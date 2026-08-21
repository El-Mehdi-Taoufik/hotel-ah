import Link from "next/link";
import { BedDouble, FileBarChart, LogIn, LogOut, PlusCircle, UserPlus } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";

export function QuickActions() {
  const { dashboard, direction } = useTranslation();

  const actions = [
    { label: dashboard('actionNewReservation'), icon: PlusCircle, href: "/reservations/new" },
    { label: dashboard('actionCheckIn'), icon: LogIn, href: "/reservations" },
    { label: dashboard('actionCheckOut'), icon: LogOut, href: "/reservations" },
    { label: dashboard('actionAddRoom'), icon: BedDouble, href: "/rooms" },
    { label: dashboard('actionAddGuest'), icon: UserPlus, href: "/guests" },
    { label: dashboard('actionGenerateReport'), icon: FileBarChart, href: "/reports" },
  ];

  return (
    <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-5 sm:p-6" dir={direction}>
      <h3 className="text-sm font-medium text-[#2F2A25] mb-4">{dashboard('quickActionsTitle')}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {actions.map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className="card-lift flex flex-col items-center justify-center gap-2 rounded-xl border border-[#E7DFD4] bg-[#F8F6F2] py-4 text-center hover:border-[#B38B59]/30"
          >
            <a.icon size={18} className="text-[#B38B59] shrink-0" />
            <span className="text-xs text-[#6B6258]">{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
