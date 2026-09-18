import { AlertTriangle, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

function messageFrom(error: unknown): string {
  if (error instanceof Error) {
    if (
      ("status" in error && (error as { status: number }).status === 401) ||
      error.message.includes("Token de acesso") ||
      error.message.includes("Não autenticado") ||
      error.message.includes("sessão expirou")
    ) {
      return "Sua sessão de acesso expirou por segurança. Faça login novamente para continuar.";
    }
    return error.message;
  }
  return "Erro inesperado";
}

function checkIsAuth(error: unknown, msg: string): boolean {
  return (
    (error != null && typeof error === "object" && "status" in error && (error as { status: number }).status === 401) ||
    msg.toLowerCase().includes("sessão expirou") ||
    msg.toLowerCase().includes("não autenticado") ||
    msg.toLowerCase().includes("token")
  );
}

export function ErrorState({
  error,
  onRetry,
  className,
  compact,
}: {
  error: unknown;
  onRetry?: () => void;
  className?: string;

  compact?: boolean;
}) {
  const message = messageFrom(error);
  const isAuth = checkIsAuth(error, message);

  if (compact) {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive",
          className,
        )}
      >
        <span className="flex-1">{message}</span>
        {isAuth && (
          <button
            type="button"
            onClick={() => {
              window.location.href = "/login";
            }}
            className="inline-flex items-center gap-1 font-bold underline hover:opacity-80"
          >
            <LogIn className="size-3" /> Fazer login
          </button>
        )}
      </div>
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
      {isAuth ? (
        <Button
          size="sm"
          onClick={() => {
            window.location.href = "/login";
          }}
          className="mt-1 gap-1.5"
        >
          <LogIn className="size-4" /> Entrar novamente
        </Button>
      ) : (
        onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
            Tentar novamente
          </Button>
        )
      )}
    </div>
  );
}
