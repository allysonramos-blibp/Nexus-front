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
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/ui/ErrorState";
import { Badge } from "@/components/ui/Badge";
import { QuestaoDraftCard } from "./QuestaoDraftCard";

/** Estado local editável de um grupo — começa a partir da estrutura detectada no PDF, mas o usuário
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

function sanitizeGroupName(name: string): string {
  const trimmed = (name || "").trim();
  if (!trimmed) return "Geral";
  if (
    trimmed.length > 35 ||
    /^(according|the |pelo |ter |em |na |no |de |da |do |com |para |como |quando |onde |qual |quais |afirmar |julgue |assinale |sua menor)/i.test(trimmed) ||
    /[?:;.]$/.test(trimmed)
  ) {
    return "Geral";
  }
  return trimmed;
}

function buildInitialGroups(res: PlanPdfExtractionResponse): GroupState[] {
  return res.grupos.map((g) => ({
    key: nextGroupKey(),
    subjectMode: "new",
    subjectNome: sanitizeGroupName(g.subjectNome),
    subjectId: null,
    topicMode: "new",
    topicNome: sanitizeGroupName(g.topicNome),
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
          <SearchableSelect
            value={group.subjectId}
            onChange={(val) =>
              onChange({
                ...group,
                subjectId: val,
                topicMode: "new",
                topicId: null,
              })
            }
            options={materiasExistentes.map((s) => ({
              value: s.id,
              label: s.nome,
              badge: s.topics?.length ? `${s.topics.length} assuntos` : undefined,
            }))}
            placeholder="Selecione uma matéria…"
            searchPlaceholder="Buscar matéria..."
            modalTitle="Selecionar Matéria"
          />
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
          <SearchableSelect
            value={group.topicId}
            onChange={(val) => onChange({ ...group, topicId: val })}
            options={(existingSubject?.topics ?? []).map((t) => ({
              value: t.id,
              label: t.nome,
            }))}
            placeholder="Selecione um assunto…"
            searchPlaceholder="Buscar assunto..."
            modalTitle="Selecionar Assunto"
          />
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
  const [bulkSubjectId, setBulkSubjectId] = useState<number | null>(null);

  const extract = useMutation({
    mutationFn: (f: File) => api.extractQuestionsFromPdfForPlan(planId, f),
    onSuccess: (res) => {
      setExtraction(res);
      const built = buildInitialGroups(res);
      setGroups(built);
      setExpandedGroup(built[0]?.key ?? null);
      setConfirmIncomplete(false);
    setBulkSubjectId(null);
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
    setBulkSubjectId(null);
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
          ? "Revise os grupos detectados antes de confirmar. A extração das questões é feita localmente pelo parser do Nexus."
          : "Funciona melhor com PDFs de texto selecionável (não escaneados/imagem). O Nexus extrai as questões sem depender da IA."
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

          {/* Ação Rápida: Destino Unificado para todas as questões */}
          {extraction && groups.length > 0 && extraction.materiasExistentes.length > 0 && (
            <div className="rounded-lg border border-border bg-surface-raised/60 p-3 flex flex-col gap-2">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">
                  Atribuir todas as questões a uma matéria do plano:
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Evita criar matérias separadas para cada trecho do PDF.
                </span>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1">
                  <SearchableSelect
                    value={bulkSubjectId}
                    onChange={(val) => setBulkSubjectId(val)}
                    options={extraction.materiasExistentes.map((m) => ({ value: m.id, label: m.nome }))}
                    placeholder="Escolha a matéria de destino..."
                    searchPlaceholder="Buscar matéria do plano..."
                    modalTitle="Matéria para Todas as Questões"
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={bulkSubjectId == null}
                  onClick={() => {
                    if (bulkSubjectId == null) return;
                    const targetSub = extraction.materiasExistentes.find((m) => m.id === bulkSubjectId);
                    setGroups((prev) =>
                      prev.map((g) => ({
                        ...g,
                        subjectMode: "existing",
                        subjectId: bulkSubjectId,
                        subjectNome: targetSub?.nome || "",
                        topicMode: "new",
                        topicNome: "Geral",
                        topicId: null,
                      }))
                    );
                    toast(`Todas as questões foram vinculadas a "${targetSub?.nome}" (Assunto: Geral)!`, "success");
                  }}
                  className="shrink-0"
                >
                  Aplicar a todas
                </Button>
              </div>
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