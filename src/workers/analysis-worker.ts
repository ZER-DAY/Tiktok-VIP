import { Worker, Job } from "bullmq";
import { getRedis } from "@/lib/redis";
import { generateAnalysisReport } from "@/modules/ai-engine";
import type { AnalysisJobData } from "./analysis-queue";

async function processAnalysisJob(job: Job<AnalysisJobData>) {
  const { snapshotId } = job.data;

  await job.updateProgress(10);

  const result = await generateAnalysisReport(snapshotId);

  await job.updateProgress(100);

  return result;
}

export const analysisWorker = new Worker<AnalysisJobData>(
  "analysis",
  async (job) => {
    return processAnalysisJob(job);
  },
  {
    connection: getRedis(),
    concurrency: 3,
  }
);

analysisWorker.on("failed", (job, error) => {
  console.error(`Analysis job ${job?.id} failed:`, error.message);
});

analysisWorker.on("completed", (job) => {
  console.log(`Analysis job ${job.id} completed: report ${job.returnvalue?.reportId}`);
});
