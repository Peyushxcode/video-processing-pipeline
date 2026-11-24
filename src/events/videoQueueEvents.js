const { QueueEvents } = require("bullmq");
const connection = require("../config/redis");
const { broadcast } = require("./sseManager");

const videoQueueEvents = new QueueEvents("video-processing", {
    connection
});

videoQueueEvents.on("waiting", ({ jobId }) => {
    console.log(`[EVENT] Job ${jobId} is waiting`);
});

videoQueueEvents.on("active", ({ jobId }) => {
    console.log(`[EVENT] Job ${jobId} is active`);
});

videoQueueEvents.on("progress", ({ jobId, data }) => {
    console.log(`[EVENT] Job ${jobId} progress:`, data);

    broadcast(jobId, {
        jobId,
        status: "processing",
        progress: data
    });
});

videoQueueEvents.on("completed", ({ jobId }) => {
    console.log(`[EVENT] Job ${jobId} completed`);

    broadcast(jobId, {
        jobId,
        status: "completed",
        progress: 100
    });
});

videoQueueEvents.on("failed", ({ jobId, failedReason }) => {
    console.log(`[EVENT] Job ${jobId} failed:`, failedReason);

    broadcast(jobId, {
        jobId,
        status: "failed",
        message: failedReason
    });
});

videoQueueEvents.on("error", (err) => {
    console.error("[QUEUE EVENTS ERROR]", err);
});

module.exports = videoQueueEvents;