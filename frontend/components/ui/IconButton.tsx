import { type ButtonHTMLAttributes } from "react";

type IBVariant = "ghost" | "danger" | "accent";
type IBSize    = "xs" | "sm" | "md";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IBVariant;
  size?:    IBSize;
}

const SZ: Record<IBSize, number> = { xs: 22, sm: 28, md: 34 };

const BG: Record<IBVariant, string> = {
  ghost:  "#111316",
  danger: "#1a0e0e",
  accent: "color-mix(in srgb, var(--accent) 18%, transparent)",
};
const BORDER: Record<IBVariant, string> = {
  ghost:  "#1e2228",
  danger: "#3a1a1a",
  accent: "color-mix(in srgb, var(--accent) 40%, transparent)",
};
const COLOR: Record<IBVariant, string> = {
  ghost:  "#3a4048",
  danger: "#ef4444",
  accent: "var(--accent)",
};
const COLOR_HOVER: Record<IBVariant, string> = {
  ghost:  "#8a9ab0",
  danger: "#f87171",
  accent: "var(--accent)",
};

/**
 * Square icon button — for ×, ★, ⋯ actions on cards / in modals.
 */
export function IconButton({
  variant = "ghost", size = "sm",
  children, style, ...rest
}: IconButtonProps) {
  const sz = SZ[size];
  return (
    <button
      style={{
        width: sz, height: sz, flexShrink: 0,
        borderRadius: Math.round(sz * 0.26),
        background: BG[variant],
        border: `1px solid ${BORDER[variant]}`,
        color: COLOR[variant],
        fontSize: "var(--fz-xs)",
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "color 0.15s, background 0.15s",
        ...style,
      }}
      onMouseEnter={e => { e.currentTarget.style.color = COLOR_HOVER[variant]; }}
      onMouseLeave={e => { e.currentTarget.style.color = COLOR[variant]; }}
      {...rest}
    >
      {children}
    </button>
  );
}
