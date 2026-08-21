import { NextResponse } from "next/server";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";
import { getSettingValue, setSettingValue } from "@/lib/settings";

const defaults = {
  taxPercentage: 20,
  depositPercentage: 30,
  defaultPaymentMethod: "Cash",
};

export async function GET() {
  try {
    await requireSession();
    const data = await getSettingValue("payment", defaults);
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
    await setSettingValue("payment", body, "payment");
    return NextResponse.json({ success: true, message: "Payment settings updated" });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
