import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus } from "lucide-react";
import { api, difficultyLabel, type Question, type QuestionDifficulty } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { ErrorState } from "@/components/ui/ErrorState";

const LETTERS = ["A", "B", "C", "D", "E"];
const DIFFICULTIES: QuestionDifficulty[] = ["FACIL", "MEDIA", "DIFICIL"];

export function QuestaoForm({
  open,
  onClose,
  topicId,
  question,
}: {
  open: boolean;
  onClose: () => void;
  topicId: number;
  question: Question | null;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [enunciado, setEnunciado] = useState(question?.enunciado ?? "");
  const [alternativas, setAlternativas] = useState<string[]>(
    question?.alternativas && question.alternativas.length >= 2
      ? question.alternativas
      : ["", ""],
  );
  const [gabaritoIndex, setGabaritoIndex] = useState<number>(
    question
      ? Math.max(
          0,
          question.alternativas.findIndex(
            (a) => a.trim().toLowerCase() === (question.gabarito ?? "").trim().toLowerCase(),
          ),
        )
      : 0,
  );
  const [explicacao, setExplicacao] = useState(question?.explicacao ?? "");
  const [dificuldade, setDificuldade] = useState<QuestionDifficulty>(
    question?.dificuldade ?? "MEDIA",
  );
  const [banca, setBanca] = useState(question?.banca ?? "");
  const [ano, setAno] = useState<string>(question?.ano ? String(question.ano) : "");

  const validAlternativas = alternativas.map((a) => a.trim()).filter(Boolean);
  const canSubmit = enunciado.trim().length > 0 && validAlternativas.length >= 2;

  const save = useMutation({
    mutationFn: () => {
      const body = {
        enunciado: enunciado.trim(),
        alternativas: alternativas.map((a) => a.trim()),
        gabarito: alternativas[gabaritoIndex]?.trim() ?? "",
        explicacao: explicacao.trim() || null,
        dificuldade,
        banca: banca.trim() || null,
        ano: ano ? Number(ano) : null,
        numero: question?.numero ?? null,
      };
      return question ? api.updateQuestion(question.id, body) : api.createQuestion(topicId, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["questions", topicId] });
      toast(question ? "Questão atualizada." : "Questão criada.", "success");
      onClose();
    },
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={question ? "Editar questão" : "Nova questão"}
      description="Marque qual alternativa é o gabarito antes de salvar."
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={save.isPending}>
            Cancelar
          </Button>
          <Button size="sm" loading={save.isPending} disabled={!canSubmit} onClick={() => save.mutate()}>
            Salvar
          </Button>
        </>
      }
    >
      <div className="flex max-h-[65vh] flex-col gap-3 overflow-y-auto pr-1">
        <Textarea
          label="Enunciado"
          rows={3}
          value={enunciado}
          onChange={(e) => setEnunciado(e.target.value)}
        />

        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            Alternativas (marque o círculo da correta)
          </p>
          {alternativas.map((alt, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setGabaritoIndex(i)}
                aria-label={`Marcar alternativa ${LETTERS[i]} como gabarito`}
                className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                  gabaritoIndex === i
                    ? "border-fin bg-fin text-primary-foreground"
                    : "border-border text-muted-foreground hover:border-fin/60"
                }`}
              >
                {LETTERS[i]}
              </button>
              <Input
                value={alt}
                onChange={(e) =>
                  setAlternativas((arr) => arr.map((v, idx) => (idx === i ? e.target.value : v)))
                }
                placeholder={`Alternativa ${LETTERS[i]}`}
                className="flex-1"
              />
              {alternativas.length > 2 && (
                <button
                  type="button"
                  aria-label={`Remover alternativa ${LETTERS[i]}`}
                  onClick={() => {
                    setAlternativas((arr) => arr.filter((_, idx) => idx !== i));
                    setGabaritoIndex((g) => (g >= i && g > 0 ? g - 1 : g));
                  }}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Minus className="size-4" />
                </button>
              )}
            </div>
          ))}
          {alternativas.length < 5 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="self-start"
              onClick={() => setAlternativas((arr) => [...arr, ""])}
            >
              <Plus className="size-3.5" /> Adicionar alternativa
            </Button>
          )}
        </div>

        <Textarea
          label="Explicação (opcional)"
          rows={2}
          value={explicacao}
          onChange={(e) => setExplicacao(e.target.value)}
          placeholder="Por que essa é a correta — e por que as outras estão erradas."
        />

        <div className="grid grid-cols-3 gap-3">
          <Select
            label="Dificuldade"
            value={dificuldade}
            onChange={(e) => setDificuldade(e.target.value as QuestionDifficulty)}
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {difficultyLabel[d]}
              </option>
            ))}
          </Select>
          <Input label="Banca (opcional)" value={banca} onChange={(e) => setBanca(e.target.value)} />
          <Input
            label="Ano (opcional)"
            type="number"
            value={ano}
            onChange={(e) => setAno(e.target.value)}
          />
        </div>

        {save.error && <ErrorState error={save.error} compact />}
      </div>
    </Dialog>
  );
}
