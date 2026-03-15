import Job from "../models/Job.js";
import Execution from "../models/Execution.js";
import {
  getNextRunTime,
  validateCronExpression,
} from "../scheduler/cronHelper.js";

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const parseTargetUrl = (targetUrl) => {
  try {
    // eslint-disable-next-line no-new
    new URL(targetUrl);
    return true;
  } catch {
    return false;
  }
};

export const createJob = async (req, res) => {
  try {
    const {
      name,
      cronExpression,
      targetUrl,
      description,
      httpMethod = "GET",
    } = req.body;

    if (!name || !cronExpression || !targetUrl) {
      return res.status(400).json({
        error: "name, cronExpression, and targetUrl are required",
      });
    }

    if (!validateCronExpression(cronExpression)) {
      return res.status(400).json({ error: "Invalid cron expression" });
    }

    if (!parseTargetUrl(targetUrl)) {
      return res.status(400).json({ error: "Invalid targetUrl" });
    }

    const method = String(httpMethod).toUpperCase();
    if (!HTTP_METHODS.includes(method)) {
      return res.status(400).json({
        error: `Invalid HTTP method. Supported methods: ${HTTP_METHODS.join(", ")}`,
      });
    }

    const job = await Job.create({
      name,
      description,
      cronExpression,
      targetUrl,
      httpMethod: method,
      status: "active",
      nextRunAt: getNextRunTime(cronExpression),
    });

    res.status(201).json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ status: { $ne: "deleted" } }).sort({
      createdAt: -1,
    });
    res.json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve jobs" });
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

    const {
      name,
      description,
      cronExpression,
      targetUrl,
      httpMethod,
    } = req.body;

    if (name !== undefined) job.name = name;
    if (description !== undefined) job.description = description;

    if (cronExpression !== undefined) {
      if (!validateCronExpression(cronExpression)) {
        return res.status(400).json({ error: "Invalid cron expression" });
      }
      job.cronExpression = cronExpression;
    }

    if (targetUrl !== undefined) {
      if (!parseTargetUrl(targetUrl)) {
        return res.status(400).json({ error: "Invalid targetUrl" });
      }
      job.targetUrl = targetUrl;
    }

    if (httpMethod !== undefined) {
      const methodValue = String(httpMethod).toUpperCase();
      if (!HTTP_METHODS.includes(methodValue)) {
        return res.status(400).json({
          error: `Invalid HTTP method. Supported methods: ${HTTP_METHODS.join(", ")}`,
        });
      }
      job.httpMethod = methodValue;
    }

    if (cronExpression !== undefined || job.status === "active") {
      job.nextRunAt = getNextRunTime(job.cronExpression);
    }

    await job.save();
    res.json(job);
  } catch (err) {
    console.error(err);
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
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve execution history" });
  }
};
