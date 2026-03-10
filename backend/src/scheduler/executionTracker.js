import Execution from "../models/Execution.js";


export const startExecutionTracking = async (jobId) => {
    try {
        const execution = await Execution.create({
            jobId,
            status: "pending",
            startedAt: new Date(),
        });
        return execution._id;
    } catch (error) {
        throw new Error(`Execution tracking failed to start: ${error.message}`);
    }
};

export const updateExecutionStatus = async (executionId, status, errorMsg = null) => {
    try {
        const updateData = { status };

        if (status === "completed" || status === "failed") {
            updateData.finishedAt = new Date();
        }

        if (errorMsg) {
            updateData.error = errorMsg;
        }

        const execution = await Execution.findByIdAndUpdate(
            executionId,
            updateData,
            { new: true }
        );

        return execution;
    } catch (error) {
        throw new Error(`Execution tracking failed to update: ${error.message}`);
    }
};
