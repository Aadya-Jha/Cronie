import Job from "../models/Job.js";
import { executeJob } from "./executionService.js";

export const startScheduler = () => {
    const checkJobs = async () => {
        try {
            const date = new Date();
            const result = await Job.find({
                status: "active",
                nextRunAt: { $lte: date }
            });

            for (const job of result) {
                executeJob(job);
            }
        } catch (err) {
            console.error("Scheduler error:", err.message);
        }
    };

    setInterval(checkJobs, 30000);
};