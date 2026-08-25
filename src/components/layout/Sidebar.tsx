"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarRange,
  CalendarDays,
  BedDouble,
  PlusCircle,
  Users,
  CreditCard,
  BarChart3,
  ShieldCheck,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";

interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

const allNav = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/reservations", key: "reservations", icon: CalendarRange },
  { href: "/calendar", key: "calendar", icon: CalendarDays },
  { href: "/rooms", key: "rooms", icon: BedDouble },
  { href: "/reservations/new", key: "newBooking", icon: PlusCircle },
  { href: "/guests", key: "guests", icon: Users },
  { href: "/payments", key: "payments", icon: CreditCard },
  { href: "/reports", key: "reports", icon: BarChart3 },
  { href: "/users", key: "users", icon: ShieldCheck, requiresAdmin: true },
  { href: "/settings", key: "settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { common: t, isLoaded, direction, language } = useTranslation();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [nav, setNav] = useState(allNav);

  useEffect(() => {
    loadUserFromStorage();

    const handleStorageChange = () => {
      loadUserFromStorage();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("userUpdated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userUpdated", handleStorageChange);
    };
  }, []);

  const loadUserFromStorage = () => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);

        const filteredNav = allNav.filter((item) => {
          if (item.requiresAdmin) {
            return userData.role === "Admin";
          }
          return true;
        });
        setNav(filteredNav);
      }
    } catch (error) {
      console.error("Error loading user from storage:", error);
      setUser(null);
      setNav(allNav.filter((item) => !item.requiresAdmin));
    }
  };

  const isArabic = language === "ar";
  const fallbackLabels: Record<string, string> = {
    dashboard: isArabic ? "لوحة التحكم" : "Dashboard",
    reservations: isArabic ? "الحجوزات" : "Reservations",
    calendar: isArabic ? "التقويم" : "Calendar",
    rooms: isArabic ? "الغرف" : "Rooms",
    newBooking: isArabic ? "حجز جديد" : "New Booking",
    guests: isArabic ? "الضيوف" : "Guests",
    payments: isArabic ? "المدفوعات" : "Payments",
    reports: isArabic ? "التقارير" : "Reports",
    users: isArabic ? "المستخدمين" : "Users",
    settings: isArabic ? "الإعدادات" : "Settings",
  };

  return (
    <aside
      className={`hidden lg:flex flex-col w-64 shrink-0 h-screen bg-[#F5F1EA] border-[#E7DFD4] px-4 py-6 ${direction === "rtl" ? "border-l" : "border-r"}`}
      dir={direction}
    >
      <div className="flex items-center gap-2.5 px-2 mb-8">
        <img
          src="/logo.jpeg"
          alt="Hotel Aguelmam Logo"
          className="h-9 w-9 rounded-xl object-contain flex items-center justify-center shrink-0"
        />
        <div className="min-w-0">
          <p className="font-semibold text-[#2F2A25] leading-tight">Hotel Aguelmam</p>
          <p className="text-[11px] text-[#9A9085] leading-tight">
            {isArabic ? "نظام الاستقبال" : "Reception Suite"}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {nav.map(({ href, key, icon: Icon }) => {
          const isActive = href === "/reservations" ? pathname === href : pathname.startsWith(href);
          const label = isLoaded ? t(key) || fallbackLabels[key] : fallbackLabels[key];
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "bg-[#B38B59] text-white shadow-sm"
                  : "text-[#6B6258] hover:text-[#2F2A25] hover:bg-[#E7DFD4] border border-transparent"
              )}
            >
              <Icon size={18} strokeWidth={2} className="shrink-0" />
              <span className="min-w-0">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="glass-card p-3.5 mt-4 bg-white border-[#E7DFD4]">
        <p className="text-xs text-[#6B6258] leading-relaxed">
          {isArabic ? "معدل الإشغال في ارتفاع" : isLoaded ? t("occupancyTrend") || "Occupancy is trending up" : "Occupancy is trending up"} {" "}
          <span className="text-[#4CAF50] font-medium">+8%</span>{" "}
          {isArabic ? "هذا الأسبوع" : isLoaded ? t("thisWeek") || "this week" : "this week"}.
        </p>
      </div>
    </aside>
  );
}
