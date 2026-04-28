const connection = require("../config/redis");
const {Queue} = require("bullmq");

const videoQueue = new Queue("video-processing" , {
    connection,
});

module.exports = videoQueue;