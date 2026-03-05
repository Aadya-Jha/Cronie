const Job = require("../models/Job");

exports.createJob = async (req, res) => {
  try {
    const { name, cronExpression, targetUrl, description } = req.body;

    if (!name || !cronExpression || !targetUrl) {
      return res.status(400).json({
        error: "name, cronExpression, and targetUrl are required",
      });
    }

    const job = await Job.create({
      name,
      description,
      cronExpression,
      targetUrl,
      status: "active",
    });

    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ error: "Failed to create job" });
  }
};

exports.pauseJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (job.status !== "active") {
      return res.status(409).json({ error: "Job is not active" });
    }

    job.status = "paused";
    job.nextRunAt = null;

    await job.save();
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: "Failed to pause job" });
  }
};

exports.resumeJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (job.status !== "paused") {
      return res.status(409).json({ error: "Job is not paused" });
    }

    job.status = "active";
    job.nextRunAt = null; 

    await job.save();
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: "Failed to resume job" });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (job.status === "deleted") {
      return res.status(409).json({ error: "Cannot update deleted job" });
    }

    const { name, description, cronExpression, targetUrl } = req.body;

    if (name !== undefined) job.name = name;
    if (description !== undefined) job.description = description;
    if (cronExpression !== undefined) job.cronExpression = cronExpression;
    if (targetUrl !== undefined) job.targetUrl = targetUrl;

    job.nextRunAt = null;

    await job.save();
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: "Failed to update job" });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    job.status = "deleted";
    job.nextRunAt = null;

    await job.save();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete job" });
  }
};
