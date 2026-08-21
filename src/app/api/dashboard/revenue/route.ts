import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function GET(request: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(request.url);
    const startDate = new Date(searchParams.get("startDate") ?? Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = new Date(searchParams.get("endDate") ?? Date.now());

    const payments = await prisma.payment.findMany({
      where: { status: { not: "Refunded" }, paymentDate: { gte: startDate, lte: endDate } },
    });

    const byDay = new Map<string, number>();
    for (const payment of payments) {
      const key = payment.paymentDate.toISOString().split("T")[0];
      byDay.set(key, (byDay.get(key) ?? 0) + payment.amount);
    }

    const data = Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, revenue]) => ({ day: DAY_NAMES[new Date(key).getUTCDay()], revenue }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
