const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },

    cronExpression: {
      type: String,
      required: true,
    },

    targetUrl: {
    type: String,
    required: true,
    },

    status: {
      type: String,
      enum: ["active", "paused", "deleted"],
      default: "active",
    },

    nextRunAt: {
      type: Date,
      default: null,
    },

    lastRunAt: {
      type: Date,
      default: null,
    },

    lastRunStatus: {
      type: String,
      enum: ["success", "failed"],
      default: null,
    },

    lastError: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, 
  }
);

module.exports = mongoose.model("Job", JobSchema);
