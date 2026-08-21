import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";

interface Props {
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down";
  icon: LucideIcon;
  accent?: string;
  count?: number;
}

export function StatCard({ label, value, delta, trend, icon: Icon, accent = "var(--primary-400)", count }: Props) {
  const { direction } = useTranslation();
  
  return (
    <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-5 flex flex-col gap-4 card-lift animate-fade-in" dir={direction}>
      <div className="flex items-start justify-between">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${accent}1F`, color: accent }}
        >
          <Icon size={20} strokeWidth={2} />
        </div>
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5 border shrink-0",
              trend === "down" ? "text-[#991B1B] bg-[#FEE2E2] border-[#EF4444]" : "text-[#166534] bg-[#DCFCE7] border-[#22C55E]"
            )}
          >
            {trend === "down" ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
            {delta}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-semibold tracking-tight text-[#2F2A25] font-mono">{value}</p>
        <p className="text-sm text-[#6B6258] mt-1">{label}{count !== undefined && ` (${count})`}</p>
      </div>
    </div>
  );
}
