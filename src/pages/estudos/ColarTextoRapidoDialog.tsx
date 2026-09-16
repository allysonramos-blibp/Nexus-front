import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ClipboardPaste,
  HelpCircle,
  Pencil,
  Sparkles,
  Trash2,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { api, type QuestionRequest } from "@/lib/api";
import { parseRawQuestionText } from "@/lib/questionTextParser";
import { useToast } from "@/contexts/ToastContext";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/ui/ErrorState";

const LETTERS = ["A", "B", "C", "D", "E"];

const SAMPLE_CE = `(CESPE / CEBRASPE - 2024 - Polícia Federal - Agente)
No que tange aos direitos fundamentais previstos na CF/88, julgue o item subsequente:
A casa é asilo inviolável do indivíduo, ninguém nela podendo penetrar sem consentimento do morador, salvo em caso de flagrante delito ou desastre, ou para prestar socorro, ou, durante o dia, por determinação judicial.
( ) Certo
( ) Errado
Gabarito: Certo
Comentário: Cópia literal do artigo 5º, inciso XI, da CF/88.`;

const SAMPLE_ME = `(FGV - 2024 - Tribunal de Justiça)
Sobre os direitos políticos previstos na Constituição Federal, assinale a opção correta:
A) O voto é facultativo para os analfabetos e maiores de 70 anos.
B) É permitido o alistamento eleitoral de conscritos durante o serviço militar obrigatório.
C) A idade mínima de 18 anos é exigida para o cargo de Deputado Federal.
D) A soberania popular é exercida exclusivamente pelo sufrágio universal.
E) O mandato eletivo não poderá ser impugnado ante a Justiça Eleitoral.
Gabarito: A
Explicação: Nos termos do art. 14, § 1º, II, o voto é facultativo para analfabetos, maiores de 70 anos e maiores de 16 e menores de 18 anos.`;

