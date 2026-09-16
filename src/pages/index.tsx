import { useState } from "react";
import { ExecutiveReportModal } from "@/components/ExecutiveReportModal";
import { Link } from "@/lib/router-compat";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  CheckCircle2,
  Clock,
  Dumbbell,
  FileText,
  Flame,
  Lock,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  api,
  brl,
  isTaskConcluded,
  priorityLabel,
  today,
  type Task,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAiChat } from "@/contexts/AiChatContext";
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

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}

function getDisplayName(email?: string): string {
  if (!email) return "Guerreiro";
  const namePart = email.split("@")[0] || "";
  const clean = namePart.replace(/[0-9._-]+/g, " ").trim();
  if (!clean) return "Guerreiro";
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function Today() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { openChat } = useAiChat();
  const userId = user?.id;
  const [reportOpen, setReportOpen] = useState(false);

  // Permissões comerciais e controle de acesso por módulo
  const isMasterAdmin =
    user?.email === "allysonr510@gmail.com" || user?.role === "ROLE_ADMIN";
  const canEstudos = isMasterAdmin || user?.moduloEstudos !== false;
  const canTreinos = isMasterAdmin || user?.moduloTreinos !== false;
  const canFinancas = isMasterAdmin || user?.moduloFinancas !== false;
  const canIa = isMasterAdmin || user?.moduloIaExtracao !== false;

  // Tarefas (sempre liberadas no ecossistema de produtividade)
  const tasks = useQuery({
    queryKey: ["tasks", userId, "todas"],
    queryFn: () => api.listTasks(userId!),
    enabled: !!userId,
  });

  // Finanças (APENAS se o módulo estiver permitido para o usuário)
  const transactions = useQuery({
    queryKey: ["transactions", userId],
    queryFn: () => api.listTransactions(userId!),
    enabled: !!userId && canFinancas,
  });

  // Treinos (APENAS se o módulo estiver permitido para o usuário)
  const workouts = useQuery({
    queryKey: ["workouts", userId],
    queryFn: () => api.listWorkouts(userId!),
    enabled: !!userId && canTreinos,
  });

  const goal = useQuery({
    queryKey: ["goal", userId],
    queryFn: () => api.getGoal(userId!).catch(() => null),
    enabled: !!userId && canTreinos,
  });

  // Estudos — pendentes de revisão se o módulo de estudos estiver ativo
  const pendingReviews = useQuery({
    queryKey: ["pendingReviews"],
    queryFn: () => api.listPendingReviews().catch(() => null),
    enabled: !!userId && canEstudos,
  });

  const complete = useMutation({
    mutationFn: (task: Task) =>
      task.ehTopicoEdital
        ? api.updateTaskStatus(task.id, "DOMINADO")
        : api.updateTaskWorkflowStatus(task.id, "CONCLUIDA"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks", userId] }),
  });

  // Loading apenas dos módulos ativos na conta do cliente
  const initialLoading =
    tasks.isLoading ||
    (canFinancas && transactions.isLoading) ||
    (canTreinos && workouts.isLoading);

  // Erro crítico apenas das fontes contratadas
  const criticalError =
    tasks.error ??
    (canFinancas ? transactions.error : null) ??
    (canTreinos ? workouts.error : null);

  // Cálculos de Tarefas
  const allTasks = tasks.data ?? [];
  const pendentes = allTasks.filter((t) => !isTaskConcluded(t));
  const concluidas = allTasks.filter((t) => isTaskConcluded(t));
  const foco = pendentes.find((t) => t.prioridade === "ALTA") ?? pendentes[0];
  const restantes = pendentes.filter((t) => t.id !== foco?.id).slice(0, 5);

  // Cálculos de Finanças (somente se permitido)
  const list = canFinancas ? transactions.data ?? [] : [];
  const saldo = list.reduce(
    (s, t) => s + (t.tipo === "RECEITA" ? Number(t.valor) : -Number(t.valor)),
    0,
  );

  // Cálculos de Treinos (somente se permitido)
  const semana = startOfWeek();
  const treinos = canTreinos ? workouts.data ?? [] : [];
  const feitosNaSemana = treinos.filter(
    (w) => w.concluido && w.dataTreino >= semana,
  ).length;
  const metaSemanal = goal.data?.metaTreinosPorSemana ?? 0;
  const treinoDeHoje = treinos.find((w) => w.dataTreino === today());

  // Cálculos de Estudos (somente se permitido)
  const dominados = allTasks.filter(
    (t) => t.ehTopicoEdital && t.status === "DOMINADO",
  ).length;
  const totalEdital = allTasks.filter((t) => t.ehTopicoEdital).length;
  const pctEdital =
    totalEdital > 0 ? Math.round((dominados / totalEdital) * 100) : 0;
  const totalRevisoesPendentes = pendingReviews.data?.totalPendentes ?? 0;

  // Ação Dinâmica no topo do Header de acordo com os módulos contratados
  const headerAction = (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setReportOpen(true)}
        className="text-xs gap-1.5 border-border/80 hover:border-dash/40 cursor-pointer"
      >
        <FileText className="size-3.5 text-dash" />
        <span className="hidden sm:inline">Relatório Executivo</span>
        <span className="sm:hidden">Relatório</span>
      </Button>
      {canTreinos ? (
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-gym/30 bg-gym/10 px-3 py-1.5 text-xs font-semibold text-gym">
          <Flame className="size-3.5 text-gym animate-pulse" />
          <span>{feitosNaSemana} treinos na semana</span>
        </div>
      ) : canEstudos && totalEdital > 0 ? (
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-study/30 bg-study/10 px-3 py-1.5 text-xs font-semibold text-study">
          <Brain className="size-3.5 text-study" />
          <span>{dominados} tópicos dominados</span>
        </div>
      ) : (
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
          <CheckCircle2 className="size-3.5 text-primary" />
          <span>{concluidas.length} concluídas</span>
        </div>
      )}
    </div>
  );

  const greeting = getGreeting();
  const userName = getDisplayName(user?.email);

  // Quantidade de módulos desativados (para exibir sugestão limpa de upgrade)
  const modulosDesativados: { name: string; icon: typeof Dumbbell; desc: string }[] = [];
  if (!canTreinos) {
    modulosDesativados.push({
      name: "Treinos",
      icon: Dumbbell,
      desc: "Acompanhe rotinas de treino, divisão muscular e consistência física.",
    });
  }
  if (!canFinancas) {
    modulosDesativados.push({
      name: "Finanças",
      icon: Wallet,
      desc: "Controle fluxo de caixa, parcelamentos e saldo em tempo real.",
    });
  }

  return (
    <AppShell
      title="Hoje"
      subtitle={`${new Date().toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })}`}
      actions={headerAction}
    >
      {initialLoading ? (
        <Loading label="Carregando seu dia…" />
      ) : criticalError ? (
        <ErrorState
          error={criticalError}
          onRetry={() => {
            tasks.refetch();
            if (canFinancas) transactions.refetch();
            if (canTreinos) workouts.refetch();
          }}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {/* Banner de Saudação e Status Pessoal */}
          <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-surface p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Painel do Aluno
                  </span>
                  {isMasterAdmin ? (
                    <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                      Admin
                    </span>
                  ) : user?.plan ? (
                    <span className="rounded bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/20 uppercase tracking-wider">
                      Plano {user.plan}
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {greeting}, {userName}!
                </h2>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  {pendentes.length > 0
                    ? `Você tem ${pendentes.length} ${
                        pendentes.length === 1 ? "tarefa pendente" : "tarefas pendentes"
                      } para avançar hoje.`
                    : "Tudo limpo por aqui! Você está com as tarefas em dia."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
                <Link to="/tarefas">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5 border-border/80"
                  >
                    <Plus className="size-3.5" /> Nova Tarefa
                  </Button>
                </Link>
                {canIa && (
                  <Button
                    size="sm"
                    onClick={() => openChat("Como posso organizar meus estudos e tarefas hoje?")}
                    className="text-xs gap-1.5 bg-gradient-to-r from-primary to-indigo-600 hover:opacity-90 shadow-xs"
                  >
                    <Sparkles className="size-3.5" /> Falar com IA
                  </Button>
                )}
              </div>
            </div>

            {/* Linha de KPIs Adaptativos (apenas módulos liberados) */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {/* Card 1: Tarefas */}
              <div className="rounded-xl border border-border/70 bg-surface-raised/60 p-3.5">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  Tarefas
                  <Target className="size-3.5 text-dash" />
                </p>
                <p className="mt-2 font-display text-xl font-bold text-foreground">
                  {pendentes.length}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    / {allTasks.length}
                  </span>
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {concluidas.length} concluídas
                </p>
              </div>

              {/* Card 2: Estudos (somente se permitido) */}
              {canEstudos && (
                <div className="rounded-xl border border-study/20 bg-study/5 p-3.5">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-study flex items-center justify-between">
                    Edital Dominado
                    <Brain className="size-3.5 text-study" />
                  </p>
                  <p className="mt-2 font-display text-xl font-bold text-foreground">
                    {pctEdital}%
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {dominados} de {totalEdital} tópicos
                  </p>
                </div>
              )}

              {/* Card 3: Treinos (somente se permitido) */}
              {canTreinos && (
                <div className="rounded-xl border border-gym/20 bg-gym/5 p-3.5">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-gym flex items-center justify-between">
                    Frequência Físico
                    <Dumbbell className="size-3.5 text-gym" />
                  </p>
                  <p className="mt-2 font-display text-xl font-bold text-foreground">
                    {feitosNaSemana}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      / {metaSemanal || "4"}
                    </span>
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    meta da semana
                  </p>
                </div>
              )}

              {/* Card 4: Finanças (somente se permitido) */}
              {canFinancas && (
                <div className="rounded-xl border border-fin/20 bg-fin/5 p-3.5">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-fin flex items-center justify-between">
                    Saldo Atual
                    <Wallet className="size-3.5 text-fin" />
                  </p>
                  <p className="mt-2 font-display text-xl font-bold text-foreground truncate">
                    {brl(saldo)}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {list.length} lançamentos
                  </p>
                </div>
              )}

              {/* Card alternativo se o usuário tiver poucos módulos: Indicador de Revisões ou Status */}
              {canEstudos && !canTreinos && !canFinancas && (
                <div className="rounded-xl border border-border/70 bg-surface-raised/60 p-3.5">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    Revisões Pendentes
                    <Clock className="size-3.5 text-amber-400" />
                  </p>
                  <p className="mt-2 font-display text-xl font-bold text-foreground">
                    {totalRevisoesPendentes}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {totalRevisoesPendentes > 0 ? "Aguardando revisão" : "Em dia"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Grid Principal do Dashboard */}
          <div
            className={`grid gap-6 ${
              canTreinos || canFinancas ? "lg:grid-cols-3" : "lg:grid-cols-12"
            }`}
          >
            {/* Coluna de Foco & Tarefas */}
            <Card
              className={`flex flex-col gap-5 p-6 ${
                canTreinos || canFinancas
                  ? "lg:col-span-2"
                  : "lg:col-span-7"
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Zap className="size-5 text-dash" />
                  Foco do Dia
                </h2>
                <span className="rounded-full bg-surface-raised px-3 py-1 text-xs text-muted-foreground border border-border">
                  {pendentes.length} pendentes
                </span>
              </div>

              {foco ? (
                <div className="rounded-xl border border-dash/40 bg-dash/10 p-5 sm:p-6 transition-all">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.2em] font-semibold text-dash">
                      Faça isto agora
                    </p>
                    <span className="text-[11px] font-medium text-muted-foreground bg-surface px-2 py-0.5 rounded border border-border">
                      Prioridade {priorityLabel[foco.prioridade]}
                    </span>
                  </div>
                  <p className="mt-3 font-display text-xl sm:text-2xl font-semibold text-foreground leading-snug">
                    {foco.titulo}
                  </p>
                  {foco.descricao && (
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                      {foco.descricao}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    {foco.dataLimite && (
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="size-3.5" /> Prazo: {foco.dataLimite}
                      </span>
                    )}
                    {foco.ehTopicoEdital && (
                      <span className="inline-flex items-center gap-1.5 text-study">
                        <Brain className="size-3.5" /> Tópico do Edital
                      </span>
                    )}
                  </div>
                  <Button
                    onClick={() => complete.mutate(foco)}
                    loading={complete.isPending}
                    className="mt-5 w-full sm:w-auto bg-dash hover:opacity-90 text-xs font-semibold text-white px-6"
                  >
                    <Check className="size-3.5 mr-1.5" /> Concluir Tarefa
                  </Button>
                </div>
              ) : (
                <EmptyState
                  title="Nada pendente"
                  description="Você concluiu tudo o que estava agendado para hoje."
                  action={
                    <Link to="/tarefas">
                      <Button variant="outline" size="sm" className="text-xs">
                        Criar uma nova tarefa
                      </Button>
                    </Link>
                  }
                />
              )}

              {/* Lista das próximas tarefas */}
              {restantes.length > 0 && (
                <div className="mt-2 flex flex-col gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Próximas no radar
                  </p>
                  <ul className="flex flex-col gap-2">
                    {restantes.map((t) => (
                      <li
                        key={t.id}
                        className="flex items-center gap-3 rounded-lg border border-border/70 bg-surface-raised px-4 py-3 transition-colors hover:border-border"
                      >
                        <button
                          onClick={() => complete.mutate(t)}
                          aria-label={`Concluir ${t.titulo}`}
                          className="flex size-5 items-center justify-center rounded-md border border-border text-transparent transition-colors hover:border-dash hover:text-dash shrink-0"
                        >
                          <Check className="size-3.5" />
                        </button>
                        <span className="flex-1 text-xs sm:text-sm font-medium text-foreground truncate">
                          {t.titulo}
                        </span>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {t.dataLimite ?? priorityLabel[t.prioridade]}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            {/* Painel Lateral Direito (renderizado estritamente conforme permissões) */}
            <div
              className={`flex flex-col gap-5 ${
                canTreinos || canFinancas ? "" : "lg:col-span-5"
              }`}
            >
              {/* Módulo de Estudos em Destaque (especialmente valioso para perfil focado como Júlia) */}
              {canEstudos && (
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-study">
                      <Brain className="size-4" />
                      Estudos & Concursos
                    </h2>
                    <span className="text-xs font-bold text-study">
                      {pctEdital}%
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-muted-foreground">
                    {dominados} de {totalEdital} tópicos do edital dominados
                  </p>

                  <ProgressBar
                    className="mt-2"
                    value={dominados}
                    max={totalEdital || 1}
                    accent="var(--study)"
                  />

                  {/* Ações Rápidas de Estudo */}
                  <div className="mt-4 grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
                    <Link
                      to="/estudos"
                      className="flex items-center justify-center gap-1 rounded-lg border border-border/70 bg-surface-raised/70 px-2.5 py-2 text-[11px] font-semibold text-foreground hover:bg-surface-raised transition-colors text-center"
                    >
                      <BookOpen className="size-3 text-study" />
                      Planos & Edital
                    </Link>
                    <Link
                      to="/estudos"
                      className="flex items-center justify-center gap-1 rounded-lg border border-border/70 bg-surface-raised/70 px-2.5 py-2 text-[11px] font-semibold text-foreground hover:bg-surface-raised transition-colors text-center"
                    >
                      <FileText className="size-3 text-study" />
                      Questões & Simulados
                    </Link>
                  </div>
                </Card>
              )}

              {/* Módulo de Finanças (APENAS se o usuário tiver moduloFinancas !== false) */}
              {canFinancas && (
                <Card className="p-6">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-fin">
                    <Wallet className="size-4" />
                    Saldo
                  </h2>
                  <p className="mt-3 font-display text-3xl font-bold text-foreground">
                    {brl(saldo)}
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <TrendingUp className="size-3.5" /> {list.length} lançamentos
                  </p>
                  <Link
                    to="/financeiro"
                    className="mt-4 inline-flex items-center gap-1.5 text-xs text-fin hover:underline font-semibold"
                  >
                    Ver financeiro completo <ArrowRight className="size-3.5" />
                  </Link>
                </Card>
              )}

              {/* Módulo de Treinos (APENAS se o usuário tiver moduloTreinos !== false) */}
              {canTreinos && (
                <Card className="p-6">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-gym">
                    <Dumbbell className="size-4" />
                    Treino de hoje
                  </h2>
                  <p className="mt-3 font-display text-xl font-semibold text-foreground">
                    {treinoDeHoje
                      ? treinoDeHoje.grupoMuscular
                      : "Descanso ou Livre"}
                  </p>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Meta semanal</span>
                      <span className="font-semibold text-foreground">
                        {feitosNaSemana} / {metaSemanal || "4"}
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
                    className="mt-5 block w-full rounded-lg border border-gym/40 bg-gym/10 py-2 text-center text-xs font-semibold text-gym transition-colors hover:bg-gym/20"
                  >
                    Registrar treino
                  </Link>
                </Card>
              )}

              {/* Sugestão de IA para Estudos ou Rotina */}
              {canIa && (
                <Card className="p-5 border-primary/20 bg-primary/5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-primary" />
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Tutor IA Nexus
                    </h3>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                    Tire dúvidas instantâneas sobre qualquer matéria ou peça um simulado personalizado.
                  </p>
                  <button
                    type="button"
                    onClick={() => openChat("Me faça 3 perguntas objetivas sobre o edital para eu testar meus conhecimentos.")}
                    className="mt-3 flex w-full items-center justify-between rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-left text-xs font-medium text-primary hover:bg-primary/20 transition-all cursor-pointer"
                  >
                    <span>🎯 Iniciar teste rápido de 3 questões</span>
                    <ArrowRight className="size-3.5 shrink-0" />
                  </button>
                </Card>
              )}
            </div>
          </div>

          {/* Banner de Expansão de Recursos (apenas para usuários com módulos bloqueados, como a Júlia) */}
          {modulosDesativados.length > 0 && !isMasterAdmin && (
            <div className="rounded-2xl border border-border/80 bg-surface-raised/40 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-surface border border-border shrink-0 text-muted-foreground">
                    <Lock className="size-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Turbine seu ecossistema no Nexus
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Você pode unificar seus{" "}
                      {modulosDesativados.map((m) => m.name).join(" e ")} com seus
                      estudos em um único painel.
                    </p>
                  </div>
                </div>
                <Link to="/perfil" className="shrink-0">
                  <Button variant="outline" size="sm" className="text-xs gap-1.5 border-border">
                    Conhecer no Perfil <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
      <ExecutiveReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} />
    </AppShell>
  );
}

export default Today;
