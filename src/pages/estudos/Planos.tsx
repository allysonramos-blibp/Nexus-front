import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Pencil, Plus, Target, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  api,
  studyPlanStatusLabel,
  type StudyPlan,
  type StudyPlanRequest,
  type StudyPlanStatus,
} from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Dialog, ConfirmDialog } from "@/components/ui/Dialog";
import { EstudosTabs } from "./EstudosTabs";

const STATUS_OPTIONS: StudyPlanStatus[] = ["PLANEJADO", "EM_ANDAMENTO", "CONCLUIDO", "PAUSADO"];

const emptyForm: StudyPlanRequest = {
  nome: "",
  objetivo: "",
  descricao: "",
  dataInicio: "",
  dataAlvo: "",
  horasDisponiveis: undefined,
  status: "PLANEJADO",
};

function PlanoDialog({
  open,
  onClose,
  plano,
}: {
  open: boolean;
  onClose: () => void;
  /** Quando presente, o diálogo edita esse plano; senão, cria um novo. */
  plano: StudyPlan | null;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<StudyPlanRequest>(
    plano
      ? {
          nome: plano.nome,
          objetivo: plano.objetivo ?? "",
          descricao: plano.descricao ?? "",
          dataInicio: plano.dataInicio ?? "",
          dataAlvo: plano.dataAlvo ?? "",
          horasDisponiveis: plano.horasDisponiveis ?? undefined,
          status: plano.status,
        }
      : emptyForm,
  );

  const save = useMutation({
    mutationFn: () => {
      const body: StudyPlanRequest = {
        ...form,
        dataInicio: form.dataInicio || null,
        dataAlvo: form.dataAlvo || null,
        horasDisponiveis: form.horasDisponiveis || null,
      };
      return plano ? api.updateStudyPlan(plano.id, body) : api.createStudyPlan(body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["study-plans"] });
      toast(plano ? "Plano atualizado." : "Plano criado.", "success");
      onClose();
    },
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={plano ? "Editar plano" : "Novo plano de estudo"}
      description="Nome e objetivo bastam para começar — o resto você ajusta quando quiser."
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={save.isPending}>
            Cancelar
          </Button>
          <Button
            size="sm"
            loading={save.isPending}
            onClick={() => form.nome.trim() && save.mutate()}
          >
            {plano ? "Salvar" : "Criar plano"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Input
          label="Nome do plano"
          required
          value={form.nome}
          onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
          placeholder="Ex.: Vestibular 2027, Concurso X, Certificação Y"
        />
        <Input
          label="Objetivo"
          value={form.objetivo ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, objetivo: e.target.value }))}
          placeholder="Ex.: Passar em Medicina"
        />
        <Textarea
          label="Descrição (opcional)"
          rows={2}
          value={form.descricao ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Início"
            type="date"
            value={form.dataInicio ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, dataInicio: e.target.value }))}
          />
          <Input
            label="Data alvo (prova/marco)"
            type="date"
            value={form.dataAlvo ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, dataAlvo: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Horas disponíveis / semana"
            type="number"
            min={0}
            value={form.horasDisponiveis ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                horasDisponiveis: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
          />
          <Select
            label="Status"
            value={form.status ?? "PLANEJADO"}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as StudyPlanStatus }))}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {studyPlanStatusLabel[s]}
              </option>
            ))}
          </Select>
        </div>
        {save.error && <ErrorState error={save.error} compact />}
      </div>
    </Dialog>
  );
}

export default function PlanosPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["study-plans"],
    queryFn: api.listStudyPlans,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StudyPlan | null>(null);
  const [deleting, setDeleting] = useState<StudyPlan | null>(null);

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteStudyPlan(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["study-plans"] });
      toast("Plano excluído.", "success");
      setDeleting(null);
    },
  });

  const planos = data ?? [];

  return (
    <AppShell
      title="Estudos"
      subtitle="Meus Planos"
      actions={
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" /> Novo Plano
        </Button>
      }
    >
      <EstudosTabs active="planos" />

      {isLoading && <Loading />}
      {!isLoading && error && <ErrorState error={error} onRetry={() => refetch()} />}
      {!isLoading && !error && planos.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="Nenhum plano de estudo ainda"
          description="Crie um plano — concurso, faculdade, ENEM, certificação, o que for — para começar a organizar matérias e assuntos."
          action={
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" /> Criar meu primeiro plano
            </Button>
          }
        />
      )}

      {!isLoading && !error && planos.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {planos.map((plano) => (
            <Card key={plano.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-base font-semibold text-foreground">
                    {plano.nome}
                  </h3>
                  {plano.objetivo && (
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Target className="size-3.5" /> {plano.objetivo}
                    </p>
                  )}
                </div>
                <Badge variant={plano.status === "CONCLUIDO" ? "success" : "info"}>
                  {studyPlanStatusLabel[plano.status]}
                </Badge>
              </div>

              <div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progresso</span>
                  <span>{Math.round(plano.progresso)}%</span>
                </div>
                <ProgressBar className="mt-1.5" value={plano.progresso} max={100} accent="var(--study)" />
              </div>

              <p className="text-xs text-muted-foreground">
                {plano.totalMaterias} matéria(s) · {plano.totalAssuntos} assunto(s)
              </p>

              <div className="mt-1 flex items-center gap-2">
                <Link
                  to={`/estudos/planos/${plano.id}`}
                  className="flex-1 rounded-lg border border-dash/40 bg-dash/10 py-2 text-center text-sm font-semibold text-dash transition-colors hover:bg-dash/20"
                >
                  Abrir
                </Link>
                <button
                  aria-label={`Editar ${plano.nome}`}
                  onClick={() => {
                    setEditing(plano);
                    setDialogOpen(true);
                  }}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  aria-label={`Excluir ${plano.nome}`}
                  onClick={() => setDeleting(plano)}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <PlanoDialog
        key={editing?.id ?? "new"}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        plano={editing}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        title="Excluir plano?"
        description={`"${deleting?.nome}" e todas as matérias/assuntos dentro dele serão removidos. Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={remove.isPending}
      />
    </AppShell>
  );
}
