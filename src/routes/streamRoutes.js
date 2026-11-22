const express = require("express");
const router = express.Router();

const { streamVideo } = require("../controllers/streamController");

router.get("/:videoId/*splat", streamVideo);   

module.exports = router;