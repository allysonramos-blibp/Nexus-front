import { useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  FileUp,
  ListPlus,
  Pencil,
  Plus,
  Trash2,
  FileCheck,
  Sparkles,
  BookOpen,
  Layers,
  Play,
  Calendar,
  Clock,
  BarChart3,
  Search,
  RotateCcw,
  ClipboardPaste,
  X,
  CheckSquare,
  Square,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/AppShell";
import {
  api,
  studyPlanStatusLabel,
  type Subject,
  type Topic,
  type StudyPlanStatus,
} from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Dialog, ConfirmDialog } from "@/components/ui/Dialog";
import { PlanImportarPdfDialog } from "./PlanImportarPdfDialog";
import { ImportGabaritoDialog } from "./ImportGabaritoDialog";
import { PlanoDialog } from "./Planos";
import { AdicionarAssuntosLoteDialog } from "./AdicionarAssuntosLoteDialog";
import { SugerirAssuntosIaDialog } from "./SugerirAssuntosIaDialog";
import { SugerirEditalIaDialog } from "./SugerirEditalIaDialog";
import { GerarQuestoesIaDialog } from "./GerarQuestoesIaDialog";
import { ColarTextoRapidoDialog } from "./ColarTextoRapidoDialog";

function TopicRow({
  topic,
  subjectId,
  subjectName,
  planId,
  onEdit,
}: {
  topic: Topic;
  subjectId: number;
  subjectName: string;
  planId: number;
  onEdit: () => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [gerarIaOpen, setGerarIaOpen] = useState(false);
  const [colarOpen, setColarOpen] = useState(false);

  const remove = useMutation({
    mutationFn: () => api.deleteTopic(topic.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["topics", subjectId] });
      qc.invalidateQueries({ queryKey: ["study-plans"] });
      qc.invalidateQueries({ queryKey: ["study-plan", planId] });
      toast("Assunto excluído.", "success");
      setConfirming(false);
    },
  });

  return (
    <li className="group flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-border/70 bg-surface px-3 py-2 text-sm transition-all hover:border-border hover:shadow-xs">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <BookOpen className="size-4 shrink-0 text-muted-foreground/80" />
        <span className="truncate font-medium text-foreground">{topic.nome}</span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0">
        {/* Treinar questões diretamente */}
        <Link
          to={`/estudos/questoes?planId=${planId}&subjectId=${subjectId}&topicId=${topic.id}&mode=resolve`}
          className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          title="Resolver questões deste assunto agora"
        >
          <Play className="size-3 fill-current" />
          <span>Treinar</span>
        </Link>

        {/* Gerar questões com IA para este tópico */}
        <button
          type="button"
          onClick={() => setGerarIaOpen(true)}
          className="inline-flex items-center gap-1 rounded-md border border-border/80 px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:bg-surface-raised hover:text-foreground"
          title="Gerar questões com IA para este assunto"
        >
          <Sparkles className="size-3 text-amber-500" />
          <span className="text-[11px]">IA</span>
        </button>

        {/* Colar questões */}
        <button
          type="button"
          onClick={() => setColarOpen(true)}
          className="inline-flex items-center gap-1 rounded-md border border-border/80 px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:bg-surface-raised hover:text-foreground"
          title="Colar texto de questões para este assunto"
        >
          <ClipboardPaste className="size-3 text-emerald-500" />
          <span className="text-[11px]">Colar</span>
        </button>

        {/* Editar */}
        <button
          aria-label={`Editar ${topic.nome}`}
          onClick={onEdit}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground"
          title="Editar nome"
        >
          <Pencil className="size-3.5" />
        </button>

        {/* Excluir */}
        <button
          aria-label={`Excluir ${topic.nome}`}
          onClick={() => setConfirming(true)}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          title="Excluir assunto"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => remove.mutate()}
        title="Excluir assunto?"
        description={`"${topic.nome}" será removido, junto com as questões cadastradas nele.`}
        confirmLabel="Excluir"
        loading={remove.isPending}
      />

      {gerarIaOpen && (
        <GerarQuestoesIaDialog
          open={gerarIaOpen}
          onClose={() => setGerarIaOpen(false)}
          topicId={topic.id}
          topicName={topic.nome}
          subjectName={subjectName}
        />
      )}

      {colarOpen && (
        <ColarTextoRapidoDialog
          open={colarOpen}
          onClose={() => setColarOpen(false)}
          topicId={topic.id}
          topicName={topic.nome}
        />
      )}
    </li>
  );
}

