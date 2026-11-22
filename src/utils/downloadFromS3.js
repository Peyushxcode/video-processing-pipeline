const fs = require("fs");
const { GetObjectCommand } = require("@aws-sdk/client-s3");

const s3 = require("../config/s3");

const downloadFromS3 = async (key, outputPath) => {
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
    });

    const response = await s3.send(command);

    const writer = fs.createWriteStream(outputPath);

    response.Body.pipe(writer);

    return new Promise((resolve, reject) => {
        response.Body.on("error", reject);
        writer.on("finish", resolve);
        writer.on("error", reject);
    });
};

module.exports = downloadFromS3;