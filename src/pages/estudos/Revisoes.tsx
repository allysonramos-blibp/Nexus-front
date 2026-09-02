import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock } from "lucide-react";
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

function isAtrasado(e: StudyError) {
  const hoje = new Date().toISOString().slice(0, 10);
  return Boolean(e.proximaRevisao && e.proximaRevisao < hoje);
}

export default function RevisoesPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["pending-reviews"],
    queryFn: api.listPendingReviews,
  });

  const [revisando, setRevisando] = useState<StudyError | null>(null);

  const itens = data?.itens ?? [];
  // Atrasadas primeiro — são as que já deviam ter sido revisadas.
  const ordenadas = [...itens].sort((a, b) => Number(isAtrasado(b)) - Number(isAtrasado(a)));

  return (
    <AppShell title="Revisões" subtitle="Estudos">
      <EstudosTabs active="revisoes" />

      {isLoading && <Loading />}
      {error && <ErrorState error={error} onRetry={() => refetch()} />}

      {!isLoading && !error && (
        <>
          <Card className="flex items-center gap-3">
            <CalendarClock className="size-5 text-study" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {data?.totalPendentes ?? 0} revisão(ões) pendente(s) hoje
              </p>
              <p className="text-xs text-muted-foreground">
                Vem do que você errou e marcou no Caderno de Erros com uma próxima revisão vencida.
              </p>
            </div>
          </Card>

          {ordenadas.length === 0 && (
            <EmptyState
              title="Nada pendente de revisão"
              description="Quando você registrar um erro no Caderno de Erros, ele aparece aqui quando a próxima revisão vencer."
            />
          )}

          {ordenadas.length > 0 && (
            <div className="flex flex-col gap-2">
              {ordenadas.map((e) => {
                const atrasado = isAtrasado(e);
                return (
                  <Card key={e.id} className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground">{e.enunciadoQuestao}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge>{errorReasonLabel[e.motivo]}</Badge>
                        <Badge variant={atrasado ? "destructive" : "warning"}>
                          {atrasado ? "Atrasada" : "Pendente"}
                        </Badge>
                        {e.proximaRevisao && <span>Prevista: {e.proximaRevisao}</span>}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => setRevisando(e)}>
                      Revisar
                    </Button>
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