function SubjectCard({
  subject,
  planId,
  planName,
  planObjective,
  searchQuery,
}: {
  subject: Subject;
  planId: number;
  planName: string;
  planObjective?: string | null;
  searchQuery?: string;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(true);
  const [editingSubject, setEditingSubject] = useState(false);
  const [subjectName, setSubjectName] = useState(subject.nome);
  const [subjectPeso, setSubjectPeso] = useState<number | undefined>(subject.pesoNoEdital ?? undefined);
  const [deletingSubject, setDeletingSubject] = useState(false);

  // Modais de tópicos
  const [topicDialog, setTopicDialog] = useState<{ topic: Topic | null } | null>(null);
  const [topicName, setTopicName] = useState("");
  const [loteOpen, setLoteOpen] = useState(false);
  const [sugerirIaOpen, setSugerirIaOpen] = useState(false);

  const topics = useQuery({
    queryKey: ["topics", subject.id],
    queryFn: () => api.listTopics(subject.id),
  });

  const saveSubject = useMutation({
    mutationFn: () =>
      api.updateSubject(subject.id, {
        nome: subjectName,
        pesoNoEdital: subjectPeso ?? null,
      }),
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
      qc.invalidateQueries({ queryKey: ["study-plans"] });
      qc.invalidateQueries({ queryKey: ["study-plan", planId] });
      toast("Matéria excluída.", "success");
      setDeletingSubject(false);
    },
    onError: (err: any) => {
      toast(err?.message || "Erro ao excluir a matéria.", "error");
    },
  });

  const createGeralTopic = useMutation({
    mutationFn: () => api.createTopic(subject.id, { nome: "Geral" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["topics", subject.id] });
      qc.invalidateQueries({ queryKey: ["study-plans"] });
      qc.invalidateQueries({ queryKey: ["study-plan", planId] });
      toast("Assunto 'Geral' criado com sucesso.", "success");
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
      qc.invalidateQueries({ queryKey: ["study-plan", planId] });
      toast(topicDialog?.topic ? "Assunto atualizado." : "Assunto criado.", "success");
      setTopicDialog(null);
      setTopicName("");
    },
  });

  const topicList = topics.data ?? [];
  const filteredTopics = useMemo(() => {
    if (!searchQuery?.trim()) return topicList;
    const q = searchQuery.toLowerCase().trim();
    if (subject.nome.toLowerCase().includes(q)) return topicList;
    return topicList.filter((t) => t.nome.toLowerCase().includes(q));
  }, [topicList, searchQuery, subject.nome]);

  const isMatch =
    !searchQuery?.trim() ||
    subject.nome.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    filteredTopics.length > 0;

  if (!isMatch) return null;

  return (
    <Card className="transition-all hover:border-border">
      {/* Cabeçalho da Matéria - Desenhado para não encavalar no mobile */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="p-1 -ml-1 text-muted-foreground transition-colors hover:text-primary shrink-0"
              aria-expanded={expanded}
              aria-label={expanded ? "Recolher matéria" : "Expandir matéria"}
            >
              {expanded ? (
                <ChevronDown className="size-4.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="size-4.5 text-muted-foreground" />
              )}
            </button>

            <Layers className="size-4 text-primary shrink-0" />

            {editingSubject ? (
              <div className="flex flex-1 flex-wrap items-center gap-2">
                <Input
                  autoFocus
                  value={subjectName}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="h-8 flex-1 text-sm font-semibold"
                  placeholder="Nome da matéria"
                />
                <Input
                  type="number"
                  value={subjectPeso ?? ""}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setSubjectPeso(e.target.value ? Number(e.target.value) : undefined)}
                  className="h-8 w-20 text-xs"
                  placeholder="Peso"
                  title="Peso no edital"
                />
                <Button size="sm" variant="ghost" onClick={() => setEditingSubject(false)}>
                  Cancelar
                </Button>
                <Button size="sm" loading={saveSubject.isPending} onClick={() => saveSubject.mutate()}>
                  Salvar
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="truncate text-base font-semibold text-foreground text-left hover:text-primary transition-colors"
                >
                  {subject.nome}
                </button>
                <Badge variant="default" className="text-[11px] font-normal shrink-0 whitespace-nowrap">
                  {topicList.length} assunto(s)
                </Badge>
                {subject.pesoNoEdital != null && (
                  <Badge variant="info" className="text-[11px] shrink-0 whitespace-nowrap">
                    Peso {subject.pesoNoEdital}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {!editingSubject && (
            <div className="flex items-center gap-1 shrink-0">
              <Link
                to={`/estudos/questoes?planId=${planId}&subjectId=${subject.id}&mode=resolve`}
                className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                title="Treinar todas as questões desta matéria"
              >
                <Play className="size-3 fill-current" />
                <span className="hidden xs:inline">Treinar</span>
              </Link>
              <button
                aria-label={`Editar ${subject.nome}`}
                onClick={() => {
                  setSubjectName(subject.nome);
                  setSubjectPeso(subject.pesoNoEdital ?? undefined);
                  setEditingSubject(true);
                }}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground"
                title="Editar matéria"
              >
                <Pencil className="size-3.5" />
              </button>
              <button
                aria-label={`Excluir ${subject.nome}`}
                onClick={() => setDeletingSubject(true)}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                title="Excluir matéria"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Linha de ferramentas da matéria */}
        {!editingSubject && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-border/40">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTopicDialog({ topic: null });
                setTopicName("");
              }}
              title="Adicionar um assunto específico"
              className="h-7 text-xs px-2.5"
            >
              <Plus className="size-3" /> Assunto
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLoteOpen(true)}
              title="Adicionar múltiplos assuntos colando do edital"
              className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
            >
              <ListPlus className="size-3.5" /> Lote
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSugerirIaOpen(true)}
              title="Sugerir tópicos com IA para esta matéria"
              className="h-7 text-xs px-2 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
            >
              <Sparkles className="size-3.5" /> IA
            </Button>
            <Link
              to={`/estudos/questoes?planId=${planId}&subjectId=${subject.id}&mode=list`}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors ml-auto"
              title="Ver todas as questões desta matéria"
            >
              <BookOpen className="size-3 text-info" />
              <span>Ver questões</span>
            </Link>
          </div>
        )}
      </div>

      {/* Lista expandida de assuntos */}
      {expanded && (
        <div className="mt-3 border-t border-border/70 pt-3">
          {topics.isLoading && <Loading label="Carregando assuntos…" />}
          {topics.error && <ErrorState error={topics.error} compact />}
          {!topics.isLoading && !topics.error && filteredTopics.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/80 py-4 px-3 text-center">
              <p className="text-xs text-muted-foreground">
                {searchQuery ? "Nenhum assunto corresponde à sua busca." : "Nenhum assunto nesta matéria ainda."}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  loading={createGeralTopic.isPending}
                  onClick={() => createGeralTopic.mutate()}
                  className="h-8 text-xs font-semibold"
                >
                  <Plus className="size-3.5" /> Criar assunto "Geral"
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTopicDialog({ topic: null });
                    setTopicName("");
                  }}
                  className="h-8 text-xs"
                >
                  Personalizado
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setLoteOpen(true)} className="h-8 text-xs">
                  <ListPlus className="size-3.5" /> Colar lista
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSugerirIaOpen(true)} className="h-8 text-xs">
                  <Sparkles className="size-3.5 text-amber-500" /> Sugerir com IA
                </Button>
              </div>
            </div>
          )}

          {!topics.isLoading && filteredTopics.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {filteredTopics.map((t) => (
                <TopicRow
                  key={t.id}
                  topic={t}
                  subjectId={subject.id}
                  subjectName={subject.nome}
                  planId={planId}
                  onEdit={() => {
                    setTopicDialog({ topic: t });
                    setTopicName(t.nome);
                  }}
                />
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Diálogos */}
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
          placeholder="Ex.: Geral, Controle de Constitucionalidade, Sintaxe"
        />
        {saveTopic.error && <ErrorState error={saveTopic.error} compact className="mt-2" />}
      </Dialog>

      {loteOpen && (
        <AdicionarAssuntosLoteDialog
          open={loteOpen}
          onClose={() => setLoteOpen(false)}
          subjectId={subject.id}
          subjectName={subject.nome}
          planId={planId}
        />
      )}

      {sugerirIaOpen && (
        <SugerirAssuntosIaDialog
          open={sugerirIaOpen}
          onClose={() => setSugerirIaOpen(false)}
          subjectId={subject.id}
          subjectName={subject.nome}
          planId={planId}
          planName={planName}
          planObjective={planObjective}
        />
      )}
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

  const [searchQuery, setSearchQuery] = useState("");
  const [editPlanoOpen, setEditPlanoOpen] = useState(false);
  const [newSubjectOpen, setNewSubjectOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [createDefaultGeral, setCreateDefaultGeral] = useState(true);
  const [sugerirEditalOpen, setSugerirEditalOpen] = useState(false);
  const [importPdfOpen, setImportPdfOpen] = useState(false);
  const [importGabaritoOpen, setImportGabaritoOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selectedSubjectsToDelete, setSelectedSubjectsToDelete] = useState<Record<number, boolean>>({});
  const [deletingProgress, setDeletingProgress] = useState<{ current: number; total: number } | null>(null);

  const subjectList = subjects.data ?? [];

  const isSuspiciousSubject = (name: string) => {
    const trimmed = (name || "").trim();
    if (trimmed.length > 30) return true;
    if (/^(according|the |pelo |ter |em |na |no |de |da |do |com |para |como |quando |onde |qual |quais |afirmar |julgue |assinale |sua menor)/i.test(trimmed)) return true;
    if (/[?:;.]$/.test(trimmed)) return true;
    return false;
  };

  const suspiciousSubjectsCount = useMemo(() => {
    return subjectList.filter((s) => isSuspiciousSubject(s.nome)).length;
  }, [subjectList]);

  const selectedCount = Object.values(selectedSubjectsToDelete).filter(Boolean).length;

  const handleSelectSuspicious = () => {
    const next: Record<number, boolean> = {};
    subjectList.forEach((s) => {
      if (isSuspiciousSubject(s.nome)) {
        next[s.id] = true;
      }
    });
    setSelectedSubjectsToDelete(next);
  };

  const handleSelectAll = () => {
    const allSelected = selectedCount === subjectList.length;
    const next: Record<number, boolean> = {};
    if (!allSelected) {
      subjectList.forEach((s) => {
        next[s.id] = true;
      });
    }
    setSelectedSubjectsToDelete(next);
  };

  const handleExecuteBulkDelete = async () => {
    const toDeleteIds = Object.entries(selectedSubjectsToDelete)
      .filter(([_, v]) => v)
      .map(([k]) => Number(k));

    if (toDeleteIds.length === 0) return;

    setDeletingProgress({ current: 0, total: toDeleteIds.length });

    try {
      let done = 0;
      for (const id of toDeleteIds) {
        await api.deleteSubject(id);
        done++;
        setDeletingProgress({ current: done, total: toDeleteIds.length });
      }

      qc.invalidateQueries({ queryKey: ["subjects", planId] });
      qc.invalidateQueries({ queryKey: ["study-plans"] });
      qc.invalidateQueries({ queryKey: ["study-plan", planId] });
      toast(`${toDeleteIds.length} matéria(s) excluída(s) com sucesso.`, "success");
      setBulkDeleteOpen(false);
      setSelectedSubjectsToDelete({});
    } catch (err: any) {
      toast(err?.message || "Ocorreu um erro ao excluir algumas matérias.", "error");
    } finally {
      setDeletingProgress(null);
    }
  };


  const createSubject = useMutation({
    mutationFn: async () => {
      const subject = await api.createSubject(planId, { nome: newSubjectName.trim() });
      if (createDefaultGeral) {
        try {
          await api.createTopic(subject.id, { nome: "Geral" });
        } catch (err) {
          console.warn("Não foi possível criar tópico Geral", err);
        }
      }
      return subject;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subjects", planId] });
      qc.invalidateQueries({ queryKey: ["study-plans"] });
      qc.invalidateQueries({ queryKey: ["study-plan", planId] });
      toast(createDefaultGeral ? "Matéria criada com assunto 'Geral'." : "Matéria criada.", "success");
      setNewSubjectOpen(false);
      setNewSubjectName("");
    },
  });

  const statusVariant = (status: StudyPlanStatus) => {
    switch (status) {
      case "CONCLUIDO":
        return "success";
      case "EM_ANDAMENTO":
        return "info";
      case "PAUSADO":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <AppShell
      title={plano.data?.nome ?? "Plano de estudo"}
      subtitle="Estudos"
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/estudos"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Meus Planos
          </Link>
        </div>
      }
    >
      {plano.isLoading && <Loading />}
      {plano.error && <ErrorState error={plano.error} onRetry={() => plano.refetch()} />}

      {/* Cartão de Resumo do Plano e Progresso */}
      {plano.data && (
        <Card className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-foreground">{plano.data.nome}</h1>
                <Badge variant={statusVariant(plano.data.status)}>
                  {studyPlanStatusLabel[plano.data.status]}
                </Badge>
              </div>
              {plano.data.objetivo && (
                <p className="text-sm font-medium text-muted-foreground">
                  {plano.data.objetivo}
                </p>
              )}
              {plano.data.descricao && (
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                  {plano.data.descricao}
                </p>
              )}
            </div>

            {/* Ações do cabeçalho do plano */}
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/estudos/questoes?planId=${planId}&mode=resolve`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
                title="Treinar todas as questões cadastradas em todas as matérias deste plano"
              >
                <Play className="size-4 fill-current" /> Treinar Questões
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditPlanoOpen(true)}
                className="h-9"
              >
                <Pencil className="size-3.5" /> Editar Plano
              </Button>
            </div>
          </div>

          {/* Barra de Progresso Visual e Métricas */}
          <div className="flex flex-col gap-2 rounded-xl bg-surface-raised/50 p-3 border border-border/60">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">Progresso do Edital</span>
              <span className="font-bold text-primary">{Math.round(plano.data.progresso)}% concluído</span>
            </div>
            <ProgressBar
              value={plano.data.progresso}
              accent="var(--primary, #3b82f6)"
              className="h-2.5"
            />

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-muted-foreground">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <Layers className="size-3.5 text-primary" />
                  {plano.data.totalMaterias} matéria(s)
                </span>
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <BookOpen className="size-3.5 text-info" />
                  {plano.data.totalAssuntos} assunto(s)
                </span>
                {plano.data.dataAlvo && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="size-3.5 text-amber-500" />
                    Prova: {plano.data.dataAlvo}
                  </span>
                )}
                {plano.data.horasDisponiveis && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5 text-emerald-500" />
                    {plano.data.horasDisponiveis}h / sem
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/estudos/revisoes"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RotateCcw className="size-3" /> Revisões
                </Link>
                <span>·</span>
                <Link
                  to="/estudos/desempenho"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <BarChart3 className="size-3" /> Desempenho
                </Link>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Barra de Matérias e Ações */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">Matérias</h2>
            <Badge variant="default">{subjects.data?.length ?? 0}</Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => setNewSubjectOpen(true)}>
              <Plus className="size-4" /> Nova matéria
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSugerirEditalOpen(true)}
              className="text-amber-500 hover:text-amber-400"
            >
              <Sparkles className="size-3.5" /> Estruturar com IA
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setImportPdfOpen(true)}>
              <FileUp className="size-4" /> PDF
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setImportGabaritoOpen(true)}>
              <FileCheck className="size-4" /> Gabarito
            </Button>
            {subjectList.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className={suspiciousSubjectsCount > 0 ? "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10" : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"}
                onClick={() => {
                  setSelectedSubjectsToDelete({});
                  setBulkDeleteOpen(true);
                }}
                title="Gerenciar e limpar matérias do plano"
              >
                <Trash2 className="size-4" />
                <span>Limpar Matérias</span>
                {suspiciousSubjectsCount > 0 && (
                  <Badge variant="warning" className="text-[10px] ml-1 px-1 py-0">
                    {suspiciousSubjectsCount}
                  </Badge>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Campo de Busca Rápida de Matérias e Assuntos */}
        {(subjects.data?.length ?? 0) > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar matéria ou assunto neste plano..."
              className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-8 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
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
        )}
      </div>

      {subjects.isLoading && <Loading label="Carregando matérias…" />}
      {subjects.error && <ErrorState error={subjects.error} onRetry={() => subjects.refetch()} />}

      {!subjects.isLoading && !subjects.error && (subjects.data ?? []).length === 0 && (
        <EmptyState
          title="Nenhuma matéria ainda"
          description="Adicione as matérias desse plano — ao criar uma matéria, o assunto 'Geral' é criado automaticamente para você começar a cadastrar e treinar questões imediatamente."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button size="sm" onClick={() => setNewSubjectOpen(true)}>
                <Plus className="size-4" /> Adicionar matéria
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSugerirEditalOpen(true)}
              >
                <Sparkles className="size-3.5 text-amber-500" /> Estruturar com IA
              </Button>
            </div>
          }
        />
      )}

      {!subjects.isLoading && (subjects.data?.length ?? 0) > 0 && (
        <div className="flex flex-col gap-3">
          {(subjects.data ?? []).map((s) => (
            <SubjectCard
              key={s.id}
              subject={s}
              planId={planId}
              planName={plano.data?.nome ?? ""}
              planObjective={plano.data?.objetivo}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}

      {/* Diálogo de Nova Matéria com Checkbox de Criar "Geral" automático */}
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
              Criar matéria
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Input
            label="Nome da matéria"
            autoFocus
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            placeholder="Ex.: Direito Constitucional, Banco de Dados, Língua Portuguesa"
          />
          <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground select-none">
            <input
              type="checkbox"
              checked={createDefaultGeral}
              onChange={(e) => setCreateDefaultGeral(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary size-4"
            />
            <span>Criar assunto <strong>"Geral"</strong> automaticamente (já fica pronta para questões)</span>
          </label>
        </div>
        {createSubject.error && <ErrorState error={createSubject.error} compact className="mt-2" />}
      </Dialog>

      {/* Diálogo de Edição do Plano */}
      {plano.data && (
        <PlanoDialog
          open={editPlanoOpen}
          onClose={() => setEditPlanoOpen(false)}
          plano={plano.data}
        />
      )}

      {/* Diálogo de Estruturar Edital com IA */}
      {Number.isFinite(planId) && (
        <SugerirEditalIaDialog
          open={sugerirEditalOpen}
          onClose={() => setSugerirEditalOpen(false)}
          planId={planId}
          planName={plano.data?.nome ?? ""}
          planObjective={plano.data?.objetivo}
        />
      )}

      {/* Diálogos de Importação de PDF e Gabarito */}
      {Number.isFinite(planId) && (
        <>
          <PlanImportarPdfDialog
            open={importPdfOpen}
            onClose={() => setImportPdfOpen(false)}
            planId={planId}
          />
          <ImportGabaritoDialog
            open={importGabaritoOpen}
            onClose={() => setImportGabaritoOpen(false)}
            planId={planId}
          />
        </>
      )}
      {/* Diálogo de Gerenciamento e Exclusão de Matérias em Lote */}
      <Dialog
        open={bulkDeleteOpen}
        onClose={() => !deletingProgress && setBulkDeleteOpen(false)}
        title="Limpeza e Exclusão de Matérias em Lote"
        description="Selecione as matérias indesejadas para remover do seu plano (ideal para excluir matérias falsas ou enunciados criados por importação de PDF)."
        className="max-w-xl"
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setBulkDeleteOpen(false)}
              disabled={Boolean(deletingProgress)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={selectedCount === 0 || Boolean(deletingProgress)}
              onClick={handleExecuteBulkDelete}
            >
              {deletingProgress
                ? `Excluindo (${deletingProgress.current}/${deletingProgress.total})...`
                : `Excluir ${selectedCount} matéria(s)`}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          {deletingProgress && (
            <Loading
              label={`Excluindo matérias (${deletingProgress.current} de ${deletingProgress.total})...`}
            />
          )}

          {!deletingProgress && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handleSelectAll}>
                    {selectedCount === subjectList.length ? "Desmarcar todas" : "Selecionar todas"}
                  </Button>
                  {suspiciousSubjectsCount > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSelectSuspicious}
                      className="text-amber-500 hover:text-amber-400 border-amber-500/30"
                    >
                      <AlertTriangle className="size-3" />
                      Selecionar {suspiciousSubjectsCount} suspeitas (PDF)
                    </Button>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {selectedCount} de {subjectList.length} selecionadas
                </span>
              </div>

              {suspiciousSubjectsCount > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-400">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>
                    Identificamos <strong>{suspiciousSubjectsCount} matéria(s)</strong> com títulos longos ou frases de questões (geradas por importação de PDF). Use o botão de suspeitas acima para marcá-las de uma só vez!
                  </span>
                </div>
              )}

              <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 divide-y divide-border/20">
                {subjectList.map((s) => {
                  const isSel = Boolean(selectedSubjectsToDelete[s.id]);
                  const isSuspicious = isSuspiciousSubject(s.nome);

                  return (
                    <div
                      key={s.id}
                      onClick={() =>
                        setSelectedSubjectsToDelete((prev) => ({
                          ...prev,
                          [s.id]: !prev[s.id],
                        }))
                      }
                      className={cn(
                        "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors gap-2",
                        isSel
                          ? "bg-red-500/10 border border-red-500/30"
                          : "hover:bg-surface-raised border border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {isSel ? (
                          <CheckSquare className="size-4 text-red-400 shrink-0" />
                        ) : (
                          <Square className="size-4 text-muted-foreground shrink-0" />
                        )}
                        <span className="text-sm font-medium text-foreground break-words">
                          {s.nome}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isSuspicious && (
                          <Badge variant="warning" className="text-[10px]">
                            Suspeita (PDF)
                          </Badge>
                        )}
                        
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </Dialog>
    </AppShell>
  );
}
