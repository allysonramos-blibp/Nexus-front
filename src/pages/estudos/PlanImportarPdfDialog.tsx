import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ChevronDown, ChevronRight, FileUp, Upload } from "lucide-react";
import {
  api,
  type ExistingSubjectSummary,
  type PlanPdfExtractionResponse,
  type QuestionGroupImportRequest,
  type QuestionRequest,
} from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/ui/ErrorState";
import { Badge } from "@/components/ui/Badge";
import { QuestaoDraftCard } from "./QuestaoDraftCard";

/** Estado local editável de um grupo — começa a partir da sugestão da IA, mas o usuário
 * pode: trocar pra uma matéria/assunto já existente do plano, renomear o nome sugerido
 * (find-or-create por nome no backend), e mover questões entre grupos. */
interface GroupState {
  key: string;
  subjectMode: "new" | "existing";
  subjectNome: string;
  subjectId: number | null;
  topicMode: "new" | "existing";
  topicNome: string;
  topicId: number | null;
  questoes: QuestionRequest[];
}

let groupKeySeq = 0;
function nextGroupKey() {
  groupKeySeq += 1;
  return `g${groupKeySeq}`;
}

function groupLabel(g: GroupState): string {
  return `${g.subjectNome || "(sem nome)"} — ${g.topicNome || "(sem nome)"}`;
}

function buildInitialGroups(res: PlanPdfExtractionResponse): GroupState[] {
  return res.grupos.map((g) => ({
    key: nextGroupKey(),
    subjectMode: "new",
    subjectNome: g.subjectNome,
    subjectId: null,
    topicMode: "new",
    topicNome: g.topicNome,
    topicId: null,
    questoes: g.questoes,
  }));
}

