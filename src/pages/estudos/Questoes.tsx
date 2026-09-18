import { isGabaritoMatch, formatGabaritoDisplay } from "@/lib/gabaritoUtils";
import { saveCadernoNote } from "@/lib/cadernoNotesStorage";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAiChat } from "@/contexts/AiChatContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardPaste,
  FileUp,
  Hash,
  Layers,
  ListChecks,
  ListFilter,
  MessageCircleQuestion,
  NotebookPen,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { api, errorReasonLabel, type ErrorReason, type Question, type Topic } from "@/lib/api";
import { classifyQuestions, type ClassifiedQuestion } from "@/lib/questionClassifier";
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
import { Input } from "@/components/ui/Input";
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
    onSuccess: (createdError) => {
      if (createdError && createdError.id) {
        saveCadernoNote({
          errorId: createdError.id,
          questionId,
          resumoRegra: observacoes.trim() || undefined,
          comoNaoErrar: `Motivo selecionado: ${errorReasonLabel[motivo]}`,
          atualizadoEm: new Date().toISOString(),
        });
      }
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

interface AnswerRecord {
  selected: string;
  submitted: boolean;
  isCorrect: boolean;
  lastAnswerId: number | null;
}

function ResolverQuestoes({
  questions,
  onExit,
  sessionTitle,
}: {
  questions: Question[];
  onExit: () => void;
  sessionTitle?: string;
}) {
  const { toast } = useToast();
  const { openChat } = useAiChat();

  const [index, setIndex] = useState(0);
  const [answersState, setAnswersState] = useState<Record<number, AnswerRecord>>({});
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [showFinishedSummary, setShowFinishedSummary] = useState(false);

  // Normaliza questões para garantir numeração e matéria legíveis
  const classifiedQuestions = useMemo(() => classifyQuestions(questions), [questions]);
  const currentClassified = classifiedQuestions[index];
  const question = currentClassified?.raw;

  const currentAnswer = question ? answersState[question.id] : undefined;
  const selected = currentAnswer?.selected ?? null;
  const submitted = currentAnswer?.submitted ?? false;

  const answerMutation = useMutation({
    mutationFn: (respostaEscolhida: string) =>
      api.submitAnswer({ questionId: question.id, respostaEscolhida }),
    onSuccess: (res) => {
      const isCorrect = isGabaritoMatch(selected, question.gabarito, question.alternativas);
      setAnswersState((prev) => ({
        ...prev,
        [question.id]: {
          selected: selected!,
          submitted: true,
          isCorrect,
          lastAnswerId: res.id,
        },
      }));
    },
    onError: () => toast("Não consegui registrar sua resposta — tente de novo.", "error"),
  });

  const handleSelectOption = (alt: string) => {
    if (submitted) return;
    setAnswersState((prev) => ({
      ...prev,
      [question.id]: {
        selected: alt,
        submitted: false,
        isCorrect: false,
        lastAnswerId: prev[question.id]?.lastAnswerId ?? null,
      },
    }));
  };

  const handleSubmit = () => {
    if (!selected || submitted) return;
    answerMutation.mutate(selected);
  };

  function optionState(alt: string): QuestionOptionState {
    if (!submitted) return selected === alt ? "selected" : "idle";
    const isGabarito = isGabaritoMatch(alt, question.gabarito, question.alternativas);
    if (isGabarito) return "correct";
    if (selected === alt) return "incorrect";
    return "idle";
  }

  const answeredCount = Object.values(answersState).filter((a) => a.submitted).length;
  const correctCount = Object.values(answersState).filter((a) => a.submitted && a.isCorrect).length;
  const incorrectCount = answeredCount - correctCount;
  const percentualAcerto = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  function handleNext() {
    if (index + 1 >= questions.length) {
      setShowFinishedSummary(true);
      return;
    }
    setIndex((i) => i + 1);
  }

  function handlePrev() {
    if (index > 0) {
      setIndex((i) => i - 1);
    }
  }

  function handleJump(targetIndex: number) {
    if (targetIndex >= 0 && targetIndex < questions.length) {
      setIndex(targetIndex);
    }
  }

  // Estatísticas por matéria ao finalizar
  const subjectBreakdown = useMemo(() => {
    const map = new Map<string, { total: number; correct: number; incorrect: number }>();
    classifiedQuestions.forEach((cq) => {
      const rec = answersState[cq.raw.id];
      const entry = map.get(cq.subject) || { total: 0, correct: 0, incorrect: 0 };
      entry.total += 1;
      if (rec?.submitted) {
        if (rec.isCorrect) entry.correct += 1;
        else entry.incorrect += 1;
      }
      map.set(cq.subject, entry);
    });
    return Array.from(map.entries()).map(([name, stats]) => ({
      name,
      ...stats,
      percent: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    }));
  }, [classifiedQuestions, answersState]);

  const wrongQuestionIds = useMemo(() => {
    return classifiedQuestions
      .filter((cq) => answersState[cq.raw.id]?.submitted && !answersState[cq.raw.id]?.isCorrect)
      .map((cq) => cq.raw.id);
  }, [classifiedQuestions, answersState]);

  const handleRestartErrorsOnly = () => {
    if (wrongQuestionIds.length === 0) return;
    setAnswersState((prev) => {
      const next = { ...prev };
      wrongQuestionIds.forEach((id) => delete next[id]);
      return next;
    });
    const firstWrongIdx = classifiedQuestions.findIndex((cq) => wrongQuestionIds.includes(cq.raw.id));
    setIndex(firstWrongIdx >= 0 ? firstWrongIdx : 0);
    setShowFinishedSummary(false);
  };

  const handleRestartFull = () => {
    setAnswersState({});
    setIndex(0);
    setShowFinishedSummary(false);
  };

  if (!question) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <p className="text-sm font-medium text-foreground">Nenhuma questão disponível.</p>
        <Button size="sm" onClick={onExit}>
          Voltar
        </Button>
      </Card>
    );
  }

  const acertou = submitted && currentAnswer?.isCorrect;

  // TELA DE RELATÓRIO / RESUMO FINAL
  if (showFinishedSummary) {
    return (
      <div className="flex flex-col gap-5 max-w-3xl mx-auto w-full">
        <Card className="flex flex-col gap-6 p-6 border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-border/80">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-study/15 p-3 text-study">
                <Trophy className="size-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Treino Concluído!</h3>
                <p className="text-xs text-muted-foreground">
                  {sessionTitle || "Sessão de prática finalizada com sucesso."}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onExit} className="gap-1.5">
              <ArrowLeft className="size-4" /> Voltar para Questões
            </Button>
          </div>

          {/* Métricas Principais */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-surface-raised border border-border text-center">
              <span className="text-2xl font-black text-foreground">{questions.length}</span>
              <span className="text-xs text-muted-foreground mt-0.5">Questões Totais</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {correctCount}
              </span>
              <span className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                Acertos
              </span>
            </div>
            <div className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
              <span className="text-2xl font-black text-destructive">{incorrectCount}</span>
              <span className="text-xs text-destructive/80 mt-0.5">Erros</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-study/10 border border-study/20 text-center">
              <span className="text-2xl font-black text-study">{percentualAcerto}%</span>
              <span className="text-xs text-study/80 mt-0.5">Aproveitamento</span>
            </div>
          </div>

          {/* Desempenho por Matéria */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Desempenho por Matéria
            </h4>
            <div className="flex flex-col gap-2">
              {subjectBreakdown.map((sb) => (
                <div
                  key={sb.name}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-raised border border-border/80 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="info" className="text-[11px] font-medium shrink-0">
                      {sb.name}
                    </Badge>
                    <span className="text-muted-foreground truncate">
                      {sb.correct} acertos de {sb.total} questões
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`font-bold ${
                        sb.percent >= 70
                          ? "text-emerald-500"
                          : sb.percent >= 50
                          ? "text-amber-500"
                          : "text-destructive"
                      }`}
                    >
                      {sb.percent}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navegador das Questões Feitas */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Revisar Questões Desta Sessão:</span>
            <div className="flex flex-wrap gap-1.5">
              {classifiedQuestions.map((cq, i) => {
                const rec = answersState[cq.raw.id];
                const isCor = rec?.submitted && rec.isCorrect;
                const isErr = rec?.submitted && !rec.isCorrect;
                return (
                  <button
                    key={cq.raw.id}
                    onClick={() => {
                      setIndex(i);
                      setShowFinishedSummary(false);
                    }}
                    className={`h-8 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all ${
                      isCor
                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : isErr
                        ? "bg-destructive/15 border-destructive/30 text-destructive"
                        : "bg-surface-raised border-border text-muted-foreground"
                    }`}
                  >
                    {isCor ? <Check className="size-3" /> : isErr ? <XCircle className="size-3" /> : null}
                    <span>#{cq.numero}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
            <Button variant="ghost" size="sm" onClick={onExit}>
              <ArrowLeft className="size-4" /> Sair para a Lista
            </Button>
            <div className="flex flex-wrap gap-2">
              {wrongQuestionIds.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRestartErrorsOnly}
                  className="border-destructive/40 text-destructive hover:bg-destructive/10 gap-1.5"
                >
                  <RotateCcw className="size-3.5" /> Refazer apenas os {wrongQuestionIds.length} erros
                </Button>
              )}
              <Button size="sm" onClick={handleRestartFull} className="gap-1.5">
                <RefreshCw className="size-3.5" /> Refazer este treino ({questions.length})
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // TELA PRINCIPAL DE RESOLUÇÃO
  return (
    <div className="flex flex-col gap-4 max-w-4xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={onExit} className="gap-1.5 text-xs text-muted-foreground">
          <ArrowLeft className="size-4" /> Sair do treino
        </Button>

        <div className="flex items-center gap-2 text-xs">
          {sessionTitle && (
            <span className="hidden sm:inline font-semibold text-foreground truncate max-w-xs">
              {sessionTitle}
            </span>
          )}
          <span className="text-muted-foreground font-medium">
            Questão <strong>{index + 1}</strong> de <strong>{questions.length}</strong>
          </span>
          {answeredCount > 0 && (
            <Badge variant="default" className="text-[11px] font-semibold">
              Acertos: {correctCount}/{answeredCount} ({percentualAcerto}%)
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFinishedSummary(true)}
            className="text-xs h-7 px-2"
          >
            Finalizar
          </Button>
        </div>
      </div>

      <ProgressBar
        value={answeredCount}
        max={questions.length}
        accent="var(--study)"
      />

      {/* Navegador Direto de Questões (Mapa de Questões) */}
      <div className="flex flex-col gap-2 rounded-xl border border-border/90 bg-surface p-3 shadow-xs">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Hash className="size-3.5 text-study" />
            <span className="font-semibold text-foreground">Mapa de Questões:</span>
            <span>Clique para ir direto a qualquer número</span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {answeredCount}/{questions.length} respondidas
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-thin">
          {classifiedQuestions.map((cq, i) => {
            const qAns = answersState[cq.raw.id];
            const isCurrent = i === index;
            const isAnswered = qAns?.submitted;
            const isCorrect = qAns?.isCorrect;

            return (
              <button
                key={cq.raw.id}
                type="button"
                onClick={() => handleJump(i)}
                title={`Questão #${cq.numero} (${cq.subject}) - ${
                  !isAnswered ? "Não respondida" : isCorrect ? "Acertou" : "Errou"
                }`}
                className={`h-8 min-w-8 px-2 rounded-lg text-xs font-semibold shrink-0 transition-all flex items-center justify-center gap-1 border ${
                  isCurrent
                    ? "ring-2 ring-study border-study bg-study/15 text-study font-bold shadow-xs"
                    : isAnswered
                    ? isCorrect
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : "bg-destructive/15 border-destructive/30 text-destructive"
                    : "bg-surface-raised/60 border-border text-muted-foreground hover:text-foreground hover:bg-surface-raised"
                }`}
              >
                {isAnswered && (
                  isCorrect ? (
                    <Check className="size-3 shrink-0" />
                  ) : (
                    <XCircle className="size-3 shrink-0" />
                  )
                )}
                <span>#{cq.numero}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cartão da Questão Atual */}
      <Card className="flex flex-col gap-4 p-4 sm:p-5 border-border">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <Badge variant="default" className="text-xs font-bold px-2 py-0.5 bg-study/15 border-study/30 text-study">
              Questão #{currentClassified.numero}
            </Badge>
            <Badge variant="info" className="text-xs font-semibold px-2 py-0.5">
              {currentClassified.subject}
            </Badge>
            {question.topicNome && (
              <Badge variant="default" className="text-[11px] font-normal">
                {question.topicNome}
              </Badge>
            )}
            {question.banca && <Badge>{question.banca}</Badge>}
            {question.ano && <Badge>{question.ano}</Badge>}
            {question.dificuldade && <Badge variant="info">{question.dificuldade}</Badge>}
          </div>

          <span className="text-xs text-muted-foreground">
            Item {index + 1} de {questions.length}
          </span>
        </div>

        <p className="text-sm sm:text-base leading-relaxed text-foreground whitespace-pre-wrap font-normal">
          {question.enunciado}
        </p>

        <div className="flex flex-col gap-2 mt-1">
          {question.alternativas.map((alt, i) => (
            <QuestionOption
              key={i}
              letter={LETTERS[i]}
              text={alt}
              state={optionState(alt)}
              disabled={submitted}
              onClick={() => handleSelectOption(alt)}
            />
          ))}
        </div>

        {submitted && (
          <div
            className={`rounded-xl border p-4 text-sm ${
              acertou
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-destructive/40 bg-destructive/10 text-destructive"
            }`}
          >
            <p className="font-bold flex items-center gap-2 text-base">
              {acertou ? (
                <>
                  <CheckCircle2 className="size-5 text-emerald-500" /> Você acertou!
                </>
              ) : (
                <>
                  <XCircle className="size-5 text-destructive" /> Você errou.
                </>
              )}
            </p>
            {!acertou && (
              <p className="mt-1 text-foreground">
                Gabarito oficial:{" "}
                <strong className="text-foreground font-semibold">
                  {formatGabaritoDisplay(question.gabarito, question.alternativas)}
                </strong>
              </p>
            )}
            {question.explicacao && (
              <div className="mt-2.5 pt-2.5 border-t border-border/60">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Explicação / Fundamentação:
                </span>
                <p className="leading-relaxed text-foreground text-xs sm:text-sm whitespace-pre-wrap">
                  {question.explicacao}
                </p>
              </div>
            )}
            {!acertou && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-destructive/40 text-destructive hover:bg-destructive/10 text-xs"
                  onClick={() => setErrorDialogOpen(true)}
                >
                  <NotebookPen className="size-3.5" /> Registrar no caderno de erros
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
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

        {/* Rodapé de Navegação */}
        <div className="flex items-center justify-between pt-2 border-t border-border/80">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            disabled={index === 0}
            className="gap-1.5 text-xs"
          >
            <ArrowLeft className="size-3.5" /> Anterior
          </Button>

          <div className="flex items-center gap-2">
            {!submitted ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNext}
                  disabled={index + 1 >= questions.length}
                  className="text-xs text-muted-foreground"
                >
                  Pular <ChevronRight className="size-3.5" />
                </Button>
                <Button
                  disabled={!selected}
                  loading={answerMutation.isPending}
                  onClick={handleSubmit}
                  size="sm"
                  className="text-xs font-semibold px-4"
                >
                  Responder
                </Button>
              </>
            ) : (
              <Button onClick={handleNext} size="sm" className="gap-1.5 text-xs font-semibold">
                {index + 1 >= questions.length ? "Ver Resultados" : "Próxima Questão"}
                <ArrowRight className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      <RegistrarErroDialog
        key={question.id}
        open={errorDialogOpen}
        onClose={() => setErrorDialogOpen(false)}
        questionId={question.id}
        answerId={currentAnswer?.lastAnswerId ?? null}
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

  // Estados de Classificação, Filtragem e Busca
  const [selectedMateriaFilter, setSelectedMateriaFilter] = useState<string>("TODAS");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<"numero-asc" | "numero-desc" | "original" | "materia">("numero-asc");

  // Sessão de Treino Personalizado (ex: 10 questões de Raciocínio Lógico)
  const [trainConfigOpen, setTrainConfigOpen] = useState(false);
  const [trainMateria, setTrainMateria] = useState<string>("TODAS");
  const [trainCount, setTrainCount] = useState<number>(10);
  const [trainOrder, setTrainOrder] = useState<"sequential" | "random">("sequential");

  const [activeTrainingQuestions, setActiveTrainingQuestions] = useState<Question[] | null>(null);
  const [activeTrainingTitle, setActiveTrainingTitle] = useState<string>("");

  // Classifica questões para garantir que tenham número e matéria claros
  const classifiedList = useMemo(() => classifyQuestions(list), [list]);

  // Lista agregada de matérias distintas encontradas nas questões
  const distinctSubjects = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of classifiedList) {
      counts.set(item.subject, (counts.get(item.subject) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [classifiedList]);

  // Lista filtrada e ordenada para exibição na página
  const filteredList = useMemo(() => {
    let result = [...classifiedList];

    // 1. Filtro por matéria
    if (selectedMateriaFilter !== "TODAS") {
      result = result.filter(
        (item) => item.subject.toLowerCase() === selectedMateriaFilter.toLowerCase()
      );
    }

    // 2. Busca por número (#10, 10) ou texto
    if (searchQuery.trim()) {
      const qTrim = searchQuery.trim().toLowerCase();
      const numSearch = qTrim.replace(/^#/, "").trim();
      const isNum = /^\d+$/.test(numSearch);
      const targetNum = isNum ? parseInt(numSearch, 10) : null;

      result = result.filter((item) => {
        if (targetNum !== null && item.numero === targetNum) return true;
        return (
          item.raw.enunciado.toLowerCase().includes(qTrim) ||
          item.subject.toLowerCase().includes(qTrim) ||
          (item.raw.banca && item.raw.banca.toLowerCase().includes(qTrim)) ||
          (item.raw.ano && String(item.raw.ano).includes(qTrim))
        );
      });
    }

    // 3. Ordenação
    if (sortOption === "numero-asc") {
      result.sort((a, b) => a.numero - b.numero);
    } else if (sortOption === "numero-desc") {
      result.sort((a, b) => b.numero - a.numero);
    } else if (sortOption === "materia") {
      result.sort((a, b) => a.subject.localeCompare(b.subject) || a.numero - b.numero);
    }

    return result;
  }, [classifiedList, selectedMateriaFilter, searchQuery, sortOption]);

  const startTrainingSession = (
    materia: string | "TODAS",
    count: number,
    order: "sequential" | "random"
  ) => {
    let pool =
      materia === "TODAS"
        ? [...classifiedList]
        : classifiedList.filter((item) => item.subject.toLowerCase() === materia.toLowerCase());

    if (order === "sequential") {
      pool.sort((a, b) => a.numero - b.numero);
    } else {
      pool.sort(() => Math.random() - 0.5);
    }

    const safeCount = Math.min(Math.max(1, count), pool.length);
    const selected = pool.slice(0, safeCount).map((item) => item.raw);

    if (selected.length === 0) {
      toast("Nenhuma questão encontrada para este filtro.", "error");
      return;
    }

    setActiveTrainingQuestions(selected);
    setActiveTrainingTitle(
      materia === "TODAS"
        ? `Treino Geral • ${selected.length} questões`
        : `Treino de ${materia} • ${selected.length} questões`
    );
    setMode("resolve");
    setTrainConfigOpen(false);
  };

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

      {mode === "resolve" && (
        <>
          {questionsQuery.isLoading && <Loading label="Carregando questões para o treino…" />}
          {questionsQuery.error && (
            <ErrorState error={questionsQuery.error} onRetry={() => questionsQuery.refetch()} />
          )}
          {!questionsQuery.isLoading && !questionsQuery.error && (activeTrainingQuestions || list).length === 0 && (
            <Card className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <ListChecks className="size-10 text-muted-foreground/50" />
              <p className="text-sm font-semibold text-foreground">
                Nenhuma questão cadastrada para treinar neste filtro
              </p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Cadastre questões nesta matéria/assunto ou selecione outro plano para resolver.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveTrainingQuestions(null);
                  setMode("list");
                }}
                className="mt-2"
              >
                <ArrowLeft className="size-4" /> Voltar para a lista
              </Button>
            </Card>
          )}
          {!questionsQuery.isLoading && (activeTrainingQuestions || list).length > 0 && (
            <ResolverQuestoes
              questions={activeTrainingQuestions || list}
              onExit={() => {
                setActiveTrainingQuestions(null);
                setMode("list");
              }}
              sessionTitle={activeTrainingTitle}
            />
          )}
        </>
      )}

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
            <div className="flex flex-col gap-4">
              {/* Barra Superior de Ações e Treino Rápido */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-surface p-4 rounded-xl border border-border/80 shadow-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="info" className="font-bold">
                    {list.length} questão(ões) totais
                  </Badge>
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
                    variant="outline"
                    className="gap-1.5 text-xs"
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

                  {/* Botões Principais de Treino */}
                  <Button
                    size="sm"
                    className="gap-1.5 bg-study hover:bg-study/90 text-white font-semibold text-xs shadow-xs"
                    onClick={() => {
                      if (selectedMateriaFilter !== "TODAS") {
                        startTrainingSession(selectedMateriaFilter, Math.min(10, filteredList.length), "sequential");
                      } else {
                        setTrainMateria("TODAS");
                        setTrainCount(Math.min(10, classifiedList.length));
                        setTrainConfigOpen(true);
                      }
                    }}
                  >
                    <Play className="size-3.5" />
                    {selectedMateriaFilter !== "TODAS"
                      ? `Treinar 10 de ${selectedMateriaFilter}`
                      : `Treinar (${Math.min(10, classifiedList.length)} questões)`}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-xs border-study/40 text-study hover:bg-study/10"
                    title="Configurar quantidade e matéria do treino"
                    onClick={() => {
                      setTrainMateria(selectedMateriaFilter);
                      setTrainCount(10);
                      setTrainConfigOpen(true);
                    }}
                  >
                    <SlidersHorizontal className="size-3.5" />
                    <span className="hidden sm:inline">Personalizar</span>
                  </Button>
                </div>
              </div>

              {/* Filtro Rápido por Matéria (Pills) */}
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-surface p-3.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListFilter className="size-4 text-study" />
                    <span className="text-xs font-bold text-foreground">Filtrar por Matéria:</span>
                  </div>
                  {selectedMateriaFilter !== "TODAS" && (
                    <button
                      onClick={() => setSelectedMateriaFilter("TODAS")}
                      className="text-xs text-study hover:underline font-semibold"
                    >
                      Limpar filtro (Ver todas)
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedMateriaFilter("TODAS")}
                    className={`h-8 px-3 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
                      selectedMateriaFilter === "TODAS"
                        ? "bg-study text-white font-bold border-study shadow-xs"
                        : "bg-surface-raised border-border text-muted-foreground hover:text-foreground hover:border-border/80"
                    }`}
                  >
                    <span>Todas as matérias</span>
                    <span
                      className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                        selectedMateriaFilter === "TODAS"
                          ? "bg-white/20 text-white font-bold"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {classifiedList.length}
                    </span>
                  </button>

                  {distinctSubjects.map((sub) => {
                    const isSelected = selectedMateriaFilter.toLowerCase() === sub.name.toLowerCase();
                    return (
                      <button
                        key={sub.name}
                        type="button"
                        onClick={() => setSelectedMateriaFilter(sub.name)}
                        className={`h-8 px-3 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
                          isSelected
                            ? "bg-study text-white font-bold border-study shadow-xs"
                            : "bg-surface-raised border-border text-muted-foreground hover:text-foreground hover:border-border/80"
                        }`}
                      >
                        <span>{sub.name}</span>
                        <span
                          className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                            isSelected
                              ? "bg-white/20 text-white font-bold"
                              : "bg-muted text-muted-foreground font-semibold"
                          }`}
                        >
                          {sub.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Barra de Busca por Número/Texto e Ordenação */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-3 rounded-xl border border-border/80 shadow-xs">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por nº (#1, 10), matéria ou palavra..."
                    className="pl-9 h-9 text-xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                    <ArrowUpDown className="size-3.5" />
                    <span>Ordenar:</span>
                  </div>
                  <Select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as any)}
                    className="h-9 text-xs w-48"
                  >
                    <option value="numero-asc">Nº Crescente (#1 → #40)</option>
                    <option value="numero-desc">Nº Decrescente (#40 → #1)</option>
                    <option value="materia">Por Matéria</option>
                  </Select>

                  <Badge variant="default" className="text-xs shrink-0">
                    {filteredList.length} de {classifiedList.length}
                  </Badge>
                </div>
              </div>

              {/* Lista de Questões Filtradas */}
              {filteredList.length === 0 ? (
                <Card className="flex flex-col items-center justify-center gap-2.5 py-10 text-center border-dashed">
                  <Search className="size-8 text-muted-foreground/40" />
                  <p className="text-sm font-semibold text-foreground">
                    Nenhuma questão encontrada com estes filtros
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    Tente limpar a busca ou selecionar outra matéria para visualizar as questões.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedMateriaFilter("TODAS");
                      setSearchQuery("");
                    }}
                    className="mt-1 text-xs"
                  >
                    Limpar Filtros
                  </Button>
                </Card>
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredList.map((cq) => {
                    const q = cq.raw;
                    const isCE =
                      q.alternativas.length === 2 &&
                      q.alternativas.some((a) => a.trim().toLowerCase() === "certo") &&
                      q.alternativas.some((a) => a.trim().toLowerCase() === "errado");

                    return (
                      <Card
                        key={q.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 transition-all hover:border-border/90 border-border"
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          {/* Número da questão em destaque */}
                          <div className="flex flex-col items-center justify-center shrink-0 w-11 h-11 rounded-xl bg-study/10 border border-study/20 text-study">
                            <span className="text-[10px] uppercase font-bold leading-none text-muted-foreground">
                              Nº
                            </span>
                            <span className="text-sm font-black leading-tight mt-0.5">
                              {cq.numero}
                            </span>
                          </div>

                          <div className="flex flex-1 flex-col min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <Badge variant="info" className="text-[11px] font-semibold py-0 px-2">
                                {cq.subject}
                              </Badge>
                              {q.topicNome && (
                                <Badge variant="default" className="text-[10px] font-normal py-0 px-1.5">
                                  {q.topicNome}
                                </Badge>
                              )}
                              {q.banca && <Badge className="text-[10px] py-0">{q.banca}</Badge>}
                              {q.ano && <Badge className="text-[10px] py-0">{q.ano}</Badge>}
                              <span className="text-[11px] text-muted-foreground">
                                • {isCE ? "Certo/Errado" : `${q.alternativas.length} alts`}
                              </span>
                              {q.gabarito && (
                                <span className="text-[11px] text-emerald-500 font-semibold">
                                  • Gab: {q.gabarito}
                                </span>
                              )}
                            </div>

                            <p className="line-clamp-2 text-xs sm:text-sm font-medium text-foreground leading-relaxed">
                              {q.enunciado}
                            </p>
                          </div>
                        </div>

                        {/* Botões de Ação na Linha da Questão */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2.5 text-xs text-study hover:bg-study/10 gap-1 font-semibold"
                            title="Resolver esta questão individualmente"
                            onClick={() => {
                              setActiveTrainingQuestions([q]);
                              setActiveTrainingTitle(`Questão #${cq.numero} • ${cq.subject}`);
                              setMode("resolve");
                            }}
                          >
                            <Play className="size-3.5" /> Resolver
                          </Button>
                          <button
                            aria-label="Editar questão"
                            onClick={() => {
                              setEditing(q);
                              setTargetTopicForAction(q.topicId);
                              setFormOpen(true);
                            }}
                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground"
                            title="Editar questão e número"
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
              )}
            </div>
          )}
        </>
      )}

      {/* Diálogo de Treino Personalizado (ex: 10 questões de Raciocínio Lógico) */}
      <Dialog
        open={trainConfigOpen}
        onClose={() => setTrainConfigOpen(false)}
        title="Personalizar Treino de Questões"
        description="Escolha a matéria, quantidade de questões e modo de estudo que deseja realizar hoje."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setTrainConfigOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              className="bg-study hover:bg-study/90 text-white font-semibold gap-1.5"
              onClick={() => startTrainingSession(trainMateria, trainCount, trainOrder)}
            >
              <Play className="size-3.5" /> Começar Treino
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 py-1">
          {/* Matéria */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-foreground">Matéria:</label>
            <Select
              value={trainMateria}
              onChange={(e) => {
                const val = e.target.value;
                setTrainMateria(val);
                // Se a quantidade atual for maior que as questões dessa matéria, ajusta
                const maxAvailable =
                  val === "TODAS"
                    ? classifiedList.length
                    : classifiedList.filter((item) => item.subject.toLowerCase() === val.toLowerCase()).length;
                if (trainCount > maxAvailable && maxAvailable > 0) {
                  setTrainCount(Math.min(10, maxAvailable));
                }
              }}
              className="text-xs"
            >
              <option value="TODAS">Todas as Matérias ({classifiedList.length} questões)</option>
              {distinctSubjects.map((sub) => (
                <option key={sub.name} value={sub.name}>
                  {sub.name} ({sub.count} questões)
                </option>
              ))}
            </Select>
          </div>

          {/* Quantidade de Questões */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground">
                Quantidade de Questões:
              </label>
              <span className="text-xs font-bold text-study">{trainCount} questões</span>
            </div>

            {/* Botões rápidos de quantidade */}
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 20].map((num) => {
                const maxAvailable =
                  trainMateria === "TODAS"
                    ? classifiedList.length
                    : classifiedList.filter(
                        (item) => item.subject.toLowerCase() === trainMateria.toLowerCase()
                      ).length;
                const isSelected = trainCount === num;

                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTrainCount(num)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      isSelected
                        ? "bg-study text-white border-study shadow-xs"
                        : "bg-surface-raised border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {num} questões
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">Ou digite:</span>
              <Input
                type="number"
                min={1}
                max={
                  trainMateria === "TODAS"
                    ? classifiedList.length
                    : classifiedList.filter(
                        (item) => item.subject.toLowerCase() === trainMateria.toLowerCase()
                      ).length || 1
                }
                value={trainCount}
                onChange={(e) => setTrainCount(Math.max(1, Number(e.target.value) || 1))}
                className="h-8 text-xs w-24"
              />
              <button
                type="button"
                onClick={() => {
                  const maxAvailable =
                    trainMateria === "TODAS"
                      ? classifiedList.length
                      : classifiedList.filter(
                          (item) => item.subject.toLowerCase() === trainMateria.toLowerCase()
                        ).length;
                  setTrainCount(maxAvailable);
                }}
                className="text-xs text-study hover:underline font-semibold ml-auto"
              >
                Fazer todas disponíveis
              </button>
            </div>
          </div>

          {/* Ordem de Resolução */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-foreground">Ordem das Questões:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTrainOrder("sequential")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  trainOrder === "sequential"
                    ? "border-study bg-study/10 text-study font-semibold"
                    : "border-border bg-surface-raised text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="block text-xs font-bold">Ordem Numérica</span>
                <span className="block text-[11px] text-muted-foreground mt-0.5">
                  Questão #1, #2, #3 em ordem
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTrainOrder("random")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  trainOrder === "random"
                    ? "border-study bg-study/10 text-study font-semibold"
                    : "border-border bg-surface-raised text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="block text-xs font-bold">Aleatória / Simulada</span>
                <span className="block text-[11px] text-muted-foreground mt-0.5">
                  Embaralhar as questões
                </span>
              </button>
            </div>
          </div>
        </div>
      </Dialog>

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
