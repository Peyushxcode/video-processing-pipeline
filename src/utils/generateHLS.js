const ffmpeg = require("fluent-ffmpeg");

const generateHLS = (inputPath, playlistPath) => {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .outputOptions([
                "-c copy",
                "-f hls",
                "-hls_time 6",
                "-hls_playlist_type vod",
            ])
            .output(playlistPath)
            .on("end", resolve)
            .on("error", reject)
            .run();
    });
};

module.exports = generateHLS;