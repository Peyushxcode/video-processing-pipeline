const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
    {
        s3Key: {
            type: String,
            required: true,
        },

        status: {
            type: String,
            enum: ["pending", "processing", "completed", "failed"],
            default: "pending",
        },

        output: {
            hlsUrl: String,
            thumbnailUrl: String,
        },
        jobId: {
            type: String,
        },
    },
    { timestamps: true }
);

const Video = mongoose.model("Video", videoSchema);

module.exports = Video;