import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, FileEdit, BookOpen, CheckCircle2, Sparkles, BookMarked } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { api, errorReasonLabel, type StudyError } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EstudosTabs } from "./EstudosTabs";
import { RevisarQuestaoDialog } from "./RevisarQuestaoDialog";
import { getCadernoNote } from "@/lib/cadernoNotesStorage";

function isAtrasado(e: StudyError) {
  const hoje = new Date().toISOString().slice(0, 10);
  return Boolean(e.proximaRevisao && e.proximaRevisao < hoje);
}

export default function RevisoesPage() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["pending-reviews"],
    queryFn: api.listPendingReviews,
  });

  const [revisando, setRevisando] = useState<StudyError | null>(null);

  const itens = data?.itens ?? [];

  const ordenadas = [...itens].sort((a, b) => Number(isAtrasado(b)) - Number(isAtrasado(a)));

  return (
    <AppShell title="Revisões Ativas" subtitle="Estudos">
      <EstudosTabs active="revisoes" />

      {isLoading && <Loading label="Buscando revisões espaçadas pendentes..." />}
      {error && <ErrorState error={error} onRetry={() => refetch()} />}

      {!isLoading && !error && (
        <>
          <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-surface-raised/40">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-study/15 text-study">
                <CalendarClock className="size-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  {data?.totalPendentes ?? 0} questão(ões) para revisar hoje
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Reencontro ativo com itens que você errou, reforçado por anotações pessoais e explicações.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate("/estudos/caderno-anotacoes")}
                className="gap-1.5 text-xs shrink-0"
              >
                <BookMarked className="size-3.5 text-study" /> Meu Caderno de Anotações
              </Button>
              {ordenadas.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => setRevisando(ordenadas[0])}
                  className="shrink-0 gap-1.5 text-xs"
                >
                  <BookOpen className="size-3.5" /> Iniciar Revisão
                </Button>
              )}
            </div>
          </Card>

          {ordenadas.length === 0 && (
            <EmptyState
              icon={CheckCircle2}
              title="Tudo em dia por aqui! Parabéns 🎉"
              description="Você não tem nenhuma questão pendente de revisão para hoje. Continue resolvendo questões ou explore o Caderno de Erros para estudar anotações."
            />
          )}

          {ordenadas.length > 0 && (
            <div className="flex flex-col gap-2.5">
              {ordenadas.map((e) => {
                const atrasado = isAtrasado(e);
                const savedNote = getCadernoNote(e.id);

                return (
                  <Card
                    key={e.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-dash/40 transition-colors"
                  >
                    <div
                      className="min-w-0 flex-1 cursor-pointer w-full"
                      onClick={() => setRevisando(e)}
                    >
                      <p className="line-clamp-2 text-sm font-medium text-foreground hover:text-dash transition-colors">
                        {e.enunciadoQuestao}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <Badge variant="default">{errorReasonLabel[e.motivo]}</Badge>
                        <Badge variant={atrasado ? "destructive" : "warning"}>
                          {atrasado ? "Atrasada" : "Para Hoje"}
                        </Badge>
                        {savedNote?.resumoRegra && (
                          <Badge variant="info" className="gap-1">
                            <FileEdit className="size-3" /> Anotação de fixação
                          </Badge>
                        )}
                        {e.proximaRevisao && <span>Vencimento: {e.proximaRevisao}</span>}
                      </div>

                      {savedNote?.resumoRegra && (
                        <p className="mt-2 rounded-lg bg-surface-raised/70 border border-border/70 p-2 text-xs text-foreground/90 line-clamp-2">
                          <span className="font-semibold text-dash">Sua Anotação: </span>
                          {savedNote.resumoRegra}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50 w-full sm:w-auto justify-end">
                      <Button size="sm" onClick={() => setRevisando(e)} className="gap-1 text-xs">
                        <BookOpen className="size-3.5" /> Revisar & Anotar
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      <RevisarQuestaoDialog
        key={revisando?.id ?? "none"}
        open={Boolean(revisando)}
        onClose={() => setRevisando(null)}
        studyError={revisando}
      />
    </AppShell>
  );
}
