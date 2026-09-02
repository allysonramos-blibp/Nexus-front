import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "default" | "success" | "warning" | "destructive" | "info";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-surface-raised text-muted-foreground",
  info: "bg-dash/15 text-dash",
  success: "bg-fin/15 text-fin",
  warning: "bg-gym/15 text-gym",
  destructive: "bg-destructive/15 text-destructive",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
