const express = require("express");
const router = express.Router();
const { addVideoJob } = require("../controllers/videoController");

router.post("/process", addVideoJob);

module.exports = router;