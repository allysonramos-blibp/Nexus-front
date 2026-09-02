import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EstudosTabs } from "./EstudosTabs";

function pct(acertos: number, respondidas: number) {
  return respondidas > 0 ? (acertos / respondidas) * 100 : 0;
}

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function DesempenhoPage() {
  const geral = useQuery({ queryKey: ["stats-geral"], queryFn: api.statsGeral });
  const porMateria = useQuery({ queryKey: ["stats-materia"], queryFn: api.statsPorMateria });
  const porAssunto = useQuery({ queryKey: ["stats-assunto"], queryFn: api.statsPorAssunto });

  const [inicio, setInicio] = useState(isoDaysAgo(30));
  const [fim, setFim] = useState(isoDaysAgo(0));
  const periodo = useQuery({
    queryKey: ["stats-periodo", inicio, fim],
    queryFn: () => api.statsPorPeriodo(inicio, fim),
    enabled: false,
  });

  const isLoading = geral.isLoading || porMateria.isLoading || porAssunto.isLoading;
  const anyError = geral.error ?? porMateria.error ?? porAssunto.error;

  return (
    <AppShell title="Desempenho" subtitle="Estudos">
      <EstudosTabs active="desempenho" />

      {isLoading && <Loading />}
      {anyError && (
        <ErrorState
          error={anyError}
          onRetry={() => {
            geral.refetch();
            porMateria.refetch();
            porAssunto.refetch();
          }}
        />
      )}

      {!isLoading && !anyError && geral.data && (
        <>
          {geral.data.questoesRespondidas === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="Ainda sem dados"
              description="Responda algumas questões em Estudos → Questões para ver seu desempenho aqui."
            />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-4">
                <StatCard label="Respondidas" value={geral.data.questoesRespondidas} accent="var(--dash)" />
                <StatCard label="Acertos" value={geral.data.acertos} accent="var(--fin)" />
                <StatCard label="Erros" value={geral.data.erros} accent="var(--destructive)" />
                <StatCard
                  label="% de acerto"
                  value={`${geral.data.percentualAcerto.toFixed(0)}%`}
                  accent="var(--study)"
                />
              </div>

              {(porMateria.data?.length ?? 0) > 0 && (
                <Card>
                  <h2 className="text-sm font-semibold">Desempenho por matéria</h2>
                  <div className="mt-3 flex flex-col gap-3">
                    {(porMateria.data ?? []).map((m) => (
                      <div key={m.subjectId}>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{m.subjectNome}</span>
                          <span>
                            {m.acertos}/{m.respondidas} ({pct(m.acertos, m.respondidas).toFixed(0)}%)
                          </span>
                        </div>
                        <ProgressBar
                          className="mt-1"
                          value={m.acertos}
                          max={Math.max(m.respondidas, 1)}
                          accent="var(--study)"
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {(porAssunto.data?.length ?? 0) > 0 && (
                <Card>
                  <h2 className="text-sm font-semibold">Desempenho por assunto</h2>
                  <div className="mt-3 flex flex-col gap-3">
                    {(porAssunto.data ?? []).map((t) => (
                      <div key={t.topicId}>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{t.topicNome}</span>
                          <span>
                            {t.acertos}/{t.respondidas} ({pct(t.acertos, t.respondidas).toFixed(0)}%)
                          </span>
                        </div>
                        <ProgressBar
                          className="mt-1"
                          value={t.acertos}
                          max={Math.max(t.respondidas, 1)}
                          accent="var(--gym)"
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </>
      )}

      <Card>
        <h2 className="text-sm font-semibold">Por período</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <Input label="De" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
          <Input label="Até" type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
          <Button className="self-end" onClick={() => periodo.refetch()} loading={periodo.isFetching}>
            Consultar
          </Button>
        </div>
        {periodo.error && <ErrorState error={periodo.error} compact className="mt-3" />}
        {periodo.data && (
          <div className="mt-4 grid gap-4 sm:grid-cols-4">
            <StatCard label="Respondidas" value={periodo.data.questoesRespondidas} accent="var(--dash)" />
            <StatCard label="Acertos" value={periodo.data.acertos} accent="var(--fin)" />
            <StatCard label="Erros" value={periodo.data.erros} />
            <StatCard label="% de acerto" value={`${periodo.data.percentualAcerto.toFixed(0)}%`} accent="var(--study)" />
          </div>
        )}
      </Card>
    </AppShell>
  );
}
