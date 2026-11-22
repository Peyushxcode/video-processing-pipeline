const { GetObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("../config/s3");

const streamVideo = async (req, res) => {
    try {
        const { videoId, splat } = req.params;
        const filePath = splat.join("/");

        // Prevent accessing unrelated S3 objects
        const allowedFile =
            filePath === "master.m3u8" ||
            /^(360p|480p|720p)\/index\.m3u8$/.test(filePath) ||
            /^(360p|480p|720p)\/index\d+\.ts$/.test(filePath);

        if (!allowedFile) {
            return res.status(400).json({
                message: "Invalid HLS file path",
            });
        }

        const s3Key = `processed/${videoId}/${filePath}`;

        const command = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: s3Key,
        });

        const response = await s3.send(command);

        if (filePath.endsWith(".m3u8")) {
            res.setHeader(
                "Content-Type",
                "application/vnd.apple.mpegurl"
            );
        } else {
            res.setHeader("Content-Type", "video/mp2t");
        }

        res.setHeader("Cache-Control", "private, max-age=60");

        response.Body.on("error", (err) => {
            console.error("S3 stream error:", err);
            res.destroy(err);
        });

        response.Body.pipe(res);

    } catch (err) {
        console.error("Streaming failed:", err);

        if (res.headersSent) {
            return res.destroy(err);
        }

        if (err.name === "NoSuchKey" || err.$metadata?.httpStatusCode === 404) {
            return res.status(404).json({
                message: "HLS file not found",
            });
        }

        res.status(500).json({
            message: "Unable to stream video",
        });
    }
};

module.exports = { streamVideo };