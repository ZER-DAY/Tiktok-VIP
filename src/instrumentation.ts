export async function register() {
  const workersDisabled = process.env.DISABLE_WORKERS === "true" || process.env.VERCEL === "1";

  if (process.env.NEXT_RUNTIME === "nodejs" && !workersDisabled) {
    // Start BullMQ workers in the server process
    // These run as background threads processing analysis jobs
    await import("@/workers/analyze-worker");
    await import("@/workers/analysis-worker");
    console.log("[Workers] analyze-worker and analysis-worker started");
  }
}
