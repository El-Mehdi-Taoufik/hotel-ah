import { cn } from "@/lib/utils";

const palette: Record<string, string> = {
  // Reservation status
  Reserved: "bg-[#DBEAFE] text-[#1D4ED8] border-[#3B82F6]",
  Confirmed: "bg-[#D1FAE5] text-[#065F46] border-[#10B981]",
  "Checked In": "bg-[#DBEAFE] text-[#1E3A8A] border-[#2563EB]",
  "Checked Out": "bg-[#F3F4F6] text-[#374151] border-[#6B7280]",
  Cancelled: "bg-[#FEE2E2] text-[#991B1B] border-[#EF4444]",
  // Payment status
  Paid: "bg-[#DCFCE7] text-[#166534] border-[#22C55E]",
  Pending: "bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]",
  Refunded: "bg-[#F3E8FF] text-[#7E22CE] border-[#A855F7]",
  Partial: "bg-[#DBEAFE] text-[#1D4ED8] border-[#3B82F6]",
  PartiallyPaid: "bg-[#DBEAFE] text-[#1D4ED8] border-[#3B82F6]",
  // Room status
  Available: "bg-[#DCFCE7] text-[#166534] border-[#22C55E]",
  Occupied: "bg-[#DBEAFE] text-[#1E3A8A] border-[#2563EB]",
  Cleaning: "bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]",
  Maintenance: "bg-[#FEE2E2] text-[#991B1B] border-[#EF4444]",
  "Out of Service": "bg-[#F3F4F6] text-[#374151] border-[#6B7280]",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap",
        palette[status] ?? "bg-[#F3F4F6] text-[#374151] border-[#6B7280]"
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
