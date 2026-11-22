require("dotenv").config();

const { ListObjectsV2Command } = require("@aws-sdk/client-s3");
const s3 = require("./config/s3");

const testS3 = async () => {
    try {
        const response = await s3.send(
            new ListObjectsV2Command({
                Bucket: process.env.AWS_S3_BUCKET,
                MaxKeys: 5,
            })
        );

        console.log("S3 connection successful!");
        console.log("Bucket:", process.env.AWS_S3_BUCKET);
        console.log("Objects:", response.Contents || []);
    } catch (error) {
        console.error("S3 connection failed:");
        console.error(error);
    }
};

testS3();