import { NextResponse } from "next/server";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";
import { getSettingValue, setSettingValue } from "@/lib/settings";

const defaults = {
  defaultCheckInTime: "14:00",
  defaultCheckOutTime: "12:00",
  reservationPrefix: "RES",
  autoConfirmReservations: false,
  allowOverbooking: false,
};

export async function GET() {
  try {
    await requireSession();
    const data = await getSettingValue("reservation", defaults);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}

export async function PUT(request: Request) {
  try {
    await requireSession();
    const body = await request.json().catch(() => ({}));
    await setSettingValue("reservation", body, "reservation");
    return NextResponse.json({ success: true, message: "Reservation settings updated" });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
