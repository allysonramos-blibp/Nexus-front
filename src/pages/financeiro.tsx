import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Pencil, Trash2, Wallet } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { api, brl, today, type FinancialTransaction, type TransactionType } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/contexts/ToastContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Dialog, ConfirmDialog } from "@/components/ui/Dialog";

type FormState = {
  descricao: string;
  valor: string;
  tipo: TransactionType;
  data: string;
};

function emptyFormState(): FormState {
  return { descricao: "", valor: "", tipo: "DESPESA", data: today() };
}

function TransactionDialog({
  open,
  onClose,
  transacao,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  transacao: FinancialTransaction | null;
  userId: number;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(
    transacao
      ? {
          descricao: transacao.descricao,
          valor: String(transacao.valor),
          tipo: transacao.tipo,
          data: transacao.data,
        }
      : emptyFormState(),
  );

  const save = useMutation({
    mutationFn: () => {
      const body = { descricao: form.descricao, valor: Number(form.valor), tipo: form.tipo, data: form.data };
      return transacao
        ? api.updateTransaction(transacao.id, body)
        : api.createTransaction(userId, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions", userId] });
      toast(transacao ? "Lançamento atualizado." : "Lançamento adicionado.", "success");
      onClose();
    },
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={transacao ? "Editar lançamento" : "Novo lançamento"}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={save.isPending}>
            Cancelar
          </Button>
          <Button
            size="sm"
            loading={save.isPending}
            onClick={() => form.descricao.trim() && form.valor && save.mutate()}
          >
            Salvar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Input
          label="Descrição"
          required
          value={form.descricao}
          onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Valor"
            type="number"
            step="0.01"
            min={0}
            required
            value={form.valor}
            onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
          />
          <Select
            label="Tipo"
            value={form.tipo}
            onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as TransactionType }))}
          >
            <option value="DESPESA">Despesa</option>
            <option value="RECEITA">Receita</option>
          </Select>
        </div>
        <Input
          label="Data"
          type="date"
          value={form.data}
          onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
        />
        {save.error && <ErrorState error={save.error} compact />}
      </div>
    </Dialog>
  );
}

function FinanceiroPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const userId = user?.id;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FinancialTransaction | null>(null);
  const [deleting, setDeleting] = useState<FinancialTransaction | null>(null);

  const { data: transactions, isLoading, error, refetch } = useQuery({
    queryKey: ["transactions", userId],
    queryFn: () => api.listTransactions(userId!),
    enabled: !!userId,
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteTransaction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions", userId] });
      toast("Lançamento excluído.", "success");
      setDeleting(null);
    },
  });

  const list = transactions ?? [];
  const receitas = list.filter((t) => t.tipo === "RECEITA").reduce((s, t) => s + Number(t.valor), 0);
  const despesas = list.filter((t) => t.tipo === "DESPESA").reduce((s, t) => s + Number(t.valor), 0);

  return (
    <AppShell
      title="Financeiro"
      subtitle="Receitas e despesas"
      actions={
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          Novo lançamento
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="flex flex-col gap-2">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Wallet className="size-3.5" /> Saldo
          </p>
          <p className="font-display text-2xl font-bold">{brl(receitas - despesas)}</p>
        </Card>
        <Card className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">Receitas</p>
          <p className="font-display text-2xl font-bold text-fin">{brl(receitas)}</p>
        </Card>
        <Card className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">Despesas</p>
          <p className="font-display text-2xl font-bold text-destructive">{brl(despesas)}</p>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold">Lançamentos</h2>
        {isLoading && <Loading />}
        {error && <ErrorState error={error} onRetry={() => refetch()} className="mt-4" />}
        {!isLoading && !error && list.length === 0 && (
          <EmptyState
            title="Nenhum lançamento ainda"
            description="Adicione o primeiro lançamento no botão acima."
            className="mt-4"
          />
        )}
        {!isLoading && list.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2">
            {list.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-3 rounded-lg border border-border/70 bg-surface-raised px-4 py-3"
              >
                {t.tipo === "RECEITA" ? (
                  <ArrowUpRight className="size-4 shrink-0 text-fin" />
                ) : (
                  <ArrowDownRight className="size-4 shrink-0 text-destructive" />
                )}
                <span className="flex-1 truncate text-sm">{t.descricao}</span>
                <span className="text-xs text-muted-foreground">{t.data}</span>
                <span
                  className={`text-sm font-semibold ${t.tipo === "RECEITA" ? "text-fin" : "text-destructive"}`}
                >
                  {brl(Number(t.valor))}
                </span>
                <button
                  onClick={() => {
                    setEditing(t);
                    setDialogOpen(true);
                  }}
                  aria-label={`Editar ${t.descricao}`}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => setDeleting(t)}
                  aria-label={`Excluir ${t.descricao}`}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {userId != null && (
        <TransactionDialog
          key={editing?.id ?? "new"}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          transacao={editing}
          userId={userId}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        title="Excluir lançamento?"
        description={deleting ? `"${deleting.descricao}" será removido.` : undefined}
        confirmLabel="Excluir"
        loading={remove.isPending}
      />
    </AppShell>
  );
}

export default FinanceiroPage;
