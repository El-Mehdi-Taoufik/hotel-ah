import { NextResponse } from "next/server";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";
import { getSettingValue, setSettingValue } from "@/lib/settings";

const defaults = {
  hotelName: "",
  address: "",
  phone: "",
  email: "",
  currency: "MAD",
  timeZone: "Africa/Casablanca",
  language: "en",
};

export async function GET() {
  try {
    await requireSession();
    const data = await getSettingValue("hotel", defaults);
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
    await setSettingValue("hotel", body, "hotel");
    return NextResponse.json({ success: true, message: "Hotel settings updated" });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
