import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  GraduationCap,
  ListChecks,
  Pencil,
  Plus,
  Trash2,
  Kanban,
  List,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Search,
  Check,
  X,
  ChevronRight,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  api,
  isTaskCancelled,
  isTaskConcluded,
  priorityLabel,
  statusLabel,
  today,
  workflowStatusLabel,
  type Task,
  type TaskPriority,
  type TaskRequest,
  type TaskStatus,
  type TaskWorkflowStatus,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/contexts/ToastContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Dialog, ConfirmDialog } from "@/components/ui/Dialog";

const STATUSES: TaskStatus[] = ["PENDENTE", "TEORIA_VISTA", "QUESTOES_FEITAS", "DOMINADO"];
const WORKFLOW_STATUSES: TaskWorkflowStatus[] = ["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"];
const PRIORITIES: TaskPriority[] = ["BAIXA", "MEDIA", "ALTA"];
const PRIORITY_DOT: Record<TaskPriority, string> = { BAIXA: "bg-fin", MEDIA: "bg-gym", ALTA: "bg-destructive" };

type Filtro = "todas" | "edital" | "hoje" | "proximas" | "atrasadas";
type ViewMode = "list" | "kanban";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function isoAddDays(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d + days);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function weekdayLabel(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const label = date.toLocaleDateString("pt-BR", { weekday: "long" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatDateBr(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function formatFullDate(iso: string, horario?: string | null) {
  const base = `${weekdayLabel(iso)} · ${formatDateBr(iso)}`;
  return horario ? `${base} · ${horario}` : base;
}

function formatConcluidaEm(iso: string) {
  const d = new Date(iso);
  const data = d.toLocaleDateString("pt-BR");
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `Concluída em ${data} às ${hora}`;
}

/** Toca um sino harmônico suave via Web Audio API quando o Pomodoro termina */
function playPomodoroChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      gain.gain.setValueAtTime(0.2, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.9);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.9);
    });
  } catch {
    // áudio não suportado ou bloqueado pelo navegador
  }
}

type FormState = {
  titulo: string;
  dataLimite: string;
  horario: string;
  prioridade: TaskPriority;
  categoryId: string;
  ehTopicoEdital: boolean;
};

function emptyForm(): FormState {
  return { titulo: "", dataLimite: today(), horario: "", prioridade: "MEDIA", categoryId: "", ehTopicoEdital: false };
}

