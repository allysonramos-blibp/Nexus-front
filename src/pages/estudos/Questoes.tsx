import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAiChat } from "@/contexts/AiChatContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardPaste,
  FileUp,
  ListChecks,
  MessageCircleQuestion,
  NotebookPen,
  Pencil,
  Play,
  Plus,
  Sparkles,
  Trash2,
  BookOpen,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { api, errorReasonLabel, type ErrorReason, type Question, type Topic } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import { Select } from "@/components/ui/Select";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Textarea } from "@/components/ui/Textarea";
import { QuestionOption, type QuestionOptionState } from "@/components/ui/QuestionOption";
import { EstudosTabs } from "./EstudosTabs";
import { TopicPicker } from "./TopicPicker";
import { QuestaoForm } from "./QuestaoForm";
import { ImportarPdfDialog } from "./ImportarPdfDialog";
import { ColarTextoRapidoDialog } from "./ColarTextoRapidoDialog";
import { GerarQuestoesIaDialog } from "./GerarQuestoesIaDialog";

const LETTERS = ["A", "B", "C", "D", "E"];

const ERROR_REASONS: ErrorReason[] = [
  "NAO_SABIA",
  "INTERPRETACAO",
  "DISTRACAO",
  "CHUTE",
  "ERRO_DE_CALCULO",
];

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function RegistrarErroDialog({
  open,
  onClose,
  questionId,
  answerId,
}: {
  open: boolean;
  onClose: () => void;
  questionId: number;
  answerId: number | null;
}) {
  const { toast } = useToast();
  const [motivo, setMotivo] = useState<ErrorReason>("NAO_SABIA");
  const [observacoes, setObservacoes] = useState("");

  const save = useMutation({
    mutationFn: () =>
      api.registerStudyError({
        questionId,
        answerId,
        motivo,
        observacao: observacoes.trim() || null,
      }),
    onSuccess: () => {
      toast("Adicionado ao caderno de erros.", "success");
      onClose();
    },
    onError: () => toast("Erro ao registrar no caderno de erros.", "error"),
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Registrar no Caderno de Erros"
      description="Identifique o motivo do erro para direcionar suas próximas revisões."
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={save.isPending}>
            Cancelar
          </Button>
          <Button size="sm" loading={save.isPending} onClick={() => save.mutate()}>
            Salvar no Caderno
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Select
          label="Motivo do erro"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value as ErrorReason)}
        >
          {ERROR_REASONS.map((r) => (
            <option key={r} value={r}>
              {errorReasonLabel[r]}
            </option>
          ))}
        </Select>
        <Textarea
          label="Anotações / Como não errar de novo (opcional)"
          rows={3}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Ex: Confundi os prazos do art. 5º; atentar para a palavra 'exclusivamente'..."
        />
        {save.error && <ErrorState error={save.error} compact />}
      </div>
    </Dialog>
  );
}

