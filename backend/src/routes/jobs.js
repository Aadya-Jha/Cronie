const express = require("express");
const router = express.Router();

const {
  createJob,
  pauseJob,
  resumeJob,
  updateJob,
  deleteJob,
} = require("../controllers/jobController");

router.post("/", createJob);
router.patch("/:id/pause", pauseJob);
router.patch("/:id/resume", resumeJob);
router.put("/:id", updateJob);
router.delete("/:id", deleteJob);

module.exports = router;
