type Variant = "accent" | "success" | "warning" | "danger" | "neutral";

interface BadgeProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}

const variants: Record<Variant, string> = {
  accent:  "bg-[var(--accent-dim)] text-[var(--accent)] border-[var(--accent)]/30",
  success: "bg-green-500/10  text-green-400  border-green-500/30",
  warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  danger:  "bg-red-500/10   text-red-400   border-red-500/30",
  neutral: "bg-white/5      text-muted     border-white/10",
};

export function Badge({ variant = "neutral", children, className = "" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
