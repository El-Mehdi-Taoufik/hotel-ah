import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";
import { serializeGuest } from "@/lib/serializers";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    const guest = await prisma.guest.findUnique({ where: { id: Number(id) } });
    if (!guest) return NextResponse.json({ success: false, message: "Guest not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: serializeGuest(guest) });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const { firstName, lastName, email, phoneNumber, nationality, idNumber, address, isVip } = body ?? {};

    const guest = await prisma.guest.update({
      where: { id: Number(id) },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(email !== undefined && { email: email || null }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(nationality !== undefined && { nationality }),
        ...(idNumber !== undefined && { idNumber }),
        ...(address !== undefined && { address }),
        ...(isVip !== undefined && { isVip: Boolean(isVip) }),
      },
    });

    return NextResponse.json({ success: true, data: serializeGuest(guest) });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    await prisma.guest.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
