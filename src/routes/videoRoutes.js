const express = require("express");
const router = express.Router();
const { addVideoJob, getUploadUrl , registerUploadedVideo, getVideoStatus, subscribeToProgress} = require("../controllers/videoController");

router.post("/process", addVideoJob);
router.post("/upload-url", getUploadUrl);
router.post("/register", registerUploadedVideo);
router.get("/:videoId/status", getVideoStatus);
router.get("/:videoId/progress", subscribeToProgress);

module.exports = router;