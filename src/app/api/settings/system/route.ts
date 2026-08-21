import { NextResponse } from "next/server";
import { requireSession, unauthorizedResponse, UnauthorizedError } from "@/lib/api-auth";
import { getSettingValue, setSettingValue } from "@/lib/settings";

const defaults = {
  theme: "light",
  fontSize: "medium",
  compactMode: false,
  sidebarCollapsed: false,
  sidebarPosition: "left",
  enableNotifications: true,
  enableEmailNotifications: false,
  enableSoundNotifications: false,
  enableDesktopNotifications: false,
  autoLogoutTimeout: 30,
  rememberMe: true,
  dateFormat: "DD/MM/YYYY",
  timeFormat: "24h",
  defaultLanguage: "en",
  defaultCurrency: "MAD",
  defaultTax: 20,
};

export async function GET() {
  try {
    await requireSession();
    const data = await getSettingValue("system", defaults);
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
    await setSettingValue("system", body, "system");
    return NextResponse.json({ success: true, message: "System settings updated" });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    throw error;
  }
}
