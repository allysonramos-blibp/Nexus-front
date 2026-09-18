import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  FileEdit,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  Save,
  MessageSquare
} from "lucide-react";
import { api, errorReasonLabel, type StudyError, type Question } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { useAiChat } from "@/contexts/AiChatContext";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Textarea";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/ui/ErrorState";
import { QuestionOption, type QuestionOptionState } from "@/components/ui/QuestionOption";
import { isGabaritoMatch, formatGabaritoDisplay } from "@/lib/gabaritoUtils";
import { getCadernoNote, saveCadernoNote } from "@/lib/cadernoNotesStorage";

const LETTERS = ["A", "B", "C", "D", "E"];

export function CadernoErroDetalheDialog({
  open,
  onClose,
  studyError,
}: {
  open: boolean;
  onClose: () => void;
  studyError: StudyError | null;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { openChat } = useAiChat();

  const [activeTab, setActiveTab] = useState<"estudo" | "retestar" | "anotacoes">("estudo");

  const [resumoRegra, setResumoRegra] = useState("");
  const [comoNaoErrar, setComoNaoErrar] = useState("");
  const [anotacaoLivre, setAnotacaoLivre] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const questionQuery = useQuery({
    queryKey: ["question", studyError?.questionId],
    queryFn: () => api.getQuestion(studyError!.questionId),
    enabled: open && studyError != null,
  });

  useEffect(() => {
    if (studyError) {
      const note = getCadernoNote(studyError.id);
      if (note) {
        setResumoRegra(note.resumoRegra || "");
        setComoNaoErrar(note.comoNaoErrar || "");
        setAnotacaoLivre(note.anotacaoLivre || "");
      } else {
        setResumoRegra("");
        setComoNaoErrar(studyError.observacao || "");
        setAnotacaoLivre("");
      }
      setSelected(null);
      setSubmitted(false);
      setActiveTab("estudo");
      setIsSaved(false);
    }
  }, [studyError, open]);

  const resolveMutation = useMutation({
    mutationFn: (id: number) => api.resolveStudyError(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["study-errors"] });
      qc.invalidateQueries({ queryKey: ["pending-reviews"] });
      toast("Marcado como revisado e dominado!", "success");
    },
  });

  const retestAnswerMutation = useMutation({
    mutationFn: (respostaEscolhida: string) =>
      api.submitAnswer({ questionId: studyError!.questionId, respostaEscolhida }),
    onSuccess: async () => {
      setSubmitted(true);
      qc.invalidateQueries({ queryKey: ["study-errors"] });
      qc.invalidateQueries({ queryKey: ["pending-reviews"] });
    },
    onError: () => toast("Erro ao enviar resposta do reteste", "error"),
  });

  function handleSaveNotes() {
    if (!studyError) return;
    saveCadernoNote({
      errorId: studyError.id,
      questionId: studyError.questionId,
      resumoRegra: resumoRegra.trim() || undefined,
      comoNaoErrar: comoNaoErrar.trim() || undefined,
      anotacaoLivre: anotacaoLivre.trim() || undefined,
      atualizadoEm: new Date().toISOString(),
    });
    setIsSaved(true);
    toast("Anotações salvas no seu caderno!", "success");
    setTimeout(() => setIsSaved(false), 2500);
  }

  const q = questionQuery.data;

  function optionState(alt: string): QuestionOptionState {
    if (!q) return "idle";
    if (!submitted) return selected === alt ? "selected" : "idle";
    const isGabarito = isGabaritoMatch(alt, q.gabarito, q.alternativas);
    if (isGabarito) return "correct";
    if (selected === alt) return "incorrect";
    return "idle";
  }

  const acertou = submitted && q && isGabaritoMatch(selected, q.gabarito, q.alternativas);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Caderno de Erros • Estudo & Revisão"
      description={studyError ? `Motivo inicial: ${errorReasonLabel[studyError.motivo]}` : ""}
      className="max-w-2xl"
    >
      {questionQuery.isLoading && <Loading label="Carregando questão completa e histórico..." />}
      {questionQuery.error && <ErrorState error={questionQuery.error} compact />}

      {q && studyError && (
        <div className="flex flex-col gap-4">

          <div className="flex border-b border-border/70 pb-2 gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("estudo")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "estudo"
                  ? "bg-dash text-primary-foreground shadow-sm"
                  : "bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              <BookOpen className="size-3.5" /> Estudo & Resolução
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("anotacoes")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "anotacoes"
                  ? "bg-dash text-primary-foreground shadow-sm"
                  : "bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileEdit className="size-3.5" /> Minhas Anotações
              {(resumoRegra || comoNaoErrar || anotacaoLivre) && (
                <span className="size-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("retestar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "retestar"
                  ? "bg-dash text-primary-foreground shadow-sm"
                  : "bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              <RotateCcw className="size-3.5" /> Resolver Novamente
            </button>
          </div>

          {activeTab === "estudo" && (
            <div className="flex max-h-[65vh] flex-col gap-3.5 overflow-y-auto pr-1">
              <div className="flex flex-wrap gap-1.5 items-center">
                <Badge>{q.subjectNome}</Badge>
                {q.topicNome && <Badge>{q.topicNome}</Badge>}
                {q.banca && <Badge>{q.banca}</Badge>}
                {q.ano && <Badge>{q.ano}</Badge>}
              </div>

              <div className="rounded-xl border border-border/80 bg-surface-raised/40 p-3.5">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Enunciado:
                </p>
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                  {q.enunciado}
                </p>
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-foreground">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400 text-sm">
                  <CheckCircle2 className="size-4" /> Gabarito Oficial:
                </div>
                <p className="mt-1 font-semibold text-sm">
                  {formatGabaritoDisplay(q.gabarito, q.alternativas)}
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-semibold text-muted-foreground">Alternativas:</p>
                {q.alternativas.map((alt, idx) => {
                  const isGab = isGabaritoMatch(alt, q.gabarito, q.alternativas);
                  return (
                    <div
                      key={idx}
                      className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-xs transition-colors ${
                        isGab
                          ? "border-emerald-500/40 bg-emerald-500/10 font-medium"
                          : "border-border/60 bg-surface/80 text-foreground"
                      }`}
                    >
                      <span className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                        isGab ? "bg-emerald-500 text-white" : "border border-border text-muted-foreground"
                      }`}>
                        {LETTERS[idx]}
                      </span>
                      <span className="flex-1 leading-relaxed">{alt}</span>
                      {isGab && <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />}
                    </div>
                  );
                })}
              </div>

              {q.explicacao && (
                <div className="rounded-xl border border-border/70 bg-surface-raised/30 p-3 text-xs">
                  <span className="font-bold text-foreground">Comentário / Fundamentação:</span>
                  <p className="mt-1 leading-relaxed text-foreground/90">{q.explicacao}</p>
                </div>
              )}

              {q.pegadinha && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
                  <span className="font-bold text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="size-3.5" /> Pegadinha da Banca:
                  </span>
                  <p className="mt-1 leading-relaxed text-foreground">{q.pegadinha}</p>
                </div>
              )}

              <div className="mt-1 flex flex-wrap gap-2 pt-2 border-t border-border/60">
                <Button
                  size="sm"
                  variant="primary"
                  className="text-xs gap-1.5"
                  onClick={() =>
                    openChat(
                      `Você pode agir como meu professor para a questão: "${q.enunciado}". O gabarito é "${formatGabaritoDisplay(q.gabarito, q.alternativas)}". Por favor: 1) Explique a regra jurídica/conceito de forma simples, 2) Mostre exatamente por que as outras alternativas estão erradas e 3) Me dê uma dica mnemônica para eu nunca mais errar isso.`
                    )
                  }
                >
                  <Sparkles className="size-3.5 text-dash" /> Explicar com IA & Mnemônicos
                </Button>

                <Button
                  size="sm"
                  variant="primary"
                  className="text-xs gap-1.5"
                  onClick={() => setActiveTab("anotacoes")}
                >
                  <FileEdit className="size-3.5" /> Adicionar Minha Anotação
                </Button>

                {!studyError.resolvido && (
                  <Button
                    size="sm"
                    className="text-xs gap-1.5 ml-auto"
                    loading={resolveMutation.isPending}
                    onClick={() => resolveMutation.mutate(studyError.id)}
                  >
                    <CheckCircle2 className="size-3.5" /> Marcar como Dominado
                  </Button>
                )}
              </div>
            </div>
          )}

          {activeTab === "anotacoes" && (
            <div className="flex max-h-[65vh] flex-col gap-3 overflow-y-auto pr-1">
              <div className="rounded-xl border border-border/80 bg-surface-raised/40 p-3 text-xs text-muted-foreground">
                📝 <strong>Caderno de Lições:</strong> registre com suas próprias palavras a regra da questão para fixar e não esquecer nas próximas revisões.
              </div>

              <Textarea
                label="O que devo memorizar? (Regra, Lei, Fórmula ou Artigo)"
                rows={3}
                value={resumoRegra}
                onChange={(e) => setResumoRegra(e.target.value)}
                placeholder="Ex: Artigo 5º, XI da CF - Flagrante delito pode entrar à noite ou de dia sem mandado..."
              />

              <Textarea
                label="Onde eu caí? (Qual foi a pegadinha / distração?)"
                rows={2}
                value={comoNaoErrar}
                onChange={(e) => setComoNaoErrar(e.target.value)}
                placeholder="Ex: Não prestei atenção na palavra 'exclusivamente'; confundi prazo de 15 dias com 30 dias..."
              />

              <Textarea
                label="Outras Anotações / Esquemas"
                rows={3}
                value={anotacaoLivre}
                onChange={(e) => setAnotacaoLivre(e.target.value)}
                placeholder="Observações adicionais, súmula relacionada ou mnemônico..."
              />

              <div className="flex justify-between items-center pt-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    openChat(
                      `Gere um resumo em 3 tópicos curtos e objetivos para eu anotar no meu caderno de erros sobre essa questão: "${q.enunciado}". Gabarito: ${formatGabaritoDisplay(q.gabarito, q.alternativas)}`
                    );
                  }}
                  className="text-xs gap-1.5"
                >
                  <Sparkles className="size-3.5 text-dash" /> Sugerir Resumo com IA
                </Button>

                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  className="gap-1.5"
                >
                  <Save className="size-3.5" />
                  {isSaved ? "Salvo com sucesso!" : "Salvar Anotações"}
                </Button>
              </div>
            </div>
          )}

          {activeTab === "retestar" && (
            <div className="flex max-h-[65vh] flex-col gap-3.5 overflow-y-auto pr-1">
              <p className="text-xs text-muted-foreground">
                Tente resolver a questão novamente sem olhar a resposta anterior para validar se o conteúdo foi fixado:
              </p>

              <div className="rounded-xl border border-border/80 bg-surface-raised/30 p-3">
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                  {q.enunciado}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {q.alternativas.map((alt, i) => (
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
                    acertou
                      ? "border-fin/40 bg-fin/10 text-fin"
                      : "border-destructive/40 bg-destructive/10 text-destructive"
                  }`}
                >
                  <p className="font-semibold">
                    {acertou
                      ? "Parabéns! Você acertou desta vez e superou o erro anterior! 🎉"
                      : "Ainda não foi dessa vez. Reveja a aba de anotações e comentários."}
                  </p>
                  <p className="mt-1 text-foreground">
                    Gabarito: <strong>{formatGabaritoDisplay(q.gabarito, q.alternativas)}</strong>
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                {submitted ? (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setSubmitted(false);
                      setSelected(null);
                    }}
                    className="gap-1.5"
                  >
                    <RotateCcw className="size-3.5" /> Tentar novamente
                  </Button>
                ) : (
                  <div />
                )}

                {!submitted ? (
                  <Button
                    size="sm"
                    disabled={!selected}
                    loading={retestAnswerMutation.isPending}
                    onClick={() => selected && retestAnswerMutation.mutate(selected)}
                  >
                    Confirmar Resposta
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => {
                      if (acertou && !studyError.resolvido) {
                        resolveMutation.mutate(studyError.id);
                      }
                      setActiveTab("estudo");
                    }}
                  >
                    Continuar Estudo
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}
