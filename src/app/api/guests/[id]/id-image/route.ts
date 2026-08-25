import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";

const MAX_IMAGE_LENGTH = 7_000_000;
const ALLOWED_PREFIXES = ["data:image/jpeg;base64,", "data:image/png;base64,", "data:image/webp;base64,"];

function validateImage(value: unknown) {
  if (typeof value !== "string" || value.length > MAX_IMAGE_LENGTH) return false;
  return ALLOWED_PREFIXES.some((prefix) => value.startsWith(prefix));
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    const guest = await prisma.guest.findUnique({
      where: { id: Number(id) },
      select: { idDocumentImage: true },
    });

    if (!guest) return NextResponse.json({ success: false, message: "Guest not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: guest.idDocumentImage ?? null });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const image = body?.image;

    if (!validateImage(image)) {
      return NextResponse.json(
        { success: false, message: "Invalid image. Use JPG, PNG or WebP and keep it under 5 MB." },
        { status: 400 }
      );
    }

    const guest = await prisma.guest.update({
      where: { id: Number(id) },
      data: { idDocumentImage: image },
      select: { id: true },
    });

    return NextResponse.json({ success: true, data: guest });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    await prisma.guest.update({
      where: { id: Number(id) },
      data: { idDocumentImage: null },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
