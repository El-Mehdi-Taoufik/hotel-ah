import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";
import { serializeGuest } from "@/lib/serializers";

export async function GET(request: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const guests = await prisma.guest.findMany({
      where: search
        ? {
            OR: [
              { firstName: { contains: search } },
              { lastName: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : undefined,
      orderBy: { id: "asc" },
    });

    return NextResponse.json({ success: true, data: guests.map(serializeGuest) });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    await requireSession();
    const body = await request.json().catch(() => null);
    const { firstName, lastName, email, phoneNumber, nationality, idNumber, address, isVip } = body ?? {};

    if (!firstName || !lastName) {
      return NextResponse.json({ success: false, message: "First and last name are required" }, { status: 400 });
    }

    const guest = await prisma.guest.create({
      data: {
        firstName,
        lastName,
        email: email || null,
        phoneNumber: phoneNumber || null,
        nationality: nationality || null,
        idNumber: idNumber || null,
        address: address || null,
        isVip: Boolean(isVip),
      },
    });

    return NextResponse.json({ success: true, data: serializeGuest(guest) }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
