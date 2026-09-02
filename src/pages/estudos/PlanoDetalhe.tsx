import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, ChevronRight, ListPlus, Pencil, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  api,
  studyPlanStatusLabel,
  type Subject,
  type Topic,
} from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Dialog, ConfirmDialog } from "@/components/ui/Dialog";

function TopicRow({
  topic,
  subjectId,
  onEdit,
}: {
  topic: Topic;
  subjectId: number;
  onEdit: () => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [confirming, setConfirming] = useState(false);

  const remove = useMutation({
    mutationFn: () => api.deleteTopic(topic.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["topics", subjectId] });
      toast("Assunto excluído.", "success");
      setConfirming(false);
    },
  });

  return (
    <li className="flex items-center gap-2 rounded-lg border border-border/70 bg-surface px-3 py-2 text-sm">
      <span className="flex-1">{topic.nome}</span>
      <button
        aria-label={`Editar ${topic.nome}`}
        onClick={onEdit}
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground"
      >
        <Pencil className="size-3.5" />
      </button>
      <button
        aria-label={`Excluir ${topic.nome}`}
        onClick={() => setConfirming(true)}
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="size-3.5" />
      </button>
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => remove.mutate()}
        title="Excluir assunto?"
        description={`"${topic.nome}" será removido, junto com as questões cadastradas nele.`}
        confirmLabel="Excluir"
        loading={remove.isPending}
      />
    </li>
  );
}

