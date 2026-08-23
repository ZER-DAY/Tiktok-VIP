export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Start BullMQ workers in the server process
    // These run as background threads processing analysis jobs
    await import("@/workers/analyze-worker");
    await import("@/workers/analysis-worker");
    console.log("[Workers] analyze-worker and analysis-worker started");
  }
}
