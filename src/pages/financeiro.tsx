import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Settings2,
  Trash2,
  Wallet,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  api,
  brl,
  today,
  type FinancialTransaction,
  type FinancialTransactionRequest,
  type TransactionStatus,
  type TransactionType,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/contexts/ToastContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Dialog, ConfirmDialog } from "@/components/ui/Dialog";
import { SaldoChart } from "@/components/ui/SaldoChart";
import { DonutChart, type DonutSlice } from "@/components/ui/DonutChart";
import { CategoriasDialog } from "./financeiro-parts/CategoriasDialog";

const CATEGORY_FALLBACK_COLOR = "#6B7280";
const pad2 = (n: number) => String(n).padStart(2, "0");

function monthBounds(ref: Date) {
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const start = `${year}-${pad2(month + 1)}-01`;
  const end = `${year}-${pad2(month + 1)}-${pad2(daysInMonth)}`;
  return { year, month, daysInMonth, start, end };
}

function monthLabel(ref: Date) {
  const label = ref.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function signed(t: FinancialTransaction) {
  return t.tipo === "RECEITA" ? Number(t.valor) : -Number(t.valor);
}

type FormState = {
  descricao: string;
  valor: string;
  tipo: TransactionType;
  status: TransactionStatus;
  data: string;
  categoryId: string;
};

function emptyFormState(): FormState {
  return { descricao: "", valor: "", tipo: "DESPESA", status: "CONCLUIDA", data: today(), categoryId: "" };
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
  const categories = useQuery({
    queryKey: ["categories", "FINANCEIRO"],
    queryFn: () => api.listCategories("FINANCEIRO"),
    enabled: open,
  });

  const [form, setForm] = useState<FormState>(
    transacao
      ? {
          descricao: transacao.descricao,
          valor: String(transacao.valor),
          tipo: transacao.tipo,
          status: transacao.status,
          data: transacao.data,
          categoryId: transacao.categoryId ? String(transacao.categoryId) : "",
        }
      : emptyFormState(),
  );

  const save = useMutation({
    mutationFn: () => {
      const body: FinancialTransactionRequest = {
        descricao: form.descricao,
        valor: Number(form.valor),
        tipo: form.tipo,
        status: form.status,
        data: form.data,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
      };
      return transacao ? api.updateTransaction(transacao.id, body) : api.createTransaction(userId, body);
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
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={form.status === "PENDENTE" ? "Vencimento" : "Data"}
            type="date"
            value={form.data}
            onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TransactionStatus }))}
          >
            <option value="CONCLUIDA">Concluída</option>
            <option value="PENDENTE">Pendente</option>
          </Select>
        </div>
        <Select
          label="Categoria (opcional)"
          value={form.categoryId}
          onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
        >
          <option value="">Sem categoria</option>
          {(categories.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </Select>
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

  const [mesRef, setMesRef] = useState(() => new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FinancialTransaction | null>(null);
  const [deleting, setDeleting] = useState<FinancialTransaction | null>(null);
  const [categoriasOpen, setCategoriasOpen] = useState(false);

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

  const confirmPendente = useMutation({
    mutationFn: (id: number) => api.concludeTransaction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions", userId] });
      toast("Confirmado.", "success");
    },
  });

  const list = useMemo(() => transactions ?? [], [transactions]);
  const { year, month, daysInMonth, start, end } = monthBounds(mesRef);
  const hojeStr = today();

  const {
    saldoInicial,
    saldoAtual,
    saldoPrevisto,
    pontosGrafico,
    concluidasMes,
    pendentesMes,
    receitasMes,
    despesasMes,
    aReceberPendente,
    aPagarPendente,
    receitasHoje,
    despesasHoje,
    porCategoria,
  } = useMemo(() => {
    const saldoInicial = list
      .filter((t) => t.status === "CONCLUIDA" && t.data < start)
      .reduce((s, t) => s + signed(t), 0);

    const doMes = list.filter((t) => t.data >= start && t.data <= end);
    const concluidasMes = doMes.filter((t) => t.status === "CONCLUIDA");
    const pendentesMes = doMes.filter((t) => t.status === "PENDENTE");

    const isMesAtual = hojeStr >= start && hojeStr <= end;
    const diaHoje = isMesAtual ? Number(hojeStr.slice(8, 10)) : hojeStr > end ? daysInMonth : 0;
    const indiceHoje = diaHoje - 1;

    const pontosGrafico: { dia: number; saldo: number }[] = [];
    let running = saldoInicial;
    for (let dia = 1; dia <= daysInMonth; dia++) {
      const dataDia = `${year}-${pad2(month + 1)}-${pad2(dia)}`;
      const realizadoAte = dia <= diaHoje;
      const doDia = doMes.filter(
        (t) => t.data === dataDia && (realizadoAte ? t.status === "CONCLUIDA" : true),
      );
      running += doDia.reduce((s, t) => s + signed(t), 0);
      pontosGrafico.push({ dia, saldo: running });
    }

    const saldoAtual = indiceHoje >= 0 ? pontosGrafico[Math.min(indiceHoje, daysInMonth - 1)].saldo : saldoInicial;
    const saldoPrevisto = pontosGrafico[daysInMonth - 1]?.saldo ?? saldoInicial;

    const receitasMes = concluidasMes.filter((t) => t.tipo === "RECEITA").reduce((s, t) => s + Number(t.valor), 0);
    const despesasMes = concluidasMes.filter((t) => t.tipo === "DESPESA").reduce((s, t) => s + Number(t.valor), 0);
    const aReceberPendente = pendentesMes
      .filter((t) => t.tipo === "RECEITA")
      .reduce((s, t) => s + Number(t.valor), 0);
    const aPagarPendente = pendentesMes.filter((t) => t.tipo === "DESPESA").reduce((s, t) => s + Number(t.valor), 0);

    const hojeTx = concluidasMes.filter((t) => t.data === hojeStr);
    const receitasHoje = hojeTx.filter((t) => t.tipo === "RECEITA").reduce((s, t) => s + Number(t.valor), 0);
    const despesasHoje = hojeTx.filter((t) => t.tipo === "DESPESA").reduce((s, t) => s + Number(t.valor), 0);

    const gastosPorCategoria = new Map<string, { valor: number; cor: string }>();
    for (const t of concluidasMes.filter((t) => t.tipo === "DESPESA")) {
      const nome = t.categoryNome ?? "Sem categoria";
      const atual = gastosPorCategoria.get(nome) ?? { valor: 0, cor: t.categoryCor ?? CATEGORY_FALLBACK_COLOR };
      atual.valor += Number(t.valor);
      gastosPorCategoria.set(nome, atual);
    }
    const porCategoria: DonutSlice[] = [...gastosPorCategoria.entries()]
      .map(([label, v]) => ({ label, value: v.valor, color: v.cor }))
      .sort((a, b) => b.value - a.value);

    return {
      saldoInicial,
      saldoAtual,
      saldoPrevisto,
      pontosGrafico,
      concluidasMes,
      pendentesMes,
      receitasMes,
      despesasMes,
      aReceberPendente,
      aPagarPendente,
      receitasHoje,
      despesasHoje,
      porCategoria,
    };
  }, [list, start, end, year, month, daysInMonth, hojeStr]);

  const isMesAtual = hojeStr >= start && hojeStr <= end;
  const indiceHojeGrafico = isMesAtual ? Number(hojeStr.slice(8, 10)) - 1 : hojeStr > end ? daysInMonth - 1 : -1;
  const totalPendente = aReceberPendente + aPagarPendente;

  return (
    <AppShell
      title="Financeiro"
      subtitle={user?.email}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCategoriasOpen(true)}>
            <Settings2 className="size-4" /> Categorias
          </Button>
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            Novo lançamento
          </Button>
        </div>
      }
    >
      <div className="flex items-center justify-center gap-4">
        <button
          aria-label="Mês anterior"
          onClick={() => setMesRef((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-sm font-semibold">{monthLabel(mesRef)}</span>
        <button
          aria-label="Próximo mês"
          onClick={() => setMesRef((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {isLoading && <Loading />}
      {error && <ErrorState error={error} onRetry={() => refetch()} />}

      {!isLoading && !error && (
        <>
          <Card className="border-fin/30 bg-fin/5">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-[11px] text-muted-foreground">Inicial</p>
                <p className="mt-1 font-display text-sm font-semibold">{brl(saldoInicial)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Saldo atual</p>
                <p className="mt-1 font-display text-lg font-bold text-fin">{brl(saldoAtual)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Previsto</p>
                <p className="mt-1 font-display text-sm font-semibold">{brl(saldoPrevisto)}</p>
              </div>
            </div>
            <div className="mt-4 h-20">
              <SaldoChart pontos={pontosGrafico} indiceHoje={indiceHojeGrafico} />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
              <span>1</span>
              <span>{daysInMonth}</span>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Resultado do mês</h2>
              <span className={`text-sm font-bold ${receitasMes - despesasMes >= 0 ? "text-fin" : "text-destructive"}`}>
                {receitasMes - despesasMes >= 0 ? "+" : ""}
                {brl(receitasMes - despesasMes)}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border/70 bg-surface-raised p-3">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ArrowUpRight className="size-3.5 text-fin" /> Receitas
                </p>
                <p className="mt-1 font-display text-base font-bold text-fin">{brl(receitasMes)}</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-surface-raised p-3">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ArrowDownRight className="size-3.5 text-destructive" /> Despesas
                </p>
                <p className="mt-1 font-display text-base font-bold text-destructive">{brl(despesasMes)}</p>
              </div>
            </div>
            {isMesAtual && (
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                <span>Hoje</span>
                <span>
                  <span className="text-fin">+{brl(receitasHoje)}</span>
                  {"  ·  "}
                  <span className="text-destructive">-{brl(despesasHoje)}</span>
                </span>
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Transações pendentes</h2>
              <span className="font-display text-base font-bold text-gym">{brl(totalPendente)}</span>
            </div>
            <p className="text-xs text-muted-foreground">{pendentesMes.length} pendência(s) no mês</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-fin/10 px-3 py-2 text-xs font-medium text-fin">
                A receber · {brl(aReceberPendente)}
              </div>
              <div className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                A pagar · {brl(aPagarPendente)}
              </div>
            </div>
            {pendentesMes.length === 0 ? (
              <p className="mt-4 text-xs text-muted-foreground">Nenhuma pendência esse mês.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {pendentesMes.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 rounded-lg border border-border/70 bg-surface-raised px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{t.descricao}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.categoryNome ?? "Sem categoria"} · vence {t.data}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold ${t.tipo === "RECEITA" ? "text-fin" : "text-destructive"}`}>
                      {t.tipo === "RECEITA" ? "+" : "-"}
                      {brl(Number(t.valor))}
                    </span>
                    <button
                      aria-label={`Confirmar ${t.descricao}`}
                      onClick={() => confirmPendente.mutate(t.id)}
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-fin/10 hover:text-fin"
                    >
                      <Check className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {porCategoria.length > 0 && (
            <Card>
              <h2 className="text-sm font-semibold">Gastos por categoria</h2>
              <div className="mt-4">
                <DonutChart data={porCategoria} centerValue={brl(despesasMes)} centerLabel="total" />
              </div>
            </Card>
          )}

          <Card>
            <h2 className="text-lg font-semibold">Lançamentos do mês</h2>
            {concluidasMes.length === 0 && pendentesMes.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="Nenhum lançamento nesse mês"
                description="Adicione o primeiro no botão acima."
                className="mt-4"
              />
            ) : (
              <ul className="mt-4 flex flex-col gap-2">
                {[...concluidasMes, ...pendentesMes]
                  .sort((a, b) => b.data.localeCompare(a.data))
                  .map((t) => (
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
                      {t.status === "PENDENTE" && <Badge variant="warning">Pendente</Badge>}
                      {t.categoryNome && <Badge>{t.categoryNome}</Badge>}
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
        </>
      )}

      {userId != null && (
        <TransactionDialog
          key={editing?.id ?? "new"}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          transacao={editing}
          userId={userId}
        />
      )}

      <CategoriasDialog open={categoriasOpen} onClose={() => setCategoriasOpen(false)} />

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
