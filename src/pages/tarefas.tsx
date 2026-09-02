import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { GraduationCap, ListChecks, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  api,
  priorityLabel,
  statusLabel,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
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

const STATUSES: TaskStatus[] = ["PENDENTE", "TEORIA_VISTA", "QUESTOES_FEITAS", "DOMINADO"];

function TarefasPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  const [titulo, setTitulo] = useState("");
  const [prioridade, setPrioridade] = useState<TaskPriority>("MEDIA");
  const [dataLimite, setDataLimite] = useState("");
  const [ehTopicoEdital, setEhTopicoEdital] = useState(false);
  const [filtro, setFiltro] = useState<"todas" | "edital">("todas");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["tasks", userId, filtro],
    queryFn: () => (filtro === "edital" ? api.listEdital(userId!) : api.listTasks(userId!)),
    enabled: !!userId,
  });

  const create = useMutation({
    mutationFn: () =>
      api.createTask(userId!, {
        titulo,
        descricao: "",
        status: "PENDENTE",
        prioridade,
        dataLimite: dataLimite || null,
        ehTopicoEdital,
      }),
    onSuccess: () => {
      setTitulo("");
      setDataLimite("");
      qc.invalidateQueries({ queryKey: ["tasks", userId] });
    },
  });

  const patch = useMutation({
    mutationFn: (v: { id: number; status: TaskStatus }) => api.updateTaskStatus(v.id, v.status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks", userId] }),
  });

  const tasks = data ?? [];
  const dominados = tasks.filter((t) => t.status === "DOMINADO").length;

  return (
    <AppShell
      title="Tarefas"
      subtitle="Rotina e edital"
      actions={
        <Tabs
          value={filtro}
          onChange={(v) => setFiltro(v as "todas" | "edital")}
          items={[
            { value: "todas", label: "Todas" },
            { value: "edital", label: "Edital" },
          ]}
        />
      }
    >
      {filtro === "edital" && tasks.length > 0 && (
        <Card>
          <div className="flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-2 font-medium">
              <GraduationCap className="size-4 text-study" /> Progresso no edital
            </span>
            <span className="text-muted-foreground">
              {dominados} / {tasks.length} dominados
            </span>
          </div>
          <ProgressBar className="mt-3" value={dominados} max={tasks.length} accent="var(--study)" />
        </Card>
      )}

      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
          className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]"
        >
          <Input
            required
            placeholder="Nova tarefa ou tópico"
            aria-label="Nova tarefa ou tópico"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
          <Select
            aria-label="Prioridade"
            value={prioridade}
            onChange={(e) => setPrioridade(e.target.value as TaskPriority)}
          >
            <option value="BAIXA">Baixa</option>
            <option value="MEDIA">Média</option>
            <option value="ALTA">Alta</option>
          </Select>
          <Input
            type="date"
            aria-label="Data limite"
            value={dataLimite}
            onChange={(e) => setDataLimite(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={ehTopicoEdital}
                onChange={(e) => setEhTopicoEdital(e.target.checked)}
              />
              Edital
            </label>
            <Button type="submit" loading={create.isPending} size="md">
              <Plus className="size-4" /> Criar
            </Button>
          </div>
        </form>
        {create.error && <ErrorState error={create.error} compact className="mt-3" />}
      </Card>

      <Card>
        {isLoading && <Loading />}
        {!isLoading && error && <ErrorState error={error} onRetry={() => refetch()} />}
        {!isLoading && !error && tasks.length === 0 && (
          <EmptyState
            icon={ListChecks}
            title="Nada por aqui ainda"
            description="Crie a primeira tarefa ou tópico de edital acima."
          />
        )}
        {!isLoading && !error && tasks.length > 0 && (
          <ul className="flex flex-col gap-2">
            {tasks.map((t) => (
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
                  onChange={(e) => patch.mutate({ id: t.id, status: e.target.value as TaskStatus })}
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
    </AppShell>
  );
}

export default TarefasPage;
