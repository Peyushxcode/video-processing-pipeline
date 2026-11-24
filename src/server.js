require("dotenv").config();

const express  = require("express");
const videoRoutes = require("./routes/videoRoutes");
const streamRoutes = require("../src/routes/streamRoutes");
const videoQueueEvents = require("./events/videoQueueEvents");

const connectDB = require("./config/db");
const path = require("path");

connectDB();

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.send("Video Pipeline API Running");
});

app.use("/api/video" , videoRoutes);
app.use("/api/stream", streamRoutes);

app.use(
    "/stream",
    express.static(path.join(__dirname, "../temp"))
);

app.get("/test-sse", (req, res) => {

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    res.flushHeaders();

    let count = 0;

    const interval = setInterval(() => {
        count++;

        res.write(`data: ${JSON.stringify({ count })}\n\n`);

    }, 2000);

    res.on("close", () => {
        clearInterval(interval);
        console.log("SSE client disconnected");
    });
});

const PORT = process.env.PORT || 5200;

videoQueueEvents.waitUntilReady()
    .then(() => {
        console.log("Video QueueEvents listener ready");
    })
    .catch(console.error);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});