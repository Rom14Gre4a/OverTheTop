import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && <label className="text-muted text-xs font-medium uppercase tracking-wide">{label}</label>}
      <input
        ref={ref}
        className={`w-full bg-[var(--surface)] border text-foreground rounded-xl px-3 py-2.5 text-sm
          placeholder:text-[var(--muted)] outline-none transition-all duration-200
          ${error
            ? "border-red-500/60 focus:border-red-500"
            : "border-[var(--border)] focus:border-[var(--accent)] focus:glow-sm focus:shadow-[0_0_0_1px_var(--accent-glow-sm)]"}
          ${className}`}
        {...props}
      />
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </div>
  )
);
Input.displayName = "Input";
