"use client";

import { useEffect, type ReactNode } from "react";

type ModalVariant = "center" | "sheet";   // sheet = bottom drawer
type ModalSize    = "sm" | "md" | "lg" | "xl" | "full";

const MAX_WIDTHS: Record<ModalSize, number | string> = {
  sm:   380,
  md:   480,
  lg:   640,
  xl:   800,
  full: "100%",
};

interface ModalProps {
  open:      boolean;
  onClose:   () => void;
  title?:    string;
  children:  ReactNode;
  variant?:  ModalVariant;
  size?:     ModalSize;
  maxWidth?: number | string;  // overrides size
  className?: string;
}

export function Modal({
  open, onClose, title, children,
  variant = "center", size = "md",
  maxWidth, className = "",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;

  const w = maxWidth ?? MAX_WIDTHS[size];
  const isSheet = variant === "sheet";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      display: "flex",
      alignItems:     isSheet ? "flex-end" : "center",
      justifyContent: "center",
      padding:        isSheet ? 0 : 16,
    }}>
      {/* Backdrop */}
      <div
        style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(5px)",
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={className}
        style={{
          position: "relative", zIndex: 10,
          width: "100%",
          maxWidth: w,
          maxHeight: isSheet ? "85vh" : "90vh",
          display: "flex", flexDirection: "column",
          background: "linear-gradient(180deg, rgba(18,20,24,0.99), rgba(10,12,14,1))",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: isSheet ? "18px 18px 0 0" : 18,
          boxShadow: isSheet
            ? "0 -20px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)"
            : "0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        {title && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 20px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            flexShrink: 0,
          }}>
            <span style={{
              color: "#e8edf2", fontSize: "var(--fz-body)",
              fontWeight: 700, lineHeight: 1,
            }}>{title}</span>
            <button
              onClick={onClose}
              style={{
                width: 28, height: 28, borderRadius: 7,
                background: "#1a1e22", border: "1px solid #252a30",
                color: "#555", fontSize: "var(--fz-body)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "color 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "#bbb")}
              onMouseLeave={e => (e.currentTarget.style.color = "#555")}
            >×</button>
          </div>
        )}

        {/* Scrollable body */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/** Convenience header area for use inside Modal children */
export function ModalBody({ children, pad = true }: { children: ReactNode; pad?: boolean }) {
  return (
    <div style={{ padding: pad ? "16px 20px 20px" : 0 }}>
      {children}
    </div>
  );
}
