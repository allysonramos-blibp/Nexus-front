import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ListPlus, Sparkles, Check, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/ui/ErrorState";

export function AdicionarAssuntosLoteDialog({
  open,
  onClose,
  subjectId,
  subjectName,
  planId,
}: {
  open: boolean;
  onClose: () => void;
  subjectId: number;
  subjectName: string;
  planId: number;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [rawText, setRawText] = useState("");

  const parsedTopics = useMemo(() => {
    if (!rawText.trim()) return [];
    return rawText
      .split("\n")
      .map((line) => {
        return line
          .replace(/^\s*(\d+[\.\-\)]|[a-zA-Z][\.\-\)]|[•\-\*\>])\s*/, "")
          .trim();
      })
      .filter((line) => line.length > 0);
  }, [rawText]);

  const [savingProgress, setSavingProgress] = useState<{ current: number; total: number } | null>(null);

  const handleSave = async () => {
    if (parsedTopics.length === 0) return;
    setSavingProgress({ current: 0, total: parsedTopics.length });

    try {
      for (let i = 0; i < parsedTopics.length; i++) {
        const nome = parsedTopics[i];
        await api.createTopic(subjectId, { nome });
        setSavingProgress({ current: i + 1, total: parsedTopics.length });
      }

      qc.invalidateQueries({ queryKey: ["topics", subjectId] });
      qc.invalidateQueries({ queryKey: ["study-plans"] });
      qc.invalidateQueries({ queryKey: ["study-plan", planId] });
      toast(`${parsedTopics.length} assunto(s) adicionado(s) com sucesso!`, "success");
      setRawText("");
      onClose();
    } catch (err: any) {
      toast(err?.message || "Ocorreu um erro ao salvar alguns assuntos.", "error");
    } finally {
      setSavingProgress(null);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => !savingProgress && onClose()}
      title="Adicionar Assuntos em Lote"
      description={`Cole a lista de tópicos do edital para a matéria "${subjectName}".`}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={Boolean(savingProgress)}>
            Cancelar
          </Button>
          <Button
            size="sm"
            disabled={parsedTopics.length === 0 || Boolean(savingProgress)}
            onClick={handleSave}
          >
            {savingProgress
              ? `Salvando (${savingProgress.current}/${savingProgress.total})...`
              : `Adicionar ${parsedTopics.length} assunto(s)`}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Textarea
          label="Tópicos (um por linha)"
          rows={6}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder={`Exemplo copiado do edital:\n1. Conceitos básicos e princípios fundamentais\n2. Direitos individuais e coletivos\n3. Organização do Estado e competências\n4. Administração Pública`}
          disabled={Boolean(savingProgress)}
        />

        {parsedTopics.length > 0 && (
          <div className="rounded-lg border border-border bg-surface-raised/40 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                Assuntos identificados ({parsedTopics.length})
              </span>
              <Badge variant="info">Prontos para salvar</Badge>
            </div>
            <ul className="max-h-36 overflow-y-auto space-y-1 text-xs text-muted-foreground pr-1">
              {parsedTopics.map((top, idx) => (
                <li key={idx} className="flex items-center gap-2 truncate py-0.5">
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                    {idx + 1}
                  </span>
                  <span className="truncate">{top}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {savingProgress && (
          <Loading
            label={`Cadastrando assunto ${savingProgress.current} de ${savingProgress.total}...`}
          />
        )}
      </div>
    </Dialog>
  );
}
