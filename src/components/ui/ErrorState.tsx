import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : "Erro inesperado";
}

/**
 * Estado de erro padrão do Design System. Aceita `onRetry` para telas com ação de
 * "Tentar novamente" (ex.: `refetch` do TanStack Query); sem ele, funciona como uma
 * nota de erro simples — compatível com o antigo `ErrorNote`.
 */
export function ErrorState({
  error,
  onRetry,
  className,
  compact,
}: {
  error: unknown;
  onRetry?: () => void;
  className?: string;
  /** Layout de linha única, sem borda tracejada — para caixas de formulário. */
  compact?: boolean;
}) {
  const message = messageFrom(error);

  if (compact) {
    return (
      <p
        className={cn(
          "rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive",
          className,
        )}
      >
        {message}
      </p>
    );
  }

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-8 text-center",
        className,
      )}
    >
      <AlertTriangle className="size-5 text-destructive" />
      <p className="text-sm text-destructive">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
