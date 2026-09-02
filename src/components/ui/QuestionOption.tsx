import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type QuestionOptionState = "idle" | "selected" | "correct" | "incorrect";

/**
 * Uma alternativa (A–E) de uma questão. Estados:
 * - idle: nada respondido ainda, clicável.
 * - selected: escolhida pelo usuário, aguardando confirmação (opcional).
 * - correct: gabarito — some verde após responder.
 * - incorrect: a que o usuário errou — fica vermelha após responder.
 */
export function QuestionOption({
  letter,
  text,
  state = "idle",
  disabled,
  onClick,
}: {
  letter: string;
  text: string;
  state?: QuestionOptionState;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const isAnswered = state === "correct" || state === "incorrect";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={state === "selected"}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
        "disabled:cursor-not-allowed",
        state === "idle" && "border-border bg-surface-raised hover:border-dash/60",
        state === "selected" && "border-dash bg-dash/10",
        state === "correct" && "border-fin bg-fin/10",
        state === "incorrect" && "border-destructive bg-destructive/10",
      )}
    >
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
          state === "idle" && "border-border text-muted-foreground",
          state === "selected" && "border-dash text-dash",
          state === "correct" && "border-fin bg-fin text-primary-foreground",
          state === "incorrect" && "border-destructive bg-destructive text-destructive-foreground",
        )}
      >
        {letter}
      </span>
      <span className="flex-1 text-foreground">{text}</span>
      {isAnswered && state === "correct" && <Check className="size-4 shrink-0 text-fin" />}
      {isAnswered && state === "incorrect" && <X className="size-4 shrink-0 text-destructive" />}
    </button>
  );
}
