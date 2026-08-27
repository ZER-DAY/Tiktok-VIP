import { afterEach, describe, expect, it, vi } from "vitest";
import { ANALYSIS_DATA_VERSION, isAnalysisDataCurrent } from "./analysis-data";

describe("analysis data version", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects legacy snapshots without a pipeline version", () => {
    expect(isAnalysisDataCurrent({ profile: {}, content: [] })).toBe(false);
  });

  it("accepts snapshots produced by the current pipeline", () => {
    expect(isAnalysisDataCurrent({ pipelineVersion: ANALYSIS_DATA_VERSION })).toBe(true);
  });

  it("refreshes a snapshot once after a signed LIVE provider is configured", () => {
    vi.stubEnv("TIKHUB_API_KEY", "configured-key");

    expect(isAnalysisDataCurrent({ pipelineVersion: ANALYSIS_DATA_VERSION })).toBe(false);
    expect(
      isAnalysisDataCurrent({
        pipelineVersion: ANALYSIS_DATA_VERSION,
        liveAccountLevelEnrichmentConfigured: true,
      })
    ).toBe(true);
  });
});
