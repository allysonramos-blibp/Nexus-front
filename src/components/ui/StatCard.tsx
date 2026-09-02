import type { ReactNode, SVGProps } from "react";
import { cn } from "@/lib/utils";
import { Card } from "./Card";

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "var(--dash)",
  footer,
  className,
}: {
  label: string;
  value: ReactNode;
  icon?: React.ComponentType<SVGProps<SVGSVGElement>>;
  accent?: string;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        {Icon && (
          <span
            className="flex size-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: `color-mix(in oklch, ${accent} 15%, transparent)` }}
          >
            <Icon className="size-4" style={{ color: accent }} />
          </span>
        )}
      </div>
      <p className="font-display text-2xl font-bold text-foreground">{value}</p>
      {footer && <div className="text-xs text-muted-foreground">{footer}</div>}
    </Card>
  );
}
