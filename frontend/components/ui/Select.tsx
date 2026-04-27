import { type SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = "", children, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && <label className="text-muted text-xs font-medium uppercase tracking-wide">{label}</label>}
      <select
        ref={ref}
        className={`w-full bg-[var(--surface)] border text-foreground rounded-xl px-3 py-2.5 text-sm
          outline-none transition-all duration-200 cursor-pointer
          ${error
            ? "border-red-500/60"
            : "border-[var(--border)] focus:border-[var(--accent)]"}
          ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </div>
  )
);
Select.displayName = "Select";
