"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useTranslation } from "@/contexts/LanguageContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { direction } = useTranslation();

  return (
    <div className="flex min-h-screen bg-[#F8F6F2]" dir={direction}>
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Navbar />
        <main className="flex-1 px-4 sm:px-6 py-6 space-y-6">{children}</main>
      </div>
    </div>
  );
}
