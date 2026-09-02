import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantIcon: Record<ToastVariant, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const variantClasses: Record<ToastVariant, string> = {
  success: "border-fin/40 text-fin",
  error: "border-destructive/40 text-destructive",
  info: "border-dash/40 text-dash",
};

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, message, variant }]);
      window.setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== "undefined" &&
        createPortal(
          <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:items-end sm:right-4 sm:left-auto">
            {toasts.map((t) => {
              const Icon = variantIcon[t.variant];
              return (
                <div
                  key={t.id}
                  role="status"
                  className={cn(
                    "panel pointer-events-auto flex w-full max-w-sm items-start gap-2.5 border p-3 text-sm",
                    variantClasses[t.variant],
                  )}
                >
                  <Icon className="mt-0.5 size-4 shrink-0" />
                  <p className="flex-1 text-foreground">{t.message}</p>
                  <button
                    type="button"
                    aria-label="Fechar notificação"
                    onClick={() => dismiss(t.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              );
            })}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast precisa estar dentro de <ToastProvider>");
  return ctx;
}
