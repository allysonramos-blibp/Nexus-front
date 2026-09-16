import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Filter,
  Pencil,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  Wallet,
  X,
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
import { Tabs } from "@/components/ui/Tabs";
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

function formatDateBr(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function signed(t: FinancialTransaction) {
  return t.tipo === "RECEITA" ? Number(t.valor) : -Number(t.valor);
}

/** Adiciona N meses a uma data YYYY-MM-DD mantendo o dia máximo válido do mês */
function addMonths(dateStr: string, monthsToAdd: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const totalMonths = m - 1 + monthsToAdd;
  const targetYear = y + Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12;
  const maxDays = new Date(targetYear, targetMonth + 1, 0).getDate();
  const day = Math.min(d, maxDays);
  return `${targetYear}-${pad2(targetMonth + 1)}-${pad2(day)}`;
}

/** Calcula dias de diferença entre duas datas YYYY-MM-DD */
function diffDays(targetIso: string, fromIso: string): number {
  const [ty, tm, td] = targetIso.split("-").map(Number);
  const [fy, fm, fd] = fromIso.split("-").map(Number);
  const t = new Date(ty, tm - 1, td).getTime();
  const f = new Date(fy, fm - 1, fd).getTime();
  return Math.round((t - f) / (1000 * 60 * 60 * 24));
}

type FormState = {
  descricao: string;
  valor: string;
  tipo: TransactionType;
  status: TransactionStatus;
  data: string;
  categoryId: string;
  isInstallment: boolean;
  installmentsCount: number;
  installmentMode: "TOTAL" | "PARCELA";
};

function emptyFormState(): FormState {
  return {
    descricao: "",
    valor: "",
    tipo: "DESPESA",
    status: "CONCLUIDA",
    data: today(),
    categoryId: "",
    isInstallment: false,
    installmentsCount: 3,
    installmentMode: "TOTAL",
  };
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
          isInstallment: false,
          installmentsCount: 3,
          installmentMode: "TOTAL",
        }
      : emptyFormState()
  );

  const [isSavingBatch, setIsSavingBatch] = useState(false);

  const save = useMutation({
    mutationFn: async () => {
      const valorNum = Number(form.valor);
      const catId = form.categoryId ? Number(form.categoryId) : null;

      // Se for edição ou não for parcelado
      if (transacao || !form.isInstallment || form.installmentsCount <= 1) {
        const body: FinancialTransactionRequest = {
          descricao: form.descricao.trim(),
          valor: valorNum,
          tipo: form.tipo,
          status: form.status,
          data: form.data,
          categoryId: catId,
        };
        return transacao ? api.updateTransaction(transacao.id, body) : api.createTransaction(userId, body);
      }

      // Se for criação com parcelamento
      setIsSavingBatch(true);
      const count = Math.max(2, Math.min(60, form.installmentsCount));
      const installmentValue =
        form.installmentMode === "TOTAL"
          ? Math.round((valorNum / count) * 100) / 100
          : valorNum;

      for (let i = 1; i <= count; i++) {
        const dateParcela = addMonths(form.data, i - 1);
        // Primeira parcela mantém o status escolhido (ex: CONCLUIDA se já pagou a entrada),
        // as demais parcelas futuras entram como PENDENTE por padrão de segurança
        const parcelaStatus: TransactionStatus =
          i === 1 ? form.status : "PENDENTE";

        await api.createTransaction(userId, {
          descricao: `${form.descricao.trim()} (${i}/${count})`,
          valor: installmentValue,
          tipo: form.tipo,
          status: parcelaStatus,
          data: dateParcela,
          categoryId: catId,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions", userId] });
      if (!transacao && form.isInstallment && form.installmentsCount > 1) {
        toast(`${form.installmentsCount} parcelas lançadas com sucesso!`, "success");
      } else {
        toast(transacao ? "Lançamento atualizado." : "Lançamento adicionado.", "success");
      }
      setIsSavingBatch(false);
      onClose();
    },
    onError: () => {
      setIsSavingBatch(false);
      toast("Erro ao salvar lançamento.", "error");
    },
  });

  const parsedValor = Number(form.valor) || 0;
  const count = form.installmentsCount || 1;
  const previewParcela =
    form.installmentMode === "TOTAL" ? (parsedValor / count).toFixed(2) : parsedValor.toFixed(2);
  const previewTotal =
    form.installmentMode === "TOTAL" ? parsedValor.toFixed(2) : (parsedValor * count).toFixed(2);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={transacao ? "Editar lançamento" : "Novo lançamento"}
      description={
        transacao
          ? "Altere os dados da transação."
          : "Registre uma receita, despesa ou compra parcelada."
      }
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={save.isPending || isSavingBatch}>
            Cancelar
          </Button>
          <Button
            size="sm"
            loading={save.isPending || isSavingBatch}
            disabled={!form.descricao.trim() || !form.valor || Number(form.valor) <= 0}
            onClick={() => form.descricao.trim() && form.valor && save.mutate()}
          >
            {isSavingBatch
              ? `Gerando ${form.installmentsCount} parcelas...`
              : transacao
              ? "Salvar alterações"
              : form.isInstallment && form.installmentsCount > 1
              ? `Criar ${form.installmentsCount} parcelas`
              : "Salvar"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Input
          label="Descrição"
          required
          autoFocus
          value={form.descricao}
          onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
          placeholder="Ex: Compra do Supermercado, Salário, Notebook..."
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
            placeholder="0,00"
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
            label={form.status === "PENDENTE" ? "Vencimento" : "Data de Pagamento/Recebimento"}
            type="date"
            value={form.data}
            onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
          />

          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TransactionStatus }))}
          >
            <option value="CONCLUIDA">Concluída (Pago/Recebido)</option>
            <option value="PENDENTE">Pendente (A pagar/receber)</option>
          </Select>
        </div>

        <Select
          label="Categoria"
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

        {!transacao && form.tipo === "DESPESA" && (
          <div className="rounded-xl border border-border/80 bg-surface-raised/60 p-3.5 flex flex-col gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
              <input
                type="checkbox"
                checked={form.isInstallment}
                onChange={(e) => setForm((f) => ({ ...f, isInstallment: e.target.checked }))}
                className="size-4 rounded border-border text-fin focus:ring-fin"
              />
              <span>Parcelar esta despesa (Cartão / Carnê)</span>
            </label>

            {form.isInstallment && (
              <div className="flex flex-col gap-2.5 pt-2 border-t border-border/50">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">
                      Número de parcelas
                    </label>
                    <Select
                      value={form.installmentsCount}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, installmentsCount: Number(e.target.value) }))
                      }
                    >
                      {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24, 36, 48].map((n) => (
                        <option key={n} value={n}>
                          {n}x vezes
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">
                      O valor digitado é
                    </label>
                    <Select
                      value={form.installmentMode}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          installmentMode: e.target.value as "TOTAL" | "PARCELA",
                        }))
                      }
                    >
                      <option value="TOTAL">Valor Total da Compra</option>
                      <option value="PARCELA">Valor de Cada Parcela</option>
                    </Select>
                  </div>
                </div>

                {parsedValor > 0 && (
                  <div className="rounded-lg bg-surface p-2.5 text-xs text-muted-foreground border border-border/60">
                    <p className="font-medium text-foreground">
                      Resumo: {count}x de <span className="text-destructive font-bold">R$ {previewParcela}</span>
                    </p>
                    <p className="text-[11px] mt-0.5">
                      Total: R$ {previewTotal} · Primeira em {formatDateBr(form.data)}, seguintes a cada 30 dias.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {save.error && <ErrorState error={save.error} compact />}
      </div>
    </Dialog>
  );
}

