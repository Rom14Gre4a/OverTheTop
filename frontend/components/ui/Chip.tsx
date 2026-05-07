import { type ButtonHTMLAttributes } from "react";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?:  boolean;
  color?:   string;   // accent override (hex)
}

/**
 * Pill-shaped toggle chip — for category filters, focus tags, multi-select.
 * Uses accent color when active; neutral when inactive.
 */
export function Chip({ active, color, children, className = "", style, ...rest }: ChipProps) {
  const ac = color ?? "var(--accent)";
  return (
    <button
      className={className}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "5px 12px", borderRadius: 20,
        fontSize: "var(--fz-xs)", fontWeight: 700,
        background: active ? `color-mix(in srgb, ${ac} 20%, transparent)` : "#111316",
        border: `1px solid ${active ? `color-mix(in srgb, ${ac} 55%, transparent)` : "#1e2228"}`,
        color: active ? ac : "#5a6270",
        cursor: "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
