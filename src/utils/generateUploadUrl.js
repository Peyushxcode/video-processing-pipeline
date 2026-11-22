const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");

const s3 = require("../config/s3");

const generateUploadUrl = async (fileName, contentType) => {
    const fileExtension = fileName.split(".").pop();

    const uniqueName = `${crypto.randomUUID()}.${fileExtension}`;

    const key = `videos/${uniqueName}`;

    const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, {
        expiresIn: 900, // 15 minutes
    });

    return {
        uploadUrl,
        key,
    };
};

module.exports = generateUploadUrl;