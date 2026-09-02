import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  max = 100,
  className,
  trackClassName,
  accent = "var(--dash)",
}: {
  value: number;
  max?: number;
  className?: string;
  trackClassName?: string;
  /** Cor da barra preenchida — aceita qualquer valor CSS de cor (ex.: "var(--fin)"). */
  accent?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-raised", trackClassName, className)}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{ width: `${pct}%`, backgroundColor: accent }}
      />
    </div>
  );
}
