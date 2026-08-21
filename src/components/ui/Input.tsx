import { InputHTMLAttributes, forwardRef } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-xl bg-white border border-[#E7DFD4] px-3.5 text-sm text-[#2F2A25] placeholder:text-[#9A9085] outline-none transition-colors focus:border-[#B38B59] focus:bg-[#F8F6F2]",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export function SearchInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { direction } = useTranslation();
  
  return (
    <div className="relative" dir={direction}>
      <Search size={16} className="absolute top-1/2 -translate-y-1/2 text-[#9A9085]" style={{ [direction === 'rtl' ? 'right' : 'left']: '0.875rem' }} />
      <Input className={direction === 'rtl' ? 'pe-10' : 'ps-10'} {...props} />
    </div>
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { direction } = useTranslation();
  
  return (
    <select
      className={cn(
        "h-10 rounded-xl bg-white border border-[#E7DFD4] px-3.5 text-sm text-[#2F2A25] outline-none transition-colors focus:border-[#B38B59] appearance-none cursor-pointer",
        // Dropdown options styling
        "[&>option]:bg-white",
        "[&>option]:text-[#2F2A25]",
        "[&>option]:text-sm",
        "[&>option]:px-3.5",
        "[&>option]:py-2",
        "[&>option:hover]:bg-[#F8F6F2]",
        "[&>option:focus]:bg-[#F5F1EA]",
        "[&>option:checked]:bg-[#B38B59]/10",
        "[&>option:checked]:text-[#2F2A25]",
        className
      )}
      dir={direction}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  const { direction } = useTranslation();
  return <label className="text-xs font-medium text-[#6B6258] mb-1.5 block" style={{ textAlign: direction === 'rtl' ? 'right' : 'left' }}>{children}</label>;
}
