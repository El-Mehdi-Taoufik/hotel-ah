import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";
import { serializeReservation } from "@/lib/serializers";

const reservationInclude = {
  guest: true,
  rooms: { include: { room: { include: { roomType: true } } } },
} as const;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    const reservation = await prisma.reservation.findUnique({
      where: { id: Number(id) },
      include: reservationInclude,
    });
    if (!reservation) return NextResponse.json({ success: false, message: "Reservation not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: serializeReservation(reservation) });
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
    const {
      checkInDate,
      checkOutDate,
      adults,
      children,
      totalAmount,
      discountAmount,
      depositAmount,
      specialRequests,
      roomId,
    } = body ?? {};

    if (roomId !== undefined) {
      const currentLink = await prisma.reservationRoom.findFirst({ where: { reservationId: Number(id) } });
      if (currentLink && currentLink.roomId !== Number(roomId)) {
        await prisma.room.update({ where: { id: currentLink.roomId }, data: { status: "Available", isAvailable: true } });
        await prisma.reservationRoom.update({ where: { id: currentLink.id }, data: { roomId: Number(roomId) } });
        await prisma.room.update({ where: { id: Number(roomId) }, data: { status: "Reserved", isAvailable: false } });
      }
    }

    const reservation = await prisma.reservation.update({
      where: { id: Number(id) },
      data: {
        ...(checkInDate !== undefined && { checkInDate: new Date(checkInDate) }),
        ...(checkOutDate !== undefined && { checkOutDate: new Date(checkOutDate) }),
        ...(adults !== undefined && { adults: Number(adults) }),
        ...(children !== undefined && { children: Number(children) }),
        ...(totalAmount !== undefined && { totalAmount: Number(totalAmount) }),
        ...(discountAmount !== undefined && { discountAmount: Number(discountAmount) }),
        ...(depositAmount !== undefined && { depositAmount: Number(depositAmount) }),
        ...(specialRequests !== undefined && { specialRequests }),
      },
      include: reservationInclude,
    });

    return NextResponse.json({ success: true, data: serializeReservation(reservation) });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    const rooms = await prisma.reservationRoom.findMany({ where: { reservationId: Number(id) } });
    await prisma.$transaction([
      prisma.payment.deleteMany({ where: { reservationId: Number(id) } }),
      prisma.reservationRoom.deleteMany({ where: { reservationId: Number(id) } }),
      prisma.reservation.delete({ where: { id: Number(id) } }),
    ]);
    await Promise.all(
      rooms.map((r) => prisma.room.update({ where: { id: r.roomId }, data: { status: "Available", isAvailable: true } }))
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
