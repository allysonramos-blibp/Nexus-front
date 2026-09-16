import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { NotebookText, Trash2, Eye, FileEdit, RotateCcw, CheckCircle2, BookOpen } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { api, errorReasonLabel, type StudyError } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { EstudosTabs } from "./EstudosTabs";
import { CadernoErroDetalheDialog } from "./CadernoErroDetalheDialog";
import { getCadernoNote } from "@/lib/cadernoNotesStorage";

type StatusFiltro = "todos" | "pendente" | "atrasado" | "revisado";

function statusOf(e: StudyError): Exclude<StatusFiltro, "todos"> {
  if (e.resolvido) return "revisado";
  if (e.proximaRevisao && e.proximaRevisao <= new Date().toISOString().slice(0, 10)) return "atrasado";
  return "pendente";
}

const STATUS_LABEL: Record<Exclude<StatusFiltro, "todos">, string> = {
  pendente: "Pendente",
  atrasado: "Atrasado",
  revisado: "Revisado / Dominado",
};

export default function CadernoDeErrosPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["study-errors"],
    queryFn: api.listStudyErrors,
  });

  const [status, setStatus] = useState<StatusFiltro>("todos");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [busca, setBusca] = useState("");
  const [deleting, setDeleting] = useState<StudyError | null>(null);
  const [selectedError, setSelectedError] = useState<StudyError | null>(null);

  const resolve = useMutation({
    mutationFn: (id: number) => api.resolveStudyError(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["study-errors"] });
      qc.invalidateQueries({ queryKey: ["pending-reviews"] });
      toast("Marcado como revisado.", "success");
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteStudyError(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["study-errors"] });
      qc.invalidateQueries({ queryKey: ["pending-reviews"] });
      toast("Removido do caderno de erros.", "success");
      setDeleting(null);
    },
  });

  const errors = data ?? [];

  const stats = useMemo(() => {
    const total = errors.length;
    const dominados = errors.filter((e) => e.resolvido).length;
    const pendentes = errors.filter((e) => !e.resolvido).length;
    return { total, dominados, pendentes };
  }, [errors]);

  const filtered = useMemo(() => {
    return errors.filter((e) => {
      if (status !== "todos" && statusOf(e) !== status) return false;
      const dia = e.criadoEm.slice(0, 10);
      if (de && dia < de) return false;
      if (ate && dia > ate) return false;
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const noEnunciado = (e.enunciadoQuestao ?? "").toLowerCase().includes(termo);
        const naObs = (e.observacao ?? "").toLowerCase().includes(termo);
        const note = getCadernoNote(e.id);
        const naAnotacao = Boolean(
          (note?.resumoRegra ?? "").toLowerCase().includes(termo) ||
          (note?.anotacaoLivre ?? "").toLowerCase().includes(termo)
        );
        if (!noEnunciado && !naObs && !naAnotacao) return false;
      }
      return true;
    });
  }, [errors, status, de, ate, busca]);

  return (
    <AppShell title="Caderno de Erros" subtitle="Estudos">
      <EstudosTabs active="caderno-erros" />

      {/* Cartões de Indicador Rápido */}
      {errors.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          <Card className="p-3 sm:p-4">
            <p className="text-xs text-muted-foreground">Total de Questões</p>
            <p className="text-lg sm:text-xl font-bold text-foreground mt-0.5">{stats.total}</p>
          </Card>
          <Card className="p-3 sm:p-4">
            <p className="text-xs text-amber-400">Para Revisar / Estudar</p>
            <p className="text-lg sm:text-xl font-bold text-amber-400 mt-0.5">{stats.pendentes}</p>
          </Card>
          <Card className="p-3 sm:p-4">
            <p className="text-xs text-emerald-400">Dominadas / Superadas</p>
            <p className="text-lg sm:text-xl font-bold text-emerald-400 mt-0.5">{stats.dominados}</p>
          </Card>
        </div>
      )}

      {/* Filtros e Barra de Pesquisa */}
      <Card className="grid gap-3 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <Input
            label="Pesquisar no enunciado ou anotações"
            placeholder="Ex: prescrição, crase, artigo 5º..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as StatusFiltro)}>
          <option value="todos">Todos ({errors.length})</option>
          <option value="pendente">Pendente para Estudo</option>
          <option value="atrasado">Atrasado</option>
          <option value="revisado">Revisado / Dominado</option>
        </Select>
        <div className="grid grid-cols-2 gap-2">
          <Input label="De" type="date" value={de} onChange={(e) => setDe(e.target.value)} />
          <Input label="Até" type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
        </div>
      </Card>

      {isLoading && <Loading label="Carregando seu caderno de erros..." />}
      {error && <ErrorState error={error} onRetry={() => refetch()} />}

      {!isLoading && !error && errors.length === 0 && (
        <EmptyState
          icon={NotebookText}
          title="Nenhum erro registrado ainda"
          description="Quando você errar uma questão no treino ou simulado, toque em 'Registrar no caderno de erros' para abrir o ciclo de aprendizado com anotações e reteste."
        />
      )}

      {!isLoading && !error && errors.length > 0 && filtered.length === 0 && (
        <EmptyState title="Nada encontrado com esses filtros" description="Tente ajustar os filtros de busca ou período." />
      )}

      {filtered.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {filtered.map((e) => {
            const st = statusOf(e);
            const savedNote = getCadernoNote(e.id);
            const hasNotes = Boolean(savedNote?.resumoRegra || savedNote?.comoNaoErrar || savedNote?.anotacaoLivre);

            return (
              <Card
                key={e.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all hover:border-dash/40"
              >
                <div 
                  className="min-w-0 flex-1 cursor-pointer w-full"
                  onClick={() => setSelectedError(e)}
                >
                  <p className="line-clamp-2 text-sm font-medium text-foreground hover:text-dash transition-colors">
                    {e.enunciadoQuestao}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <Badge>{errorReasonLabel[e.motivo]}</Badge>
                    <Badge
                      variant={st === "revisado" ? "success" : st === "atrasado" ? "destructive" : "warning"}
                    >
                      {STATUS_LABEL[st]}
                    </Badge>
                    {hasNotes && (
                      <Badge variant="info" className="gap-1">
                        <FileEdit className="size-3" /> Tem anotações
                      </Badge>
                    )}
                    {e.proximaRevisao && <span>Revisão: {e.proximaRevisao}</span>}
                  </div>

                  {/* Resumo da anotação rápida do estudante */}
                  {savedNote?.resumoRegra ? (
                    <div className="mt-2 rounded-lg bg-surface-raised/70 border border-border/70 p-2 text-xs text-foreground/90">
                      <span className="font-semibold text-dash">Memorizar: </span>
                      {savedNote.resumoRegra}
                    </div>
                  ) : e.observacao ? (
                    <p className="mt-1.5 text-xs italic text-muted-foreground">
                      "{e.observacao}"
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50 w-full sm:w-auto justify-end">
                  <Button
                    size="sm"
                    variant="primary"
                    className="gap-1 text-xs"
                    onClick={() => setSelectedError(e)}
                  >
                    <BookOpen className="size-3.5" /> Estudar & Anotar
                  </Button>

                  {!e.resolvido ? (
                    <Button
                      size="sm"
                      variant="primary"
                      className="text-xs"
                      onClick={() => resolve.mutate(e.id)}
                      loading={resolve.isPending}
                    >
                      Marcar dominado
                    </Button>
                  ) : (
                    <Badge variant="success" className="text-xs">
                      <CheckCircle2 className="size-3 mr-1" /> Dominada
                    </Badge>
                  )}

                  <button
                    aria-label="Excluir registro"
                    onClick={() => setDeleting(e)}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Rico de Estudo, Anotações e Reteste da Questão do Caderno */}
      <CadernoErroDetalheDialog
        key={selectedError?.id ?? "none"}
        open={Boolean(selectedError)}
        onClose={() => setSelectedError(null)}
        studyError={selectedError}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        title="Remover do caderno de erros?"
        description="Esta questão sairá da lista de erros e não aparecerá nas revisões espaçadas."
        confirmLabel="Remover"
        loading={remove.isPending}
      />
    </AppShell>
  );
}
