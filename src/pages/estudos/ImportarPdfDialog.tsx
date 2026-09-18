import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, FileUp, Filter, Upload } from "lucide-react";
import { api, type QuestionRequest } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/ui/ErrorState";
import { Badge } from "@/components/ui/Badge";
import { QuestaoDraftCard } from "./QuestaoDraftCard";

export function ImportarPdfDialog({
  open,
  onClose,
  topicId,
}: {
  open: boolean;
  onClose: () => void;
  topicId: number;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drafts, setDrafts] = useState<QuestionRequest[] | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [extractionWarning, setExtractionWarning] = useState<string | null>(null);
  const [filterSemGabarito, setFilterSemGabarito] = useState(false);

  const extract = useMutation({
    mutationFn: (f: File) => api.extractQuestionsFromPdf(f),
    onSuccess: (res) => {
      setDrafts(res.questoes);
      if (res.questoes.length === 0) {
        toast("Não encontrei questões nesse PDF.", "error");
      }
      const esperado = res.possivelTotalNoPdf;
      if (esperado > 0 && res.total < esperado * 0.8) {
        setExtractionWarning(
          `Importação possivelmente incompleta: o PDF parece ter ~${esperado} questão(ões), mas só ${res.total} foram extraídas.` +
            (res.chunksComFalha > 0
              ? ` ${res.chunksComFalha} de ${res.chunksProcessados} trecho(s) falharam — importe o que veio e tente de novo depois.`
              : " Revise se faltou alguma seção do PDF antes de confirmar."),
        );
      } else if (res.chunksComFalha > 0) {
        setExtractionWarning(
          `${res.chunksComFalha} de ${res.chunksProcessados} trecho(s) do PDF falharam nas tentativas automáticas.`,
        );
      } else {
        setExtractionWarning(null);
      }
    },
  });

  const confirm = useMutation({
    mutationFn: () => api.bulkCreateQuestions(topicId, drafts ?? []),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ["questions", topicId] });
      toast(`${created.length} questão(ões) importada(s) com sucesso.`, "success");
      handleClose();
    },
  });

  function handleClose() {
    setFile(null);
    setDrafts(null);
    setExpanded(null);
    setExtractionWarning(null);
    setFilterSemGabarito(false);
    extract.reset();
    confirm.reset();
    onClose();
  }

  const semGabaritoCount = (drafts ?? []).filter((d) => !d.gabarito.trim()).length;

  const displayedDrafts = (drafts ?? []).map((draft, originalIndex) => ({
    draft,
    originalIndex,
  })).filter((item) => (filterSemGabarito ? !item.draft.gabarito.trim() : true));

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Importar questões de um PDF"
      description={
        drafts
          ? "Revise antes de confirmar — você pode salvar todas de uma vez ou corrigir gabaritos."
          : "Funciona com provas e apostilas em PDF com texto selecionável."
      }
      className="max-w-2xl"
      footer={
        drafts ? (
          <>
            <Button variant="ghost" size="sm" onClick={handleClose} disabled={confirm.isPending}>
              Cancelar
            </Button>
            <Button
              size="sm"
              loading={confirm.isPending}
              disabled={drafts.length === 0}
              onClick={() => confirm.mutate()}
            >
              Salvar Todas ({drafts.length} questões)
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              size="sm"
              loading={extract.isPending}
              disabled={!file}
              onClick={() => file && extract.mutate(file)}
            >
              <Upload className="size-4" /> Extrair questões
            </Button>
          </>
        )
      }
    >
      {!drafts && (
        <div className="flex flex-col gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-10 text-center transition-colors hover:border-dash/60"
          >
            <FileUp className="size-6 text-muted-foreground" />
            <span className="text-sm text-foreground">{file ? file.name : "Escolher arquivo PDF"}</span>
            <span className="text-xs text-muted-foreground">Provas, apostilas e listas de questões (até 10MB)</span>
          </button>
          {extract.isPending && (
            <Loading label="Lendo o PDF e extraindo as questões com IA — aguarde um momento..." />
          )}
          {extract.error && <ErrorState error={extract.error} compact />}
        </div>
      )}

      {drafts && (
        <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto pr-1">
          {extractionWarning && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              {extractionWarning}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterSemGabarito(false)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  !filterSemGabarito
                    ? "bg-surface-raised text-foreground border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Todas ({drafts.length})
              </button>
              {semGabaritoCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterSemGabarito(true)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                    filterSemGabarito
                      ? "bg-gym/20 text-gym border border-gym/40"
                      : "text-gym/80 hover:text-gym"
                  }`}
                >
                  <AlertTriangle className="size-3" />
                  Sem Gabarito ({semGabaritoCount})
                </button>
              )}
            </div>

            {semGabaritoCount === 0 && (
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="size-3.5" /> Gabaritos prontos para salvar
              </span>
            )}
          </div>

          {displayedDrafts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma questão encontrada com o filtro selecionado.
            </p>
          ) : (
            displayedDrafts.map(({ draft, originalIndex }) => (
              <QuestaoDraftCard
                key={originalIndex}
                draft={draft}
                index={originalIndex}
                expanded={expanded === originalIndex}
                onToggle={() => setExpanded(expanded === originalIndex ? null : originalIndex)}
                onChange={(next) =>
                  setDrafts((arr) => arr!.map((v, idx) => (idx === originalIndex ? next : v)))
                }
                onRemove={() => {
                  setDrafts((arr) => arr!.filter((_, idx) => idx !== originalIndex));
                  setExpanded(null);
                }}
              />
            ))
          )}

          {confirm.error && <ErrorState error={confirm.error} compact />}
        </div>
      )}
    </Dialog>
  );
}
