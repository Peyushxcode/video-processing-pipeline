const fs = require("fs");
const path = require("path");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("../config/s3");

const uploadToS3 = async (filePath, s3Key) => {
    const extension = path.extname(filePath).toLowerCase();

    const contentTypes = {
        ".m3u8": "application/vnd.apple.mpegurl",
        ".ts": "video/mp2t",
        ".png": "image/png",
        ".mp4": "video/mp4",
    };

    const contentType = contentTypes[extension] || "application/octet-stream";

    const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: s3Key,
        Body: fs.createReadStream(filePath),
        ContentType: contentType,
    });

    await s3.send(command);

    console.log(`Uploaded to S3: ${s3Key}`);
};

module.exports = uploadToS3;