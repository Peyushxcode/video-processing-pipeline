const ffmpeg = require("../config/ffmpeg");

const path = require("path");

const generateThumbnail = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    const folder = path.dirname(outputPath);
    const filename = path.basename(outputPath);

    ffmpeg(inputPath)
      .screenshots({
        timestamps: ["10%"],
        filename: filename,   // only name
        folder: folder,       // folder separately
        size: "320x240",
      })
      .on("end", () => {
        console.log("Thumbnail generation done");
        resolve();
      })
      .on("error", (err) => {
        console.error("FFmpeg error:", err);
        reject(err);
      });
  });
};

module.exports = generateThumbnail;