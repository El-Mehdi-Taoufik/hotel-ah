import { NextResponse } from "next/server";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";
import { getSettingValue, setSettingValue } from "@/lib/settings";

export async function GET() {
  try {
    await requireSession();
    const [hotel, reservation, payment, system] = await Promise.all([
      getSettingValue("hotel", {}),
      getSettingValue("reservation", {}),
      getSettingValue("payment", {}),
      getSettingValue("system", {}),
    ]);
    return NextResponse.json({ success: true, data: { hotel, reservation, payment, system } });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}

export async function PUT(request: Request) {
  try {
    await requireSession();
    const body = await request.json().catch(() => null);
    if (body?.hotel) await setSettingValue("hotel", body.hotel, "hotel");
    if (body?.reservation) await setSettingValue("reservation", body.reservation, "reservation");
    if (body?.payment) await setSettingValue("payment", body.payment, "payment");
    if (body?.system) await setSettingValue("system", body.system, "system");
    return NextResponse.json({ success: true, message: "Settings updated" });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
