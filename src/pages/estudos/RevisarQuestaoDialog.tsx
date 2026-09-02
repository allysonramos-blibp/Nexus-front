import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { api, type StudyError } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/ui/ErrorState";
import { QuestionOption, type QuestionOptionState } from "@/components/ui/QuestionOption";

const LETTERS = ["A", "B", "C", "D", "E"];

function normalize(s: string) {
  return s.trim().toLowerCase();
}

/**
 * Reabre a questão de um item pendente de revisão. Ao responder — acertando ou
 * errando — a entrada do caderno de erros é marcada como revisada: o objetivo aqui é
 * o reencontro com o conteúdo, não exigir acerto para "liberar" a revisão.
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
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const question = useQuery({
    queryKey: ["question", studyError?.questionId],
    queryFn: () => api.getQuestion(studyError!.questionId),
    enabled: open && studyError != null,
  });

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

  function handleClose() {
    setSelected(null);
    setSubmitted(false);
    onClose();
  }

  const q = question.data;
  const acertou = submitted && q && normalize(selected ?? "") === normalize(q.gabarito ?? "");

  function optionState(alt: string): QuestionOptionState {
    if (!q) return "idle";
    if (!submitted) return selected === alt ? "selected" : "idle";
    const isGabarito = normalize(alt) === normalize(q.gabarito ?? "");
    if (isGabarito) return "correct";
    if (selected === alt) return "incorrect";
    return "idle";
  }

  return (
    <Dialog open={open} onClose={handleClose} title="Revisar questão">
      {question.isLoading && <Loading />}
      {question.error && <ErrorState error={question.error} compact />}
      {q && (
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-foreground">{q.enunciado}</p>
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
                {acertou ? "Dessa vez você acertou!" : "Ainda não — tudo bem, é pra isso que a revisão existe."}
              </p>
              {q.explicacao && <p className="mt-2 leading-relaxed text-foreground">{q.explicacao}</p>}
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
              <Button onClick={handleClose}>
                Concluir revisão <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
}
