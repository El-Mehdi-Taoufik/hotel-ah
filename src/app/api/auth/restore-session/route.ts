import { NextResponse } from "next/server";
import { createSessionCookie, verifySessionToken } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";

  if (!token) {
    return NextResponse.json({ success: false, message: "Session token is required" }, { status: 400 });
  }

  const session = await verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ success: false, message: "Session expired" }, { status: 401 });
  }

  await createSessionCookie(session);
  return NextResponse.json({ success: true });
}
