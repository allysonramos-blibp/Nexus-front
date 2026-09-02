import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { NotebookText, Trash2 } from "lucide-react";
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

type StatusFiltro = "todos" | "pendente" | "atrasado" | "revisado";

function statusOf(e: StudyError): Exclude<StatusFiltro, "todos"> {
  if (e.resolvido) return "revisado";
  if (e.proximaRevisao && e.proximaRevisao <= new Date().toISOString().slice(0, 10)) return "atrasado";
  return "pendente";
}

const STATUS_LABEL: Record<Exclude<StatusFiltro, "todos">, string> = {
  pendente: "Pendente",
  atrasado: "Atrasado",
  revisado: "Revisado",
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
  const [deleting, setDeleting] = useState<StudyError | null>(null);

  const resolve = useMutation({
    mutationFn: (id: number) => api.resolveStudyError(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["study-errors"] });
      toast("Marcado como revisado.", "success");
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteStudyError(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["study-errors"] });
      toast("Removido do caderno de erros.", "success");
      setDeleting(null);
    },
  });

  const errors = data ?? [];
  const filtered = useMemo(() => {
    return errors.filter((e) => {
      if (status !== "todos" && statusOf(e) !== status) return false;
      const dia = e.criadoEm.slice(0, 10);
      if (de && dia < de) return false;
      if (ate && dia > ate) return false;
      return true;
    });
  }, [errors, status, de, ate]);

  return (
    <AppShell title="Caderno de Erros" subtitle="Estudos">
      <EstudosTabs active="caderno-erros" />

      <Card className="grid gap-3 sm:grid-cols-3">
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as StatusFiltro)}>
          <option value="todos">Todos</option>
          <option value="pendente">Pendente</option>
          <option value="atrasado">Atrasado</option>
          <option value="revisado">Revisado</option>
        </Select>
        <Input label="De" type="date" value={de} onChange={(e) => setDe(e.target.value)} />
        <Input label="Até" type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
      </Card>

      {isLoading && <Loading />}
      {error && <ErrorState error={error} onRetry={() => refetch()} />}
      {!isLoading && !error && errors.length === 0 && (
        <EmptyState
          icon={NotebookText}
          title="Nenhum erro registrado ainda"
          description="Quando você errar uma questão na tela de Questões, pode registrar aqui o motivo — e isso alimenta as revisões."
        />
      )}
      {!isLoading && !error && errors.length > 0 && filtered.length === 0 && (
        <EmptyState title="Nada com esses filtros" description="Tente ajustar o status ou o período." />
      )}

      {filtered.length > 0 && (
        <div className="flex flex-col gap-2">
          {filtered.map((e) => {
            const st = statusOf(e);
            return (
              <Card key={e.id} className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{e.enunciadoQuestao}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge>{errorReasonLabel[e.motivo]}</Badge>
                    <Badge
                      variant={st === "revisado" ? "success" : st === "atrasado" ? "destructive" : "warning"}
                    >
                      {STATUS_LABEL[st]}
                    </Badge>
                    {e.proximaRevisao && <span>Próxima revisão: {e.proximaRevisao}</span>}
                  </div>
                  {e.observacao && (
                    <p className="mt-1 text-xs text-muted-foreground">"{e.observacao}"</p>
                  )}
                </div>
                {!e.resolvido && (
                  <Button size="sm" variant="outline" onClick={() => resolve.mutate(e.id)} loading={resolve.isPending}>
                    Marcar revisado
                  </Button>
                )}
                <button
                  aria-label="Excluir registro"
                  onClick={() => setDeleting(e)}
                  className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        title="Remover do caderno de erros?"
        confirmLabel="Remover"
        loading={remove.isPending}
      />
    </AppShell>
  );
}
