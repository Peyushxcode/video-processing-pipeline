const fs = require("fs-extra");
const path = require("path");

const generateMasterPlaylist = async (hlsDir, variants) => {
    let content = "#EXTM3U\n";

    for (const variant of variants) {
        content += `#EXT-X-STREAM-INF:BANDWIDTH=${variant.bandwidth},RESOLUTION=${variant.width}x${variant.height}\n`;
        content += `${variant.resolution}p/index.m3u8\n`;
    }

    const masterPath = path.join(hlsDir, "master.m3u8");

    await fs.writeFile(masterPath, content);

    return masterPath;
};

module.exports = generateMasterPlaylist;