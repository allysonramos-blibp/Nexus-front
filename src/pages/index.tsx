import { Link } from "@/lib/router-compat";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Brain,
  Check,
  Clock,
  Dumbbell,
  Flame,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { api, brl, priorityLabel, today } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Loading } from "@/components/ui/Loading";

function startOfWeek() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

function Today() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  const tasks = useQuery({
    queryKey: ["tasks", userId, "todas"],
    queryFn: () => api.listTasks(userId!),
    enabled: !!userId,
  });

  const transactions = useQuery({
    queryKey: ["transactions", userId],
    queryFn: () => api.listTransactions(userId!),
    enabled: !!userId,
  });

  const workouts = useQuery({
    queryKey: ["workouts", userId],
    queryFn: () => api.listWorkouts(userId!),
    enabled: !!userId,
  });

  const goal = useQuery({
    queryKey: ["goal", userId],
    queryFn: () => api.getGoal(userId!).catch(() => null),
    enabled: !!userId,
  });

  const complete = useMutation({
    mutationFn: (id: number) => api.updateTaskStatus(id, "DOMINADO"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks", userId] }),
  });

  // Primeiro carregamento das três fontes principais do dashboard — depois disso, refetches
  // em segundo plano não devem mais tirar a tela inteira e trocar por um spinner.
  const initialLoading = tasks.isLoading || transactions.isLoading || workouts.isLoading;
  // A primeira falha entre as fontes essenciais decide o estado de erro da tela toda; as
  // demais seções continuam renderizando com o que já têm (falha parcial não trava tudo).
  const criticalError = tasks.error ?? transactions.error ?? workouts.error;

  const pendentes = (tasks.data ?? []).filter((t) => t.status !== "DOMINADO");
  const foco = pendentes.find((t) => t.prioridade === "ALTA") ?? pendentes[0];
  const restantes = pendentes.filter((t) => t.id !== foco?.id).slice(0, 5);

  const list = transactions.data ?? [];
  const saldo = list.reduce(
    (s, t) => s + (t.tipo === "RECEITA" ? Number(t.valor) : -Number(t.valor)),
    0,
  );

  const semana = startOfWeek();
  const treinos = workouts.data ?? [];
  const feitosNaSemana = treinos.filter((w) => w.concluido && w.dataTreino >= semana).length;
  const metaSemanal = goal.data?.metaTreinosPorSemana ?? 0;
  const treinoDeHoje = treinos.find((w) => w.dataTreino === today());

  const dominados = (tasks.data ?? []).filter(
    (t) => t.ehTopicoEdital && t.status === "DOMINADO",
  ).length;
  const totalEdital = (tasks.data ?? []).filter((t) => t.ehTopicoEdital).length;

  return (
    <AppShell
      title="Hoje"
      subtitle={new Date().toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })}
      actions={
        <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm">
          <Flame className="size-4 text-gym" />
          <span className="font-medium">{feitosNaSemana} treinos na semana</span>
        </div>
      }
    >
      {initialLoading ? (
        <Loading label="Carregando seu dia…" />
      ) : criticalError ? (
        <ErrorState
          error={criticalError}
          onRetry={() => {
            tasks.refetch();
            transactions.refetch();
            workouts.refetch();
          }}
        />
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="flex flex-col gap-5 p-6 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <Brain className="size-5 text-study" />
                  Foco único
                </h2>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                  {pendentes.length} pendentes
                </span>
              </div>

              {foco ? (
                <div className="rounded-xl border border-study/30 bg-study/10 p-6">
                  <p className="text-xs uppercase tracking-[0.2em] text-study">Faça isto agora</p>
                  <p className="mt-3 font-display text-2xl font-semibold">{foco.titulo}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span>Prioridade {priorityLabel[foco.prioridade]}</span>
                    {foco.dataLimite && (
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="size-4" /> {foco.dataLimite}
                      </span>
                    )}
                  </div>
                  <Button
                    onClick={() => complete.mutate(foco.id)}
                    loading={complete.isPending}
                    className="mt-6 bg-study hover:opacity-90"
                  >
                    Concluir
                  </Button>
                </div>
              ) : (
                <EmptyState
                  title="Nada pendente"
                  description="Você concluiu tudo que estava no radar de hoje."
                  action={
                    <Link to="/tarefas">
                      <Button variant="outline" size="sm">
                        Criar uma tarefa
                      </Button>
                    </Link>
                  }
                />
              )}

              {restantes.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {restantes.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center gap-3 rounded-lg border border-border/70 bg-surface-raised px-4 py-3"
                    >
                      <button
                        onClick={() => complete.mutate(t.id)}
                        aria-label={`Concluir ${t.titulo}`}
                        className="flex size-5 items-center justify-center rounded-md border border-border text-transparent transition-colors hover:border-dash hover:text-dash"
                      >
                        <Check className="size-3.5" />
                      </button>
                      <span className="flex-1 text-sm">{t.titulo}</span>
                      <span className="text-xs text-muted-foreground">
                        {t.dataLimite ?? priorityLabel[t.prioridade]}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <div className="flex flex-col gap-5">
              <Card className="p-6">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-fin">
                  <Wallet className="size-4" />
                  Saldo
                </h2>
                <p className="mt-3 font-display text-3xl font-bold">{brl(saldo)}</p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <TrendingUp className="size-3.5" /> {list.length} lançamentos
                </p>
                <Link
                  to="/financeiro"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs text-fin hover:underline"
                >
                  Ver financeiro <ArrowRight className="size-3.5" />
                </Link>
              </Card>

              <Card className="p-6">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-gym">
                  <Dumbbell className="size-4" />
                  Treino de hoje
                </h2>
                <p className="mt-3 font-display text-xl font-semibold">
                  {treinoDeHoje ? treinoDeHoje.grupoMuscular : "Nenhum registrado"}
                </p>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Meta semanal</span>
                    <span>
                      {feitosNaSemana} / {metaSemanal || "—"}
                    </span>
                  </div>
                  <ProgressBar
                    className="mt-2"
                    value={feitosNaSemana}
                    max={metaSemanal || 1}
                    accent="var(--gym)"
                  />
                </div>
                <Link
                  to="/treinos"
                  className="mt-5 block w-full rounded-lg border border-gym/40 bg-gym/10 py-2.5 text-center text-sm font-semibold text-gym transition-colors hover:bg-gym/20"
                >
                  Registrar treino
                </Link>
              </Card>
            </div>
          </div>

          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Progresso no edital</h2>
              <p className="text-xs text-muted-foreground">
                {dominados} de {totalEdital} tópicos dominados
              </p>
            </div>
            {totalEdital > 0 ? (
              <ProgressBar className="mt-4" value={dominados} max={totalEdital} accent="var(--study)" />
            ) : (
              <p className="mt-4 text-xs text-muted-foreground">
                Nenhum tópico de edital cadastrado ainda.
              </p>
            )}
          </Card>
        </>
      )}
    </AppShell>
  );
}

export default Today;
