import { type HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  strong?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ glow, strong, className = "", children, ...props }, ref) => (
    <div
      ref={ref}
      className={`rounded-2xl p-5 transition-all duration-200
        ${strong ? "glass-strong" : "glass"}
        ${glow ? "glow-border" : "hover:border-[var(--border-strong)]"}
        ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);
Card.displayName = "Card";
