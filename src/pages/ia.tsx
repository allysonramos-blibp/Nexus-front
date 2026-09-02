import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Bot, Send, User } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { api, type ChatMessage } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";

function IaPage() {
  const location = useLocation();
  const [pergunta, setPergunta] = useState(
    (location.state as { initialMessage?: string } | null)?.initialMessage ?? "",
  );
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chat = useMutation({
    mutationFn: (message: string) => api.chat(message, history),
    onSuccess: (res, message) => {
      setHistory((h) => [
        ...h,
        { role: "user", content: message },
        { role: "assistant", content: res.reply },
      ]);
      setPending(null);
    },
    onError: (_err, message) => setPending(message),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [history, chat.isPending]);

  function send(message: string) {
    if (!message.trim() || chat.isPending) return;
    chat.mutate(message.trim());
    setPergunta("");
  }

  return (
    <AppShell title="IA" subtitle="Tutor de estudos">
      <Card className="flex h-[70vh] flex-col p-0">
        <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
          {history.length === 0 && !chat.isPending && (
            <EmptyState
              icon={Bot}
              title="Pergunte o que quiser sobre seus estudos"
              description="Explicar uma questão, resumir um conteúdo, sugerir o que revisar — é só perguntar."
            />
          )}
          {history.map((m, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 ${m.role === "user" ? "flex-row-reverse self-end" : ""}`}
            >
              <span
                className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${
                  m.role === "user" ? "bg-secondary text-muted-foreground" : "bg-study/15 text-study"
                }`}
              >
                {m.role === "user" ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
              </span>
              <div
                className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm ${
                  m.role === "user" ? "bg-surface-raised" : "border border-study/30 bg-study/10"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
              </div>
            </div>
          ))}
          {chat.isPending && <Loading label="A IA está pensando…" />}
          {chat.error && pending && (
            <ErrorState error={chat.error} onRetry={() => send(pending)} compact />
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(pergunta);
          }}
          className="flex gap-2 border-t border-border p-3"
        >
          <Input
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
            placeholder="Sua dúvida…"
            aria-label="Sua dúvida"
            className="flex-1"
            autoFocus
          />
          <Button type="submit" disabled={chat.isPending || !pergunta.trim()} aria-label="Enviar pergunta">
            <Send className="size-4" />
          </Button>
        </form>
      </Card>
    </AppShell>
  );
}

export default IaPage;
