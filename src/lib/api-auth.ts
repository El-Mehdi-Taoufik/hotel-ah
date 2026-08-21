import "server-only";
import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "./auth";

export class UnauthorizedError extends Error {}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError("Not authenticated");
  return session;
}

export function unauthorizedResponse(message = "Unauthorized") {
  return NextResponse.json({ success: false, message }, { status: 401 });
}