export function ColarTextoRapidoDialog({
  open,
  onClose,
  topicId,
  topicName,
}: {
  open: boolean;
  onClose: () => void;
  topicId: number;
  topicName?: string;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [rawText, setRawText] = useState("");
  const [drafts, setDrafts] = useState<QuestionRequest[] | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const handleParseLocal = () => {
    if (!rawText.trim()) return;
    const parsed = parseRawQuestionText(rawText);
    if (parsed.length === 0) {
      toast("Não consegui estruturar o texto automaticamente. Tente a opção 'Formatar com IA'.", "error");
      return;
    }
    setDrafts(parsed);
    toast(`${parsed.length} questão(ões) identificada(s)!`, "success");
  };

  const handleParseAi = async () => {
    if (!rawText.trim()) return;
    setIsAiProcessing(true);
    try {
      const prompt = `Analise o texto a seguir de questões de concurso público e extraia em formato JSON estrito:
Texto a ser analisado:
"""
${rawText.slice(0, 4000)}
"""

Retorne APENAS um array JSON válido de objetos com o formato:
[
  {
    "enunciado": "texto do enunciado ou item para julgar",
    "alternativas": ["Certo", "Errado"] ou ["texto A", "texto B", "texto C", "texto D", "texto E"],
    "gabarito": "Certo" ou texto exato da alternativa correta,
    "explicacao": "justificativa ou comentário se houver, ou null",
    "banca": "CEBRASPE, FGV, FCC, etc. ou null",
    "ano": 2024 ou null,
    "dificuldade": "MEDIA"
  }
]
Não inclua comentários adicionais ou markdown fora do JSON.`;

      const res = await api.chat(prompt, []);
      let jsonStr = res.reply.trim();
      const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/i);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      }

      const parsedJson = JSON.parse(jsonStr);
      if (Array.isArray(parsedJson) && parsedJson.length > 0) {
        setDrafts(parsedJson);
        toast(`${parsedJson.length} questão(ões) organizadas com sucesso pela IA!`, "success");
      } else {
        throw new Error("Formato inválido retornado pela IA");
      }
    } catch (err) {
      // Fallback para parser local
      const local = parseRawQuestionText(rawText);
      if (local.length > 0) {
        setDrafts(local);
        toast(`${local.length} questão(ões) identificadas pelo leitor rápido.`, "info");
      } else {
        toast("Erro ao formatar com IA. Verifique o texto colado.", "error");
      }
    } finally {
      setIsAiProcessing(false);
    }
  };

  const save = useMutation({
    mutationFn: () => api.bulkCreateQuestions(topicId, drafts ?? []),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["questions", topicId] });
      toast(`${res.length} questão(ões) cadastrada(s) no assunto!`, "success");
      handleReset();
      onClose();
    },
    onError: () => toast("Erro ao cadastrar questões. Tente novamente.", "error"),
  });

  const handleReset = () => {
    setRawText("");
    setDrafts(null);
    setIsAiProcessing(false);
  };

  const handleOptionSelect = (draftIndex: number, optionText: string) => {
    setDrafts((prev) =>
      prev
        ? prev.map((d, i) => (i === draftIndex ? { ...d, gabarito: optionText } : d))
        : null,
    );
  };

  const handleRemoveDraft = (draftIndex: number) => {
    setDrafts((prev) => {
      if (!prev) return null;
      const next = prev.filter((_, i) => i !== draftIndex);
      return next.length > 0 ? next : null;
    });
  };

  const semGabaritoCount = (drafts ?? []).filter((d) => !d.gabarito?.trim()).length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Colar Texto Rápido (Smart Paste)"
      description={
        drafts
          ? `Revise as questões identificadas antes de salvar em ${topicName ? `"${topicName}"` : "seu assunto"}.`
          : "Cole o texto copiado de qualquer site ou apostila — identificamos tudo automaticamente."
      }
      className="max-w-2xl"
      footer={
        drafts ? (
          <>
            <Button variant="ghost" size="sm" onClick={() => setDrafts(null)} disabled={save.isPending}>
              <ArrowLeft className="size-4" /> Voltar ao texto
            </Button>
            <Button
              size="sm"
              loading={save.isPending}
              disabled={drafts.length === 0 || semGabaritoCount > 0}
              onClick={() => save.mutate()}
            >
              Salvar {drafts.length} questão(ões)
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isAiProcessing}>
              Cancelar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-study/40 text-study hover:bg-study/10"
              disabled={!rawText.trim() || isAiProcessing}
              onClick={handleParseAi}
            >
              <Sparkles className="size-4" /> Formatar com IA
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              disabled={!rawText.trim() || isAiProcessing}
              onClick={handleParseLocal}
            >
              <Zap className="size-4" /> Identificar e Visualizar
            </Button>
          </>
        )
      }
    >
      {!drafts ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <ClipboardPaste className="size-3.5" /> Cole a questão abaixo:
            </span>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-muted-foreground">Testar exemplo:</span>
              <button
                type="button"
                onClick={() => setRawText(SAMPLE_CE)}
                className="text-study hover:underline font-medium"
              >
                Certo/Errado
              </button>
              <span className="text-muted-foreground">•</span>
              <button
                type="button"
                onClick={() => setRawText(SAMPLE_ME)}
                className="text-study hover:underline font-medium"
              >
                Múltipla Escolha
              </button>
            </div>
          </div>

          <Textarea
            rows={10}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={`Cole aqui o texto da questão. Exemplo:\n\n(CESPE - 2024 - PF) Julgue o item:\nA casa é asilo inviolável...\n( ) Certo\n( ) Errado\nGabarito: Certo\n\nOu cole com A, B, C, D, E.`}
            className="font-mono text-xs leading-relaxed"
          />

          {isAiProcessing && (
            <Loading label="A IA do Nexus está estruturando o texto, identificando alternativas e gabarito..." />
          )}

          <div className="rounded-xl border border-border/80 bg-surface-raised/40 p-3 text-xs text-muted-foreground leading-relaxed flex items-start gap-2.5">
            <Zap className="size-4 text-study shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">Como funciona o Colar Rápido:</p>
              <p className="mt-0.5">
                Você pode colar <strong>uma ou várias questões de uma vez</strong>. O sistema reconhece
                banca (Cespe, FGV, FCC, etc.), ano, alternativas e gabarito. Se faltar gabarito, você só
                precisa clicar na opção certa na pré-visualização.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex max-h-[62vh] flex-col gap-3.5 overflow-y-auto pr-1">
          <div className="flex items-center justify-between pb-1 border-b border-border">
            <Badge>{drafts.length} questão(ões) identificada(s)</Badge>
            {semGabaritoCount > 0 ? (
              <Badge variant="warning">{semGabaritoCount} sem gabarito marcado</Badge>
            ) : (
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="size-3.5" /> Todos os gabaritos definidos
              </span>
            )}
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
                    {d.banca && <Badge>{d.banca}</Badge>}
                    {d.ano && <Badge>{d.ano}</Badge>}
                    <Badge variant={isCE ? "info" : "default"}>
                      {isCE ? "Certo/Errado" : `${d.alternativas.length} alternativas`}
                    </Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDraft(dIdx)}
                    className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                    title="Remover esta questão"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap font-medium">
                  {d.enunciado}
                </p>

                {/* Alternativas com seleção de gabarito em 1 clique */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    Gabarito (clique na opção para marcar):
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
                    <strong className="text-foreground">Comentário:</strong> {d.explicacao}
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
