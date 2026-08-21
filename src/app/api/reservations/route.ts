import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";
import { serializeReservation } from "@/lib/serializers";
import { generatePaymentNumber, generateReservationNumber } from "@/lib/ids";

const reservationInclude = {
  guest: true,
  rooms: { include: { room: { include: { roomType: true } } } },
} as const;

export async function GET(request: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(request.url);
    const pageNumber = Number(searchParams.get("pageNumber") ?? "1");
    const pageSize = Number(searchParams.get("pageSize") ?? "10");
    const status = searchParams.get("status");

    const where = status ? { status } : {};

    const [reservations, totalCount] = await Promise.all([
      prisma.reservation.findMany({
        where,
        include: reservationInclude,
        orderBy: { id: "desc" },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
      }),
      prisma.reservation.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    return NextResponse.json({
      success: true,
      data: reservations.map(serializeReservation),
      pageNumber,
      pageSize,
      totalCount,
      totalPages,
      hasPrevious: pageNumber > 1,
      hasNext: pageNumber < totalPages,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    await requireSession();
    const body = await request.json().catch(() => null);
    const {
      guestId,
      guestFirstName,
      guestLastName,
      guestEmail,
      guestPhoneNumber,
      guestNationality,
      guestIdNumber,
      guestAddress,
      roomId,
      checkInDate,
      checkOutDate,
      adults,
      children,
      totalAmount,
      depositAmount,
      paymentMethod,
      status,
      specialRequests,
    } = body ?? {};

    if (!roomId || !checkInDate || !checkOutDate) {
      return NextResponse.json({ success: false, message: "roomId, checkInDate and checkOutDate are required" }, { status: 400 });
    }

    const room = await prisma.room.findUnique({ where: { id: Number(roomId) } });
    if (!room) {
      return NextResponse.json({ success: false, message: "Room not found" }, { status: 400 });
    }

    let guest = guestId ? await prisma.guest.findUnique({ where: { id: Number(guestId) } }) : null;

    if (!guest && guestEmail) {
      guest = await prisma.guest.findUnique({ where: { email: guestEmail } });
    }

    if (!guest) {
      if (!guestFirstName || !guestLastName) {
        return NextResponse.json({ success: false, message: "Guest information is required" }, { status: 400 });
      }
      guest = await prisma.guest.create({
        data: {
          firstName: guestFirstName,
          lastName: guestLastName,
          email: guestEmail || null,
          phoneNumber: guestPhoneNumber || null,
          nationality: guestNationality || null,
          idNumber: guestIdNumber || null,
          address: guestAddress || null,
        },
      });
    }

    const reservation = await prisma.reservation.create({
      data: {
        reservationNumber: generateReservationNumber(),
        guestId: guest.id,
        checkInDate: new Date(checkInDate),
        checkOutDate: new Date(checkOutDate),
        adults: Number(adults ?? 1),
        children: Number(children ?? 0),
        status: status || "Pending",
        totalAmount: Number(totalAmount ?? 0),
        depositAmount: Number(depositAmount ?? 0),
        specialRequests: specialRequests || null,
        rooms: { create: [{ roomId: room.id }] },
      },
      include: reservationInclude,
    });

    await prisma.room.update({
      where: { id: room.id },
      data: { status: "Reserved", isAvailable: false },
    });

    await prisma.guest.update({
      where: { id: guest.id },
      data: { totalStays: { increment: 1 }, totalSpent: { increment: Number(totalAmount ?? 0) } },
    });

    if (Number(depositAmount) > 0) {
      await prisma.payment.create({
        data: {
          paymentNumber: generatePaymentNumber(),
          reservationId: reservation.id,
          amount: Number(depositAmount),
          paymentMethod: paymentMethod || "Cash",
          status: Number(depositAmount) >= Number(totalAmount ?? 0) ? "Paid" : "Partial",
        },
      });
    }

    return NextResponse.json({ success: true, data: serializeReservation(reservation) }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
