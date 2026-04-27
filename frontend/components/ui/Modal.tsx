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
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative z-10 w-full max-w-md glass-strong rounded-2xl shadow-2xl
        border-[var(--border-strong)] animate-in fade-in zoom-in-95 duration-200 ${className}`}
        style={{ boxShadow: "0 0 60px var(--accent-glow-sm), 0 24px 48px rgba(0,0,0,0.5)" }}
      >
        {title && (
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[var(--border)]">
            <h2 className="font-semibold text-foreground">{title}</h2>
            <button
              onClick={onClose}
              className="text-muted hover:text-foreground transition w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--surface-hover)]"
            >
              ✕
            </button>
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
