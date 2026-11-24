const ffmpeg = require("../config/ffmpeg");

const transcodeVideo = (inputPath, outputPath, resolution) => {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .videoCodec("libx264")
            .audioCodec("aac")
            .videoFilters(`scale=-2:${resolution}`)
            .outputOptions([
                "-preset veryfast",
                "-crf 23",
                "-pix_fmt yuv420p",
                "-movflags +faststart",
                "-g 180",
                "-keyint_min 180",
                "-sc_threshold 0",
                "-force_key_frames expr:gte(t,n_forced*6)",
            ])
            .output(outputPath)
            .on("end", resolve)
            .on("error", reject)
            .run();
    });
};

module.exports = transcodeVideo;