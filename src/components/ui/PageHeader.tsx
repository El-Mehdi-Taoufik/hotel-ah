import { ReactNode } from "react";
import { useTranslation } from "@/contexts/LanguageContext";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const { direction } = useTranslation();
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in" dir={direction}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#2F2A25]">{title}</h1>
        {subtitle && <p className="text-sm text-[#6B6258] mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
