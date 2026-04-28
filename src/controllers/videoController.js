const videoQueue = require("../queue/videoQueue");
const Video = require("../models/Video");

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
            videoId:video._id,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
};

module.exports = {
    addVideoJob,
};