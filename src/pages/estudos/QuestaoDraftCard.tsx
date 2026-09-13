import { AlertTriangle, ChevronDown, ChevronUp, Lightbulb, Minus, Plus, Trash2 } from "lucide-react";
import { difficultyLabel, type QuestionDifficulty, type QuestionRequest } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";

const LETTERS = ["A", "B", "C", "D", "E"];
const DIFFICULTIES: QuestionDifficulty[] = ["FACIL", "MEDIA", "DIFICIL"];

/**
 * Card de edição de uma questão em rascunho (vinda de extração por PDF). Usado tanto pelo
 * importador antigo (por Assunto já aberto) quanto pelo novo importador por Plano — nenhuma
 * lógica de edição de questão é duplicada entre os dois fluxos.
 */
export function QuestaoDraftCard({
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
