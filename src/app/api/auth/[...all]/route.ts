import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

async function handler(request: NextRequest) {
  return auth().handler(request);
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };
