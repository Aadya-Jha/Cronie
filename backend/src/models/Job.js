import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
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

    httpMethod: {
      type: String,
      enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      default: "GET",
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
      enum: ["completed", "failed"],
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

export default mongoose.model("Job", jobSchema);
