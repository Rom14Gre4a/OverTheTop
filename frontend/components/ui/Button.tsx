import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size    = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  glow?: boolean;
}

const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary:   "bg-[var(--accent)] text-black hover:bg-[var(--accent-light)] active:scale-95",
  secondary: "glass border-[var(--border-strong)] text-foreground hover:bg-[var(--surface-hover)] hover:border-[var(--accent)]",
  ghost:     "text-muted hover:text-foreground hover:bg-[var(--surface-hover)]",
  danger:    "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/60",
};

const sizes: Record<Size, string> = {
  sm: "h-8  px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", glow, className = "", ...props }, ref) => (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${glow && variant === "primary" ? "glow" : ""} ${className}`}
      {...props}
    />
  )
);
Button.displayName = "Button";
