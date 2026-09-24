import { forwardRelayRequest } from "@/lib/backend-relay/client";

export const runtime = "nodejs";
export const maxDuration = 60;

async function handler(request: Request) {
  if (process.env.BACKEND_RELAY_ENABLED !== "true") return new Response(null, { status: 404 });
  const path = request.headers.get("x-backend-relay-path");
  if (!path) return new Response(null, { status: 404 });
  try {
    return await forwardRelayRequest(request, path);
  } catch {
    return Response.json(
      {
        success: false,
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Service temporarily unavailable. Please try again later.",
        },
      },
      { status: 503, headers: { "cache-control": "no-store" } }
    );
  }
}
export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as OPTIONS,
  handler as HEAD,
};
