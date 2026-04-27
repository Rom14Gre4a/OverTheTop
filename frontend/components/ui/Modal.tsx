"use client";

import { useEffect, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className = "" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop — solid, no blur */}
      <div
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`relative z-10 w-full max-w-md rounded-2xl overflow-hidden ${className}`}
        style={{
          background: "linear-gradient(170deg, #1c1c20 0%, #111113 100%)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 40px 80px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {title && (
          <>
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
              <h2 className="font-bold text-base tracking-wide text-foreground">{title}</h2>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-muted transition-colors"
                style={{ background: "rgba(255,255,255,0.05)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.10)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              >
                ✕
              </button>
            </div>

            {/* Accent line under header */}
            <div style={{ height: 2, background: "var(--accent)" }} />
          </>
        )}

        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
