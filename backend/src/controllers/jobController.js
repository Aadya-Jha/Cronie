import Job from "../models/Job.js";
import Execution from "../models/Execution.js";
import { getNextRunTime } from "../scheduler/cronHelper.js";

export const createJob = async (req, res) => {
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
      nextRunAt: getNextRunTime(cronExpression),
    });

    res.status(201).json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve job" });
  }
};

export const pauseJob = async (req, res) => {
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

export const resumeJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (job.status !== "paused") {
      return res.status(409).json({ error: "Job is not paused" });
    }

    job.status = "active";
    job.nextRunAt = getNextRunTime(job.cronExpression);

    await job.save();
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: "Failed to resume job" });
  }
};

export const updateJob = async (req, res) => {
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

    job.nextRunAt = getNextRunTime(job.cronExpression);

    await job.save();
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: "Failed to update job" });
  }
};

export const deleteJob = async (req, res) => {
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

export const getExecutionHistory = async (req, res) => {
  try {
    const { id: jobId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    const executions = await Execution.find({ jobId })
      .sort({ createdAt: -1 })
      .select("status startedAt finishedAt error createdAt");

    res.json({
      jobId,
      jobName: job.name,
      executions,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve execution history" });
  }
};
