import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  GraduationCap,
  ListChecks,
  Pencil,
  Plus,
  Trash2,
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

/** "Quinta-feira · 10/09/2026" (+ horário, se houver). */
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
      : emptyForm(),
  );

  const save = useMutation({
    mutationFn: () => {
      const body: TaskRequest = {
        titulo: form.titulo,
        prioridade: form.prioridade,
        dataLimite: form.dataLimite || null,
        horario: form.horario || null,
        ehTopicoEdital: form.ehTopicoEdital,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        // Edição não mexe em status/workflowStatus — cada um tem sua própria ação.
        status: task?.status ?? null,
        workflowStatus: task?.workflowStatus ?? null,
      };
      return task ? api.updateTask(task.id, body) : api.createTask(body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", userId] });
      toast(task ? "Tarefa atualizada." : "Tarefa criada.", "success");
      onClose();
    },
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={task ? "Editar tarefa" : "Nova tarefa"}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={save.isPending}>
            Cancelar
          </Button>
          <Button
            size="sm"
            loading={save.isPending}
            onClick={() => form.titulo.trim() && form.dataLimite && save.mutate()}
          >
            {task ? "Salvar" : "Criar tarefa"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Input
          label="Título"
          required
          value={form.titulo}
          onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
          placeholder="O que você precisa fazer?"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Data"
            type="date"
            required
            value={form.dataLimite}
            onChange={(e) => setForm((f) => ({ ...f, dataLimite: e.target.value }))}
          />
          <Input
            label="Horário (opcional)"
            type="time"
            value={form.horario}
            onChange={(e) => setForm((f) => ({ ...f, horario: e.target.value }))}
          />
        </div>

        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">Prioridade</p>
          <div className="flex gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setForm((f) => ({ ...f, prioridade: p }))}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  form.prioridade === p
                    ? "border-dash bg-dash/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-dash/40"
                }`}
              >
                <span className={`size-2 rounded-full ${PRIORITY_DOT[p]}`} />
                {priorityLabel[p]}
              </button>
            ))}
          </div>
        </div>

        <Select
          label="Categoria (opcional)"
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

        <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={form.ehTopicoEdital}
            disabled={Boolean(task)}
            onChange={(e) => setForm((f) => ({ ...f, ehTopicoEdital: e.target.checked }))}
          />
          É um tópico do edital
          {task && <span>(não pode ser alterado depois de criada)</span>}
        </label>

        {save.error && <ErrorState error={save.error} compact />}
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
}: {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onWorkflowChange: (s: TaskWorkflowStatus) => void;
  onEditalStatusChange: (s: TaskStatus) => void;
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
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          aria-label={`Excluir ${task.titulo}`}
          onClick={onDelete}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </button>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{task.titulo}</p>
        <div className="flex shrink-0 items-center gap-1">
          <button
            aria-label={`Editar ${task.titulo}`}
            onClick={onEdit}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            aria-label={`Excluir ${task.titulo}`}
            onClick={onDelete}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
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
          <span className={`inline-flex items-center gap-1 ${overdue ? "text-destructive" : ""}`}>
            {overdue ? <AlertTriangle className="size-3.5" /> : <Clock className="size-3.5" />}
            {formatFullDate(task.dataLimite, task.horario)}
          </span>
        )}
        {task.ehTopicoEdital && <Badge variant="info">Edital</Badge>}
        {task.categoryNome && <Badge>{task.categoryNome}</Badge>}
      </div>

      {task.ehTopicoEdital ? (
        <Select
          aria-label={`Status de ${task.titulo}`}
          value={task.status}
          onChange={(e) => onEditalStatusChange(e.target.value as TaskStatus)}
          className="h-9 w-auto min-w-[10rem] self-start text-xs"
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
          className="h-9 w-auto min-w-[10rem] self-start text-xs"
        >
          {WORKFLOW_STATUSES.map((s) => (
            <option key={s} value={s}>
              {workflowStatusLabel[s]}
            </option>
          ))}
        </Select>
      )}
    </Card>
  );
}

function TaskSection({
  title,
  icon: Icon,
  tasks,
  ...cardProps
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  tasks: Task[];
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onWorkflowChange: (id: number, s: TaskWorkflowStatus) => void;
  onEditalStatusChange: (id: number, s: TaskStatus) => void;
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
            onEdit={() => cardProps.onEdit(t)}
            onDelete={() => cardProps.onDelete(t)}
            onWorkflowChange={(s) => cardProps.onWorkflowChange(t.id, s)}
            onEditalStatusChange={(s) => cardProps.onEditalStatusChange(t.id, s)}
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);

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

  const { atrasadas, hoje, amanha, proximas, concluidas } = useMemo(() => {
    const all = geralQuery.data ?? [];
    const atrasadas: Task[] = [];
    const hoje: Task[] = [];
    const amanha: Task[] = [];
    const proximas: Task[] = [];
    const concluidas: Task[] = [];

    for (const t of all) {
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
  }, [geralQuery.data, hojeStr, amanhaStr]);

  const totalGeral = atrasadas.length + hoje.length + amanha.length + proximas.length + concluidas.length;

  const handleEditalStatusChange = (id: number, status: TaskStatus) => editalStatus.mutate({ id, status });
  const handleWorkflowChange = (id: number, status: TaskWorkflowStatus) => workflowStatus.mutate({ id, status });
  const handleEdit = (t: Task) => {
    setEditing(t);
    setDialogOpen(true);
  };
  const handleDelete = (t: Task) => setDeleting(t);

  const sectionProps = {
    onEdit: handleEdit,
    onDelete: handleDelete,
    onWorkflowChange: handleWorkflowChange,
    onEditalStatusChange: handleEditalStatusChange,
  };

  return (
    <AppShell
      title="Tarefas"
      subtitle="Rotina e edital"
      actions={
        <div className="flex flex-wrap items-center gap-2">
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
      {filtro === "edital" ? (
        <>
          {(editalQuery.data ?? []).length > 0 && (
            <Card>
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
              description="Crie a primeira tarefa no botão acima."
              action={
                <Button size="sm" onClick={() => setDialogOpen(true)}>
                  <Plus className="size-4" /> Nova tarefa
                </Button>
              }
            />
          )}

          {!geralQuery.isLoading && !geralQuery.error && totalGeral > 0 && (
            <div className="flex flex-col gap-6">
              {(filtro === "todas" || filtro === "atrasadas") && (
                <TaskSection title="Atrasadas" icon={AlertTriangle} tasks={atrasadas} {...sectionProps} />
              )}
              {(filtro === "todas" || filtro === "hoje") && (
                <TaskSection title="Hoje" icon={Clock} tasks={hoje} {...sectionProps} />
              )}
              {filtro === "todas" && <TaskSection title="Amanhã" icon={Clock} tasks={amanha} {...sectionProps} />}
              {(filtro === "todas" || filtro === "proximas") && (
                <TaskSection title="Próximas" icon={Clock} tasks={proximas} {...sectionProps} />
              )}
              {filtro === "todas" && (
                <TaskSection title="Concluídas e canceladas" icon={CheckCircle2} tasks={concluidas} {...sectionProps} />
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
    </AppShell>
  );
}

export default TarefasPage;