function GroupHeader({
  group,
  materiasExistentes,
  onChange,
}: {
  group: GroupState;
  materiasExistentes: ExistingSubjectSummary[];
  onChange: (next: GroupState) => void;
}) {
  const existingSubject = materiasExistentes.find((s) => s.id === group.subjectId);

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Matéria</span>
          <button
            type="button"
            className="text-dash hover:underline"
            onClick={() =>
              onChange({
                ...group,
                subjectMode: group.subjectMode === "new" ? "existing" : "new",
                subjectId: null,
                // trocar de matéria invalida o assunto escolhido (pode não existir na nova matéria)
                topicMode: "new",
                topicId: null,
              })
            }
          >
            {group.subjectMode === "new" ? "usar existente" : "criar nova"}
          </button>
        </div>
        {group.subjectMode === "new" ? (
          <Input value={group.subjectNome} onChange={(e) => onChange({ ...group, subjectNome: e.target.value })} />
        ) : (
          <Select
            value={group.subjectId ?? ""}
            onChange={(e) =>
              onChange({
                ...group,
                subjectId: e.target.value ? Number(e.target.value) : null,
                topicMode: "new",
                topicId: null,
              })
            }
          >
            <option value="">Selecione…</option>
            {materiasExistentes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </Select>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Assunto</span>
          {group.subjectMode === "existing" && existingSubject && existingSubject.topics.length > 0 && (
            <button
              type="button"
              className="text-dash hover:underline"
              onClick={() =>
                onChange({
                  ...group,
                  topicMode: group.topicMode === "new" ? "existing" : "new",
                  topicId: null,
                })
              }
            >
              {group.topicMode === "new" ? "usar existente" : "criar novo"}
            </button>
          )}
        </div>
        {group.topicMode === "new" || !existingSubject ? (
          <Input value={group.topicNome} onChange={(e) => onChange({ ...group, topicNome: e.target.value })} />
        ) : (
          <Select
            value={group.topicId ?? ""}
            onChange={(e) => onChange({ ...group, topicId: e.target.value ? Number(e.target.value) : null })}
          >
            <option value="">Selecione…</option>
            {existingSubject.topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </Select>
        )}
      </div>
    </div>
  );
}

export function PlanImportarPdfDialog({
  open,
  onClose,
  planId,
}: {
  open: boolean;
  onClose: () => void;
  planId: number;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [extraction, setExtraction] = useState<PlanPdfExtractionResponse | null>(null);
  const [groups, setGroups] = useState<GroupState[]>([]);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [confirmIncomplete, setConfirmIncomplete] = useState(false);

  const extract = useMutation({
    mutationFn: (f: File) => api.extractQuestionsFromPdfForPlan(planId, f),
    onSuccess: (res) => {
      setExtraction(res);
      const built = buildInitialGroups(res);
      setGroups(built);
      setExpandedGroup(built[0]?.key ?? null);
      setConfirmIncomplete(false);
      if (res.totalExtraido === 0) {
        toast("Não encontrei questões nesse PDF.", "error");
      }
    },
  });

  const confirmImport = useMutation({
    mutationFn: () => {
      const payload: QuestionGroupImportRequest[] = groups
        .filter((g) => g.questoes.length > 0)
        .map((g) => ({
          subjectId: g.subjectMode === "existing" ? g.subjectId : null,
          subjectNome: g.subjectMode === "new" ? g.subjectNome : null,
          topicId: g.topicMode === "existing" ? g.topicId : null,
          topicNome: g.topicMode === "new" ? g.topicNome : null,
          questoes: g.questoes,
        }));
      return api.importQuestionsToPlan(planId, payload);
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["subjects", planId] });
      qc.invalidateQueries({ queryKey: ["study-plan", planId] });
      qc.invalidateQueries({ queryKey: ["study-plans"] });
      toast(`${res.totalSalvo} questão(ões) importada(s).`, "success");
      handleClose();
    },
  });

  function handleClose() {
    setFile(null);
    setExtraction(null);
    setGroups([]);
    setExpandedGroup(null);
    setExpandedQuestion(null);
    setConfirmIncomplete(false);
    extract.reset();
    confirmImport.reset();
    onClose();
  }

  function updateGroup(key: string, next: GroupState) {
    setGroups((arr) => arr.map((g) => (g.key === key ? next : g)));
  }

  function updateQuestion(groupKey: string, index: number, next: QuestionRequest) {
    setGroups((arr) =>
      arr.map((g) => (g.key === groupKey ? { ...g, questoes: g.questoes.map((q, i) => (i === index ? next : q)) } : g)),
    );
  }

  function removeQuestion(groupKey: string, index: number) {
    setGroups((arr) =>
      arr.map((g) => (g.key === groupKey ? { ...g, questoes: g.questoes.filter((_, i) => i !== index) } : g)),
    );
  }

  function moveQuestion(fromKey: string, index: number, toKey: string) {
    if (fromKey === toKey) return;
    setGroups((arr) => {
      const from = arr.find((g) => g.key === fromKey);
      const questao = from?.questoes[index];
      if (!questao) return arr;
      return arr.map((g) => {
        if (g.key === fromKey) return { ...g, questoes: g.questoes.filter((_, i) => i !== index) };
        if (g.key === toKey) return { ...g, questoes: [...g.questoes, questao] };
        return g;
      });
    });
  }

  const totalQuestoes = groups.reduce((sum, g) => sum + g.questoes.length, 0);
  const semGabaritoCount = groups.reduce((sum, g) => sum + g.questoes.filter((q) => !q.gabarito.trim()).length, 0);
  const questaoIncompleta = groups.some((g) =>
    g.questoes.some((q) => !q.enunciado.trim() || q.alternativas.length < 2),
  );

  const integridadeOk =
    extraction != null &&
    extraction.numerosAusentes.length === 0 &&
    extraction.chunksComFalha === 0 &&
    !questaoIncompleta;

  const podeConfirmar = totalQuestoes > 0 && (integridadeOk || confirmIncomplete);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Importar prova completa (PDF) para o plano"
      description={
        extraction
          ? "Revise os grupos detectados antes de confirmar — a IA classifica automaticamente por matéria e assunto."
          : "Funciona melhor com PDFs de texto selecionável (não escaneados/imagem). Não é preciso escolher matéria antes — a IA identifica cada questão."
      }
      className="max-w-2xl"
      footer={
        extraction ? (
          <>
            <Button variant="ghost" size="sm" onClick={handleClose} disabled={confirmImport.isPending}>
              Cancelar
            </Button>
            <Button
              size="sm"
              loading={confirmImport.isPending}
              disabled={!podeConfirmar}
              onClick={() => confirmImport.mutate()}
            >
              Importar {totalQuestoes} questão(ões)
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
      {!extraction && (
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
            <span className="text-xs text-muted-foreground">Até 10MB — pode conter várias matérias</span>
          </button>
          {extract.isPending && (
            <Loading label="Lendo o PDF, extraindo e classificando as questões por matéria — pode levar alguns minutos…" />
          )}
          {extract.error && <ErrorState error={extract.error} compact />}
        </div>
      )}

      {extraction && (
        <div className="flex max-h-[65vh] flex-col gap-3 overflow-y-auto pr-1">
          {extraction.numerosAusentes.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <span>
                Importação possivelmente incompleta: {extraction.numerosAusentes.length} questão(ões) detectada(s) no
                PDF não vieram na extração (números: {extraction.numerosAusentes.slice(0, 15).join(", ")}
                {extraction.numerosAusentes.length > 15 ? "…" : ""}).
              </span>
            </div>
          )}
          {extraction.chunksComFalha > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <span>
                {extraction.chunksComFalha} de {extraction.chunksProcessados} trecho(s) do PDF falharam durante o
                processamento — questões desses trechos não aparecem abaixo. Tente importar de novo.
              </span>
            </div>
          )}
          {questaoIncompleta && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <span>Uma ou mais questões estão sem enunciado ou com menos de 2 alternativas — corrija ou remova antes de importar.</span>
            </div>
          )}
          {extraction.numerosDuplicados.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {extraction.numerosDuplicados.length} número(s) de questão apareceram duplicados durante o
              processamento e já foram consolidados automaticamente.
            </p>
          )}

          {!integridadeOk && totalQuestoes > 0 && (
            <label className="flex items-start gap-2 rounded-lg border border-gym/30 bg-gym/10 px-3 py-2 text-xs text-gym">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={confirmIncomplete}
                onChange={(e) => setConfirmIncomplete(e.target.checked)}
              />
              <span>
                Entendo que a extração está incompleta ou tem pendências e quero importar assim mesmo (posso
                importar o restante depois, num novo PDF ou trecho).
              </span>
            </label>
          )}

          {semGabaritoCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-gym/30 bg-gym/10 px-3 py-2 text-xs text-gym">
              <AlertTriangle className="size-4 shrink-0" />
              {semGabaritoCount} questão(ões) sem gabarito identificado — marque manualmente antes de importar.
            </div>
          )}

          {groups.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nada pra importar.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {groups.map((g) =>
                g.questoes.length === 0 ? null : (
                  <div key={g.key} className="rounded-lg border border-border/70 bg-surface-raised">
                    <button
                      type="button"
                      onClick={() => setExpandedGroup(expandedGroup === g.key ? null : g.key)}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
                    >
                      {expandedGroup === g.key ? (
                        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="flex-1 truncate text-sm font-medium">
                        {g.subjectMode === "existing"
                          ? extraction.materiasExistentes.find((s) => s.id === g.subjectId)?.nome || "(escolha a matéria)"
                          : g.subjectNome || "(sem nome)"}
                        <span className="ml-1.5 font-normal text-muted-foreground">
                          —{" "}
                          {g.topicMode === "existing"
                            ? extraction.materiasExistentes
                                .find((s) => s.id === g.subjectId)
                                ?.topics.find((t) => t.id === g.topicId)?.nome || "(escolha o assunto)"
                            : g.topicNome || "(sem nome)"}
                        </span>
                      </span>
                      <Badge>{g.questoes.length}</Badge>
                    </button>

                    {expandedGroup === g.key && (
                      <div className="flex flex-col gap-3 border-t border-border p-3">
                        <GroupHeader
                          group={g}
                          materiasExistentes={extraction.materiasExistentes}
                          onChange={(next) => updateGroup(g.key, next)}
                        />
                        <div className="flex flex-col gap-2">
                          {g.questoes.map((q, i) => {
                            const qKey = `${g.key}:${i}`;
                            return (
                              <div key={i} className="flex flex-col gap-1.5">
                                <QuestaoDraftCard
                                  draft={q}
                                  index={i}
                                  expanded={expandedQuestion === qKey}
                                  onToggle={() => setExpandedQuestion(expandedQuestion === qKey ? null : qKey)}
                                  onChange={(next) => updateQuestion(g.key, i, next)}
                                  onRemove={() => removeQuestion(g.key, i)}
                                />
                                {groups.length > 1 && (
                                  <div className="flex items-center gap-1.5 pl-1 text-xs text-muted-foreground">
                                    <span>Mover para:</span>
                                    <select
                                      value=""
                                      onChange={(e) => e.target.value && moveQuestion(g.key, i, e.target.value)}
                                      className="rounded-md border border-border bg-surface px-1.5 py-0.5 text-xs"
                                    >
                                      <option value="">selecionar grupo…</option>
                                      {groups
                                        .filter((other) => other.key !== g.key)
                                        .map((other) => (
                                          <option key={other.key} value={other.key}>
                                            {groupLabel(other)}
                                          </option>
                                        ))}
                                    </select>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ),
              )}
            </div>
          )}

          {confirmImport.error && <ErrorState error={confirmImport.error} compact />}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
            <Badge>{totalQuestoes} questão(ões) no total</Badge>
            {semGabaritoCount > 0 && <Badge variant="warning">{semGabaritoCount} sem gabarito</Badge>}
          </div>
        </div>
      )}
    </Dialog>
  );
}
