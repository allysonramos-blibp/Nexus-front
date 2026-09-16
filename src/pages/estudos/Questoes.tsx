import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { api, errorReasonLabel, type ErrorReason, type Question } from "@/lib/api";
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
          <ArrowLeft className="size-4" /> Sair da resolução
        </Button>
        <span className="text-xs text-muted-foreground">
          Questão {index + 1} de {questions.length}
        </span>
      </div>
      <ProgressBar value={index + (submitted ? 1 : 0)} max={questions.length} accent="var(--study)" />

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {question.banca && <Badge>{question.banca}</Badge>}
          {question.ano && <Badge>{question.ano}</Badge>}
          {question.dificuldade && <Badge variant="info">{question.dificuldade}</Badge>}
        </div>
        <p className="text-sm leading-relaxed text-foreground">{question.enunciado}</p>

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
                    openChat(`Pode me explicar essa questão de forma clara e didática? "${question.enunciado}" — o gabarito correto é "${question.gabarito}".`)
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
              {index + 1 >= questions.length ? "Concluir" : "Próxima questão"}
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

  // Consultar detalhes do tópico e matéria para contextualizar IA e Smart Paste
  const topics = useQuery({
    queryKey: ["topics", subjectId],
    queryFn: () => api.listTopics(subjectId!),
    enabled: subjectId != null,
  });

  const subjects = useQuery({
    queryKey: ["subjects", planoId],
    queryFn: () => api.listSubjects(planoId!),
    enabled: planoId != null,
  });

  const activeTopic = topics.data?.find((t) => t.id === topicId);
  const activeSubject = subjects.data?.find((s) => s.id === subjectId);

  const questions = useQuery({
    queryKey: ["questions", topicId],
    queryFn: () => api.listQuestions(topicId!),
    enabled: topicId != null,
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteQuestion(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["questions", topicId] });
      toast("Questão excluída.", "success");
      setDeleting(null);
    },
  });

  const list = questions.data ?? [];

  return (
    <AppShell title="Questões" subtitle="Estudos">
      <EstudosTabs active="questoes" />

      <TopicPicker
        planoId={planoId}
        subjectId={subjectId}
        topicId={topicId}
        onChangePlano={setPlanoId}
        onChangeSubject={setSubjectId}
        onChangeTopic={(id) => {
          setTopicId(id);
          setMode("list");
        }}
      />

      {topicId != null && mode === "list" && (
        <>
          {questions.isLoading && <Loading />}
          {questions.error && (
            <ErrorState error={questions.error} onRetry={() => questions.refetch()} />
          )}

          {!questions.isLoading && !questions.error && list.length === 0 && (
            <EmptyState
              icon={ListChecks}
              title="Nenhuma questão neste assunto ainda"
              description="Escolha a forma mais fácil e rápida para cadastrar suas questões:"
              action={
                <div className="flex flex-wrap justify-center gap-2.5 max-w-lg mt-1">
                  <Button
                    size="sm"
                    className="gap-1.5 bg-study hover:bg-study/90 text-white font-semibold shadow-sm"
                    onClick={() => setColarOpen(true)}
                  >
                    <ClipboardPaste className="size-4" /> Colar Texto Rápido
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-study/40 text-study hover:bg-study/10"
                    onClick={() => setGerarIaOpen(true)}
                  >
                    <Sparkles className="size-4" /> Gerar com IA
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(null);
                      setFormOpen(true);
                    }}
                    className="gap-1.5"
                  >
                    <Plus className="size-4" /> Nova Manual
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setImportOpen(true)}
                    className="gap-1.5"
                  >
                    <FileUp className="size-4" /> Importar de PDF
                  </Button>
                </div>
              }
            />
          )}

          {!questions.isLoading && list.length > 0 && (
            <>
              {/* Barra de Ações com Ferramentas Rápidas */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-3 rounded-xl border border-border/80 shadow-xs">
                <div className="flex items-center gap-2">
                  <Badge variant="info">{list.length} questão(ões)</Badge>
                  {activeTopic && (
                    <span className="text-xs text-muted-foreground hidden sm:inline font-medium truncate max-w-xs">
                      {activeTopic.nome}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    className="gap-1.5 bg-study/90 hover:bg-study text-white font-semibold text-xs"
                    onClick={() => setColarOpen(true)}
                  >
                    <ClipboardPaste className="size-3.5" /> Colar Rápido
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-study/40 text-study hover:bg-study/10 text-xs"
                    onClick={() => setGerarIaOpen(true)}
                  >
                    <Sparkles className="size-3.5" /> Gerar IA
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => {
                      setEditing(null);
                      setFormOpen(true);
                    }}
                  >
                    <Plus className="size-3.5" /> Manual
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => setImportOpen(true)}
                  >
                    <FileUp className="size-3.5" /> PDF
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-1.5 text-xs font-semibold"
                    onClick={() => setMode("resolve")}
                  >
                    <Play className="size-3.5" /> Treinar
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
                    <Card key={q.id} className="flex items-center gap-3 p-3.5">
                      <span className="text-xs font-semibold text-muted-foreground">#{i + 1}</span>
                      <div className="flex flex-1 flex-col min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{q.enunciado}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
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

                      <button
                        aria-label="Editar questão"
                        onClick={() => {
                          setEditing(q);
                          setFormOpen(true);
                        }}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        aria-label="Excluir questão"
                        onClick={() => setDeleting(q)}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {topicId != null && mode === "resolve" && list.length > 0 && (
        <ResolverQuestoes questions={list} onExit={() => setMode("list")} />
      )}

      {/* Modal 1: Formulário Manual (com Modo Certo/Errado e Múltipla Escolha) */}
      {topicId != null && (
        <QuestaoForm
          key={editing?.id ?? "new"}
          open={formOpen}
          onClose={() => setFormOpen(false)}
          topicId={topicId}
          question={editing}
        />
      )}

      {/* Modal 2: Colar Texto Rápido (Smart Paste de sites e apostilas) */}
      {topicId != null && (
        <ColarTextoRapidoDialog
          open={colarOpen}
          onClose={() => setColarOpen(false)}
          topicId={topicId}
          topicName={activeTopic?.nome}
        />
      )}

      {/* Modal 3: Gerar Questões Inéditas com IA */}
      {topicId != null && (
        <GerarQuestoesIaDialog
          open={gerarIaOpen}
          onClose={() => setGerarIaOpen(false)}
          topicId={topicId}
          topicName={activeTopic?.nome}
          subjectName={activeSubject?.nome}
        />
      )}

      {/* Modal 4: Importar de PDF (com Salvar Todas e Filtros) */}
      {topicId != null && (
        <ImportarPdfDialog
          open={importOpen}
          onClose={() => setImportOpen(false)}
          topicId={topicId}
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
