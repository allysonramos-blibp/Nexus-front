import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, CheckCircle2, Minus, Plus, X, XCircle } from "lucide-react";
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

type QuestionType = "MULTIPLA_ESCOLHA" | "CERTO_ERRADO";

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

  const isInitialCertoErrado = Boolean(
    question &&
      question.alternativas.length === 2 &&
      question.alternativas.some((a) => a.trim().toLowerCase() === "certo") &&
      question.alternativas.some((a) => a.trim().toLowerCase() === "errado"),
  );

  const [tipoQuestao, setTipoQuestao] = useState<QuestionType>(
    isInitialCertoErrado ? "CERTO_ERRADO" : "MULTIPLA_ESCOLHA",
  );

  const [enunciado, setEnunciado] = useState(question?.enunciado ?? "");
  const [alternativas, setAlternativas] = useState<string[]>(() => {
    if (isInitialCertoErrado) return ["Certo", "Errado"];
    if (question?.alternativas && question.alternativas.length >= 2) {
      return question.alternativas;
    }
    return ["", "", "", ""];
  });

  const [gabaritoIndex, setGabaritoIndex] = useState<number>(() => {
    if (!question) return 0;
    const idx = question.alternativas.findIndex(
      (a) => a.trim().toLowerCase() === (question.gabarito ?? "").trim().toLowerCase(),
    );
    return Math.max(0, idx);
  });

  const [explicacao, setExplicacao] = useState(question?.explicacao ?? "");
  const [pegadinha, setPegadinha] = useState(question?.pegadinha ?? "");
  const [dificuldade, setDificuldade] = useState<QuestionDifficulty>(
    question?.dificuldade ?? "MEDIA",
  );
  const [banca, setBanca] = useState(question?.banca ?? "");
  const [ano, setAno] = useState<string>(question?.ano ? String(question.ano) : "");

  // Atualizar estado quando mudar a prop question
  useEffect(() => {
    if (question) {
      const isCE =
        question.alternativas.length === 2 &&
        question.alternativas.some((a) => a.trim().toLowerCase() === "certo") &&
        question.alternativas.some((a) => a.trim().toLowerCase() === "errado");

      setTipoQuestao(isCE ? "CERTO_ERRADO" : "MULTIPLA_ESCOLHA");
      setEnunciado(question.enunciado);
      setAlternativas(isCE ? ["Certo", "Errado"] : question.alternativas);
      const idx = question.alternativas.findIndex(
        (a) => a.trim().toLowerCase() === (question.gabarito ?? "").trim().toLowerCase(),
      );
      setGabaritoIndex(Math.max(0, idx));
      setExplicacao(question.explicacao ?? "");
      setPegadinha(question.pegadinha ?? "");
      setDificuldade(question.dificuldade ?? "MEDIA");
      setBanca(question.banca ?? "");
      setAno(question.ano ? String(question.ano) : "");
    }
  }, [question]);

  const handleSwitchTipo = (novoTipo: QuestionType) => {
    if (novoTipo === tipoQuestao) return;
    setTipoQuestao(novoTipo);
    if (novoTipo === "CERTO_ERRADO") {
      setAlternativas(["Certo", "Errado"]);
      setGabaritoIndex(0);
      if (!banca) setBanca("CEBRASPE");
    } else {
      setAlternativas(["", "", "", ""]);
      setGabaritoIndex(0);
    }
  };

  const validAlternativas = alternativas.map((a) => a.trim()).filter(Boolean);
  const canSubmit =
    enunciado.trim().length > 0 &&
    validAlternativas.length >= 2 &&
    gabaritoIndex >= 0 &&
    gabaritoIndex < alternativas.length;

  const save = useMutation({
    mutationFn: () => {
      const finalGabarito =
        tipoQuestao === "CERTO_ERRADO"
          ? gabaritoIndex === 0
            ? "Certo"
            : "Errado"
          : alternativas[gabaritoIndex]?.trim() ?? "";

      const body = {
        enunciado: enunciado.trim(),
        alternativas:
          tipoQuestao === "CERTO_ERRADO"
            ? ["Certo", "Errado"]
            : alternativas.map((a) => a.trim()),
        gabarito: finalGabarito,
        explicacao: explicacao.trim() || null,
        pegadinha: pegadinha.trim() || null,
        dificuldade,
        banca: banca.trim() || null,
        ano: ano ? Number(ano) : null,
        numero: question?.numero ?? null,
      };
      return question ? api.updateQuestion(question.id, body) : api.createQuestion(topicId, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["questions", topicId] });
      toast(question ? "Questão atualizada." : "Questão criada com sucesso.", "success");
      onClose();
    },
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={question ? "Editar questão" : "Nova questão"}
      description="Preencha o enunciado e marque a alternativa correta."
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={save.isPending}>
            Cancelar
          </Button>
          <Button size="sm" loading={save.isPending} disabled={!canSubmit} onClick={() => save.mutate()}>
            {question ? "Salvar alterações" : "Cadastrar Questão"}
          </Button>
        </>
      }
    >
      <div className="flex max-h-[68vh] flex-col gap-3.5 overflow-y-auto pr-1">
        {/* Seletor de Modelo de Questão */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground">
            Formato da Questão:
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-surface-raised/60 rounded-xl border border-border/80">
            <button
              type="button"
              onClick={() => handleSwitchTipo("MULTIPLA_ESCOLHA")}
              className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                tipoQuestao === "MULTIPLA_ESCOLHA"
                  ? "bg-surface shadow-sm text-foreground border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Múltipla Escolha (A, B, C, D, E)
            </button>
            <button
              type="button"
              onClick={() => handleSwitchTipo("CERTO_ERRADO")}
              className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                tipoQuestao === "CERTO_ERRADO"
                  ? "bg-surface shadow-sm text-foreground border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ⚡ Certo / Errado (Cebraspe)
            </button>
          </div>
        </div>

        <Textarea
          label="Enunciado ou Item para Julgar"
          rows={tipoQuestao === "CERTO_ERRADO" ? 4 : 3}
          value={enunciado}
          onChange={(e) => setEnunciado(e.target.value)}
          placeholder={
            tipoQuestao === "CERTO_ERRADO"
              ? "Ex.: A casa é asilo inviolável do indivíduo, ninguém nela podendo penetrar sem consentimento do morador..."
              : "Ex.: Acerca dos direitos e garantias fundamentais na CF/88, assinale a opção correta:"
          }
        />

        {/* Bloco de Alternativas */}
        {tipoQuestao === "CERTO_ERRADO" ? (
          <div className="flex flex-col gap-2 p-3.5 rounded-xl border border-border/80 bg-surface-raised/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">
                Selecione o Gabarito Oficial:
              </span>
              <span className="text-[11px] text-muted-foreground">
                Clique na opção correta
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setGabaritoIndex(0)}
                className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border font-bold text-sm transition-all ${
                  gabaritoIndex === 0
                    ? "border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-md ring-2 ring-emerald-500/30"
                    : "border-border/80 bg-surface text-muted-foreground hover:border-emerald-500/40 hover:text-foreground"
                }`}
              >
                <CheckCircle2 className={`size-5 ${gabaritoIndex === 0 ? "text-emerald-400" : "text-muted-foreground"}`} />
                CERTO
              </button>

              <button
                type="button"
                onClick={() => setGabaritoIndex(1)}
                className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border font-bold text-sm transition-all ${
                  gabaritoIndex === 1
                    ? "border-rose-500 bg-rose-500/15 text-rose-400 shadow-md ring-2 ring-rose-500/30"
                    : "border-border/80 bg-surface text-muted-foreground hover:border-rose-500/40 hover:text-foreground"
                }`}
              >
                <XCircle className={`size-5 ${gabaritoIndex === 1 ? "text-rose-400" : "text-muted-foreground"}`} />
                ERRADO
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground">
                Alternativas (marque a letra correta)
              </p>
              <span className="text-[11px] text-muted-foreground">
                Letra marcada em verde é o gabarito
              </span>
            </div>

            {alternativas.map((alt, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setGabaritoIndex(i)}
                  aria-label={`Marcar alternativa ${LETTERS[i]} como gabarito`}
                  className={`flex size-8 shrink-0 items-center justify-center rounded-xl border text-xs font-bold transition-colors ${
                    gabaritoIndex === i
                      ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                      : "border-border bg-surface text-muted-foreground hover:border-emerald-500/60 hover:text-foreground"
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
                  className="flex-1 text-xs"
                />
                {alternativas.length > 2 && (
                  <button
                    type="button"
                    aria-label={`Remover alternativa ${LETTERS[i]}`}
                    onClick={() => {
                      setAlternativas((arr) => arr.filter((_, idx) => idx !== i));
                      setGabaritoIndex((g) => (g >= i && g > 0 ? g - 1 : g));
                    }}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
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
                className="self-start text-xs gap-1 text-muted-foreground hover:text-foreground"
                onClick={() => setAlternativas((arr) => [...arr, ""])}
              >
                <Plus className="size-3.5" /> Adicionar alternativa ({LETTERS[alternativas.length]})
              </Button>
            )}
          </div>
        )}

        <Textarea
          label="Explicação / Comentário Fundamentado (opcional)"
          rows={2}
          value={explicacao}
          onChange={(e) => setExplicacao(e.target.value)}
          placeholder="Artigo de lei, súmula, doutrina ou por que essa alternativa é a correta."
        />

        <Textarea
          label="Pegadinha da Banca (opcional)"
          rows={2}
          value={pegadinha}
          onChange={(e) => setPegadinha(e.target.value)}
          placeholder="Ex.: A banca trocou 'imprescritível' por 'prescritível' para induzir ao erro..."
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
          <Input
            label="Banca (opcional)"
            value={banca}
            placeholder="Ex: CEBRASPE, FGV"
            onChange={(e) => setBanca(e.target.value)}
          />
          <Input
            label="Ano (opcional)"
            type="number"
            value={ano}
            placeholder="Ex: 2024"
            onChange={(e) => setAno(e.target.value)}
          />
        </div>

        {save.error && <ErrorState error={save.error} compact />}
      </div>
    </Dialog>
  );
}
