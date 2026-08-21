import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";

export async function POST(request: Request) {
  try {
    await requireSession();
    const raw = await request.json().catch(() => null);
    const jsonText = typeof raw === "string" ? raw : JSON.stringify(raw);
    const dump = JSON.parse(jsonText);

    if (Array.isArray(dump.settings)) {
      for (const setting of dump.settings) {
        await prisma.setting.upsert({
          where: { key: setting.key },
          update: { value: setting.value, category: setting.category },
          create: { key: setting.key, value: setting.value, category: setting.category },
        });
      }
    }

    if (Array.isArray(dump.roomTypes)) {
      for (const roomType of dump.roomTypes) {
        await prisma.roomType.upsert({
          where: { id: roomType.id },
          update: roomType,
          create: roomType,
        });
      }
    }

    return NextResponse.json({ success: true, message: "Database imported (settings and room types)" });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    return NextResponse.json({ success: false, message: "Invalid import file" }, { status: 400 });
  }
}
