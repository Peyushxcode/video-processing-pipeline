const fs = require("fs-extra");
const path = require("path");
const uploadToS3 = require("./uploadToS3");

const uploadDirectoryToS3 = async (localDir, s3Prefix) => {
    const files = await fs.readdir(localDir);

    for (const file of files) {
        const fullPath = path.join(localDir, file);
        const stats = await fs.stat(fullPath);

        if (stats.isDirectory()) {
            await uploadDirectoryToS3(
                fullPath,
                `${s3Prefix}/${file}`
            );
        } else {
            await uploadToS3(
                fullPath,
                `${s3Prefix}/${file}`
            );
        }
    }
};

module.exports = uploadDirectoryToS3;