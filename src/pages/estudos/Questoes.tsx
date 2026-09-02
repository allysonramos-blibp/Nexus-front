import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  ListChecks,
  MessageCircleQuestion,
  NotebookPen,
  Pencil,
  Plus,
  Trash2,
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
  const [observacao, setObservacao] = useState("");

  const save = useMutation({
    mutationFn: () =>
      api.registerStudyError({ questionId, answerId, motivo, observacao: observacao.trim() || null }),
    onSuccess: () => {
      toast("Adicionado ao caderno de erros.", "success");
      onClose();
    },
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Registrar no caderno de erros"
      description="Ajuda a saber depois em que você mais precisa revisar."
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Agora não
          </Button>
          <Button size="sm" loading={save.isPending} onClick={() => save.mutate()}>
            Registrar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Select label="Motivo do erro" value={motivo} onChange={(e) => setMotivo(e.target.value as ErrorReason)}>
          {ERROR_REASONS.map((r) => (
            <option key={r} value={r}>
              {errorReasonLabel[r]}
            </option>
          ))}
        </Select>
        <Textarea
          label="Observação (opcional)"
          rows={2}
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
        />
        {save.error && <ErrorState error={save.error} compact />}
      </div>
    </Dialog>
  );
}

function ResolverQuestoes({ questions, onExit }: { questions: Question[]; onExit: () => void }) {
  const { toast } = useToast();
  const navigate = useNavigate();
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
                    navigate("/ia", {
                      state: {
                        initialMessage: `Pode me explicar essa questão? "${question.enunciado}" — o gabarito é "${question.gabarito}".`,
                      },
                    })
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
  const [planoId, setPlanoId] = useState<number | null>(null);
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [topicId, setTopicId] = useState<number | null>(null);
  const [mode, setMode] = useState<"list" | "resolve">("list");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [deleting, setDeleting] = useState<Question | null>(null);

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
              description="Cadastre a primeira questão para começar a treinar."
              action={
                <Button
                  size="sm"
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                >
                  <Plus className="size-4" /> Nova questão
                </Button>
              }
            />
          )}
          {!questions.isLoading && list.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{list.length} questão(ões)</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(null);
                      setFormOpen(true);
                    }}
                  >
                    <Plus className="size-4" /> Nova questão
                  </Button>
                  <Button size="sm" onClick={() => setMode("resolve")}>
                    Resolver questões
                  </Button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {list.map((q, i) => (
                  <Card key={q.id} className="flex items-center gap-3 p-4">
                    <span className="text-xs text-muted-foreground">#{i + 1}</span>
                    <p className="flex-1 truncate text-sm text-foreground">{q.enunciado}</p>
                    <button
                      aria-label="Editar questão"
                      onClick={() => {
                        setEditing(q);
                        setFormOpen(true);
                      }}
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      aria-label="Excluir questão"
                      onClick={() => setDeleting(q)}
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </Card>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {topicId != null && mode === "resolve" && list.length > 0 && (
        <ResolverQuestoes questions={list} onExit={() => setMode("list")} />
      )}

      {topicId != null && (
        <QuestaoForm
          key={editing?.id ?? "new"}
          open={formOpen}
          onClose={() => setFormOpen(false)}
          topicId={topicId}
          question={editing}
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
