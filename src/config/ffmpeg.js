const ffmpeg = require("fluent-ffmpeg");

if (process.env.FFMPEG_PATH) {
    ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
}

if (process.env.FFPROBE_PATH) {
    ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);
}

module.exports = ffmpeg;