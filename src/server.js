require("dotenv").config();

const express  = require("express");
const videoRoutes = require("./routes/videoRoutes");
const connectDB = require("./config/db");

connectDB();

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Video Pipeline API Running");
});

app.use("/api/video" , videoRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});