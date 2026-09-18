import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileDown,
  Printer,
  X,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Dumbbell,
  Wallet,
  BookOpen,
  Calendar,
  User,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  api,
  isTaskConcluded,
  type Task,
  type Workout,
  type FinancialTransaction,
  type PendingReviewResponse,
} from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { generateExecutivePdf, ReportData } from "@/lib/exportPdfReport";

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExecutiveReportModal({
  isOpen,
  onClose,
}: ExecutiveReportModalProps) {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const userId = user?.id;

  const isMasterAdmin =
    user?.email === "allysonr510@gmail.com" || user?.role === "ROLE_ADMIN";

  const hasEstudos = user?.moduloEstudos !== false || isMasterAdmin;
  const hasTreinos = user?.moduloTreinos !== false || isMasterAdmin;
  const hasFinancas = user?.moduloFinancas !== false || isMasterAdmin;

  const tasksQuery = useQuery<Task[]>({
    queryKey: ["tasks", userId, "report"],
    queryFn: () => api.listTasks(userId!),
    enabled: isOpen && !!userId,
  });

  const pendingReviewsQuery = useQuery<PendingReviewResponse | null>({
    queryKey: ["study-pending-reviews-report"],
    queryFn: () => api.listPendingReviews().catch(() => null),
    enabled: isOpen && !!userId && hasEstudos,
  });

  const workoutsQuery = useQuery<Workout[]>({
    queryKey: ["workouts", userId, "report"],
    queryFn: () => api.listWorkouts(userId!),
    enabled: isOpen && !!userId && hasTreinos,
  });

  const transactionsQuery = useQuery<FinancialTransaction[]>({
    queryKey: ["transactions", userId, "report"],
    queryFn: () => api.listTransactions(userId!),
    enabled: isOpen && !!userId && hasFinancas,
  });

  if (!isOpen) return null;

  const allTasks = tasksQuery.data ?? [];
  const allWorkouts = workoutsQuery.data ?? [];
  const allTransactions = transactionsQuery.data ?? [];

  const totalTasks = allTasks.length;
  const concludedTasks = allTasks.filter((t: Task) => isTaskConcluded(t)).length;
  const pendingTasks = totalTasks - concludedTasks;
  const taskCompletionRate =
    totalTasks > 0 ? Math.round((concludedTasks / totalTasks) * 100) : 0;
  const highPriorityPending = allTasks.filter(
    (t: Task) => !isTaskConcluded(t) && t.prioridade === "ALTA"
  ).length;

  const totalEdital = allTasks.filter((t: Task) => t.ehTopicoEdital).length;
  const dominatedTopics = allTasks.filter(
    (t: Task) => t.ehTopicoEdital && t.status === "DOMINADO"
  ).length;
  const dominatedPercentage =
    totalEdital > 0 ? Math.round((dominatedTopics / totalEdital) * 100) : 0;
  const pendingRevCount = pendingReviewsQuery.data?.totalPendentes ?? 0;

  const now = new Date();
  const day = (now.getDay() + 6) % 7;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - day);
  const startOfWeekStr = startOfWeek.toISOString().slice(0, 10);

  const workoutsThisWeek = allWorkouts.filter((w: Workout) => {
    return w.concluido && w.dataTreino >= startOfWeekStr;
  }).length;
  const lastWorkout = allWorkouts[0]?.grupoMuscular || "Sem registro";

  const income = allTransactions
    .filter((t: FinancialTransaction) => t.tipo === "RECEITA")
    .reduce((acc: number, t: FinancialTransaction) => acc + Number(t.valor), 0);
  const expense = allTransactions
    .filter((t: FinancialTransaction) => t.tipo === "DESPESA")
    .reduce((acc: number, t: FinancialTransaction) => acc + Number(t.valor), 0);
  const balance = income - expense;

  let diagnostic = "Desempenho consistente registrado no período.";
  if (taskCompletionRate >= 75) {
    diagnostic =
      "Excelente taxa de entrega! " +
      taskCompletionRate +
      "% das metas e tarefas foram concluídas. A disciplina operacional está alta.";
  } else if (highPriorityPending > 2) {
    diagnostic =
      "Atenção recomendada: você possui " +
      highPriorityPending +
      " tarefas de alta prioridade pendentes. Sugerimos priorizar essas entregas antes de abrir novas frentes.";
  } else if (hasEstudos && dominatedPercentage > 40) {
    diagnostic =
      "Progresso sólido nos estudos: " +
      dominatedPercentage +
      "% do edital dominado. Mantenha o fluxo de questões diárias para consolidação.";
  }

  const reportData: ReportData = {
    userName: user?.email ? user.email.split("@")[0] : "Usuário Nexus",
    userEmail: user?.email || "usuario@nexus.app",
    userPlan: user?.plan || "PRO",
    generatedAt: new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    tasks: {
      total: totalTasks,
      concluded: concludedTasks,
      pending: pendingTasks,
      completionRate: taskCompletionRate,
      highPriorityPending,
    },
    studies: hasEstudos
      ? {
          totalTopics: totalEdital,
          dominatedTopics,
          dominatedPercentage,
          pendingReviews: pendingRevCount,
        }
      : undefined,
    workouts: hasTreinos
      ? {
          completedThisWeek: workoutsThisWeek,
          weeklyGoal: 4,
          lastWorkout,
        }
      : undefined,
    finance: hasFinancas
      ? {
          income,
          expense,
          balance,
          transactionsCount: allTransactions.length,
        }
      : undefined,
    diagnostic,
  };

  const handleDownloadPdf = () => {
    setIsGenerating(true);
    try {
      generateExecutivePdf(reportData);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
    } finally {
      setTimeout(() => setIsGenerating(false), 500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">

        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-surface-raised/40">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-dash/15 text-dash">
              <Sparkles className="size-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-display font-semibold text-foreground">
                Relatório Executivo de Performance
              </h2>
              <p className="text-xs text-muted-foreground">
                Visão consolidada de produtividade, metas e evolução
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        <div
          id="nexus-executive-report-preview"
          className="p-6 space-y-6 max-h-[72vh] overflow-y-auto"
        >

          <div className="p-4 rounded-xl border border-border/70 bg-surface-raised/60 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-display text-xl font-bold tracking-wider text-foreground">
                  NEXUS
                </span>
                <Badge
                  variant={user?.plan === "ENTERPRISE" ? "warning" : "info"}
                >
                  Plano {user?.plan || "PRO"}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="size-3.5 text-dash" /> {reportData.userName} (
                  {reportData.userEmail})
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5" /> {reportData.generatedAt}
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-fin font-medium bg-fin/10 px-3 py-1.5 rounded-full border border-fin/20">
              <ShieldCheck className="size-3.5" /> Autenticado & Auditado
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-dash" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                1. Gestão de Tarefas & Produtividade
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl border border-border/70 bg-surface-raised/40">
                <p className="text-[11px] text-muted-foreground">Concluídas</p>
                <p className="text-lg font-bold text-foreground mt-0.5">
                  {concludedTasks}{" "}
                  <span className="text-xs text-muted-foreground font-normal">
                    / {totalTasks}
                  </span>
                </p>
              </div>
              <div className="p-3 rounded-xl border border-border/70 bg-surface-raised/40">
                <p className="text-[11px] text-muted-foreground">
                  Taxa de Conclusão
                </p>
                <p className="text-lg font-bold text-fin mt-0.5">
                  {taskCompletionRate}%
                </p>
              </div>
              <div className="p-3 rounded-xl border border-border/70 bg-surface-raised/40">
                <p className="text-[11px] text-muted-foreground">
                  Pendências Críticas
                </p>
                <p className="text-lg font-bold text-foreground mt-0.5">
                  {highPriorityPending > 0 ? (
                    <span className="text-destructive">
                      {highPriorityPending}
                    </span>
                  ) : (
                    <span className="text-fin">Zero</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {hasEstudos && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <BookOpen className="size-4 text-study" />
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  2. Desempenho em Estudos & Concursos
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-border/70 bg-surface-raised/40">
                  <p className="text-[11px] text-muted-foreground">
                    Progresso do Edital
                  </p>
                  <p className="text-base font-bold text-study mt-0.5">
                    {dominatedPercentage}% dominado
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {dominatedTopics} de {totalEdital} tópicos
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border/70 bg-surface-raised/40">
                  <p className="text-[11px] text-muted-foreground">
                    Caderno de Erros
                  </p>
                  <p className="text-base font-bold text-foreground mt-0.5">
                    {pendingRevCount} revisões
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Aguardando repetição espaçada
                  </p>
                </div>
              </div>
            </div>
          )}

          {hasTreinos && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Dumbbell className="size-4 text-gym" />
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  3. Rotina de Treinos & Consistência Físico-Mental
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-border/70 bg-surface-raised/40">
                  <p className="text-[11px] text-muted-foreground">
                    Frequência Semanal
                  </p>
                  <p className="text-base font-bold text-gym mt-0.5">
                    {workoutsThisWeek} de 4 treinos da meta
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border/70 bg-surface-raised/40">
                  <p className="text-[11px] text-muted-foreground">
                    Último Grupo Trabalhado
                  </p>
                  <p className="text-base font-bold text-foreground mt-0.5">
                    {lastWorkout}
                  </p>
                </div>
              </div>
            </div>
          )}

          {hasFinancas && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Wallet className="size-4 text-fin" />
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  4. Gestão Financeira & Balanço
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl border border-border/70 bg-surface-raised/40">
                  <p className="text-[11px] text-muted-foreground">Receitas</p>
                  <p className="text-sm font-bold text-fin mt-0.5">
                    R$ {income.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border/70 bg-surface-raised/40">
                  <p className="text-[11px] text-muted-foreground">Despesas</p>
                  <p className="text-sm font-bold text-destructive mt-0.5">
                    R$ {expense.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border/70 bg-surface-raised/40">
                  <p className="text-[11px] text-muted-foreground">
                    Saldo Líquido
                  </p>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    R$ {balance.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 rounded-xl border border-dash/30 bg-dash/5 space-y-1.5">
            <div className="flex items-center gap-2 text-dash text-xs font-semibold uppercase tracking-wider">
              <TrendingUp className="size-3.5" /> Diagnóstico da Inteligência Nexus
            </div>
            <p className="text-xs text-foreground/90 leading-relaxed font-sans">
              {diagnostic}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-border/80 bg-surface-raised/30">
          <p className="text-xs text-muted-foreground hidden sm:block">
            Formato vetor A4 pronto para arquivo ou impressão
          </p>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={handlePrint}
              className="flex-1 sm:flex-none text-xs"
            >
              <Printer className="size-3.5 mr-1.5" /> Imprimir
            </Button>
            <Button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="flex-1 sm:flex-none text-xs bg-dash text-white hover:bg-dash/90"
            >
              <FileDown className="size-3.5 mr-1.5" />
              {isGenerating ? "Gerando PDF..." : "Baixar PDF Oficial"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
