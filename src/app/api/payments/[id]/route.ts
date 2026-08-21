import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";
import { serializePayment } from "@/lib/serializers";

const paymentInclude = { reservation: { include: { guest: true } } } as const;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    const payment = await prisma.payment.findUnique({ where: { id: Number(id) }, include: paymentInclude });
    if (!payment) return NextResponse.json({ success: false, message: "Payment not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: serializePayment(payment) });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    await prisma.payment.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
