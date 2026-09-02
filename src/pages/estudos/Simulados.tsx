import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { api, mockExamStatusLabel, type MockExam } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Dialog, ConfirmDialog } from "@/components/ui/Dialog";
import { EstudosTabs } from "./EstudosTabs";

function NovoSimuladoDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [titulo, setTitulo] = useState("");
  const [planoId, setPlanoId] = useState<number | null>(null);
  const [subjectIds, setSubjectIds] = useState<number[]>([]);
  const [quantidade, setQuantidade] = useState("10");
  const [duracao, setDuracao] = useState("");

  const planos = useQuery({ queryKey: ["study-plans"], queryFn: api.listStudyPlans, enabled: open });
  const subjects = useQuery({
    queryKey: ["subjects", planoId],
    queryFn: () => api.listSubjects(planoId!),
    enabled: open && planoId != null,
  });

  const create = useMutation({
    mutationFn: () =>
      api.createMockExam({
        titulo: titulo.trim(),
        studyPlanId: planoId,
        subjectIds,
        quantidadeQuestoes: Number(quantidade),
        duracaoMinutos: duracao ? Number(duracao) : null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mock-exams"] });
      toast("Simulado criado.", "success");
      handleClose();
    },
  });

  function handleClose() {
    setTitulo("");
    setPlanoId(null);
    setSubjectIds([]);
    setQuantidade("10");
    setDuracao("");
    onClose();
  }

  const canSubmit = titulo.trim() && subjectIds.length > 0 && Number(quantidade) > 0;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Novo simulado"
      description="As questões são sorteadas entre as matérias escolhidas."
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={create.isPending}>
            Cancelar
          </Button>
          <Button size="sm" loading={create.isPending} disabled={!canSubmit} onClick={() => create.mutate()}>
            Criar simulado
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Input label="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Simulado geral 1" />

        <Select
          label="Plano"
          value={planoId ?? ""}
          onChange={(e) => {
            setPlanoId(e.target.value ? Number(e.target.value) : null);
            setSubjectIds([]);
          }}
        >
          <option value="">Selecione um plano…</option>
          {(planos.data ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </Select>

        {planoId != null && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-muted-foreground">Matérias</p>
            {subjects.isLoading && <Loading label="Carregando matérias…" />}
            {(subjects.data ?? []).length === 0 && !subjects.isLoading && (
              <p className="text-xs text-muted-foreground">Esse plano ainda não tem matérias.</p>
            )}
            <div className="flex flex-wrap gap-2">
              {(subjects.data ?? []).map((s) => {
                const checked = subjectIds.includes(s.id);
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() =>
                      setSubjectIds((ids) =>
                        checked ? ids.filter((id) => id !== s.id) : [...ids, s.id],
                      )
                    }
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      checked
                        ? "border-dash bg-dash/15 text-dash"
                        : "border-border text-muted-foreground hover:border-dash/50"
                    }`}
                  >
                    {s.nome}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Quantidade de questões"
            type="number"
            min={1}
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
          />
          <Input
            label="Duração (min, opcional)"
            type="number"
            min={1}
            value={duracao}
            onChange={(e) => setDuracao(e.target.value)}
          />
        </div>

        {create.error && <ErrorState error={create.error} compact />}
      </div>
    </Dialog>
  );
}

export default function SimuladosPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["mock-exams"],
    queryFn: api.listMockExams,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<MockExam | null>(null);

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteMockExam(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mock-exams"] });
      toast("Simulado excluído.", "success");
      setDeleting(null);
    },
    onError: () =>
      toast("Só dá para excluir simulados que ainda não foram iniciados.", "error"),
  });

  const exams = [...(data ?? [])].sort((a, b) => b.id - a.id);

  return (
    <AppShell
      title="Simulados"
      subtitle="Estudos"
      actions={
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" /> Novo simulado
        </Button>
      }
    >
      <EstudosTabs active="simulados" />

      {isLoading && <Loading />}
      {error && <ErrorState error={error} onRetry={() => refetch()} />}
      {!isLoading && !error && exams.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title="Nenhum simulado ainda"
          description="Crie um simulado escolhendo matérias e quantidade de questões."
          action={
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" /> Criar simulado
            </Button>
          }
        />
      )}

      {exams.length > 0 && (
        <div className="flex flex-col gap-2">
          {exams.map((exam) => (
            <Card key={exam.id} className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{exam.titulo}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant={exam.status === "FINALIZADO" ? "success" : "info"}>
                    {mockExamStatusLabel[exam.status]}
                  </Badge>
                  <span>{exam.totalQuestoes} questões</span>
                  <span>{exam.materias.join(", ")}</span>
                  {exam.status === "FINALIZADO" && (
                    <span className="font-semibold text-foreground">
                      {exam.percentual.toFixed(0)}% de acerto
                    </span>
                  )}
                </div>
              </div>
              <Link to={`/estudos/simulados/${exam.id}`}>
                <Button size="sm" variant="outline">
                  {exam.status === "FINALIZADO" ? "Ver resultado" : "Abrir"}
                </Button>
              </Link>
              {exam.status === "CRIADO" && (
                <button
                  aria-label={`Excluir ${exam.titulo}`}
                  onClick={() => setDeleting(exam)}
                  className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </Card>
          ))}
        </div>
      )}

      <NovoSimuladoDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        title="Excluir simulado?"
        confirmLabel="Excluir"
        loading={remove.isPending}
      />
    </AppShell>
  );
}