function TaskFormDialog({
  open,
  onClose,
  task,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  task: Task | null;
  userId: number;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const categories = useQuery({
    queryKey: ["categories", "TASK"],
    queryFn: () => api.listCategories("TASK"),
    enabled: open,
  });

  const [form, setForm] = useState<FormState>(
    task
      ? {
          titulo: task.titulo,
          dataLimite: task.dataLimite ?? "",
          horario: task.horario ?? "",
          prioridade: task.prioridade,
          categoryId: task.categoryId ? String(task.categoryId) : "",
          ehTopicoEdital: task.ehTopicoEdital,
        }
      : emptyForm()
  );

  const [isDecomposing, setIsDecomposing] = useState(false);
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [isCreatingSubtasks, setIsCreatingSubtasks] = useState(false);

  const save = useMutation({
    mutationFn: (body: TaskRequest) => (task ? api.updateTask(task.id, body) : api.createTask(body)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", userId] });
      toast(task ? "Tarefa atualizada." : "Tarefa criada com sucesso!", "success");
      onClose();
    },
  });

  const handleDecomposeWithAi = async () => {
    if (!form.titulo.trim()) {
      toast("Digite um título para a tarefa antes de desdobrar com IA.", "error");
      return;
    }
    setIsDecomposing(true);
    try {
      const prompt = `Você é o assistente inteligente Nexus de produtividade e estudos. O usuário precisa cumprir a seguinte tarefa: "${form.titulo.trim()}". Desdobre-a em 3 a 5 passos práticos, diretos e acionáveis, estimando o tempo necessário para cada um. Retorne apenas uma lista onde cada item comece com hífen e tempo entre colchetes, por exemplo: "- [25 min] Leitura e marcação dos conceitos fundamentais". Não adicione introduções nem conclusões.`;
      const res = await api.chat(prompt, []);
      const lines = res.reply
        .split("\n")
        .map((l: string) => l.replace(/^[-*•\d.)\s]+/, "").trim())
        .filter((l: string) => l.length > 5);
      if (lines.length > 0) {
        setSubtasks(lines);
        toast("Etapas sugeridas pela IA com sucesso!", "success");
      } else {
        toast("Não foi possível identificar etapas claras. Tente detalhar mais o título.", "error");
      }
    } catch {
      toast("Erro ao consultar a IA. Verifique sua conexão.", "error");
    } finally {
      setIsDecomposing(false);
    }
  };

  const handleCreateAllSubtasks = async () => {
    if (subtasks.length === 0) return;
    setIsCreatingSubtasks(true);
    try {
      for (const item of subtasks) {
        await api.createTask({
          titulo: `${form.titulo}: ${item}`,
          dataLimite: form.dataLimite || today(),
          horario: form.horario || null,
          prioridade: form.prioridade,
          categoryId: form.categoryId ? Number(form.categoryId) : null,
          ehTopicoEdital: form.ehTopicoEdital,
          workflowStatus: "PENDENTE",
        });
      }
      qc.invalidateQueries({ queryKey: ["tasks", userId] });
      toast(`${subtasks.length} subtarefas criadas na sua lista!`, "success");
      onClose();
    } catch {
      toast("Erro ao criar subtarefas em lote.", "error");
    } finally {
      setIsCreatingSubtasks(false);
    }
  };

  const handleSubmit = () => {
    if (!form.titulo.trim()) return;
    save.mutate({
      titulo: form.titulo.trim(),
      dataLimite: form.dataLimite || null,
      horario: form.horario || null,
      prioridade: form.prioridade,
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      ehTopicoEdital: form.ehTopicoEdital,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={task ? "Editar tarefa" : "Nova tarefa"}
      description={
        task ? "Altere os campos da tarefa." : "Defina uma tarefa da sua rotina ou tópico do edital."
      }
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={save.isPending}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            loading={save.isPending}
            disabled={!form.titulo.trim()}
          >
            {task ? "Salvar alterações" : "Criar tarefa"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-foreground">Título</label>
            {!task && (
              <button
                type="button"
                disabled={isDecomposing || !form.titulo.trim()}
                onClick={handleDecomposeWithAi}
                className="inline-flex items-center gap-1.5 text-xs text-study hover:text-study/80 disabled:opacity-50 transition-colors font-medium cursor-pointer"
                title="A IA do Nexus divide essa tarefa em passos práticos para você"
              >
                <Sparkles className={`size-3.5 ${isDecomposing ? "animate-spin" : ""}`} />
                {isDecomposing ? "Pensando nas etapas..." : "Desdobrar com IA"}
              </button>
            )}
          </div>
          <Input
            autoFocus
            placeholder="Ex: Resolver 30 questões de Farmacologia"
            value={form.titulo}
            onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
          />
        </div>

        {subtasks.length > 0 && (
          <div className="rounded-lg border border-study/30 bg-study/5 p-3.5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-study inline-flex items-center gap-1.5">
                <Sparkles className="size-3.5" /> Etapas sugeridas pela IA ({subtasks.length}):
              </span>
              <button
                type="button"
                onClick={() => setSubtasks([])}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
            <ul className="flex flex-col gap-1.5">
              {subtasks.map((st, i) => (
                <li key={i} className="text-xs text-foreground flex items-start gap-2">
                  <span className="size-1.5 rounded-full bg-study shrink-0 mt-1.5" />
                  <span>{st}</span>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-1 border-study/40 text-study hover:bg-study/10 self-start"
              disabled={isCreatingSubtasks}
              onClick={handleCreateAllSubtasks}
            >
              {isCreatingSubtasks ? "Criando subtarefas..." : "Criar como tarefas separadas"}
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">Data limite</label>
            <Input
              type="date"
              value={form.dataLimite}
              onChange={(e) => setForm((f) => ({ ...f, dataLimite: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">Horário (opcional)</label>
            <Input
              type="time"
              value={form.horario}
              onChange={(e) => setForm((f) => ({ ...f, horario: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-foreground mb-1.5 block">Prioridade</label>
          <Select
            value={form.prioridade}
            onChange={(e) => setForm((f) => ({ ...f, prioridade: e.target.value as TaskPriority }))}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {priorityLabel[p]}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium text-foreground mb-1.5 block">Categoria</label>
          <Select
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
          >
            <option value="">Sem categoria</option>
            {(categories.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Select>
        </div>

        <label className="inline-flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={form.ehTopicoEdital}
            disabled={Boolean(task)}
            onChange={(e) => setForm((f) => ({ ...f, ehTopicoEdital: e.target.checked }))}
            className="rounded border-border text-study focus:ring-study"
          />
          É um tópico do edital
          {task && <span>(não pode ser alterado depois de criada)</span>}
        </label>

        {save.error && <ErrorState error={save.error} compact />}
      </div>
    </Dialog>
  );
}

function PomodoroModal({
  task,
  onClose,
  onConcludeTask,
}: {
  task: Task;
  onClose: () => void;
  onConcludeTask: (task: Task) => void;
}) {
  const { toast } = useToast();
  const [mode, setMode] = useState<"foco" | "pausaCurta" | "pausaLonga">("foco");
  const durations = { foco: 25 * 60, pausaCurta: 5 * 60, pausaLonga: 15 * 60 };
  const [timeLeft, setTimeLeft] = useState(durations[mode]);
  const [isRunning, setIsRunning] = useState(false);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);

  const initialTime = durations[mode];
  const progress = ((initialTime - timeLeft) / initialTime) * 100;

  useEffect(() => {
    setTimeLeft(durations[mode]);
    setIsRunning(false);
  }, [mode]);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      playPomodoroChime();
      if (mode === "foco") {
        const nextCycles = cyclesCompleted + 1;
        setCyclesCompleted(nextCycles);
        toast(`Sessão de foco concluída! Ciclo ${nextCycles} finalizado. Hora de descansar!`, "success");
        setMode(nextCycles % 4 === 0 ? "pausaLonga" : "pausaCurta");
      } else {
        toast("Pausa concluída! Pronto para mais um ciclo de foco?", "info");
        setMode("foco");
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, cyclesCompleted, toast]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${pad2(minutes)}:${pad2(seconds)}`;

  return (
    <Dialog
      open={true}
      onClose={onClose}
      title="Nexus Foco & Pomodoro"
      description="Concentre-se na execução desta tarefa com blocos cronometrados."
    >
      <div className="flex flex-col items-center gap-6 py-2">
        <div className="w-full rounded-xl border border-study/20 bg-study/5 p-4 text-center">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-study">
            Tarefa em Execução
          </span>
          <h3 className="text-base font-medium text-foreground mt-1 line-clamp-2">
            {task.titulo}
          </h3>
          <div className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className={`size-2 rounded-full ${PRIORITY_DOT[task.prioridade]}`} />
            Prioridade {priorityLabel[task.prioridade]}
            {task.categoryNome && <span>· {task.categoryNome}</span>}
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-surface-raised p-1 border border-border/70">
          <button
            type="button"
            onClick={() => setMode("foco")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === "foco" ? "bg-study text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Foco (25 min)
          </button>
          <button
            type="button"
            onClick={() => setMode("pausaCurta")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === "pausaCurta" ? "bg-fin text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Pausa Curta (5 min)
          </button>
          <button
            type="button"
            onClick={() => setMode("pausaLonga")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === "pausaLonga" ? "bg-fin text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Pausa Longa (15 min)
          </button>
        </div>

        <div className="relative flex size-52 items-center justify-center rounded-full border-4 border-surface-raised shadow-inner">
          <svg className="absolute inset-0 size-full -rotate-90">
            <circle
              cx="104"
              cy="104"
              r="94"
              className="stroke-border/40"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="104"
              cy="104"
              r="94"
              className={`transition-all duration-1000 ${
                mode === "foco" ? "stroke-study" : "stroke-fin"
              }`}
              strokeWidth="8"
              strokeDasharray={2 * Math.PI * 94}
              strokeDashoffset={2 * Math.PI * 94 * (1 - progress / 100)}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold tracking-tight text-foreground font-mono">
              {formattedTime}
            </span>
            <span className="text-xs uppercase tracking-widest text-muted-foreground mt-1">
              {mode === "foco" ? "Modo Foco" : "Pausa"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Ciclos:</span>
          <div className="flex items-center gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`size-3 rounded-full transition-colors ${
                  i < cyclesCompleted % 4 || cyclesCompleted >= 4
                    ? "bg-study"
                    : "bg-surface-raised border border-border"
                }`}
                title={`Ciclo ${i + 1}`}
              />
            ))}
          </div>
          <span className="text-xs font-semibold text-foreground ml-1">
            {cyclesCompleted} {cyclesCompleted === 1 ? "ciclo" : "ciclos"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTimeLeft(durations[mode])}
            title="Reiniciar tempo deste bloco"
          >
            <RotateCcw className="size-4" />
          </Button>

          <Button
            size="lg"
            className={mode === "foco" ? "bg-study hover:bg-study/90 text-white min-w-[8rem]" : "bg-fin hover:bg-fin/90 text-white min-w-[8rem]"}
            onClick={() => setIsRunning(!isRunning)}
          >
            {isRunning ? (
              <>
                <Pause className="size-5 mr-1" /> Pausar
              </>
            ) : (
              <>
                <Play className="size-5 mr-1" /> Iniciar
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTimeLeft(0);
            }}
            title="Pular para o próximo bloco"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="w-full pt-2 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Terminou o objetivo?</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-fin hover:text-fin hover:bg-fin/10 font-semibold"
            onClick={() => {
              onConcludeTask(task);
              onClose();
            }}
          >
            <CheckCircle2 className="size-4 mr-1.5" /> Concluir Tarefa
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function TaskCard({
  task,
  onEdit,
  onDelete,
  onWorkflowChange,
  onEditalStatusChange,
  onStartFocus,
}: {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onWorkflowChange: (s: TaskWorkflowStatus) => void;
  onEditalStatusChange: (s: TaskStatus) => void;
  onStartFocus: () => void;
}) {
  const concluded = isTaskConcluded(task);
  const cancelled = isTaskCancelled(task);
  const overdue = !concluded && !cancelled && Boolean(task.dataLimite) && task.dataLimite! < today();

  if (concluded || cancelled) {
    return (
      <Card className="flex items-center gap-3 opacity-70">
        {concluded ? (
          <CheckCircle2 className="size-4 shrink-0 text-fin" />
        ) : (
          <span className="size-4 shrink-0 rounded-full border border-muted-foreground" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm line-through">{task.titulo}</p>
          <p className="text-xs text-muted-foreground">
            {concluded
              ? task.concluidaEm
                ? formatConcluidaEm(task.concluidaEm)
                : "Concluída"
              : "Cancelada"}
          </p>
        </div>
        <button
          aria-label={`Editar ${task.titulo}`}
          onClick={onEdit}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground cursor-pointer"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          aria-label={`Excluir ${task.titulo}`}
          onClick={onDelete}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive cursor-pointer"
        >
          <Trash2 className="size-3.5" />
        </button>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-2.5 hover:border-border transition-colors">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground leading-snug">{task.titulo}</p>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            title="Iniciar Sessão de Foco Pomodoro"
            onClick={onStartFocus}
            className="rounded-md p-1.5 text-study transition-colors hover:bg-study/10 cursor-pointer"
          >
            <Timer className="size-4" />
          </button>
          <button
            aria-label={`Editar ${task.titulo}`}
            onClick={onEdit}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground cursor-pointer"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            aria-label={`Excluir ${task.titulo}`}
            onClick={onDelete}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive cursor-pointer"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className={`size-2 rounded-full ${PRIORITY_DOT[task.prioridade]}`} />
          {priorityLabel[task.prioridade]}
        </span>
        {task.dataLimite && (
          <span className={`inline-flex items-center gap-1 ${overdue ? "text-destructive font-medium" : ""}`}>
            {overdue ? <AlertTriangle className="size-3.5" /> : <Clock className="size-3.5" />}
            {formatFullDate(task.dataLimite, task.horario)}
          </span>
        )}
        {task.ehTopicoEdital && <Badge variant="info">Edital</Badge>}
        {task.categoryNome && <Badge>{task.categoryNome}</Badge>}
      </div>

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
        {task.ehTopicoEdital ? (
          <Select
            aria-label={`Status de ${task.titulo}`}
            value={task.status}
            onChange={(e) => onEditalStatusChange(e.target.value as TaskStatus)}
            className="h-8 w-auto min-w-[9.5rem] self-start text-xs"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel[s]}
              </option>
            ))}
          </Select>
        ) : (
          <Select
            aria-label={`Status de ${task.titulo}`}
            value={task.workflowStatus ?? "PENDENTE"}
            onChange={(e) => onWorkflowChange(e.target.value as TaskWorkflowStatus)}
            className="h-8 w-auto min-w-[9.5rem] self-start text-xs"
          >
            {WORKFLOW_STATUSES.map((s) => (
              <option key={s} value={s}>
                {workflowStatusLabel[s]}
              </option>
            ))}
          </Select>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-study hover:bg-study/10 gap-1 px-2"
          onClick={onStartFocus}
        >
          <Timer className="size-3.5" /> Modo Foco
        </Button>
      </div>
    </Card>
  );
}

function KanbanCard({
  task,
  onEdit,
  onDelete,
  onWorkflowChange,
  onStartFocus,
}: {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onWorkflowChange: (s: TaskWorkflowStatus) => void;
  onStartFocus: () => void;
}) {
  const isPending = (task.workflowStatus ?? "PENDENTE") === "PENDENTE";
  const isInProgress = task.workflowStatus === "EM_ANDAMENTO";
  const isConcluded = task.workflowStatus === "CONCLUIDA";
  const isCancelled = task.workflowStatus === "CANCELADA";
  const overdue = !isConcluded && !isCancelled && Boolean(task.dataLimite) && task.dataLimite! < today();

  return (
    <Card className="flex flex-col gap-2.5 p-3.5 border-border/70 hover:border-border transition-all shadow-xs bg-surface">
      <div className="flex items-start justify-between gap-2">
        <p className={`text-xs font-semibold leading-snug text-foreground ${isConcluded ? "line-through opacity-70" : ""}`}>
          {task.titulo}
        </p>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            title="Editar"
            onClick={onEdit}
            className="rounded p-1 text-muted-foreground hover:bg-surface-raised hover:text-foreground cursor-pointer"
          >
            <Pencil className="size-3" />
          </button>
          <button
            type="button"
            title="Excluir"
            onClick={onDelete}
            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className={`size-2 rounded-full ${PRIORITY_DOT[task.prioridade]}`} />
          {priorityLabel[task.prioridade]}
        </span>
        {task.dataLimite && (
          <span className={`inline-flex items-center gap-0.5 ${overdue ? "text-destructive font-medium" : ""}`}>
            {overdue ? <AlertTriangle className="size-3" /> : <Clock className="size-3" />}
            {formatDateBr(task.dataLimite)}
            {task.horario ? ` ${task.horario}` : ""}
          </span>
        )}
        {task.categoryNome && <Badge className="text-[10px] px-1.5 py-0">{task.categoryNome}</Badge>}
        {task.ehTopicoEdital && <Badge variant="info" className="text-[10px] px-1.5 py-0">Edital</Badge>}
      </div>

      <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-border/40 mt-0.5">
        <button
          type="button"
          onClick={onStartFocus}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-study hover:text-study/80 py-0.5 cursor-pointer"
          title="Abrir cronômetro Pomodoro desta tarefa"
        >
          <Timer className="size-3" /> Foco
        </button>

        <div className="flex items-center gap-1">
          {isPending && (
            <>
              <button
                type="button"
                onClick={() => onWorkflowChange("EM_ANDAMENTO")}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-500 hover:bg-amber-500/10 px-2 py-0.5 rounded cursor-pointer transition-colors"
                title="Mover para Em Andamento"
              >
                <Play className="size-3" /> Iniciar
              </button>
              <button
                type="button"
                onClick={() => onWorkflowChange("CONCLUIDA")}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-fin hover:bg-fin/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                title="Concluir"
              >
                <Check className="size-3" />
              </button>
            </>
          )}

          {isInProgress && (
            <>
              <button
                type="button"
                onClick={() => onWorkflowChange("PENDENTE")}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:bg-surface-raised px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                title="Voltar para A Fazer"
              >
                Pausar
              </button>
              <button
                type="button"
                onClick={() => onWorkflowChange("CONCLUIDA")}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-fin hover:bg-fin/10 px-2 py-0.5 rounded cursor-pointer transition-colors"
                title="Marcar como Concluída"
              >
                <Check className="size-3" /> Concluir
              </button>
            </>
          )}

          {isConcluded && (
            <button
              type="button"
              onClick={() => onWorkflowChange("PENDENTE")}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground px-2 py-0.5 rounded cursor-pointer transition-colors"
              title="Reabrir Tarefa"
            >
              <RotateCcw className="size-3" /> Reabrir
            </button>
          )}

          {isCancelled && (
            <button
              type="button"
              onClick={() => onWorkflowChange("PENDENTE")}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground px-2 py-0.5 rounded cursor-pointer transition-colors"
              title="Restaurar Tarefa"
            >
              Restaurar
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

function TaskSection({
  title,
  icon: Icon,
  tasks,
  onEdit,
  onDelete,
  onWorkflowChange,
  onEditalStatusChange,
  onStartFocus,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  tasks: Task[];
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onWorkflowChange: (id: number, s: TaskWorkflowStatus) => void;
  onEditalStatusChange: (id: number, s: TaskStatus) => void;
  onStartFocus: (t: Task) => void;
}) {
  if (tasks.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="size-4" /> {title}
        <span className="font-normal text-muted-foreground">({tasks.length})</span>
      </h2>
      <div className="flex flex-col gap-2">
        {tasks.map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            onEdit={() => onEdit(t)}
            onDelete={() => onDelete(t)}
            onWorkflowChange={(s) => onWorkflowChange(t.id, s)}
            onEditalStatusChange={(s) => onEditalStatusChange(t.id, s)}
            onStartFocus={() => onStartFocus(t)}
          />
        ))}
      </div>
    </div>
  );
}

function sortTasks(a: Task, b: Task) {
  const dateA = a.dataLimite ?? "9999-99-99";
  const dateB = b.dataLimite ?? "9999-99-99";
  if (dateA !== dateB) return dateA.localeCompare(dateB);
  const order: Record<TaskPriority, number> = { ALTA: 0, MEDIA: 1, BAIXA: 2 };
  if (order[a.prioridade] !== order[b.prioridade]) return order[a.prioridade] - order[b.prioridade];
  const horA = a.horario ?? "99:99";
  const horB = b.horario ?? "99:99";
  if (horA !== horB) return horA.localeCompare(horB);
  return a.id - b.id;
}

function TarefasPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const userId = user?.id;

  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"TODAS" | TaskPriority>("TODAS");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [focusTask, setFocusTask] = useState<Task | null>(null);

  const editalQuery = useQuery({
    queryKey: ["tasks", userId, "edital"],
    queryFn: () => api.listEdital(userId!),
    enabled: !!userId && filtro === "edital",
  });

  const geralQuery = useQuery({
    queryKey: ["tasks", userId, "todas"],
    queryFn: () => api.listTasks(userId!),
    enabled: !!userId && filtro !== "edital",
  });

  const editalStatus = useMutation({
    mutationFn: (v: { id: number; status: TaskStatus }) => api.updateTaskStatus(v.id, v.status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks", userId] }),
  });

  const workflowStatus = useMutation({
    mutationFn: (v: { id: number; status: TaskWorkflowStatus }) => api.updateTaskWorkflowStatus(v.id, v.status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks", userId] }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", userId] });
      toast("Tarefa excluída.", "success");
      setDeleting(null);
    },
  });

  const hojeStr = today();
  const amanhaStr = isoAddDays(hojeStr, 1);

  const filteredTasks = useMemo(() => {
    let list = geralQuery.data ?? [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.titulo.toLowerCase().includes(q) ||
          (t.categoryNome && t.categoryNome.toLowerCase().includes(q))
      );
    }
    if (priorityFilter !== "TODAS") {
      list = list.filter((t) => t.prioridade === priorityFilter);
    }
    return list;
  }, [geralQuery.data, searchQuery, priorityFilter]);

  const { atrasadas, hoje, amanha, proximas, concluidas } = useMemo(() => {
    const atrasadas: Task[] = [];
    const hoje: Task[] = [];
    const amanha: Task[] = [];
    const proximas: Task[] = [];
    const concluidas: Task[] = [];

    for (const t of filteredTasks) {
      const done = isTaskConcluded(t) || isTaskCancelled(t);
      if (done) {
        concluidas.push(t);
        continue;
      }
      if (!t.dataLimite) {
        proximas.push(t);
      } else if (t.dataLimite < hojeStr) {
        atrasadas.push(t);
      } else if (t.dataLimite === hojeStr) {
        hoje.push(t);
      } else if (t.dataLimite === amanhaStr) {
        amanha.push(t);
      } else {
        proximas.push(t);
      }
    }
    [atrasadas, hoje, amanha, proximas, concluidas].forEach((arr) => arr.sort(sortTasks));
    return { atrasadas, hoje, amanha, proximas, concluidas };
  }, [filteredTasks, hojeStr, amanhaStr]);

  const kanbanColumns = useMemo(() => {
    const pendentes: Task[] = [];
    const emAndamento: Task[] = [];
    const concluidas: Task[] = [];
    const canceladas: Task[] = [];

    for (const t of filteredTasks) {
      const s = t.workflowStatus ?? "PENDENTE";
      if (s === "PENDENTE") pendentes.push(t);
      else if (s === "EM_ANDAMENTO") emAndamento.push(t);
      else if (s === "CONCLUIDA") concluidas.push(t);
      else if (s === "CANCELADA") canceladas.push(t);
    }

    [pendentes, emAndamento, concluidas, canceladas].forEach((arr) => arr.sort(sortTasks));
    return { pendentes, emAndamento, concluidas, canceladas };
  }, [filteredTasks]);

  const totalGeral = filteredTasks.length;

  const handleEditalStatusChange = (id: number, status: TaskStatus) => editalStatus.mutate({ id, status });
  const handleWorkflowChange = (id: number, status: TaskWorkflowStatus) => workflowStatus.mutate({ id, status });
  const handleEdit = (t: Task) => {
    setEditing(t);
    setDialogOpen(true);
  };
  const handleDelete = (t: Task) => setDeleting(t);
  const handleStartFocus = (t: Task) => {
    if ((t.workflowStatus ?? "PENDENTE") === "PENDENTE") {
      workflowStatus.mutate({ id: t.id, status: "EM_ANDAMENTO" });
    }
    setFocusTask(t);
  };

  const handleConcludeFocusTask = (t: Task) => {
    workflowStatus.mutate({ id: t.id, status: "CONCLUIDA" });
    toast(`Parabéns! Tarefa "${t.titulo}" marcada como concluída!`, "success");
  };

  return (
    <AppShell
      title="Tarefas & Foco"
      subtitle="Quadro Kanban, Pomodoro e rotina integrada"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {filtro !== "edital" && (
            <div className="flex items-center rounded-lg border border-border/70 p-0.5 bg-surface-raised">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === "list"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="size-3.5" /> Lista
              </button>
              <button
                type="button"
                onClick={() => setViewMode("kanban")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === "kanban"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Kanban className="size-3.5" /> Kanban
              </button>
            </div>
          )}

          <Tabs
            value={filtro}
            onChange={(v) => setFiltro(v as Filtro)}
            items={[
              { value: "todas", label: "Todas" },
              { value: "edital", label: "Edital" },
              { value: "hoje", label: "Hoje" },
              { value: "proximas", label: "Próximas" },
              { value: "atrasadas", label: "Atrasadas" },
            ]}
          />

          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" /> Nova tarefa
          </Button>
        </div>
      }
    >
      {filtro !== "edital" && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[14rem]">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por título ou categoria..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-9 text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Prioridade:</span>
            {(["TODAS", "ALTA", "MEDIA", "BAIXA"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriorityFilter(p)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  priorityFilter === p
                    ? "bg-surface-raised border border-border text-foreground shadow-2xs font-semibold"
                    : "hover:text-foreground text-muted-foreground"
                }`}
              >
                {p === "TODAS" ? "Todas" : priorityLabel[p]}
              </button>
            ))}
          </div>
        </div>
      )}

      {filtro === "edital" ? (
        <>
          {(editalQuery.data ?? []).length > 0 && (
            <Card className="mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-2 font-medium">
                  <GraduationCap className="size-4 text-study" /> Progresso no edital
                </span>
                <span className="text-muted-foreground">
                  {(editalQuery.data ?? []).filter((t) => t.status === "DOMINADO").length} /{" "}
                  {(editalQuery.data ?? []).length} dominados
                </span>
              </div>
              <ProgressBar
                className="mt-3"
                value={(editalQuery.data ?? []).filter((t) => t.status === "DOMINADO").length}
                max={(editalQuery.data ?? []).length}
                accent="var(--study)"
              />
            </Card>
          )}

          <Card>
            {editalQuery.isLoading && <Loading />}
            {editalQuery.error && (
              <ErrorState error={editalQuery.error} onRetry={() => editalQuery.refetch()} />
            )}
            {!editalQuery.isLoading && !editalQuery.error && (editalQuery.data ?? []).length === 0 && (
              <EmptyState
                icon={GraduationCap}
                title="Nenhum tópico de edital ainda"
                description='Marque "É um tópico do edital" ao criar uma tarefa.'
              />
            )}
            {!editalQuery.isLoading && (editalQuery.data ?? []).length > 0 && (
              <ul className="flex flex-col gap-2">
                {(editalQuery.data ?? []).map((t) => (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-border/70 bg-surface-raised px-4 py-3"
                  >
                    <span className="flex-1 text-sm">{t.titulo}</span>
                    {t.ehTopicoEdital && <Badge variant="info">Edital</Badge>}
                    <span className="text-xs text-muted-foreground">
                      {priorityLabel[t.prioridade]}
                      {t.dataLimite ? ` · ${t.dataLimite}` : ""}
                    </span>
                    <Select
                      aria-label={`Status de ${t.titulo}`}
                      value={t.status}
                      onChange={(e) => handleEditalStatusChange(t.id, e.target.value as TaskStatus)}
                      className="h-9 w-auto min-w-[9.5rem] text-xs"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {statusLabel[s]}
                        </option>
                      ))}
                    </Select>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      ) : (
        <>
          {geralQuery.isLoading && <Loading />}
          {geralQuery.error && <ErrorState error={geralQuery.error} onRetry={() => geralQuery.refetch()} />}

          {!geralQuery.isLoading && !geralQuery.error && totalGeral === 0 && (
            <EmptyState
              icon={ListChecks}
              title="Nada por aqui ainda"
              description="Crie a primeira tarefa ou limpe os filtros de busca."
              action={
                <Button size="sm" onClick={() => setDialogOpen(true)}>
                  <Plus className="size-4" /> Nova tarefa
                </Button>
              }
            />
          )}

          {!geralQuery.isLoading && !geralQuery.error && totalGeral > 0 && (
            <>
              {viewMode === "kanban" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
                  <div className="flex flex-col gap-2.5 rounded-xl border border-border/80 bg-surface-raised/50 p-3">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-blue-500" />
                        <h3 className="text-xs font-semibold text-foreground">A Fazer</h3>
                        <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-muted-foreground border border-border/60">
                          {kanbanColumns.pendentes.length}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(null);
                          setDialogOpen(true);
                        }}
                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Nova tarefa"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-2 min-h-[8rem]">
                      {kanbanColumns.pendentes.map((t) => (
                        <KanbanCard
                          key={t.id}
                          task={t}
                          onEdit={() => handleEdit(t)}
                          onDelete={() => handleDelete(t)}
                          onWorkflowChange={(s) => handleWorkflowChange(t.id, s)}
                          onStartFocus={() => handleStartFocus(t)}
                        />
                      ))}
                      {kanbanColumns.pendentes.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-6 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-lg">
                          Nenhuma tarefa pendente
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                        <h3 className="text-xs font-semibold text-foreground">Em Andamento</h3>
                        <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-amber-500 border border-amber-500/30">
                          {kanbanColumns.emAndamento.length}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 min-h-[8rem]">
                      {kanbanColumns.emAndamento.map((t) => (
                        <KanbanCard
                          key={t.id}
                          task={t}
                          onEdit={() => handleEdit(t)}
                          onDelete={() => handleDelete(t)}
                          onWorkflowChange={(s) => handleWorkflowChange(t.id, s)}
                          onStartFocus={() => handleStartFocus(t)}
                        />
                      ))}
                      {kanbanColumns.emAndamento.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-6 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-lg">
                          Nenhuma tarefa em andamento
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 rounded-xl border border-fin/30 bg-fin/5 p-3">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-fin" />
                        <h3 className="text-xs font-semibold text-foreground">Concluídas</h3>
                        <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-fin border border-fin/30">
                          {kanbanColumns.concluidas.length}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 min-h-[8rem]">
                      {kanbanColumns.concluidas.map((t) => (
                        <KanbanCard
                          key={t.id}
                          task={t}
                          onEdit={() => handleEdit(t)}
                          onDelete={() => handleDelete(t)}
                          onWorkflowChange={(s) => handleWorkflowChange(t.id, s)}
                          onStartFocus={() => handleStartFocus(t)}
                        />
                      ))}
                      {kanbanColumns.concluidas.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-6 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-lg">
                          Nenhuma tarefa concluída
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 rounded-xl border border-border/80 bg-surface-raised/30 p-3 opacity-80">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-muted-foreground" />
                        <h3 className="text-xs font-semibold text-muted-foreground">Canceladas</h3>
                        <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-muted-foreground border border-border/60">
                          {kanbanColumns.canceladas.length}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 min-h-[8rem]">
                      {kanbanColumns.canceladas.map((t) => (
                        <KanbanCard
                          key={t.id}
                          task={t}
                          onEdit={() => handleEdit(t)}
                          onDelete={() => handleDelete(t)}
                          onWorkflowChange={(s) => handleWorkflowChange(t.id, s)}
                          onStartFocus={() => handleStartFocus(t)}
                        />
                      ))}
                      {kanbanColumns.canceladas.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-6 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-lg">
                          Nenhuma tarefa cancelada
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {(filtro === "todas" || filtro === "atrasadas") && (
                    <TaskSection
                      title="Atrasadas"
                      icon={AlertTriangle}
                      tasks={atrasadas}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onWorkflowChange={handleWorkflowChange}
                      onEditalStatusChange={handleEditalStatusChange}
                      onStartFocus={handleStartFocus}
                    />
                  )}
                  {(filtro === "todas" || filtro === "hoje") && (
                    <TaskSection
                      title="Hoje"
                      icon={Clock}
                      tasks={hoje}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onWorkflowChange={handleWorkflowChange}
                      onEditalStatusChange={handleEditalStatusChange}
                      onStartFocus={handleStartFocus}
                    />
                  )}
                  {filtro === "todas" && (
                    <TaskSection
                      title="Amanhã"
                      icon={Clock}
                      tasks={amanha}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onWorkflowChange={handleWorkflowChange}
                      onEditalStatusChange={handleEditalStatusChange}
                      onStartFocus={handleStartFocus}
                    />
                  )}
                  {(filtro === "todas" || filtro === "proximas") && (
                    <TaskSection
                      title="Próximas"
                      icon={Clock}
                      tasks={proximas}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onWorkflowChange={handleWorkflowChange}
                      onEditalStatusChange={handleEditalStatusChange}
                      onStartFocus={handleStartFocus}
                    />
                  )}
                  {filtro === "todas" && (
                    <TaskSection
                      title="Concluídas e canceladas"
                      icon={CheckCircle2}
                      tasks={concluidas}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onWorkflowChange={handleWorkflowChange}
                      onEditalStatusChange={handleEditalStatusChange}
                      onStartFocus={handleStartFocus}
                    />
                  )}
                  {filtro !== "todas" &&
                    atrasadas.length === 0 &&
                    hoje.length === 0 &&
                    proximas.length === 0 && (
                      <EmptyState title="Nada nesse filtro" description="Tente outro filtro ou crie uma tarefa." />
                    )}
                </div>
              )}
            </>
          )}
        </>
      )}

      <TaskFormDialog
        key={editing?.id ?? "new"}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        task={editing}
        userId={userId!}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        title="Excluir tarefa?"
        description={deleting ? `"${deleting.titulo}" será removida.` : undefined}
        confirmLabel="Excluir"
        loading={remove.isPending}
      />

      {focusTask && (
        <PomodoroModal
          task={focusTask}
          onClose={() => setFocusTask(null)}
          onConcludeTask={handleConcludeFocusTask}
        />
      )}
    </AppShell>
  );
}

export default TarefasPage;
