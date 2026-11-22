const { Worker } = require("bullmq");
const connection = require("../config/redis");
const Video = require("../models/Video");
const mongoose = require("mongoose");
const path = require("path");
const downloadFromS3 = require("../utils/downloadFromS3");
const generateThumbnail = require("../utils/generateThumbnail");
const transcodeVideo = require("../utils/transcodeVideo");
const generateHLS = require("../utils/generateHLS");
const generateMasterPlaylist = require("../utils/generateMasterPlaylist");
const uploadDirectoryToS3 = require("../utils/uploadDirectoryToS3");
const uploadToS3 = require("../utils/uploadToS3");

const fs = require("fs-extra");

const tempDir = path.join(__dirname, "../../temp");

// ensure directory exists ALWAYS
fs.ensureDirSync(tempDir);

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/video-pipeline").then(() => {
    console.log("Worker DB connected");
});

const videoWorker = new Worker("video-processing", async (job) => {
    const { s3Key, videoId } = job.data;

    console.log("Processing job:", job.id);
    console.log("Temp dir:", tempDir);

    const jobTempDir = path.join(tempDir, String(job.id));

    await fs.ensureDir(jobTempDir);

    const inputPath = path.join(jobTempDir, "input.mp4");
    const thumbnailPath = path.join(jobTempDir, "thumb.png");

    // 1. Download video from S3
    await downloadFromS3(s3Key, inputPath);
    console.log("Video downloaded");
    await job.updateProgress(15);

    // 2. Update status
    await Video.findByIdAndUpdate(videoId, {
        status: "processing",
    });

    // 3. Generate thumbnail
    try {
        await generateThumbnail(inputPath, thumbnailPath);
        console.log("Thumbnail generated");
        await job.updateProgress(15);
    } catch (err) {
        console.error("Thumbnail failed:", err);
        throw err;
    }

    // 4. Transcode into multiple resolutions
    const resolutions = [360, 480, 720];

    for (const resolution of resolutions) {
        const outputPath = path.join(jobTempDir, `${resolution}p.mp4`);

        console.log(`Starting ${resolution}p transcoding...`);

        await transcodeVideo(inputPath, outputPath, resolution);

        console.log(`${resolution}p transcoding completed`);
        if (resolution === 360) await job.updateProgress(40);
        if (resolution === 480) await job.updateProgress(55);
        if (resolution === 720) await job.updateProgress(70);
    }

    // 5. Generate HLS for all resolutions
    const hlsDir = path.join(jobTempDir, "hls");

    for (const resolution of resolutions) {
        const inputVideoPath = path.join(jobTempDir, `${resolution}p.mp4`);
        const resolutionDir = path.join(hlsDir, `${resolution}p`);

        await fs.ensureDir(resolutionDir);

        const playlistPath = path.join(resolutionDir, "index.m3u8");

        console.log(`Generating ${resolution}p HLS...`);

        await generateHLS(inputVideoPath, playlistPath);

        console.log(`${resolution}p HLS generated successfully`);
    }

    // 6. Generate master playlist
    const variants = [
        { resolution: 360, width: 640, height: 360, bandwidth: 200000 },
        { resolution: 480, width: 854, height: 480, bandwidth: 350000 },
        { resolution: 720, width: 1280, height: 720, bandwidth: 800000 },
    ];

    const masterPath = await generateMasterPlaylist(hlsDir, variants);

    console.log("Master playlist generated:", masterPath);
    await job.updateProgress(85);

    // 7. Upload processed HLS files to S3
    const s3Prefix = `processed/${videoId}`;

    console.log("Uploading HLS files to S3...");

    await uploadDirectoryToS3(hlsDir, s3Prefix);

    // Upload thumbnail separately
    await uploadToS3(
        thumbnailPath,
        `${s3Prefix}/thumbnail.png`
    );

    console.log("All processed files uploaded to S3");
    await job.updateProgress(95);

    // 5. Update MongoDB
    await Video.findByIdAndUpdate(videoId, {
        status: "completed",
        output: {
            hlsUrl: `${s3Prefix}/master.m3u8`,
            thumbnailUrl: `${s3Prefix}/thumbnail.png`,
        },
    });

    console.log(`Finished processing video: ${videoId}`);
    await job.updateProgress(100);

    return { success: true };

}, {
    connection,
});

videoWorker.on("completed", (job, result) => {
    console.log(`Job ${job.id} completed`, result);
});

videoWorker.on("failed", async (job, err) => {
    console.error(`Job ${job.id} failed:`, err);

    const { videoId } = job.data;

    await Video.findByIdAndUpdate(videoId, {
        status: "failed",
    });
});