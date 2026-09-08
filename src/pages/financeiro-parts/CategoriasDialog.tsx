import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { Dialog, ConfirmDialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";

const SWATCHES = ["#3B82F6", "#34D399", "#FB923C", "#EF4444", "#A78BFA", "#F472B6", "#22D3EE", "#EAB308"];

export function CategoriasDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState(SWATCHES[0]);
  const [deleting, setDeleting] = useState<{ id: number; nome: string } | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["categories", "FINANCEIRO"],
    queryFn: () => api.listCategories("FINANCEIRO"),
    enabled: open,
  });

  const create = useMutation({
    mutationFn: () => api.createCategory({ nome: nome.trim(), tipo: "FINANCEIRO", cor }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      setNome("");
      toast("Categoria criada.", "success");
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast("Categoria excluída.", "success");
      setDeleting(null);
    },
    onError: (err) => toast(err instanceof Error ? err.message : "Não foi possível excluir.", "error"),
  });

  return (
    <Dialog open={open} onClose={onClose} title="Categorias">
      <div className="flex flex-col gap-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (nome.trim()) create.mutate();
          }}
          className="flex flex-col gap-3"
        >
          <Input
            label="Nova categoria"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Alimentação, Moradia, Salário"
          />
          <div className="flex items-center gap-2">
            {SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCor(c)}
                aria-label={`Cor ${c}`}
                aria-pressed={cor === c}
                className="size-6 rounded-full ring-offset-2 ring-offset-surface transition-shadow"
                style={{ backgroundColor: c, boxShadow: cor === c ? `0 0 0 2px ${c}` : undefined }}
              />
            ))}
            <Button type="submit" size="sm" loading={create.isPending} disabled={!nome.trim()} className="ml-auto">
              <Plus className="size-3.5" /> Adicionar
            </Button>
          </div>
          {create.error && <ErrorState error={create.error} compact />}
        </form>

        <div className="border-t border-border pt-3">
          {isLoading && <Loading label="Carregando categorias…" />}
          {error && <ErrorState error={error} onRetry={() => refetch()} compact />}
          {!isLoading && !error && (data ?? []).length === 0 && (
            <EmptyState title="Nenhuma categoria ainda" description="Crie a primeira acima." />
          )}
          {!isLoading && (data ?? []).length > 0 && (
            <ul className="flex max-h-56 flex-col gap-1.5 overflow-y-auto">
              {(data ?? []).map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-2 rounded-lg border border-border/70 bg-surface-raised px-3 py-2 text-sm"
                >
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.cor ?? "#888" }} />
                  <span className="flex-1">{c.nome}</span>
                  <button
                    aria-label={`Excluir ${c.nome}`}
                    onClick={() => setDeleting({ id: c.id, nome: c.nome })}
                    className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        title="Excluir categoria?"
        description={
          deleting
            ? `"${deleting.nome}" só pode ser excluída se nenhum lançamento estiver usando ela.`
            : undefined
        }
        confirmLabel="Excluir"
        loading={remove.isPending}
      />
    </Dialog>
  );
}
