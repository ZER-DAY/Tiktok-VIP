import { validateWorkerEnvironment } from "./validate-environment";

async function main() {
  validateWorkerEnvironment();

  const [{ analyzeWorker }, { analysisWorker }] = await Promise.all([
    import("./analyze-worker"),
    import("./analysis-worker"),
  ]);

  console.log("[Workers] analyze and analysis consumers are ready");

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[Workers] ${signal} received; finishing active jobs`);
    await Promise.allSettled([analyzeWorker.close(), analysisWorker.close()]);
    process.exit(0);
  };

  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  process.once("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((error) => {
  console.error("[Workers] startup failed", error);
  process.exit(1);
});
