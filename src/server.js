require("dotenv").config();

const express  = require("express");
const videoRoutes = require("./routes/videoRoutes");
const streamRoutes = require("../src/routes/streamRoutes");
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

const PORT = process.env.PORT || 5200;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});