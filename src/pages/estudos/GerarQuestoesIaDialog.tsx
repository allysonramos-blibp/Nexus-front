import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ListFilter,
  Pencil,
  Sparkles,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { api, type QuestionRequest, type QuestionDifficulty } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/ui/ErrorState";

const BANCAS = [
  "CEBRASPE",
  "FGV",
  "FCC",
  "VUNESP",
  "CESGRANRIO",
  "QUADRIX",
  "AOCP",
  "IBFC",
];

const LETTERS = ["A", "B", "C", "D", "E"];

export function GerarQuestoesIaDialog({
  open,
  onClose,
  topicId,
  topicName,
  subjectName,
}: {
  open: boolean;
  onClose: () => void;
  topicId: number;
  topicName?: string;
  subjectName?: string;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [foco, setFoco] = useState(topicName || "");
  const [banca, setBanca] = useState("CEBRASPE");
  const [formato, setFormato] = useState<"CERTO_ERRADO" | "MULTIPLA_ESCOLHA">("CERTO_ERRADO");
  const [dificuldade, setDificuldade] = useState<QuestionDifficulty>("MEDIA");
  const [quantidade, setQuantidade] = useState<number>(3);
  const [instrucaoExtra, setInstrucaoExtra] = useState("");

  const [drafts, setDrafts] = useState<QuestionRequest[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const contexto = subjectName
        ? `Disciplina: ${subjectName}. Assunto: ${foco || topicName || "Tópico de estudos"}.`
        : `Assunto: ${foco || topicName || "Tópico de estudos"}.`;

      const prompt = `Você é um elaborador sênior de questões para concursos públicos de alto nível no Brasil.
Elabore exatamente ${quantidade} questão(ões) inéditas ou adaptadas para o seguinte contexto:
${contexto}
Banca examinadora: ${banca}
Formato: ${formato === "CERTO_ERRADO" ? "Itens no modelo Certo ou Errado (estilo Cebraspe)" : "Múltipla Escolha com 5 alternativas (A, B, C, D, E)"}
Nível de dificuldade: ${dificuldade}
${instrucaoExtra ? `Diretrizes adicionais: ${instrucaoExtra}` : ""}

Requisitos de qualidade:
1. Para modelo Certo ou Errado: o enunciado deve ser uma assertiva técnica assertiva para julgar, e 'alternativas' deve ser exatamente ["Certo", "Errado"]. O 'gabarito' deve ser exatamente "Certo" ou "Errado".
2. Para Múltipla Escolha: o enunciado deve trazer o contexto ou comando da questão, e 'alternativas' deve ter 5 opções plausíveis. O 'gabarito' deve ser exatamente o texto da alternativa correta.
3. Forneça uma explicação detalhada com fundamentação jurídica/técnica (artigo de lei, súmula, jurisprudência do STF/STJ ou doutrina majoritária).

Retorne APENAS um array JSON estrito no seguinte formato, sem texto adicional:
[
  {
    "enunciado": "texto completo do enunciado",
    "alternativas": ${formato === "CERTO_ERRADO" ? '["Certo", "Errado"]' : '["Alternativa A", "Alternativa B", "Alternativa C", "Alternativa D", "Alternativa E"]'},
    "gabarito": ${formato === "CERTO_ERRADO" ? '"Certo" ou "Errado"' : '"texto exato da alternativa correta"'},
    "explicacao": "fundamentação técnica detalhada com artigo de lei ou súmula",
    "banca": "${banca}",
    "ano": ${new Date().getFullYear()},
    "dificuldade": "${dificuldade}"
  }
]`;

      const res = await api.chat(prompt, []);
      let jsonStr = res.reply.trim();
      const codeBlock = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/i);
      if (codeBlock) {
        jsonStr = codeBlock[1].trim();
      }

      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setDrafts(parsed);
        toast(`${parsed.length} questão(ões) gerada(s) com sucesso!`, "success");
      } else {
        throw new Error("Formato inválido");
      }
    } catch (err) {
      toast("Não foi possível gerar as questões no momento. Tente novamente.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const save = useMutation({
    mutationFn: () => api.bulkCreateQuestions(topicId, drafts ?? []),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["questions", topicId] });
      toast(`${res.length} questão(ões) salvas com sucesso no assunto!`, "success");
      handleReset();
      onClose();
    },
    onError: () => toast("Erro ao salvar questões.", "error"),
  });

  const handleReset = () => {
    setDrafts(null);
    setIsGenerating(false);
  };

  const handleOptionSelect = (draftIndex: number, optionText: string) => {
    setDrafts((prev) =>
      prev ? prev.map((d, i) => (i === draftIndex ? { ...d, gabarito: optionText } : d)) : null,
    );
  };

  const handleRemoveDraft = (index: number) => {
    setDrafts((prev) => {
      if (!prev) return null;
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : null;
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Gerar Questões com IA"
      description={
        drafts
          ? `Revise as questões geradas antes de adicioná-las a ${topicName ? `"${topicName}"` : "seu assunto"}.`
          : `Gere questões direcionadas pela banca e no nível que você precisa.`
      }
      className="max-w-2xl"
      footer={
        drafts ? (
          <>
            <Button variant="ghost" size="sm" onClick={() => setDrafts(null)} disabled={save.isPending}>
              <ArrowLeft className="size-4" /> Configurar novamente
            </Button>
            <Button
              size="sm"
              loading={save.isPending}
              disabled={drafts.length === 0}
              onClick={() => save.mutate()}
            >
              Salvar {drafts.length} questão(ões) no Assunto
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isGenerating}>
              Cancelar
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              loading={isGenerating}
              onClick={handleGenerate}
            >
              <Sparkles className="size-4" /> Gerar {quantidade} Questão(ões)
            </Button>
          </>
        )
      }
    >
      {!drafts ? (
        <div className="flex flex-col gap-3.5">
          <Input
            label="Assunto ou Tópico de Foco"
            value={foco}
            onChange={(e) => setFoco(e.target.value)}
            placeholder="Ex: Artigo 5º - Direitos Individuais e Coletivos"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Banca Examinadora"
              value={banca}
              onChange={(e) => {
                const b = e.target.value;
                setBanca(b);
                if (b === "CEBRASPE") {
                  setFormato("CERTO_ERRADO");
                }
              }}
            >
              {BANCAS.map((b) => (
                <option key={b} value={b}>
                  {b} {b === "CEBRASPE" ? "(Padrão Certo/Errado)" : ""}
                </option>
              ))}
            </Select>

            <Select
              label="Formato da Questão"
              value={formato}
              onChange={(e) => setFormato(e.target.value as "CERTO_ERRADO" | "MULTIPLA_ESCOLHA")}
            >
              <option value="CERTO_ERRADO">⚡ Certo ou Errado (Cebraspe)</option>
              <option value="MULTIPLA_ESCOLHA">Múltipla Escolha (5 alternativas)</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Nível de Dificuldade"
              value={dificuldade}
              onChange={(e) => setDificuldade(e.target.value as QuestionDifficulty)}
            >
              <option value="FACIL">Fácil (Conceitos diretos)</option>
              <option value="MEDIA">Média (Padrão de prova)</option>
              <option value="DIFICIL">Difícil (Pegadinhas e Jurisprudência)</option>
            </Select>

            <Select
              label="Quantidade a gerar"
              value={String(quantidade)}
              onChange={(e) => setQuantidade(Number(e.target.value))}
            >
              <option value="1">1 questão rápida</option>
              <option value="3">3 questões</option>
              <option value="5">5 questões</option>
              <option value="10">10 questões (Simulado completo)</option>
            </Select>
          </div>

          <Textarea
            label="Diretriz ou foco adicional (opcional)"
            rows={2}
            value={instrucaoExtra}
            onChange={(e) => setInstrucaoExtra(e.target.value)}
            placeholder="Ex: Cobrar entendimento recente do STF; focar em pegadinhas com prazos; estilo policial..."
          />

          {isGenerating && (
            <Loading label={`A IA do Nexus está elaborando ${quantidade} questões da banca ${banca} com gabarito fundamentado...`} />
          )}
        </div>
      ) : (
        <div className="flex max-h-[62vh] flex-col gap-3.5 overflow-y-auto pr-1">
          <div className="flex items-center justify-between pb-1 border-b border-border">
            <Badge>{drafts.length} questão(ões) gerada(s)</Badge>
            <span className="text-xs text-muted-foreground">
              Você pode ajustar o gabarito ou remover itens antes de salvar
            </span>
          </div>

          {drafts.map((d, dIdx) => {
            const isCE =
              d.alternativas.length === 2 &&
              d.alternativas.some((a) => a.trim().toLowerCase() === "certo") &&
              d.alternativas.some((a) => a.trim().toLowerCase() === "errado");

            return (
              <div
                key={dIdx}
                className="flex flex-col gap-2.5 rounded-xl border border-border bg-surface p-3.5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="font-bold text-muted-foreground">#{dIdx + 1}</span>
                    <Badge>{d.banca || banca}</Badge>
                    <Badge variant="info">{d.dificuldade || dificuldade}</Badge>
                    <Badge variant={isCE ? "info" : "default"}>
                      {isCE ? "Certo/Errado" : `${d.alternativas.length} alternativas`}
                    </Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDraft(dIdx)}
                    className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                    title="Descartar esta questão"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap font-medium">
                  {d.enunciado}
                </p>

                {/* Seleção do Gabarito */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    Gabarito Oficial:
                  </span>

                  {isCE ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleOptionSelect(dIdx, "Certo")}
                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                          d.gabarito?.trim().toLowerCase() === "certo"
                            ? "border-emerald-500 bg-emerald-500/15 text-emerald-400 ring-2 ring-emerald-500/30"
                            : "border-border bg-surface-raised/40 text-muted-foreground hover:border-emerald-500/50 hover:text-foreground"
                        }`}
                      >
                        <Check className="size-3.5" /> CERTO
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOptionSelect(dIdx, "Errado")}
                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                          d.gabarito?.trim().toLowerCase() === "errado"
                            ? "border-rose-500 bg-rose-500/15 text-rose-400 ring-2 ring-rose-500/30"
                            : "border-border bg-surface-raised/40 text-muted-foreground hover:border-rose-500/50 hover:text-foreground"
                        }`}
                      >
                        <X className="size-3.5" /> ERRADO
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {d.alternativas.map((alt, aIdx) => {
                        const isSelected =
                          d.gabarito?.trim().toLowerCase() === alt.trim().toLowerCase();
                        return (
                          <button
                            key={aIdx}
                            type="button"
                            onClick={() => handleOptionSelect(dIdx, alt)}
                            className={`flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition-all ${
                              isSelected
                                ? "border-emerald-500 bg-emerald-500/10 text-foreground ring-1 ring-emerald-500/40"
                                : "border-border/70 bg-surface-raised/30 text-muted-foreground hover:border-border hover:text-foreground"
                            }`}
                          >
                            <span
                              className={`flex size-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${
                                isSelected
                                  ? "bg-emerald-500 text-white"
                                  : "bg-surface-raised text-muted-foreground"
                              }`}
                            >
                              {LETTERS[aIdx] ?? aIdx + 1}
                            </span>
                            <span className="flex-1 text-[11px] leading-snug">{alt}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {d.explicacao && (
                  <div className="rounded-lg bg-surface-raised/60 p-2.5 text-[11px] text-muted-foreground leading-relaxed border border-border/60">
                    <strong className="text-foreground">Fundamentação:</strong> {d.explicacao}
                  </div>
                )}
              </div>
            );
          })}

          {save.error && <ErrorState error={save.error} compact />}
        </div>
      )}
    </Dialog>
  );
}
