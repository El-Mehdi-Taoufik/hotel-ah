import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";

function serializeProfile(user: {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  role: string;
  avatarColor: string | null;
  preferredLanguage: string | null;
  createdAt: Date;
  lastLogin: Date | null;
}) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNumber: user.phoneNumber ?? "",
    role: user.role,
    avatarColor: user.avatarColor ?? undefined,
    preferredLanguage: user.preferredLanguage ?? undefined,
    createdAt: user.createdAt.toISOString(),
    lastLogin: user.lastLogin?.toISOString(),
  };
}

export async function GET() {
  try {
    const session = await requireSession();
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return unauthorizedResponse();
    return NextResponse.json({ success: true, data: serializeProfile(user) });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json().catch(() => null);
    const { firstName, lastName, phoneNumber, avatarColor } = body ?? {};

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(avatarColor !== undefined && { avatarColor }),
      },
    });

    return NextResponse.json({ success: true, data: serializeProfile(user), message: "Profile updated" });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
