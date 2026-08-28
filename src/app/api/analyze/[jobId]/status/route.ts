import { NextRequest, NextResponse } from "next/server";
import { getAnalyzeQueue } from "@/workers/queue";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const job = await getAnalyzeQueue().getJob(jobId);

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Job not found",
          },
        },
        { status: 404 }
      );
    }

    const state = await job.getState();
    const progress = job.progress;

    let reportId: string | null = null;

    if (state === "completed") {
      const result = job.returnvalue as { snapshotId?: string; accountId?: string } | undefined;

      if (result?.snapshotId) {
        // Look up the actual report ID from the database
        const report = await prisma.analysisReport.findUnique({
          where: { snapshotId: result.snapshotId },
          select: { id: true },
        });
        reportId = report?.id ?? null;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        status:
          state === "waiting"
            ? "queued"
            : state === "active"
              ? "processing"
              : state === "completed" && reportId
                ? "ready"
                : state === "completed"
                  ? "processing" // completed but report not generated yet
                  : "failed",
        progress: typeof progress === "number" ? progress : 0,
        reportId,
      },
    });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to check job status",
        },
      },
      { status: 500 }
    );
  }
}
