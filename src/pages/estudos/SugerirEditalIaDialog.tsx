import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Sparkles, Check, CheckSquare, Square, ChevronDown, ChevronRight, Layers } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/ui/ErrorState";

interface SubjectSuggestion {
  materia: string;
  assuntos: string[];
}

export function SugerirEditalIaDialog({
  open,
  onClose,
  planId,
  planName,
  planObjective,
}: {
  open: boolean;
  onClose: () => void;
  planId: number;
  planName: string;
  planObjective?: string | null;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [cargo, setCargo] = useState(planObjective || planName || "Dataprev - Analista de Tecnologia");
  const [loadingAi, setLoadingAi] = useState(false);
  const [grade, setGrade] = useState<SubjectSuggestion[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<Record<number, boolean>>({});
  const [selectedTopics, setSelectedTopics] = useState<Record<string, boolean>>({}); // key: `${subIdx}-${topIdx}`
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [savingProgress, setSavingProgress] = useState<{ current: number; total: number } | null>(null);

  const handleGerar = async () => {
    setLoadingAi(true);
    try {
      const prompt = `Você é um coordenador pedagógico sênior especialista em concursos públicos brasileiros.
Elabore uma grade programática completa e estruturada de matérias e assuntos para o concurso/cargo: "${cargo}".

Gere entre 4 a 7 matérias principais (ex.: Língua Portuguesa, Raciocínio Lógico, Direito Constitucional, Conhecimentos Específicos...), e para cada matéria liste entre 4 a 8 tópicos fundamentais e frequentes em editais.

Retorne APENAS um array JSON válido sem markdown ou texto extra, no seguinte formato:
[
  {
    "materia": "Nome da Matéria",
    "assuntos": [
      "Tópico 1",
      "Tópico 2",
      "Tópico 3"
    ]
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
        setGrade(parsed);
        const subSel: Record<number, boolean> = {};
        const topSel: Record<string, boolean> = {};
        const exp: Record<number, boolean> = {};

        parsed.forEach((sub, sIdx) => {
          subSel[sIdx] = true;
          exp[sIdx] = true;
          sub.assuntos?.forEach((_: any, tIdx: number) => {
            topSel[`${sIdx}-${tIdx}`] = true;
          });
        });

        setSelectedSubjects(subSel);
        setSelectedTopics(topSel);
        setExpanded(exp);
        toast(`Grade gerada com ${parsed.length} matérias sugeridas!`, "success");
      } else {
        throw new Error("Formato inválido retornado pela IA");
      }
    } catch (err: any) {
      toast("Não foi possível gerar a grade no momento. Tente novamente.", "error");
    } finally {
      setLoadingAi(false);
    }
  };

  const totalAssuntosSelecionados = Object.entries(selectedTopics).filter(
    ([k, v]) => {
      const [sIdx] = k.split("-").map(Number);
      return v && selectedSubjects[sIdx];
    }
  ).length;

  const totalMateriasSelecionadas = Object.values(selectedSubjects).filter(Boolean).length;

  const handleSalvarTudo = async () => {
    if (totalMateriasSelecionadas === 0) return;
    setSavingProgress({ current: 0, total: totalMateriasSelecionadas });

    try {
      let matSalvas = 0;
      for (let sIdx = 0; sIdx < grade.length; sIdx++) {
        if (!selectedSubjects[sIdx]) continue;
        const s = grade[sIdx];

        // Cria a matéria
        const createdSubject = await api.createSubject(planId, { nome: s.materia });

        // Cria os tópicos selecionados dessa matéria
        if (s.assuntos && s.assuntos.length > 0) {
          for (let tIdx = 0; tIdx < s.assuntos.length; tIdx++) {
            if (selectedTopics[`${sIdx}-${tIdx}`]) {
              await api.createTopic(createdSubject.id, { nome: s.assuntos[tIdx] });
            }
          }
        }

        matSalvas++;
        setSavingProgress({ current: matSalvas, total: totalMateriasSelecionadas });
      }

      qc.invalidateQueries({ queryKey: ["subjects", planId] });
      qc.invalidateQueries({ queryKey: ["study-plans"] });
      qc.invalidateQueries({ queryKey: ["study-plan", planId] });
      toast("Edital e matérias importados com sucesso para o seu plano!", "success");
      onClose();
    } catch (err: any) {
      toast(err?.message || "Ocorreu um erro ao importar algumas matérias.", "error");
    } finally {
      setSavingProgress(null);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => !savingProgress && !loadingAi && onClose()}
      title="Estruturar Edital com IA"
      description="Informe o concurso e a IA criará toda a grade de matérias e assuntos correspondente."
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loadingAi || Boolean(savingProgress)}>
            Cancelar
          </Button>
          {grade.length === 0 ? (
            <Button size="sm" onClick={handleGerar} loading={loadingAi}>
              <Sparkles className="size-3.5" /> Gerar grade do edital
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSalvarTudo}
              disabled={totalMateriasSelecionadas === 0 || Boolean(savingProgress)}
            >
              {savingProgress
                ? `Importando (${savingProgress.current}/${savingProgress.total})...`
                : `Importar ${totalMateriasSelecionadas} matérias (${totalAssuntosSelecionados} assuntos)`}
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Input
          label="Concurso, Cargo ou Órgão"
          value={cargo}
          onChange={(e) => setCargo(e.target.value)}
          placeholder="Ex.: Dataprev - Analista de TI, TJSP Escrevente, Receita Federal Auditor"
          disabled={loadingAi || Boolean(savingProgress)}
        />

        {loadingAi && (
          <Loading label="A inteligência artificial está estruturando a grade de disciplinas e assuntos de concurso..." />
        )}

        {savingProgress && (
          <Loading
            label={`Importando matérias no seu plano (${savingProgress.current} de ${savingProgress.total})...`}
          />
        )}

        {grade.length > 0 && !savingProgress && (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>Grade sugerida ({grade.length} matérias):</span>
              <span className="text-primary">
                {totalMateriasSelecionadas} matérias · {totalAssuntosSelecionados} assuntos
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {grade.map((sub, sIdx) => {
                const isSubSelected = Boolean(selectedSubjects[sIdx]);
                const isExp = Boolean(expanded[sIdx]);
                return (
                  <div
                    key={sIdx}
                    className={`rounded-lg border transition-colors ${
                      isSubSelected
                        ? "border-border bg-surface"
                        : "border-border/40 bg-surface-raised/20 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-2 p-2.5">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedSubjects((prev) => ({ ...prev, [sIdx]: !prev[sIdx] }))
                        }
                      >
                        {isSubSelected ? (
                          <CheckSquare className="size-4 text-primary" />
                        ) : (
                          <Square className="size-4 text-muted-foreground" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpanded((prev) => ({ ...prev, [sIdx]: !prev[sIdx] }))}
                        className="flex flex-1 items-center justify-between text-left text-xs font-semibold"
                      >
                        <span className="truncate">{sub.materia}</span>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <span className="text-[11px] font-normal">
                            {sub.assuntos?.length ?? 0} assuntos
                          </span>
                          {isExp ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                        </div>
                      </button>
                    </div>

                    {isExp && isSubSelected && (
                      <div className="border-t border-border/60 bg-surface-raised/30 p-2.5 pl-8 space-y-1">
                        {sub.assuntos?.map((assunto, tIdx) => {
                          const k = `${sIdx}-${tIdx}`;
                          const isTopSel = Boolean(selectedTopics[k]);
                          return (
                            <button
                              key={tIdx}
                              type="button"
                              onClick={() =>
                                setSelectedTopics((prev) => ({ ...prev, [k]: !prev[k] }))
                              }
                              className="flex w-full items-center gap-2 text-left text-xs text-muted-foreground hover:text-foreground py-0.5"
                            >
                              {isTopSel ? (
                                <CheckSquare className="size-3.5 text-primary shrink-0" />
                              ) : (
                                <Square className="size-3.5 shrink-0" />
                              )}
                              <span className="truncate">{assunto}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
