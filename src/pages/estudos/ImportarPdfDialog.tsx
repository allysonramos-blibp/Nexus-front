import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, FileUp, Upload } from "lucide-react";
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

  const extract = useMutation({
    mutationFn: (f: File) => api.extractQuestionsFromPdf(f),
    onSuccess: (res) => {
      setDrafts(res.questoes);
      if (res.questoes.length === 0) {
        toast("Não encontrei questões nesse PDF.", "error");
      }
      // possivelTotalNoPdf é uma estimativa heurística (regex), não uma contagem exata — só
      // alertamos quando o resultado real ficou BEM abaixo dela, pra evitar alarme falso.
      const esperado = res.possivelTotalNoPdf;
      if (esperado > 0 && res.total < esperado * 0.8) {
        setExtractionWarning(
          `Importação possivelmente incompleta: o PDF parece ter ~${esperado} questão(ões), mas só ${res.total} foram extraídas.` +
            (res.chunksComFalha > 0
              ? ` ${res.chunksComFalha} de ${res.chunksProcessados} trecho(s) do processamento falharam — tente importar de novo.`
              : " Revise se faltou alguma seção do PDF (ex.: outra disciplina) antes de confirmar."),
        );
      } else if (res.chunksComFalha > 0) {
        setExtractionWarning(
          `${res.chunksComFalha} de ${res.chunksProcessados} trecho(s) do PDF falharam durante o processamento — algumas questões podem estar faltando. Tente importar de novo se parecer incompleto.`,
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
      toast(`${created.length} questão(ões) importada(s).`, "success");
      handleClose();
    },
  });

  function handleClose() {
    setFile(null);
    setDrafts(null);
    setExpanded(null);
    setExtractionWarning(null);
    extract.reset();
    confirm.reset();
    onClose();
  }

  const semGabaritoCount = (drafts ?? []).filter((d) => !d.gabarito.trim()).length;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Importar questões de um PDF"
      description={
        drafts
          ? "Revise antes de confirmar — a extração automática pode errar, principalmente o gabarito."
          : "Funciona melhor com PDFs de texto selecionável (não escaneados/imagem)."
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
              Importar {drafts.length} questão(ões)
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
            <span className="text-xs text-muted-foreground">Até 10MB</span>
          </button>
          {extract.isPending && <Loading label="Lendo o PDF e extraindo as questões — pode levar um minuto…" />}
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
          {semGabaritoCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-gym/30 bg-gym/10 px-3 py-2 text-xs text-gym">
              <AlertTriangle className="size-4 shrink-0" />
              {semGabaritoCount} questão(ões) sem gabarito identificado — marque manualmente antes de importar
              (clique para expandir).
            </div>
          )}
          {drafts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nada pra importar.</p>
          ) : (
            drafts.map((d, i) => (
              <QuestaoDraftCard
                key={i}
                draft={d}
                index={i}
                expanded={expanded === i}
                onToggle={() => setExpanded(expanded === i ? null : i)}
                onChange={(next) => setDrafts((arr) => arr!.map((v, idx) => (idx === i ? next : v)))}
                onRemove={() => {
                  setDrafts((arr) => arr!.filter((_, idx) => idx !== i));
                  setExpanded(null);
                }}
              />
            ))
          )}
          {confirm.error && <ErrorState error={confirm.error} compact />}
          <div className="flex justify-between border-t border-border pt-2">
            <Badge>{drafts.length} questão(ões)</Badge>
            {semGabaritoCount > 0 && <Badge variant="warning">{semGabaritoCount} sem gabarito</Badge>}
          </div>
        </div>
      )}
    </Dialog>
  );
}
