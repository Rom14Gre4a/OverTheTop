import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size    = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  glow?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

const textCls: Record<Variant, string> = {
  primary:   "text-black active:scale-95",
  secondary: "text-foreground",
  ghost:     "text-muted hover:text-foreground",
  danger:    "text-red-400 hover:text-red-300",
};

const sizes: Record<Size, string> = {
  sm: "h-8  px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

function baseStyle(variant: Variant): React.CSSProperties {
  if (variant === "primary") return {
    background: "linear-gradient(160deg, var(--accent-light) 0%, var(--accent) 100%)",
    border: "1px solid rgba(255,255,255,0.18)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22), 0 2px 8px rgba(0,0,0,0.35)",
  };
  if (variant === "secondary") return {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07)",
  };
  if (variant === "ghost") return {
    background: "transparent",
    border: "1px solid transparent",
  };
  if (variant === "danger") return {
    background: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.22)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
  };
  return {};
}

function hoverStyle(el: HTMLButtonElement, variant: Variant, entering: boolean) {
  const s = baseStyle(variant);
  if (variant === "primary") {
    el.style.opacity = entering ? "0.88" : "";
  }
  if (variant === "secondary") {
    el.style.background = entering ? "rgba(255,255,255,0.12)" : (s.background as string);
    el.style.borderColor = entering ? "rgba(255,255,255,0.20)" : "";
  }
  if (variant === "ghost") {
    el.style.background = entering ? "rgba(255,255,255,0.06)" : "";
  }
  if (variant === "danger") {
    el.style.background = entering ? "rgba(239,68,68,0.15)" : (s.background as string);
    el.style.borderColor = entering ? "rgba(239,68,68,0.42)" : "";
  }
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      glow: _glow,
      className = "",
      style: userStyle,
      onMouseEnter,
      onMouseLeave,
      ...rest
    },
    ref
  ) => (
    <button
      ref={ref}
      className={`${base} ${textCls[variant]} ${sizes[size]} ${className}`}
      style={{ ...baseStyle(variant), ...userStyle }}
      onMouseEnter={(e) => { hoverStyle(e.currentTarget, variant, true);  onMouseEnter?.(e); }}
      onMouseLeave={(e) => { hoverStyle(e.currentTarget, variant, false); onMouseLeave?.(e); }}
      {...rest}
    />
  )
);
Button.displayName = "Button";
