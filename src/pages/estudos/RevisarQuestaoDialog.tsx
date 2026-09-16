import { isGabaritoMatch, formatGabaritoDisplay } from "@/lib/gabaritoUtils";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowRight, 
  Sparkles, 
  FileEdit, 
  Save, 
  HelpCircle, 
  RotateCcw,
  BookOpen,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { api, type StudyError } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { useAiChat } from "@/contexts/AiChatContext";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { ErrorState } from "@/components/ui/ErrorState";
import { QuestionOption, type QuestionOptionState } from "@/components/ui/QuestionOption";
import { getCadernoNote, saveCadernoNote } from "@/lib/cadernoNotesStorage";

const LETTERS = ["A", "B", "C", "D", "E"];

/**
 * Reabre a questão de um item pendente de revisão. 
 * Agora conta com painel de anotações persistentes, explicação didática da IA e consulta
 * ao comentário da questão enquanto estuda.
 */
export function RevisarQuestaoDialog({
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

  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  // Notas de estudo
  const [resumoRegra, setResumoRegra] = useState("");
  const [comoNaoErrar, setComoNaoErrar] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const question = useQuery({
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
      } else {
        setResumoRegra("");
        setComoNaoErrar(studyError.observacao || "");
      }
      setSelected(null);
      setSubmitted(false);
      setShowNotes(false);
    }
  }, [studyError, open]);

  const answer = useMutation({
    mutationFn: (respostaEscolhida: string) =>
      api.submitAnswer({ questionId: studyError!.questionId, respostaEscolhida }),
    onSuccess: async () => {
      await api.resolveStudyError(studyError!.id);
      qc.invalidateQueries({ queryKey: ["pending-reviews"] });
      qc.invalidateQueries({ queryKey: ["study-errors"] });
      setSubmitted(true);
    },
    onError: () => toast("Não consegui registrar sua resposta — tente de novo.", "error"),
  });

  function handleSaveNotes() {
    if (!studyError) return;
    saveCadernoNote({
      errorId: studyError.id,
      questionId: studyError.questionId,
      resumoRegra: resumoRegra.trim() || undefined,
      comoNaoErrar: comoNaoErrar.trim() || undefined,
      atualizadoEm: new Date().toISOString(),
    });
    setIsSaved(true);
    toast("Anotações de revisão salvas com sucesso!", "success");
    setTimeout(() => setIsSaved(false), 2000);
  }

  function handleClose() {
    setSelected(null);
    setSubmitted(false);
    onClose();
  }

  const q = question.data;
  const acertou = submitted && q && isGabaritoMatch(selected, q.gabarito, q.alternativas);

  function optionState(alt: string): QuestionOptionState {
    if (!q) return "idle";
    if (!submitted) return selected === alt ? "selected" : "idle";
    const isGabarito = isGabaritoMatch(alt, q.gabarito, q.alternativas);
    if (isGabarito) return "correct";
    if (selected === alt) return "incorrect";
    return "idle";
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      title="Sessão de Revisão Ativa"
      description="Resolva novamente para consolidar na memória de longo prazo e faça suas anotações."
      className="max-w-2xl"
    >
      {question.isLoading && <Loading label="Carregando questão para revisão..." />}
      {question.error && <ErrorState error={question.error} compact />}

      {q && studyError && (
        <div className="flex max-h-[72vh] flex-col gap-4 overflow-y-auto pr-1">
          {/* Tags de contexto */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="default">{q.subjectNome}</Badge>
            {q.topicNome && <Badge variant="default">{q.topicNome}</Badge>}
            {q.banca && <Badge>{q.banca}</Badge>}
            {q.ano && <Badge>{q.ano}</Badge>}
            {studyError.proximaRevisao && (
              <span className="text-xs text-muted-foreground ml-auto">
                Revisão agendada: {studyError.proximaRevisao}
              </span>
            )}
          </div>

          {/* Enunciado */}
          <div className="rounded-xl border border-border/80 bg-surface-raised/30 p-3.5">
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {q.enunciado}
            </p>
          </div>

          {/* Alternativas de Resposta */}
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

          {/* Feedback Pós-Envio */}
          {submitted && (
            <div
              className={`rounded-xl border p-4 text-sm ${
                acertou
                  ? "border-fin/40 bg-fin/10 text-fin"
                  : "border-destructive/40 bg-destructive/10 text-destructive"
              }`}
            >
              <div className="flex items-center gap-2 font-semibold">
                {acertou ? (
                  <>
                    <CheckCircle2 className="size-4" />
                    <span>Excelente! Você acertou na revisão e superou o erro!</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="size-4" />
                    <span>Ainda não foi dessa vez — aproveite para fixar a regra nas anotações abaixo!</span>
                  </>
                )}
              </div>

              <p className="mt-2 text-foreground">
                Gabarito oficial: <strong>{formatGabaritoDisplay(q.gabarito, q.alternativas)}</strong>
              </p>

              {q.explicacao && (
                <div className="mt-2.5 pt-2.5 border-t border-border/50 text-foreground">
                  <span className="font-semibold text-xs text-muted-foreground block mb-1">
                    Comentário da questão:
                  </span>
                  <p className="leading-relaxed text-xs">{q.explicacao}</p>
                </div>
              )}

              {q.pegadinha && (
                <div className="mt-2 rounded-lg bg-surface-raised/60 p-2.5 text-xs text-foreground">
                  <span className="font-semibold text-amber-400">💡 Pegadinha da Banca: </span>
                  {q.pegadinha}
                </div>
              )}
            </div>
          )}

          {/* Seção de Anotações & Ajuda com IA */}
          <div className="rounded-xl border border-border/80 bg-surface-raised/40 p-3.5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowNotes((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-dash transition-colors"
              >
                <FileEdit className="size-3.5 text-dash" />
                <span>{showNotes ? "Recolher anotações de estudo" : "Abrir minhas anotações desta questão"}</span>
                {(resumoRegra || comoNaoErrar) && (
                  <Badge variant="info" className="text-[10px] py-0 px-1.5 ml-1">Preenchido</Badge>
                )}
              </button>

              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-xs h-7 gap-1 text-muted-foreground hover:text-foreground"
                onClick={() =>
                  openChat(
                    `Pode me explicar didaticamente o ponto principal dessa questão que estou revisando? "${q.enunciado}". O gabarito é "${formatGabaritoDisplay(q.gabarito, q.alternativas)}". Dê uma dica rápida de memorização.`
                  )
                }
              >
                <Sparkles className="size-3 text-dash" /> Pedir ajuda à IA
              </Button>
            </div>

            {showNotes && (
              <div className="flex flex-col gap-2 pt-2 border-t border-border/60">
                <Textarea
                  label="O que fixar (regra / artigo / fórmula):"
                  rows={2}
                  value={resumoRegra}
                  onChange={(e) => setResumoRegra(e.target.value)}
                  placeholder="Ex: Artigo 5º, inciso XI - mandado judicial só durante o dia..."
                />
                <Textarea
                  label="Dica para não cair na pegadinha:"
                  rows={2}
                  value={comoNaoErrar}
                  onChange={(e) => setComoNaoErrar(e.target.value)}
                  placeholder="Ex: A banca trocou 'dia' por 'noite'..."
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    className="text-xs gap-1"
                    onClick={handleSaveNotes}
                  >
                    <Save className="size-3" />
                    {isSaved ? "Salvo!" : "Salvar Anotação"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Rodapé com botões de ação */}
          <div className="flex justify-between items-center pt-2">
            {!submitted ? (
              <Button
                disabled={!selected}
                loading={answer.isPending}
                onClick={() => selected && answer.mutate(selected)}
              >
                Responder e Registrar Revisão
              </Button>
            ) : (
              <Button onClick={handleClose} className="ml-auto gap-1">
                Concluir revisão <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
}
