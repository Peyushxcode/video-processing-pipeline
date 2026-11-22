const videoQueue = require("../queue/videoQueue");
const Video = require("../models/Video");
const generateUploadUrl = require("../utils/generateUploadUrl");

const addVideoJob = async (req, res) => {
    try {
        const { videoUrl } = req.body;

        if (!videoUrl) {
            return res.status(400).json({ error: "videoUrl is required" });
        }

        const video = await Video.create({
            videoUrl,
            status: "pending",
        });

        const job = await videoQueue.add("process-video", {
            videoId: video._id,
            videoUrl,
        });
        //console.log(job);
        res.json({
            message: "Job added to queue",
            jobId: job.id,
            videoId: video._id,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
};

const getUploadUrl = async (req, res) => {
    try {
        const { fileName, contentType } = req.body;

        if (!fileName || !contentType) {
            return res.status(400).json({
                message: "fileName and contentType are required",
            });
        }

        const result = await generateUploadUrl(
            fileName,
            contentType
        );

        res.status(200).json(result);

    } catch (error) {
        console.error("Failed to generate upload URL:", error);

        res.status(500).json({
            message: "Failed to generate upload URL",
        });
    }
};

const registerUploadedVideo = async (req, res) => {
    try {
        const { s3Key } = req.body;

        if (!s3Key) {
            return res.status(400).json({
                message: "s3Key is required",
            });
        }
        console.log(
            "Mongo DB:",
            Video.db.name,
            "Collection:",
            Video.collection.name
        );
        const video = await Video.create({
            s3Key,
            status: "pending",
        });

        const job = await videoQueue.add("process-video", {
            videoId: video._id,
            s3Key,
        });
        video.jobId = job.id;
        await video.save();

        res.status(201).json({
            message: "Video registered and processing job queued",
            videoId: video._id,
            jobId: job.id,
        });

    } catch (error) {
        console.error("Failed to register video:", error);

        res.status(500).json({
            message: "Failed to register video",
        });
    }
};

const getVideoStatus = async (req, res) => {
    try {
        const { videoId } = req.params;

        const video = await Video.findById(videoId);

        if (!video) {
            return res.status(404).json({
                message: "Video not found"
            });
        }

        let progress = 0;
        let jobState = "unknown";

        if (video.jobId) {
            const job = await videoQueue.getJob(video.jobId);

            if (job) {
                progress = job.progress || 0;
                jobState = await job.getState();
            }
        }

        const stages = [
            { min: 100, name: "Completed" },
            { min: 95, name: "Finalizing" },
            { min: 85, name: "Uploading to S3" },
            { min: 70, name: "Generating HLS" },
            { min: 55, name: "Transcoding 720p" },
            { min: 40, name: "Transcoding 480p" },
            { min: 25, name: "Transcoding 360p" },
            { min: 15, name: "Generating thumbnail" },
            { min: 0, name: "Downloading video" }
        ];

        let stage = stages.find(s => progress >= s.min)?.name;

        if (video.status === "completed") {
            progress = 100;
            stage = "Completed";
        } else if (video.status === "failed") {
            stage = "Failed";
        } else if (jobState === "waiting" || jobState === "delayed") {
            stage = "Queued";
        }

        return res.status(200).json({
            videoId: video._id,
            status: video.status,
            jobState,
            progress,
            stage
        });

    } catch (err) {
        console.error("Get video status failed:", err);

        if (err.name === "CastError") {
            return res.status(400).json({
                message: "Invalid video ID"
            });
        }

        return res.status(500).json({
            message: "Unable to fetch video status"
        });
    }
};

module.exports = {
    addVideoJob, getUploadUrl, registerUploadedVideo, getVideoStatus
};