function SubjectCard({ subject, planId }: { subject: Subject; planId: number }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [editingSubject, setEditingSubject] = useState(false);
  const [subjectName, setSubjectName] = useState(subject.nome);
  const [deletingSubject, setDeletingSubject] = useState(false);
  const [topicDialog, setTopicDialog] = useState<{ topic: Topic | null } | null>(null);
  const [topicName, setTopicName] = useState("");

  const topics = useQuery({
    queryKey: ["topics", subject.id],
    queryFn: () => api.listTopics(subject.id),
    enabled: expanded,
  });

  const saveSubject = useMutation({
    mutationFn: () => api.updateSubject(subject.id, { nome: subjectName, pesoNoEdital: subject.pesoNoEdital }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subjects", planId] });
      setEditingSubject(false);
      toast("Matéria atualizada.", "success");
    },
  });

  const removeSubject = useMutation({
    mutationFn: () => api.deleteSubject(subject.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subjects", planId] });
      toast("Matéria excluída.", "success");
    },
  });

  const saveTopic = useMutation({
    mutationFn: () =>
      topicDialog?.topic
        ? api.updateTopic(topicDialog.topic.id, { nome: topicName })
        : api.createTopic(subject.id, { nome: topicName }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["topics", subject.id] });
      qc.invalidateQueries({ queryKey: ["study-plans"] });
      toast(topicDialog?.topic ? "Assunto atualizado." : "Assunto criado.", "success");
      setTopicDialog(null);
      setTopicName("");
    },
  });

  return (
    <Card>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex flex-1 items-center gap-2 text-left"
          aria-expanded={expanded}
        >
          {expanded ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
          {editingSubject ? (
            <Input
              autoFocus
              value={subjectName}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setSubjectName(e.target.value)}
              className="h-8 flex-1"
            />
          ) : (
            <span className="font-medium">{subject.nome}</span>
          )}
        </button>
        {editingSubject ? (
          <>
            <Button size="sm" variant="ghost" onClick={() => setEditingSubject(false)}>
              Cancelar
            </Button>
            <Button size="sm" loading={saveSubject.isPending} onClick={() => saveSubject.mutate()}>
              Salvar
            </Button>
          </>
        ) : (
          <>
            <button
              aria-label={`Editar ${subject.nome}`}
              onClick={() => {
                setSubjectName(subject.nome);
                setEditingSubject(true);
              }}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              aria-label={`Excluir ${subject.nome}`}
              onClick={() => setDeletingSubject(true)}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          </>
        )}
      </div>

      {expanded && (
        <div className="mt-3 border-t border-border pt-3">
          {topics.isLoading && <Loading label="Carregando assuntos…" />}
          {topics.error && <ErrorState error={topics.error} compact />}
          {!topics.isLoading && !topics.error && (topics.data ?? []).length === 0 && (
            <p className="py-2 text-xs text-muted-foreground">Nenhum assunto nesta matéria ainda.</p>
          )}
          {!topics.isLoading && (topics.data?.length ?? 0) > 0 && (
            <ul className="flex flex-col gap-1.5">
              {(topics.data ?? []).map((t) => (
                <TopicRow
                  key={t.id}
                  topic={t}
                  subjectId={subject.id}
                  onEdit={() => {
                    setTopicDialog({ topic: t });
                    setTopicName(t.nome);
                  }}
                />
              ))}
            </ul>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => {
              setTopicDialog({ topic: null });
              setTopicName("");
            }}
          >
            <ListPlus className="size-3.5" /> Adicionar assunto
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={deletingSubject}
        onClose={() => setDeletingSubject(false)}
        onConfirm={() => removeSubject.mutate()}
        title="Excluir matéria?"
        description={`"${subject.nome}" e todos os assuntos dentro dela serão removidos.`}
        confirmLabel="Excluir"
        loading={removeSubject.isPending}
      />

      <Dialog
        open={Boolean(topicDialog)}
        onClose={() => setTopicDialog(null)}
        title={topicDialog?.topic ? "Editar assunto" : "Novo assunto"}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setTopicDialog(null)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              loading={saveTopic.isPending}
              onClick={() => topicName.trim() && saveTopic.mutate()}
            >
              Salvar
            </Button>
          </>
        }
      >
        <Input
          label="Nome do assunto"
          autoFocus
          value={topicName}
          onChange={(e) => setTopicName(e.target.value)}
          placeholder="Ex.: Genética, Verbos irregulares, Direito Constitucional"
        />
        {saveTopic.error && <ErrorState error={saveTopic.error} compact className="mt-2" />}
      </Dialog>
    </Card>
  );
}

export default function PlanoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const planId = Number(id);
  const qc = useQueryClient();
  const { toast } = useToast();

  const plano = useQuery({
    queryKey: ["study-plan", planId],
    queryFn: () => api.getStudyPlan(planId),
    enabled: Number.isFinite(planId),
  });

  const subjects = useQuery({
    queryKey: ["subjects", planId],
    queryFn: () => api.listSubjects(planId),
    enabled: Number.isFinite(planId),
  });

  const [newSubjectOpen, setNewSubjectOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");

  const createSubject = useMutation({
    mutationFn: () => api.createSubject(planId, { nome: newSubjectName }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subjects", planId] });
      qc.invalidateQueries({ queryKey: ["study-plans"] });
      toast("Matéria criada.", "success");
      setNewSubjectOpen(false);
      setNewSubjectName("");
    },
  });

  return (
    <AppShell
      title={plano.data?.nome ?? "Plano de estudo"}
      subtitle="Estudos"
      actions={
        <Link
          to="/estudos"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Meus Planos
        </Link>
      }
    >
      {plano.isLoading && <Loading />}
      {plano.error && <ErrorState error={plano.error} onRetry={() => plano.refetch()} />}

      {plano.data && (
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <div>
            {plano.data.objetivo && (
              <p className="text-sm text-muted-foreground">{plano.data.objetivo}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {Math.round(plano.data.progresso)}% concluído · {plano.data.totalMaterias} matéria(s) ·{" "}
              {plano.data.totalAssuntos} assunto(s)
            </p>
          </div>
          <Badge variant={plano.data.status === "CONCLUIDO" ? "success" : "info"}>
            {studyPlanStatusLabel[plano.data.status]}
          </Badge>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Matérias</h2>
        <Button size="sm" onClick={() => setNewSubjectOpen(true)}>
          <Plus className="size-4" /> Nova matéria
        </Button>
      </div>

      {subjects.isLoading && <Loading label="Carregando matérias…" />}
      {subjects.error && <ErrorState error={subjects.error} onRetry={() => subjects.refetch()} />}
      {!subjects.isLoading && !subjects.error && (subjects.data ?? []).length === 0 && (
        <EmptyState
          title="Nenhuma matéria ainda"
          description="Adicione as matérias desse plano — depois entram os assuntos dentro de cada uma."
          action={
            <Button size="sm" onClick={() => setNewSubjectOpen(true)}>
              <Plus className="size-4" /> Adicionar matéria
            </Button>
          }
        />
      )}

      {!subjects.isLoading && (subjects.data?.length ?? 0) > 0 && (
        <div className="flex flex-col gap-3">
          {(subjects.data ?? []).map((s) => (
            <SubjectCard key={s.id} subject={s} planId={planId} />
          ))}
        </div>
      )}

      <Dialog
        open={newSubjectOpen}
        onClose={() => setNewSubjectOpen(false)}
        title="Nova matéria"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setNewSubjectOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              loading={createSubject.isPending}
              onClick={() => newSubjectName.trim() && createSubject.mutate()}
            >
              Criar
            </Button>
          </>
        }
      >
        <Input
          label="Nome da matéria"
          autoFocus
          value={newSubjectName}
          onChange={(e) => setNewSubjectName(e.target.value)}
          placeholder="Ex.: Biologia, Direito Constitucional, Inglês"
        />
        {createSubject.error && <ErrorState error={createSubject.error} compact className="mt-2" />}
      </Dialog>
    </AppShell>
  );
}