function FinancialAiInsightDialog({
  open,
  onClose,
  resumo,
}: {
  open: boolean;
  onClose: () => void;
  resumo: {
    mes: string;
    receitas: number;
    despesas: number;
    saldo: number;
    aPagar: number;
    categoriasTop: { nome: string; valor: number }[];
  };
}) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateInsight = async () => {
    setLoading(true);
    try {
      const topCatStr = resumo.categoriasTop
        .map((c) => `- ${c.nome}: ${brl(c.valor)}`)
        .join("\n");
      const prompt = `Você é o consultor financeiro inteligente Nexus. Analise a seguinte situação financeira do usuário para o mês de ${resumo.mes}:
- Total de Receitas: ${brl(resumo.receitas)}
- Total de Despesas: ${brl(resumo.despesas)}
- Saldo Líquido do Mês: ${brl(resumo.saldo)}
- Pendências a Pagar no mês: ${brl(resumo.aPagar)}
- Principais Categorias de Gastos:
${topCatStr || "Sem categorias definidas ainda"}

Por favor, faça um diagnóstico direto, objetivo e motivador em 3 tópicos curtos:
1. Saúde Financeira (taxa de poupança ou alerta de déficit)
2. Ponto de Atenção (onde o dinheiro está indo e como equilibrar)
3. Sugestão Prática e Acionável para a próxima semana.
Não utilize cumprimentos formais longos.`;

      const res = await api.chat(prompt, []);
      setInsight(res.reply);
    } catch {
      toast("Não foi possível gerar a análise com IA agora.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Diagnóstico Financeiro com IA"
      description={`Análise estratégica e dicas para ${resumo.mes}`}
      footer={
        <div className="flex w-full justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateInsight}
            disabled={loading}
          >
            <Sparkles className="size-3.5 mr-1" /> Atualizar Análise
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 py-1">
        {!insight && !loading && (
          <div className="text-center py-6">
            <div className="mx-auto size-12 rounded-full bg-fin/10 flex items-center justify-center text-fin mb-3">
              <Sparkles className="size-6" />
            </div>
            <p className="text-sm font-medium text-foreground">Pronto para analisar seu mês?</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              A IA do Nexus avalia suas receitas, gastos e pendências para traçar um diagnóstico realista.
            </p>
            <Button
              className="mt-4 bg-fin hover:bg-fin/90 text-white"
              onClick={handleGenerateInsight}
            >
              <Sparkles className="size-4 mr-1.5" /> Gerar Diagnóstico Agora
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="size-8 animate-spin rounded-full border-2 border-fin border-t-transparent" />
            <p className="text-xs font-medium text-muted-foreground">
              Examinando suas receitas e despesas com a IA do Nexus...
            </p>
          </div>
        )}

        {insight && !loading && (
          <div className="rounded-xl border border-fin/30 bg-fin/5 p-4 text-xs leading-relaxed text-foreground whitespace-pre-line">
            {insight}
          </div>
        )}
      </div>
    </Dialog>
  );
}

type TabFiltro = "todas" | "receitas" | "despesas" | "pendentes" | "vencidas";

function FinanceiroPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const userId = user?.id;

  const [mesRef, setMesRef] = useState(() => new Date());
  const [tabFiltro, setTabFiltro] = useState<TabFiltro>("todas");
  const [searchQuery, setSearchQuery] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FinancialTransaction | null>(null);
  const [deleting, setDeleting] = useState<FinancialTransaction | null>(null);
  const [categoriasOpen, setCategoriasOpen] = useState(false);
  const [aiInsightOpen, setAiInsightOpen] = useState(false);

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
      toast("Confirmado como pago/recebido!", "success");
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
    vencidasGeral,
    vencendoEmBreve,
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
        (t) => t.data === dataDia && (realizadoAte ? t.status === "CONCLUIDA" : true)
      );
      running += doDia.reduce((s, t) => s + signed(t), 0);
      pontosGrafico.push({ dia, saldo: running });
    }

    const saldoAtual =
      indiceHoje >= 0 ? pontosGrafico[Math.min(indiceHoje, daysInMonth - 1)].saldo : saldoInicial;
    const saldoPrevisto = pontosGrafico[daysInMonth - 1]?.saldo ?? saldoInicial;

    const receitasMes = concluidasMes
      .filter((t) => t.tipo === "RECEITA")
      .reduce((s, t) => s + Number(t.valor), 0);
    const despesasMes = concluidasMes
      .filter((t) => t.tipo === "DESPESA")
      .reduce((s, t) => s + Number(t.valor), 0);

    const aReceberPendente = pendentesMes
      .filter((t) => t.tipo === "RECEITA")
      .reduce((s, t) => s + Number(t.valor), 0);
    const aPagarPendente = pendentesMes
      .filter((t) => t.tipo === "DESPESA")
      .reduce((s, t) => s + Number(t.valor), 0);

    const hojeTx = concluidasMes.filter((t) => t.data === hojeStr);
    const receitasHoje = hojeTx
      .filter((t) => t.tipo === "RECEITA")
      .reduce((s, t) => s + Number(t.valor), 0);
    const despesasHoje = hojeTx
      .filter((t) => t.tipo === "DESPESA")
      .reduce((s, t) => s + Number(t.valor), 0);

    const gastosPorCategoria = new Map<string, { valor: number; cor: string }>();
    for (const t of concluidasMes.filter((t) => t.tipo === "DESPESA")) {
      const nome = t.categoryNome ?? "Sem categoria";
      const atual = gastosPorCategoria.get(nome) ?? {
        valor: 0,
        cor: t.categoryCor ?? CATEGORY_FALLBACK_COLOR,
      };
      atual.valor += Number(t.valor);
      gastosPorCategoria.set(nome, atual);
    }

    const porCategoria: DonutSlice[] = [...gastosPorCategoria.entries()]
      .map(([label, v]) => ({ label, value: v.valor, color: v.cor }))
      .sort((a, b) => b.value - a.value);

    // Alertas de Vencimento:
    // Transações pendentes que já passaram da data limite (vencidas)
    const vencidasGeral = list.filter(
      (t) => t.status === "PENDENTE" && t.tipo === "DESPESA" && t.data < hojeStr
    );

    // Transações pendentes vencendo hoje ou nos próximos 3 dias
    const vencendoEmBreve = list.filter((t) => {
      if (t.status !== "PENDENTE" || t.tipo !== "DESPESA") return false;
      const diff = diffDays(t.data, hojeStr);
      return diff >= 0 && diff <= 3;
    });

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
      vencidasGeral,
      vencendoEmBreve,
    };
  }, [list, start, end, year, month, daysInMonth, hojeStr]);

  const isMesAtual = hojeStr >= start && hojeStr <= end;
  const indiceHojeGrafico = isMesAtual
    ? Number(hojeStr.slice(8, 10)) - 1
    : hojeStr > end
    ? daysInMonth - 1
    : -1;
  const totalPendente = aReceberPendente + aPagarPendente;

  // Lançamentos filtrados para a listagem
  const filteredTransactions = useMemo(() => {
    let source = [...concluidasMes, ...pendentesMes];

    if (tabFiltro === "receitas") {
      source = source.filter((t) => t.tipo === "RECEITA");
    } else if (tabFiltro === "despesas") {
      source = source.filter((t) => t.tipo === "DESPESA");
    } else if (tabFiltro === "pendentes") {
      source = source.filter((t) => t.status === "PENDENTE");
    } else if (tabFiltro === "vencidas") {
      source = source.filter((t) => t.status === "PENDENTE" && t.data < hojeStr);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      source = source.filter(
        (t) =>
          t.descricao.toLowerCase().includes(q) ||
          (t.categoryNome && t.categoryNome.toLowerCase().includes(q))
      );
    }

    return source.sort((a, b) => b.data.localeCompare(a.data));
  }, [concluidasMes, pendentesMes, tabFiltro, searchQuery, hojeStr]);

  // Taxa de economia ou comprometimento
  const taxaEconomia =
    receitasMes > 0 ? Math.round(((receitasMes - despesasMes) / receitasMes) * 100) : null;

  const exportCsv = () => {
    const rows = [
      ["Data", "Descrição", "Tipo", "Status", "Categoria", "Valor"],
      ...filteredTransactions.map((t) => [
        t.data,
        `"${t.descricao.replace(/"/g, '""')}"`,
        t.tipo,
        t.status,
        `"${t.categoryNome ?? "Sem categoria"}"`,
        t.valor.toFixed(2),
      ]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `financeiro_${year}_${pad2(month + 1)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast("Relatório CSV exportado com sucesso!", "success");
  };

  return (
    <AppShell
      title="Financeiro"
      subtitle={monthLabel(mesRef)}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAiInsightOpen(true)}
            className="border-fin/40 text-fin hover:bg-fin/10"
            title="Diagnóstico inteligente com IA"
          >
            <Sparkles className="size-4 mr-1 text-fin" /> IA Diagnóstico
          </Button>

          <Button variant="outline" size="sm" onClick={() => setCategoriasOpen(true)}>
            <Settings2 className="size-4 mr-1" /> Categorias
          </Button>

          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4 mr-1" /> Novo lançamento
          </Button>
        </div>
      }
    >
      {/* Barra de navegação de meses */}
      <div className="flex items-center justify-between gap-4 mb-1">
        <div className="flex items-center gap-2">
          <button
            aria-label="Mês anterior"
            onClick={() => setMesRef((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground cursor-pointer"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-base font-semibold text-foreground font-display">
            {monthLabel(mesRef)}
          </span>
          <button
            aria-label="Próximo mês"
            onClick={() => setMesRef((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground cursor-pointer"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {!isMesAtual && (
          <button
            type="button"
            onClick={() => setMesRef(new Date())}
            className="text-xs font-medium text-fin hover:underline cursor-pointer"
          >
            Ir para o mês atual
          </button>
        )}
      </div>

      {/* Alertas de Vencimento (Destaque se houver contas vencidas ou a vencer em breve) */}
      {(vencidasGeral.length > 0 || vencendoEmBreve.length > 0) && (
        <div className="flex flex-col gap-2 mb-2">
          {vencidasGeral.length > 0 && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3.5 flex items-start gap-3 text-xs">
              <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-destructive">
                  Atenção: Você tem {vencidasGeral.length} conta(s) com vencimento atrasado!
                </p>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {vencidasGeral.slice(0, 3).map((t) => (
                    <span
                      key={t.id}
                      className="inline-flex items-center gap-1.5 bg-surface/80 rounded-md px-2 py-1 text-[11px] font-medium border border-destructive/30"
                    >
                      <span>{t.descricao}</span>
                      <span className="text-destructive font-bold">{brl(Number(t.valor))}</span>
                      <span className="text-muted-foreground text-[10px]">({formatDateBr(t.data)})</span>
                      <button
                        type="button"
                        onClick={() => confirmPendente.mutate(t.id)}
                        className="ml-1 text-fin hover:underline font-semibold cursor-pointer"
                        title="Marcar como paga"
                      >
                        Pagar
                      </button>
                    </span>
                  ))}
                  {vencidasGeral.length > 3 && (
                    <span className="text-[11px] text-muted-foreground self-center">
                      +{vencidasGeral.length - 3} outra(s)
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {vencendoEmBreve.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-3 text-xs">
              <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-amber-500">
                  Próximos vencimentos ({vencendoEmBreve.length} conta(s) vencem nos próximos 3 dias):
                </p>
                <p className="text-muted-foreground text-[11px] mt-0.5">
                  {vencendoEmBreve
                    .map((t) => `${t.descricao} (${brl(Number(t.valor))} em ${formatDateBr(t.data)})`)
                    .join(" · ")}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {isLoading && <Loading />}
      {error && <ErrorState error={error} onRetry={() => refetch()} />}

      {!isLoading && !error && (
        <>
          {/* Card do Saldo e Gráfico */}
          <Card className="border-fin/30 bg-fin/5">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-[11px] text-muted-foreground">Saldo Inicial</p>
                <p className="mt-1 font-display text-sm font-semibold">{brl(saldoInicial)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Saldo Atual</p>
                <p className="mt-1 font-display text-xl font-bold text-fin">{brl(saldoAtual)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Saldo Previsto</p>
                <p className="mt-1 font-display text-sm font-semibold">{brl(saldoPrevisto)}</p>
              </div>
            </div>

            <div className="mt-4 h-20">
              <SaldoChart pontos={pontosGrafico} indiceHoje={indiceHojeGrafico} />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
              <span>Dia 1</span>
              <span>Dia {daysInMonth}</span>
            </div>
          </Card>

          {/* Resumo do Mês e Indicadores de Saúde */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Balanço do Mês</h2>
                <span
                  className={`text-sm font-bold ${
                    receitasMes - despesasMes >= 0 ? "text-fin" : "text-destructive"
                  }`}
                >
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
                  <p className="mt-1 font-display text-base font-bold text-destructive">
                    {brl(despesasMes)}
                  </p>
                </div>
              </div>

              {taxaEconomia !== null && (
                <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5 text-xs text-muted-foreground">
                  <span>Taxa de Economia / Poupança:</span>
                  <span
                    className={`font-semibold ${
                      taxaEconomia >= 20
                        ? "text-fin"
                        : taxaEconomia > 0
                        ? "text-amber-500"
                        : "text-destructive"
                    }`}
                  >
                    {taxaEconomia}% da renda
                  </span>
                </div>
              )}

              {isMesAtual && (
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Hoje ({formatDateBr(hojeStr)})</span>
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
                <h2 className="text-sm font-semibold text-foreground">Transações Pendentes</h2>
                <span className="font-display text-base font-bold text-gym">{brl(totalPendente)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {pendentesMes.length} compromisso(s) pendente(s) neste mês
              </p>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-fin/10 px-3 py-2 text-xs font-medium text-fin">
                  A receber · {brl(aReceberPendente)}
                </div>
                <div className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                  A pagar · {brl(aPagarPendente)}
                </div>
              </div>

              {pendentesMes.length === 0 ? (
                <p className="mt-4 text-xs text-muted-foreground">
                  Tudo em dia! Nenhuma pendência para este mês.
                </p>
              ) : (
                <div className="mt-3 flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {pendentesMes.map((t) => {
                    const atrasado = t.data < hojeStr;
                    const diff = diffDays(t.data, hojeStr);
                    return (
                      <div
                        key={t.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-surface-raised px-3 py-2 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground">{t.descricao}</p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock className="size-3" />
                            {formatDateBr(t.data)}
                            {atrasado && (
                              <span className="text-destructive font-semibold"> (vencido)</span>
                            )}
                            {!atrasado && diff <= 3 && (
                              <span className="text-amber-500 font-semibold">
                                {diff === 0 ? " (vence hoje!)" : ` (vence em ${diff}d)`}
                              </span>
                            )}
                          </p>
                        </div>
                        <span
                          className={`font-semibold shrink-0 ${
                            t.tipo === "RECEITA" ? "text-fin" : "text-destructive"
                          }`}
                        >
                          {t.tipo === "RECEITA" ? "+" : "-"}
                          {brl(Number(t.valor))}
                        </span>
                        <button
                          type="button"
                          aria-label={`Confirmar ${t.descricao}`}
                          onClick={() => confirmPendente.mutate(t.id)}
                          className="rounded p-1 text-muted-foreground transition-colors hover:bg-fin/10 hover:text-fin cursor-pointer"
                          title="Confirmar pagamento/recebimento"
                        >
                          <Check className="size-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Gráfico de Gastos por Categoria */}
          {porCategoria.length > 0 && (
            <Card>
              <h2 className="text-sm font-semibold text-foreground">Gastos por Categoria</h2>
              <div className="mt-4">
                <DonutChart data={porCategoria} centerValue={brl(despesasMes)} centerLabel="despesas" />
              </div>
            </Card>
          )}

          {/* Lista Completa de Lançamentos com Busca e Filtros */}
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div>
                <h2 className="text-base font-semibold text-foreground">Lançamentos</h2>
                <p className="text-xs text-muted-foreground">
                  {filteredTransactions.length} de {concluidasMes.length + pendentesMes.length} registros no mês
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportCsv}
                  className="text-xs h-8"
                  title="Exportar dados filtrados em CSV"
                >
                  <Download className="size-3.5 mr-1" /> Exportar CSV
                </Button>
              </div>
            </div>

            {/* Barra de Filtros e Busca */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <div className="relative flex-1 min-w-[14rem]">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar lançamento ou categoria..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-8 h-8 text-xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <Tabs
                value={tabFiltro}
                onChange={(v) => setTabFiltro(v as TabFiltro)}
                items={[
                  { value: "todas", label: "Todas" },
                  { value: "receitas", label: "Receitas" },
                  { value: "despesas", label: "Despesas" },
                  { value: "pendentes", label: "Pendentes" },
                  { value: "vencidas", label: "Vencidas" },
                ]}
              />
            </div>

            {/* Listagem de Transações */}
            {concluidasMes.length === 0 && pendentesMes.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="Nenhum lançamento nesse mês"
                description="Adicione seu primeiro registro ou simule compras parceladas."
                className="mt-4"
                action={
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditing(null);
                      setDialogOpen(true);
                    }}
                  >
                    <Plus className="size-4 mr-1" /> Novo lançamento
                  </Button>
                }
              />
            ) : filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-muted-foreground">
                <Filter className="size-8 text-muted-foreground/50 mb-2" />
                Nenhum lançamento encontrado para os filtros selecionados.
              </div>
            ) : (
              <ul className="mt-4 flex flex-col gap-2">
                {filteredTransactions.map((t) => {
                  const isPendente = t.status === "PENDENTE";
                  const isVencido = isPendente && t.data < hojeStr;
                  const diff = isPendente ? diffDays(t.data, hojeStr) : 0;

                  return (
                    <li
                      key={t.id}
                      className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                        isVencido
                          ? "border-destructive/40 bg-destructive/5 hover:bg-destructive/10"
                          : "border-border/70 bg-surface-raised hover:border-border"
                      }`}
                    >
                      {t.tipo === "RECEITA" ? (
                        <ArrowUpRight className="size-4 shrink-0 text-fin" />
                      ) : (
                        <ArrowDownRight className="size-4 shrink-0 text-destructive" />
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-foreground">
                            {t.descricao}
                          </span>
                          {isVencido && <Badge variant="destructive">Vencida</Badge>}
                          {isPendente && !isVencido && diff <= 3 && (
                            <Badge variant="warning">
                              {diff === 0 ? "Vence hoje" : `Vence em ${diff}d`}
                            </Badge>
                          )}
                          {isPendente && !isVencido && diff > 3 && (
                            <Badge variant="warning">Pendente</Badge>
                          )}
                          {t.categoryNome && <Badge>{t.categoryNome}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <Calendar className="size-3" />
                          <span>{formatDateBr(t.data)}</span>
                          {t.categoryNome && <span>· {t.categoryNome}</span>}
                        </p>
                      </div>

                      <span
                        className={`text-sm font-bold ${
                          t.tipo === "RECEITA" ? "text-fin" : "text-destructive"
                        }`}
                      >
                        {t.tipo === "RECEITA" ? "+" : "-"}
                        {brl(Number(t.valor))}
                      </span>

                      {isPendente && (
                        <button
                          type="button"
                          onClick={() => confirmPendente.mutate(t.id)}
                          aria-label={`Confirmar ${t.descricao}`}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-fin/10 hover:text-fin cursor-pointer"
                          title="Marcar como Pago / Recebido"
                        >
                          <Check className="size-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setEditing(t);
                          setDialogOpen(true);
                        }}
                        aria-label={`Editar ${t.descricao}`}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground cursor-pointer"
                      >
                        <Pencil className="size-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleting(t)}
                        aria-label={`Excluir ${t.descricao}`}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  );
                })}
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

      <FinancialAiInsightDialog
        open={aiInsightOpen}
        onClose={() => setAiInsightOpen(false)}
        resumo={{
          mes: monthLabel(mesRef),
          receitas: receitasMes,
          despesas: despesasMes,
          saldo: receitasMes - despesasMes,
          aPagar: aPagarPendente,
          categoriasTop: porCategoria.map((c) => ({ nome: c.label, valor: c.value })),
        }}
      />

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