function ResolverQuestoes({
  questions,
  onExit,
}: {
  questions: Question[];
  onExit: () => void;
}) {
  const { toast } = useToast();
  const { openChat } = useAiChat();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [lastAnswerId, setLastAnswerId] = useState<number | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);

  const question = questions[index];

  const answer = useMutation({
    mutationFn: (respostaEscolhida: string) =>
      api.submitAnswer({ questionId: question.id, respostaEscolhida }),
    onSuccess: (res) => {
      setLastAnswerId(res.id);
      setSubmitted(true);
    },
    onError: () => toast("Não consegui registrar sua resposta — tente de novo.", "error"),
  });

  function optionState(alt: string): QuestionOptionState {
    if (!submitted) return selected === alt ? "selected" : "idle";
    const isGabarito = normalize(alt) === normalize(question.gabarito ?? "");
    if (isGabarito) return "correct";
    if (selected === alt) return "incorrect";
    return "idle";
  }

  function next() {
    if (index + 1 >= questions.length) {
      onExit();
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setSubmitted(false);
    setLastAnswerId(null);
  }

  const acertou = submitted && normalize(selected ?? "") === normalize(question.gabarito ?? "");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onExit}>
          <ArrowLeft className="size-4" /> Sair do treino
        </Button>
        <span className="text-xs text-muted-foreground font-medium">
          Questão {index + 1} de {questions.length}
        </span>
      </div>

      <ProgressBar value={index + (submitted ? 1 : 0)} max={questions.length} accent="var(--study)" />

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {question.subjectNome && (
            <Badge variant="default" className="text-[11px] font-normal">
              {question.subjectNome}
            </Badge>
          )}
          {question.topicNome && (
            <Badge variant="default" className="text-[11px] font-normal">
              {question.topicNome}
            </Badge>
          )}
          {question.banca && <Badge>{question.banca}</Badge>}
          {question.ano && <Badge>{question.ano}</Badge>}
          {question.dificuldade && <Badge variant="info">{question.dificuldade}</Badge>}
        </div>

        <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{question.enunciado}</p>

        <div className="flex flex-col gap-2">
          {question.alternativas.map((alt, i) => (
            <QuestionOption
              key={i}
              letter={LETTERS[i]}
              text={alt}
              state={optionState(alt)}
              disabled={submitted}
              onClick={() => setSelected(alt)}
            />
          ))}
        </div>

        {submitted && (
          <div
            className={`rounded-xl border p-4 text-sm ${
              acertou ? "border-fin/40 bg-fin/10 text-fin" : "border-destructive/40 bg-destructive/10 text-destructive"
            }`}
          >
            <p className="font-semibold">{acertou ? "Você acertou!" : "Você errou."}</p>
            {!acertou && (
              <p className="mt-1 text-foreground">
                Gabarito: <strong>{question.gabarito}</strong>
              </p>
            )}
            {question.explicacao && (
              <p className="mt-2 leading-relaxed text-foreground">{question.explicacao}</p>
            )}
            {!acertou && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-destructive/40 text-destructive hover:bg-destructive/10"
                  onClick={() => setErrorDialogOpen(true)}
                >
                  <NotebookPen className="size-3.5" /> Registrar no caderno de erros
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    openChat(
                      `Pode me explicar essa questão de forma clara e didática? "${question.enunciado}" — o gabarito correto é "${question.gabarito}".`
                    )
                  }
                >
                  <MessageCircleQuestion className="size-3.5" /> Perguntar à IA
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end">
          {!submitted ? (
            <Button
              disabled={!selected}
              loading={answer.isPending}
              onClick={() => selected && answer.mutate(selected)}
            >
              Responder
            </Button>
          ) : (
            <Button onClick={next}>
              {index + 1 >= questions.length ? "Concluir treino" : "Próxima questão"}
              <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </Card>

      <RegistrarErroDialog
        key={question.id}
        open={errorDialogOpen}
        onClose={() => setErrorDialogOpen(false)}
        questionId={question.id}
        answerId={lastAnswerId}
      />
    </div>
  );
}

export default function QuestoesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const urlPlanId = searchParams.get("planId") ? Number(searchParams.get("planId")) : null;
  const urlSubjectId = searchParams.get("subjectId") ? Number(searchParams.get("subjectId")) : null;
  const urlTopicId = searchParams.get("topicId") ? Number(searchParams.get("topicId")) : null;
  const urlMode = searchParams.get("mode") === "resolve" ? "resolve" : "list";

  const [planoId, setPlanoId] = useState<number | null>(urlPlanId);
  const [subjectId, setSubjectId] = useState<number | null>(urlSubjectId);
  const [topicId, setTopicId] = useState<number | null>(urlTopicId);
  const [mode, setMode] = useState<"list" | "resolve">(urlMode);

  useEffect(() => {
    if (urlPlanId && planoId !== urlPlanId) setPlanoId(urlPlanId);
    if (urlSubjectId && subjectId !== urlSubjectId) setSubjectId(urlSubjectId);
    if (urlTopicId && topicId !== urlTopicId) setTopicId(urlTopicId);
    if (urlMode && mode !== urlMode) setMode(urlMode);
  }, [urlPlanId, urlSubjectId, urlTopicId, urlMode]);

  // Modais de criação e importação
  const [formOpen, setFormOpen] = useState(false);
  const [colarOpen, setColarOpen] = useState(false);
  const [gerarIaOpen, setGerarIaOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [deleting, setDeleting] = useState<Question | null>(null);

  // Destino dinâmico para cadastrar questões (quando estiver no modo Geral)
  const [targetTopicForAction, setTargetTopicForAction] = useState<number | null>(null);
  const [targetTopicName, setTargetTopicName] = useState<string | undefined>(undefined);
  const [targetSubjectName, setTargetSubjectName] = useState<string | undefined>(undefined);
  const [chooseDestinoOpen, setChooseDestinoOpen] = useState<null | "colar" | "ia" | "manual" | "pdf">(null);
  const [chosenSubjectId, setChosenSubjectId] = useState<number | null>(null);
  const [chosenTopicId, setChosenTopicId] = useState<number | null>(null);

  const planos = useQuery({ queryKey: ["study-plans"], queryFn: api.listStudyPlans });
  const activePlano = planos.data?.find((p) => p.id === planoId);

  const subjects = useQuery({
    queryKey: ["subjects", planoId],
    queryFn: () => api.listSubjects(planoId!),
    enabled: planoId != null,
  });
  const activeSubject = subjects.data?.find((s) => s.id === subjectId);

  const topics = useQuery({
    queryKey: ["topics", subjectId],
    queryFn: () => api.listTopics(subjectId!),
    enabled: subjectId != null,
  });
  const activeTopic = topics.data?.find((t) => t.id === topicId);

  // Tópicos para o diálogo de escolha de destino
  const chosenSubjectTopics = useQuery({
    queryKey: ["topics", chosenSubjectId],
    queryFn: () => api.listTopics(chosenSubjectId!),
    enabled: chosenSubjectId != null,
  });

  // Carregamento de questões: Suporta tópico individual, matéria completa (todos os assuntos) ou plano completo (todas as matérias)
  const questionsQuery = useQuery({
    queryKey: ["questions-aggregate", { planoId, subjectId, topicId }],
    queryFn: async (): Promise<Question[]> => {
      // 1. Tópico específico selecionado
      if (topicId != null) {
        const qs = await api.listQuestions(topicId);
        return qs.map((q) => ({
          ...q,
          topicNome: activeTopic?.nome,
          subjectNome: activeSubject?.nome ?? q.subjectNome,
        }));
      }

      // 2. Matéria selecionada com "Todos os assuntos (Geral)"
      if (subjectId != null) {
        const topicosDaMateria = topics.data ?? (await api.listTopics(subjectId));
        if (!topicosDaMateria || topicosDaMateria.length === 0) return [];

        const results = await Promise.all(
          topicosDaMateria.map(async (t) => {
            try {
              const qs = await api.listQuestions(t.id);
              return qs.map((q) => ({
                ...q,
                topicNome: t.nome,
                subjectNome: activeSubject?.nome ?? q.subjectNome,
              }));
            } catch {
              return [];
            }
          })
        );
        return results.flat();
      }

      // 3. Plano selecionado com "Todas as matérias (Geral)"
      if (planoId != null) {
        const materiasDoPlano = subjects.data ?? (await api.listSubjects(planoId));
        if (!materiasDoPlano || materiasDoPlano.length === 0) return [];

        const topicsBySubject = await Promise.all(
          materiasDoPlano.map(async (s) => {
            try {
              const ts = await api.listTopics(s.id);
              return ts.map((t) => ({ ...t, subjectNome: s.nome, subjectId: s.id }));
            } catch {
              return [];
            }
          })
        );

        const allTopics = topicsBySubject.flat();
        const results = await Promise.all(
          allTopics.map(async (t) => {
            try {
              const qs = await api.listQuestions(t.id);
              return qs.map((q) => ({
                ...q,
                topicNome: t.nome,
                subjectNome: t.subjectNome,
                subjectId: t.subjectId,
              }));
            } catch {
              return [];
            }
          })
        );

        return results.flat();
      }

      return [];
    },
    enabled: planoId != null || subjectId != null || topicId != null,
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteQuestion(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["questions"] });
      qc.invalidateQueries({ queryKey: ["questions-aggregate"] });
      toast("Questão excluída.", "success");
      setDeleting(null);
    },
  });

  const list = questionsQuery.data ?? [];

  // Função para abrir modais de cadastro garantindo que temos um topicId
  const handleOpenAction = async (actionType: "colar" | "ia" | "manual" | "pdf") => {
    // Se temos topicId direto
    if (topicId != null) {
      setTargetTopicForAction(topicId);
      setTargetTopicName(activeTopic?.nome);
      setTargetSubjectName(activeSubject?.nome);
      if (actionType === "colar") setColarOpen(true);
      if (actionType === "ia") setGerarIaOpen(true);
      if (actionType === "manual") {
        setEditing(null);
        setFormOpen(true);
      }
      if (actionType === "pdf") setImportOpen(true);
      return;
    }

    // Se temos matéria selecionada
    if (subjectId != null) {
      const currentTopics = topics.data ?? (await api.listTopics(subjectId));
      if (currentTopics.length > 0) {
        const geral = currentTopics.find((t) => t.nome.toLowerCase() === "geral") ?? currentTopics[0];
        setTargetTopicForAction(geral.id);
        setTargetTopicName(geral.nome);
        setTargetSubjectName(activeSubject?.nome);
        if (actionType === "colar") setColarOpen(true);
        if (actionType === "ia") setGerarIaOpen(true);
        if (actionType === "manual") {
          setEditing(null);
          setFormOpen(true);
        }
        if (actionType === "pdf") setImportOpen(true);
        return;
      } else {
        // Criar assunto Geral automaticamente para a matéria
        try {
          const createdGeral = await api.createTopic(subjectId, { nome: "Geral" });
          qc.invalidateQueries({ queryKey: ["topics", subjectId] });
          setTargetTopicForAction(createdGeral.id);
          setTargetTopicName("Geral");
          setTargetSubjectName(activeSubject?.nome);
          if (actionType === "colar") setColarOpen(true);
          if (actionType === "ia") setGerarIaOpen(true);
          if (actionType === "manual") {
            setEditing(null);
            setFormOpen(true);
          }
          if (actionType === "pdf") setImportOpen(true);
          return;
        } catch {
          toast("Não foi possível preparar o assunto para salvar as questões.", "error");
          return;
        }
      }
    }

    // Se estamos no plano geral (sem matéria selecionada ainda):
    // Abrir seletor de destino
    setChosenSubjectId(subjects.data?.[0]?.id ?? null);
    setChooseDestinoOpen(actionType);
  };

  const confirmDestinoAndOpen = () => {
    if (!chosenTopicId) {
      toast("Selecione um assunto para vincular as questões.", "info");
      return;
    }
    const topicObj = chosenSubjectTopics.data?.find((t) => t.id === chosenTopicId);
    const subObj = subjects.data?.find((s) => s.id === chosenSubjectId);

    setTargetTopicForAction(chosenTopicId);
    setTargetTopicName(topicObj?.nome);
    setTargetSubjectName(subObj?.nome);

    const action = chooseDestinoOpen;
    setChooseDestinoOpen(null);

    if (action === "colar") setColarOpen(true);
    if (action === "ia") setGerarIaOpen(true);
    if (action === "manual") {
      setEditing(null);
      setFormOpen(true);
    }
    if (action === "pdf") setImportOpen(true);
  };

  return (
    <AppShell title="Questões" subtitle="Estudos">
      <EstudosTabs active="questoes" />

      <TopicPicker
        planoId={planoId}
        subjectId={subjectId}
        topicId={topicId}
        onChangePlano={(id) => {
          setPlanoId(id);
          setSubjectId(null);
          setTopicId(null);
        }}
        onChangeSubject={(id) => {
          setSubjectId(id);
          setTopicId(null);
        }}
        onChangeTopic={(id) => {
          setTopicId(id);
        }}
      />

      {/* MODO RESOLUÇÃO (TREINO / SIMULADO) */}
      {mode === "resolve" && (
        <>
          {questionsQuery.isLoading && <Loading label="Carregando questões para o treino…" />}
          {questionsQuery.error && (
            <ErrorState error={questionsQuery.error} onRetry={() => questionsQuery.refetch()} />
          )}
          {!questionsQuery.isLoading && !questionsQuery.error && list.length === 0 && (
            <Card className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <ListChecks className="size-10 text-muted-foreground/50" />
              <p className="text-sm font-semibold text-foreground">
                Nenhuma questão cadastrada para treinar neste filtro
              </p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Cadastre questões nesta matéria/assunto ou selecione outro plano para resolver.
              </p>
              <Button variant="outline" size="sm" onClick={() => setMode("list")} className="mt-2">
                <ArrowLeft className="size-4" /> Voltar para a lista
              </Button>
            </Card>
          )}
          {!questionsQuery.isLoading && list.length > 0 && (
            <ResolverQuestoes questions={list} onExit={() => setMode("list")} />
          )}
        </>
      )}

      {/* MODO LISTA DE QUESTÕES */}
      {mode === "list" && (
        <>
          {planoId == null && (
            <Card className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <BookOpen className="size-9 text-muted-foreground/60" />
              <p className="text-sm font-semibold text-foreground">
                Selecione um plano de estudo acima para ver e treinar as questões
              </p>
              <p className="text-xs text-muted-foreground max-w-md">
                Você poderá ver todas as questões do plano (Geral), filtrar por matéria ou praticar por assunto específico.
              </p>
            </Card>
          )}

          {planoId != null && questionsQuery.isLoading && <Loading label="Carregando questões…" />}
          {planoId != null && questionsQuery.error && (
            <ErrorState error={questionsQuery.error} onRetry={() => questionsQuery.refetch()} />
          )}

          {planoId != null && !questionsQuery.isLoading && !questionsQuery.error && list.length === 0 && (
            <EmptyState
              icon={ListChecks}
              title={
                topicId != null
                  ? "Nenhuma questão neste assunto ainda"
                  : subjectId != null
                  ? "Nenhuma questão nesta matéria ainda"
                  : "Nenhuma questão neste plano ainda"
              }
              description="Escolha a forma mais fácil e rápida para cadastrar suas questões:"
              action={
                <div className="flex flex-wrap justify-center gap-2.5 max-w-lg mt-1">
                  <Button
                    size="sm"
                    className="gap-1.5 bg-study hover:bg-study/90 text-white font-semibold shadow-xs"
                    onClick={() => handleOpenAction("colar")}
                  >
                    <ClipboardPaste className="size-4" /> Colar Texto Rápido
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-study/40 text-study hover:bg-study/10"
                    onClick={() => handleOpenAction("ia")}
                  >
                    <Sparkles className="size-4" /> Gerar com IA
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenAction("manual")}
                    className="gap-1.5"
                  >
                    <Plus className="size-4" /> Nova Manual
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenAction("pdf")}
                    className="gap-1.5"
                  >
                    <FileUp className="size-4" /> Importar de PDF
                  </Button>
                </div>
              }
            />
          )}

          {planoId != null && !questionsQuery.isLoading && list.length > 0 && (
            <>
              {/* Barra de Ações com Ferramentas Rápidas */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-3 rounded-xl border border-border/80 shadow-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="info">{list.length} questão(ões)</Badge>
                  <span className="text-xs text-muted-foreground font-medium truncate max-w-md">
                    {topicId != null
                      ? activeTopic?.nome
                      : subjectId != null
                      ? `${activeSubject?.nome} • Todos os assuntos (Geral)`
                      : `${activePlano?.nome ?? "Plano"} • Todas as matérias (Geral)`}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    className="gap-1.5 bg-study/90 hover:bg-study text-white font-semibold text-xs"
                    onClick={() => handleOpenAction("colar")}
                  >
                    <ClipboardPaste className="size-3.5" /> Colar Rápido
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-study/40 text-study hover:bg-study/10 text-xs"
                    onClick={() => handleOpenAction("ia")}
                  >
                    <Sparkles className="size-3.5" /> Gerar IA
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => handleOpenAction("manual")}
                  >
                    <Plus className="size-3.5" /> Manual
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => handleOpenAction("pdf")}
                  >
                    <FileUp className="size-3.5" /> PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-1.5 text-xs font-semibold"
                    onClick={() => setMode("resolve")}
                  >
                    <Play className="size-3.5" /> Treinar ({list.length})
                  </Button>
                </div>
              </div>

              {/* Lista de Questões Cadastradas */}
              <div className="flex flex-col gap-2">
                {list.map((q, i) => {
                  const isCE =
                    q.alternativas.length === 2 &&
                    q.alternativas.some((a) => a.trim().toLowerCase() === "certo") &&
                    q.alternativas.some((a) => a.trim().toLowerCase() === "errado");

                  return (
                    <Card key={q.id} className="flex items-center gap-3 p-3.5 transition-all hover:border-border">
                      <span className="text-xs font-semibold text-muted-foreground shrink-0">#{i + 1}</span>

                      <div className="flex flex-1 flex-col min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{q.enunciado}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
                          {q.subjectNome && (
                            <Badge variant="default" className="text-[10px] font-normal py-0 px-1.5">
                              {q.subjectNome}
                            </Badge>
                          )}
                          {q.topicNome && (
                            <Badge variant="default" className="text-[10px] font-normal py-0 px-1.5">
                              {q.topicNome}
                            </Badge>
                          )}
                          {q.banca && <span>{q.banca}</span>}
                          {q.ano && <span>• {q.ano}</span>}
                          <span>• {isCE ? "Certo/Errado" : `${q.alternativas.length} alts`}</span>
                          {q.gabarito && (
                            <span className="text-emerald-400 font-semibold">
                              • Gab: {q.gabarito}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          aria-label="Editar questão"
                          onClick={() => {
                            setEditing(q);
                            setTargetTopicForAction(q.topicId);
                            setFormOpen(true);
                          }}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground"
                          title="Editar questão"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          aria-label="Excluir questão"
                          onClick={() => setDeleting(q)}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          title="Excluir questão"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* Modal: Escolher Destino quando em modo Geral */}
      <Dialog
        open={Boolean(chooseDestinoOpen)}
        onClose={() => setChooseDestinoOpen(null)}
        title="Onde deseja salvar as novas questões?"
        description="Escolha a matéria e o assunto para vincular suas questões."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setChooseDestinoOpen(null)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={confirmDestinoAndOpen}>
              Continuar
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <SearchableSelect
            label="Matéria"
            value={chosenSubjectId}
            onChange={(val) => {
              setChosenSubjectId(val);
              setChosenTopicId(null);
            }}
            options={(subjects.data ?? []).map((s) => ({
              value: s.id,
              label: s.nome,
              
            }))}
            placeholder="Selecione uma matéria…"
            searchPlaceholder="Buscar matéria..."
            modalTitle="Selecionar Matéria de Destino"
          />

          <SearchableSelect
            label="Assunto"
            value={chosenTopicId}
            disabled={chosenSubjectId == null}
            onChange={(val) => setChosenTopicId(val)}
            options={(chosenSubjectTopics.data ?? []).map((t) => ({
              value: t.id,
              label: t.nome,
            }))}
            placeholder={chosenSubjectId == null ? "Escolha uma matéria primeiro" : "Selecione um assunto…"}
            searchPlaceholder="Buscar assunto..."
            modalTitle="Selecionar Assunto de Destino"
          />
        </div>
      </Dialog>

      {/* Modal 1: Formulário Manual */}
      {targetTopicForAction != null && (
        <QuestaoForm
          key={editing?.id ?? "new"}
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            qc.invalidateQueries({ queryKey: ["questions-aggregate"] });
          }}
          topicId={targetTopicForAction}
          question={editing}
        />
      )}

      {/* Modal 2: Colar Texto Rápido */}
      {targetTopicForAction != null && (
        <ColarTextoRapidoDialog
          open={colarOpen}
          onClose={() => {
            setColarOpen(false);
            qc.invalidateQueries({ queryKey: ["questions-aggregate"] });
          }}
          topicId={targetTopicForAction}
          topicName={targetTopicName}
        />
      )}

      {/* Modal 3: Gerar Questões Inéditas com IA */}
      {targetTopicForAction != null && (
        <GerarQuestoesIaDialog
          open={gerarIaOpen}
          onClose={() => {
            setGerarIaOpen(false);
            qc.invalidateQueries({ queryKey: ["questions-aggregate"] });
          }}
          topicId={targetTopicForAction}
          topicName={targetTopicName}
          subjectName={targetSubjectName}
        />
      )}

      {/* Modal 4: Importar de PDF */}
      {targetTopicForAction != null && (
        <ImportarPdfDialog
          open={importOpen}
          onClose={() => {
            setImportOpen(false);
            qc.invalidateQueries({ queryKey: ["questions-aggregate"] });
          }}
          topicId={targetTopicForAction}
        />
      )}

      {/* Diálogo de Confirmação de Exclusão */}
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        title="Excluir questão?"
        description="Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        loading={remove.isPending}
      />
    </AppShell>
  );
}
