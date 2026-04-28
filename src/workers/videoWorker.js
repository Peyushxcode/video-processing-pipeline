const { Worker } = require("bullmq");
const connection = require("../config/redis");
const Video = require("../models/Video");
const mongoose = require("mongoose");
const path = require("path");
const downloadVideo = require("../utils/downloadVideo");
const generateThumbnail = require("../utils/generateThumbnail");

const fs = require("fs-extra");

const tempDir = path.join(__dirname, "../../temp");

// ensure directory exists ALWAYS
fs.ensureDirSync(tempDir);

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/video-pipeline").then(() => {
    console.log("Worker DB connected");
});

const videoWorker = new Worker("video-processing", async (job) => {
    const { videoUrl, videoId } = job.data;
    console.log("Processing job:", job.id);
    console.log("Temp dir:", tempDir);
    const inputPath = path.join(tempDir, "input.mp4");
    const thumbnailPath = path.join(tempDir, "thumb.png");

    // 1. download video
    await downloadVideo(videoUrl, inputPath);
    console.log("Video downloaded");

    // 2. update status
    await Video.findByIdAndUpdate(videoId, {
        status: "processing",
    });

    // 3. generate thumbnail
    try {
        await generateThumbnail(inputPath, thumbnailPath);
        console.log("Thumbnail generated");
    } catch (err) {
        console.error("Thumbnail failed:", err);
        throw err;
    }

    // 4. update DB
    await Video.findByIdAndUpdate(videoId, {
        status: "completed",
        output: {
            thumbnailUrl: thumbnailPath,
        },
    });

    console.log(`Finished processing video: ${videoUrl}`);

    return { success: true };

}, {
    connection,
})

videoWorker.on("completed", (job, result) => {
    console.log(`Job ${job.id} completed`, result);
});

videoWorker.on("failed", async (job, err) => {
    console.error(`Job ${job.id} failed`);

    const { videoId } = job.data;

    await Video.findByIdAndUpdate(videoId, {
        status: "failed",
    });
});