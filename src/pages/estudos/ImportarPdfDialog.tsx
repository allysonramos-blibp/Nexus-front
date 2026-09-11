import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileUp,
  Lightbulb,
  Minus,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { api, difficultyLabel, type QuestionDifficulty, type QuestionRequest } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/ui/ErrorState";
import { Badge } from "@/components/ui/Badge";

const LETTERS = ["A", "B", "C", "D", "E"];
const DIFFICULTIES: QuestionDifficulty[] = ["FACIL", "MEDIA", "DIFICIL"];

function QuestaoDraftCard({
  draft,
  index,
  expanded,
  onToggle,
  onChange,
  onRemove,
}: {
  draft: QuestionRequest;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onChange: (next: QuestionRequest) => void;
  onRemove: () => void;
}) {
  const gabaritoIndex = draft.alternativas.findIndex(
    (a) => a.trim().toLowerCase() === draft.gabarito.trim().toLowerCase(),
  );
  const semGabarito = !draft.gabarito.trim();
  const temSugestao = Boolean(draft.disciplinaSugerida || draft.assuntoSugerido);

  return (
    <div className="rounded-lg border border-border/70 bg-surface-raised">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
      >
        <span className="text-xs text-muted-foreground">#{draft.numero ?? index + 1}</span>
        <span className="flex-1 truncate text-sm">{draft.enunciado || "(sem enunciado)"}</span>
        {draft.pegadinha && (
          <span title="A IA identificou uma possível pegadinha nessa questão">
            <Lightbulb className="size-4 shrink-0 text-dash" />
          </span>
        )}
        {semGabarito && (
          <span title="Gabarito não identificado">
            <AlertTriangle className="size-4 shrink-0 text-gym" />
          </span>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Remover questão ${index + 1} da importação`}
          className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </button>
        {expanded ? (
          <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="flex flex-col gap-3 border-t border-border p-3">
          {temSugestao && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">Sugestão da IA:</span>
              {draft.disciplinaSugerida && <Badge variant="info">{draft.disciplinaSugerida}</Badge>}
              {draft.assuntoSugerido && <Badge variant="info">{draft.assuntoSugerido}</Badge>}
              <span className="text-muted-foreground">— confira se bate com o tópico escolhido.</span>
            </div>
          )}
          <Textarea
            label="Enunciado"
            rows={3}
            value={draft.enunciado}
            onChange={(e) => onChange({ ...draft, enunciado: e.target.value })}
          />
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">Alternativas (marque a correta)</p>
            {draft.alternativas.map((alt, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onChange({ ...draft, gabarito: draft.alternativas[i] })}
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                    gabaritoIndex === i
                      ? "border-fin bg-fin text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-fin/60"
                  }`}
                >
                  {LETTERS[i] ?? i + 1}
                </button>
                <Input
                  value={alt}
                  onChange={(e) => {
                    const wasGabarito = gabaritoIndex === i;
                    const alternativas = draft.alternativas.map((v, idx) => (idx === i ? e.target.value : v));
                    onChange({ ...draft, alternativas, gabarito: wasGabarito ? e.target.value : draft.gabarito });
                  }}
                  className="flex-1"
                />
                {draft.alternativas.length > 2 && (
                  <button
                    type="button"
                    aria-label={`Remover alternativa ${LETTERS[i] ?? i + 1}`}
                    onClick={() =>
                      onChange({ ...draft, alternativas: draft.alternativas.filter((_, idx) => idx !== i) })
                    }
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Minus className="size-4" />
                  </button>
                )}
              </div>
            ))}
            {draft.alternativas.length < 5 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="self-start"
                onClick={() => onChange({ ...draft, alternativas: [...draft.alternativas, ""] })}
              >
                <Plus className="size-3.5" /> Adicionar alternativa
              </Button>
            )}
          </div>
          <Textarea
            label="Explicação (opcional)"
            rows={2}
            value={draft.explicacao ?? ""}
            onChange={(e) => onChange({ ...draft, explicacao: e.target.value })}
          />
          <Textarea
            label="Pegadinha (opcional)"
            rows={2}
            value={draft.pegadinha ?? ""}
            placeholder="O que a banca costuma fazer nesse tipo de questão…"
            onChange={(e) => onChange({ ...draft, pegadinha: e.target.value })}
          />
          <Select
            label="Dificuldade"
            value={draft.dificuldade ?? ""}
            onChange={(e) =>
              onChange({ ...draft, dificuldade: (e.target.value || null) as QuestionDifficulty | null })
            }
          >
            <option value="">—</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {difficultyLabel[d]}
              </option>
            ))}
          </Select>
        </div>
      )}
    </div>
  );
}

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

  const extract = useMutation({
    mutationFn: (f: File) => api.extractQuestionsFromPdf(f),
    onSuccess: (res) => {
      setDrafts(res.questoes);
      if (res.questoes.length === 0) {
        toast("Não encontrei questões nesse PDF.", "error");
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
