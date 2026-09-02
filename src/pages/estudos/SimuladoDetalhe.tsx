import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bookmark, CheckCircle2, Clock, XCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { api, mockExamStatusLabel } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/ui/ErrorState";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { QuestionOption, type QuestionOptionState } from "@/components/ui/QuestionOption";
import { StatCard } from "@/components/ui/StatCard";

const LETTERS = ["A", "B", "C", "D", "E"];

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function formatDuration(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function useElapsedSeconds(startIso: string | null | undefined, stopIso: string | null | undefined) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startIso || stopIso) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [startIso, stopIso]);

  if (!startIso) return 0;
  const end = stopIso ? new Date(stopIso).getTime() : now;
  return (end - new Date(startIso).getTime()) / 1000;
}

export default function SimuladoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const examId = Number(id);
  const qc = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  const detail = useQuery({
    queryKey: ["mock-exam", examId],
    queryFn: () => api.getMockExam(examId),
    enabled: Number.isFinite(examId),
  });

  // Só busca as respostas dadas quando o simulado já está finalizado — é o que
  // permite mostrar "você marcou X" na revisão (o detalhe do simulado só traz o
  // gabarito, não a resposta escolhida por questão).
  const answers = useQuery({
    queryKey: ["answers"],
    queryFn: api.listAnswers,
    enabled: detail.data?.exam.status === "FINALIZADO",
  });

  const [index, setIndex] = useState(0);
  const [answeredLocal, setAnsweredLocal] = useState<Record<number, string>>({});
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [confirmFinish, setConfirmFinish] = useState(false);

  const start = useMutation({
    mutationFn: () => api.startMockExam(examId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mock-exam", examId] }),
  });

  const answer = useMutation({
    mutationFn: (v: { questionId: number; respostaEscolhida: string }) =>
      api.submitAnswer({ ...v, mockExamId: examId }),
    onSuccess: (_res, v) => setAnsweredLocal((a) => ({ ...a, [v.questionId]: v.respostaEscolhida })),
    onError: () => toast("Não consegui registrar essa resposta — tente de novo.", "error"),
  });

  const finish = useMutation({
    mutationFn: () => api.finishMockExam(examId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mock-exam", examId] });
      qc.invalidateQueries({ queryKey: ["mock-exams"] });
      setConfirmFinish(false);
      toast("Simulado finalizado!", "success");
    },
  });

  const exam = detail.data?.exam;
  const questoes = detail.data?.questoes ?? [];
  const question = questoes[index];

  const elapsed = useElapsedSeconds(exam?.iniciadoEm, exam?.finalizadoEm);
  const limiteSegundos = exam?.duracaoMinutos ? exam.duracaoMinutos * 60 : null;
  const tempoEsgotado = limiteSegundos != null && elapsed >= limiteSegundos;

  const answeredCount = Object.keys(answeredLocal).length;

  // questionId -> resposta escolhida, só disponível depois de finalizado.
  const answersByQuestion = useMemo(() => {
    const map = new Map<number, string>();
    for (const a of answers.data ?? []) {
      if (a.mockExamId === examId) map.set(a.questionId, a.respostaEscolhida);
    }
    return map;
  }, [answers.data, examId]);

  // Desempenho por matéria calculado a partir das próprias questões do simulado +
  // respostas — o backend não expõe estatística por simulado, só global.
  const porMateria = useMemo(() => {
    if (exam?.status !== "FINALIZADO") return [];
    const map = new Map<string, { respondidas: number; acertos: number }>();
    for (const q of questoes) {
      const resposta = answersByQuestion.get(q.id);
      if (resposta == null) continue;
      const entry = map.get(q.subjectNome) ?? { respondidas: 0, acertos: 0 };
      entry.respondidas += 1;
      if (normalize(resposta) === normalize(q.gabarito ?? "")) entry.acertos += 1;
      map.set(q.subjectNome, entry);
    }
    return [...map.entries()].map(([nome, v]) => ({ nome, ...v }));
  }, [exam?.status, questoes, answersByQuestion]);

  function optionState(alt: string): QuestionOptionState {
    if (!question) return "idle";
    const resposta = answeredLocal[question.id];
    const isFinalizado = exam?.status === "FINALIZADO";

    if (isFinalizado) {
      const dada = answersByQuestion.get(question.id);
      const isGabarito = normalize(alt) === normalize(question.gabarito ?? "");
      if (isGabarito) return "correct";
      if (dada && normalize(dada) === normalize(alt)) return "incorrect";
      return "idle";
    }

    return resposta === alt ? "selected" : "idle";
  }

  if (detail.isLoading) {
    return (
      <AppShell title="Simulado" subtitle="Estudos">
        <Loading />
      </AppShell>
    );
  }

  if (detail.error || !exam) {
    return (
      <AppShell title="Simulado" subtitle="Estudos">
        <ErrorState error={detail.error} onRetry={() => detail.refetch()} />
      </AppShell>
    );
  }

  return (
    <AppShell
      title={exam.titulo}
      subtitle="Estudos"
      actions={
        <Link
          to="/estudos/simulados"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Simulados
        </Link>
      }
    >
      {/* CRIADO — ainda não começou */}
      {exam.status === "CRIADO" && (
        <Card className="flex flex-col items-center gap-3 py-10 text-center">
          <Badge variant="info">{mockExamStatusLabel[exam.status]}</Badge>
          <p className="font-display text-lg font-semibold">{exam.totalQuestoes} questões</p>
          <p className="text-sm text-muted-foreground">
            {exam.materias.join(", ")}
            {exam.duracaoMinutos ? ` · ${exam.duracaoMinutos} min` : ""}
          </p>
          <Button loading={start.isPending} onClick={() => start.mutate()} className="mt-2">
            Iniciar simulado
          </Button>
        </Card>
      )}

      {/* EM_ANDAMENTO — execução */}
      {exam.status === "EM_ANDAMENTO" && question && (
        <div className="flex flex-col gap-4">
          <Card className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Clock className={`size-4 ${tempoEsgotado ? "text-destructive" : "text-muted-foreground"}`} />
              <span className={tempoEsgotado ? "font-semibold text-destructive" : "text-muted-foreground"}>
                {limiteSegundos != null
                  ? `${formatDuration(Math.max(0, limiteSegundos - elapsed))} restantes`
                  : `${formatDuration(elapsed)} decorridos`}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {answeredCount} / {questoes.length} respondidas
            </span>
          </Card>
          {tempoEsgotado && (
            <p className="text-xs text-destructive">
              Tempo esgotado — você ainda pode finalizar quando quiser, não é automático.
            </p>
          )}

          <div className="flex flex-wrap gap-1.5">
            {questoes.map((q, i) => {
              const isAnswered = answeredLocal[q.id] != null;
              const isMarked = marked.has(q.id);
              return (
                <button
                  key={q.id}
                  onClick={() => setIndex(i)}
                  aria-label={`Ir para questão ${i + 1}${isAnswered ? ", respondida" : ""}${isMarked ? ", marcada" : ""}`}
                  aria-current={i === index}
                  className={`relative flex size-8 items-center justify-center rounded-lg border text-xs font-semibold transition-colors ${
                    i === index
                      ? "border-dash bg-dash/15 text-dash"
                      : isAnswered
                        ? "border-fin/40 bg-fin/10 text-fin"
                        : "border-border text-muted-foreground hover:border-dash/40"
                  }`}
                >
                  {i + 1}
                  {isMarked && <Bookmark className="absolute -right-1 -top-1 size-3 fill-gym text-gym" />}
                </button>
              );
            })}
          </div>

          <Card className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge>{question.subjectNome}</Badge>
                {question.dificuldade && <Badge variant="info">{question.dificuldade}</Badge>}
              </div>
              <button
                onClick={() =>
                  setMarked((m) => {
                    const next = new Set(m);
                    if (next.has(question.id)) next.delete(question.id);
                    else next.add(question.id);
                    return next;
                  })
                }
                aria-pressed={marked.has(question.id)}
                aria-label="Marcar questão para revisar depois"
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                  marked.has(question.id)
                    ? "border-gym/40 bg-gym/10 text-gym"
                    : "border-border text-muted-foreground hover:border-gym/40"
                }`}
              >
                <Bookmark className="size-3.5" /> Marcar
              </button>
            </div>

            <p className="text-sm leading-relaxed text-foreground">{question.enunciado}</p>

            <div className="flex flex-col gap-2">
              {question.alternativas.map((alt, i) => (
                <QuestionOption
                  key={i}
                  letter={LETTERS[i]}
                  text={alt}
                  state={optionState(alt)}
                  disabled={answeredLocal[question.id] != null}
                  onClick={() => answer.mutate({ questionId: question.id, respostaEscolhida: alt })}
                />
              ))}
            </div>

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={index === 0}
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
              >
                Anterior
              </Button>
              {index + 1 < questoes.length ? (
                <Button size="sm" onClick={() => setIndex((i) => i + 1)}>
                  Próxima
                </Button>
              ) : (
                <Button size="sm" onClick={() => setConfirmFinish(true)}>
                  Finalizar simulado
                </Button>
              )}
            </div>
          </Card>

          {index + 1 === questoes.length && (
            <Button variant="ghost" size="sm" className="self-center" onClick={() => setConfirmFinish(true)}>
              Finalizar agora ({answeredCount}/{questoes.length} respondidas)
            </Button>
          )}
        </div>
      )}

      {/* FINALIZADO — resultado e análise */}
      {exam.status === "FINALIZADO" && (
        <div className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Acertos" value={`${exam.acertos ?? 0} / ${exam.totalQuestoes}`} accent="var(--fin)" />
            <StatCard label="Percentual" value={`${exam.percentual.toFixed(0)}%`} accent="var(--dash)" />
            <StatCard
              label="Tempo total"
              value={exam.iniciadoEm && exam.finalizadoEm ? formatDuration(elapsed) : "—"}
              accent="var(--study)"
            />
          </div>

          {porMateria.length > 0 && (
            <Card>
              <h2 className="text-sm font-semibold">Desempenho por matéria</h2>
              <div className="mt-3 flex flex-col gap-3">
                {porMateria.map((m) => (
                  <div key={m.nome}>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{m.nome}</span>
                      <span>
                        {m.acertos}/{m.respondidas}
                      </span>
                    </div>
                    <ProgressBar
                      className="mt-1"
                      value={m.acertos}
                      max={m.respondidas}
                      accent="var(--study)"
                    />
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <h2 className="text-sm font-semibold">Revisão questão a questão</h2>
            <div className="mt-3 flex flex-col gap-2">
              {questoes.map((q, i) => {
                const dada = answersByQuestion.get(q.id);
                const acertou = dada != null && normalize(dada) === normalize(q.gabarito ?? "");
                return (
                  <div key={q.id} className="rounded-lg border border-border/70 bg-surface-raised p-3">
                    <div className="flex items-start gap-2">
                      {acertou ? (
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-fin" />
                      ) : (
                        <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground">
                          {i + 1}. {q.enunciado}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {dada ? `Você respondeu: ${dada}` : "Não respondida"} · Gabarito: {q.gabarito}
                        </p>
                        {q.explicacao && (
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{q.explicacao}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={confirmFinish}
        onClose={() => setConfirmFinish(false)}
        onConfirm={() => finish.mutate()}
        title="Finalizar simulado?"
        description={
          answeredCount < questoes.length
            ? `Você respondeu ${answeredCount} de ${questoes.length} questões. As não respondidas contam como erradas. Essa ação não pode ser desfeita.`
            : "Essa ação não pode ser desfeita."
        }
        confirmLabel="Finalizar"
        destructive={false}
        loading={finish.isPending}
      />
    </AppShell>
  );
}
