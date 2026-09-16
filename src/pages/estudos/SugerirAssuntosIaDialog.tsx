import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Sparkles, Check, CheckSquare, Square } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/ui/ErrorState";

export function SugerirAssuntosIaDialog({
  open,
  onClose,
  subjectId,
  subjectName,
  planId,
  planName,
  planObjective,
}: {
  open: boolean;
  onClose: () => void;
  subjectId: number;
  subjectName: string;
  planId: number;
  planName?: string;
  planObjective?: string | null;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [foco, setFoco] = useState(planObjective || planName || "Concurso Público");
  const [loadingAi, setLoadingAi] = useState(false);
  const [sugestoes, setSugestoes] = useState<string[]>([]);
  const [selecionados, setSelecionados] = useState<Record<number, boolean>>({});
  const [salvando, setSalvando] = useState(false);

  const handleGerar = async () => {
    setLoadingAi(true);
    try {
      const prompt = `Você é um coordenador pedagógico especialista em concursos públicos no Brasil.
Liste os 7 a 10 tópicos de edital mais importantes e frequentes para a disciplina "${subjectName}", considerando o concurso/foco: "${foco}".
Seja direto, usando a nomenclatura padrão dos editais de bancas como Cebraspe, FGV, FCC.

Retorne APENAS um array JSON de strings com os títulos dos assuntos, sem explicações ou markdown adicional:
[
  "Assunto 1",
  "Assunto 2",
  "Assunto 3"
]`;

      const res = await api.chat(prompt, []);
      let jsonStr = res.reply.trim();
      const codeBlock = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/i);
      if (codeBlock) {
        jsonStr = codeBlock[1].trim();
      }

      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const clean = parsed.map((item) => String(item).trim()).filter(Boolean);
        setSugestoes(clean);
        // Marca todos como selecionados por padrão
        const initSel: Record<number, boolean> = {};
        clean.forEach((_, idx) => {
          initSel[idx] = true;
        });
        setSelecionados(initSel);
        toast(`${clean.length} tópicos sugeridos pela IA!`, "success");
      } else {
        throw new Error("Formato inválido retornado pela IA");
      }
    } catch (err: any) {
      toast("Não foi possível gerar sugestões no momento. Tente novamente.", "error");
    } finally {
      setLoadingAi(false);
    }
  };

  const toggleSelect = (idx: number) => {
    setSelecionados((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const countSelecionados = Object.values(selecionados).filter(Boolean).length;

  const handleSalvarSelecionados = async () => {
    const toSave = sugestoes.filter((_, idx) => selecionados[idx]);
    if (toSave.length === 0) return;

    setSalvando(true);
    try {
      for (const nome of toSave) {
        await api.createTopic(subjectId, { nome });
      }

      qc.invalidateQueries({ queryKey: ["topics", subjectId] });
      qc.invalidateQueries({ queryKey: ["study-plans"] });
      qc.invalidateQueries({ queryKey: ["study-plan", planId] });
      toast(`${toSave.length} assunto(s) adicionado(s) à matéria!`, "success");
      onClose();
    } catch (err: any) {
      toast(err?.message || "Erro ao salvar assuntos.", "error");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => !salvando && !loadingAi && onClose()}
      title="Sugerir Tópicos com IA"
      description={`A IA analisará os editais mais recentes e sugerirá os tópicos essenciais de "${subjectName}".`}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loadingAi || salvando}>
            Cancelar
          </Button>
          {sugestoes.length === 0 ? (
            <Button size="sm" onClick={handleGerar} loading={loadingAi}>
              <Sparkles className="size-3.5" /> Gerar sugestões
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSalvarSelecionados}
              disabled={countSelecionados === 0 || salvando}
              loading={salvando}
            >
              Adicionar {countSelecionados} selecionado(s)
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Input
          label="Concurso ou Foco do Estudo"
          value={foco}
          onChange={(e) => setFoco(e.target.value)}
          placeholder="Ex: Dataprev - Analista de TI, TJSP Escrevente, Polícia Federal"
          disabled={loadingAi || salvando}
        />

        {loadingAi && (
          <Loading label="A inteligência artificial está mapeando os editais para sugerir os melhores tópicos..." />
        )}

        {sugestoes.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>Selecione os tópicos para incluir:</span>
              <button
                type="button"
                onClick={() => {
                  const allSelected = countSelecionados === sugestoes.length;
                  const newSel: Record<number, boolean> = {};
                  sugestoes.forEach((_, idx) => {
                    newSel[idx] = !allSelected;
                  });
                  setSelecionados(newSel);
                }}
                className="text-primary hover:underline"
              >
                {countSelecionados === sugestoes.length ? "Desmarcar todos" : "Marcar todos"}
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {sugestoes.map((top, idx) => {
                const isChecked = Boolean(selecionados[idx]);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleSelect(idx)}
                    className={`flex w-full items-center gap-2.5 rounded-lg border p-2 text-left text-xs transition-colors ${
                      isChecked
                        ? "border-primary/40 bg-primary/5 text-foreground"
                        : "border-border/60 bg-surface-raised/30 text-muted-foreground hover:border-border"
                    }`}
                  >
                    {isChecked ? (
                      <CheckSquare className="size-4 shrink-0 text-primary" />
                    ) : (
                      <Square className="size-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="flex-1 font-medium">{top}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
