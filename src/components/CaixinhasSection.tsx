import { useState } from "react";
import {
  PiggyBank,
  Shield,
  Plane,
  Car,
  Home,
  Heart,
  Star,
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  History,
  Pencil,
  Trash2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  type Caixinha,
  type CaixinhaMovimentacao,
  CAIXINHA_ICONS,
  CAIXINHA_CORES,
  saveCaixinha,
  deleteCaixinha,
  movimentarCaixinha,
} from "@/lib/caixinhasStorage";

function brl(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface CaixinhasSectionProps {
  userId: number;
  caixinhas: Caixinha[];
  onRefresh: () => void;
  onCreateTransaction?: (tipo: "RECEITA" | "DESPESA", valor: number, descricao: string) => Promise<void>;
}

export function CaixinhasSection({ userId, caixinhas, onRefresh, onCreateTransaction }: CaixinhasSectionProps) {
  const [modalCaixinhaOpen, setModalCaixinhaOpen] = useState(false);
  const [editingCaixinha, setEditingCaixinha] = useState<Caixinha | null>(null);

  // Form de Criar/Editar Caixinha
  const [formNome, setFormNome] = useState("");
  const [formSaldoInicial, setFormSaldoInicial] = useState("");
  const [formMeta, setFormMeta] = useState("");
  const [formDescricao, setFormDescricao] = useState("");
  const [formIcone, setFormIcone] = useState<Caixinha["icone"]>("shield");
  const [formCor, setFormCor] = useState("#10b981");

  // Modal de Movimentação (Guardar / Resgatar)
  const [movModalOpen, setMovModalOpen] = useState(false);
  const [movCaixinha, setMovCaixinha] = useState<Caixinha | null>(null);
  const [movTipo, setMovTipo] = useState<"DEPOSITO" | "RESGATE">("DEPOSITO");
  const [movValor, setMovValor] = useState("");
  const [movObs, setMovObs] = useState("");
  const [movSyncExtrato, setMovSyncExtrato] = useState(false);

  // Modal de Histórico de Movimentações
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyCaixinha, setHistoryCaixinha] = useState<Caixinha | null>(null);

  // Modal de Confirmação de Exclusão
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingCaixinha, setDeletingCaixinha] = useState<Caixinha | null>(null);

  const totalGuardado = caixinhas.reduce((acc, c) => acc + (Number(c.saldo) || 0), 0);

  function handleOpenCreate() {
    setEditingCaixinha(null);
    setFormNome("");
    setFormSaldoInicial("");
    setFormMeta("");
    setFormDescricao("");
    setFormIcone("shield");
    setFormCor("#10b981");
    setModalCaixinhaOpen(true);
  }

  function handleOpenEdit(c: Caixinha) {
    setEditingCaixinha(c);
    setFormNome(c.nome);
    setFormSaldoInicial(c.saldo ? String(c.saldo) : "");
    setFormMeta(c.metaValor ? String(c.metaValor) : "");
    setFormDescricao(c.descricao || "");
    setFormIcone(c.icone);
    setFormCor(c.cor);
    setModalCaixinhaOpen(true);
  }

  function handleSaveCaixinha(e: React.FormEvent) {
    e.preventDefault();
    if (!formNome.trim()) return;

    const metaNum = formMeta ? parseFloat(formMeta.replace(",", ".")) : undefined;
    const saldoNum = formSaldoInicial ? parseFloat(formSaldoInicial.replace(",", ".")) : 0;

    saveCaixinha(userId, {
      id: editingCaixinha?.id,
      nome: formNome.trim(),
      icone: formIcone,
      cor: formCor,
      metaValor: metaNum && !isNaN(metaNum) && metaNum > 0 ? metaNum : undefined,
      saldo: editingCaixinha ? undefined : !isNaN(saldoNum) ? saldoNum : 0,
      descricao: formDescricao.trim() || undefined,
    });

    setModalCaixinhaOpen(false);
    onRefresh();
  }

  function handleOpenMovimentacao(c: Caixinha, tipo: "DEPOSITO" | "RESGATE") {
    setMovCaixinha(c);
    setMovTipo(tipo);
    setMovValor("");
    setMovObs("");
    setMovSyncExtrato(false);
    setMovModalOpen(true);
  }

  async function handleConfirmMovimentacao(e: React.FormEvent) {
    e.preventDefault();
    if (!movCaixinha) return;
    const valorNum = parseFloat(movValor.replace(",", "."));
    if (isNaN(valorNum) || valorNum <= 0) return;

    if (movTipo === "RESGATE" && valorNum > movCaixinha.saldo) {
      alert(`O valor do resgate não pode ser maior que o saldo atual da caixinha (${brl(movCaixinha.saldo)}).`);
      return;
    }

    movimentarCaixinha(userId, movCaixinha.id, movTipo, valorNum, movObs.trim() || undefined);

    if (movSyncExtrato && onCreateTransaction) {
      const desc =
        movTipo === "DEPOSITO"
          ? `Guardado na caixinha: ${movCaixinha.nome}`
          : `Resgate da caixinha: ${movCaixinha.nome}`;
      await onCreateTransaction(
        movTipo === "DEPOSITO" ? "DESPESA" : "RECEITA",
        valorNum,
        movObs.trim() ? `${desc} (${movObs.trim()})` : desc
      );
    }

    setMovModalOpen(false);
    onRefresh();
  }

  function handleDeleteConfirm() {
    if (!deletingCaixinha) return;
    deleteCaixinha(userId, deletingCaixinha.id);
    setDeleteConfirmOpen(false);
    setDeletingCaixinha(null);
    onRefresh();
  }

  function renderIcon(icone: Caixinha["icone"], className = "size-5") {
    switch (icone) {
      case "shield":
        return <Shield className={className} />;
      case "piggy":
        return <PiggyBank className={className} />;
      case "plane":
        return <Plane className={className} />;
      case "car":
        return <Car className={className} />;
      case "home":
        return <Home className={className} />;
      case "heart":
        return <Heart className={className} />;
      case "star":
        return <Star className={className} />;
      case "wallet":
      default:
        return <Wallet className={className} />;
    }
  }

  return (
    <div className="space-y-4">
      {/* Header das Caixinhas */}
      <Card className="border-border/80 bg-surface">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-fin/15 text-fin border border-fin/20">
              <PiggyBank className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">Caixinhas & Metas</h2>
                <span className="rounded-full bg-fin/15 px-2 py-0.5 text-[10px] font-bold text-fin border border-fin/30">
                  Separado da Conta
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Separe dinheiro para reserva de emergência, viagens e objetivos sem misturar com o saldo diário.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
            <div className="text-right">
              <p className="text-[11px] text-muted-foreground">Total em Caixinhas</p>
              <p className="text-lg font-bold font-display text-fin">{brl(totalGuardado)}</p>
            </div>
            <Button
              size="sm"
              onClick={handleOpenCreate}
              className="bg-fin hover:bg-fin/90 text-white shadow-sm h-9 px-3 text-xs"
            >
              <Plus className="size-4 mr-1.5" /> Nova Caixinha
            </Button>
          </div>
        </div>
      </Card>

      {/* Grid de Caixinhas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {caixinhas.map((c) => {
          const metaAtingida = c.metaValor && c.metaValor > 0 ? (c.saldo / c.metaValor) * 100 : null;
          const faltaMeta = c.metaValor && c.metaValor > c.saldo ? c.metaValor - c.saldo : 0;

          return (
            <Card
              key={c.id}
              className="relative flex flex-col justify-between border-border/80 bg-surface-raised hover:border-border transition-all"
            >
              <div>
                {/* Cabeçalho da Caixinha */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="flex size-10 shrink-0 items-center justify-center rounded-xl border shadow-xs"
                      style={{
                        backgroundColor: `${c.cor}20`,
                        borderColor: `${c.cor}50`,
                        color: c.cor,
                      }}
                    >
                      {renderIcon(c.icone, "size-5")}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground truncate" title={c.nome}>
                        {c.nome}
                      </h3>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {c.descricao || "Caixinha de reserva"}
                      </p>
                    </div>
                  </div>

                  {/* Ações Rápidas: Histórico, Editar, Excluir */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setHistoryCaixinha(c);
                        setHistoryModalOpen(true);
                      }}
                      className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface hover:text-foreground transition-colors cursor-pointer"
                      title="Histórico de movimentações"
                    >
                      <History className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(c)}
                      className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface hover:text-foreground transition-colors cursor-pointer"
                      title="Editar caixinha"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeletingCaixinha(c);
                        setDeleteConfirmOpen(true);
                      }}
                      className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                      title="Excluir caixinha"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Saldo Atual Guardado */}
                <div className="mt-4 rounded-xl border border-border/60 bg-surface/80 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Valor Guardado</span>
                    <span className="flex items-center gap-1 text-[11px] font-medium text-fin bg-fin/10 px-1.5 py-0.5 rounded-md">
                      <Sparkles className="size-3" /> Rendendo 100% CDI
                    </span>
                  </div>
                  <p className="mt-1 text-2xl font-bold font-display text-foreground tracking-tight">
                    {brl(c.saldo)}
                  </p>

                  {/* Progresso da Meta */}
                  {c.metaValor && c.metaValor > 0 ? (
                    <div className="mt-3 space-y-1.5 pt-2 border-t border-border/50">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Meta: {brl(c.metaValor)}</span>
                        <span className="font-semibold text-foreground">
                          {Math.min(100, Math.round(metaAtingida || 0))}%
                        </span>
                      </div>
                      <ProgressBar
                        value={Math.min(100, metaAtingida || 0)}
                        className="h-2"
                        accent={c.cor || "var(--fin)"}
                      />
                      <p className="text-[10px] text-muted-foreground text-right">
                        {faltaMeta > 0 ? `Faltam ${brl(faltaMeta)} para o objetivo` : "🎉 Meta atingida!"}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Sem meta fixa • Guarde no seu ritmo
                    </p>
                  )}
                </div>
              </div>

              {/* Botões de Guardar e Resgatar */}
              <div className="mt-4 grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenMovimentacao(c, "DEPOSITO")}
                  className="h-8 text-xs border-fin/40 text-fin hover:bg-fin/10 font-medium"
                >
                  <ArrowUpRight className="size-3.5 mr-1 text-fin" /> Guardar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={c.saldo <= 0}
                  onClick={() => handleOpenMovimentacao(c, "RESGATE")}
                  className="h-8 text-xs border-border hover:bg-surface text-muted-foreground hover:text-foreground font-medium disabled:opacity-50"
                >
                  <ArrowDownRight className="size-3.5 mr-1" /> Resgatar
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modal Criar / Editar Caixinha */}
      <Dialog
        open={modalCaixinhaOpen}
        onClose={() => setModalCaixinhaOpen(false)}
        title={editingCaixinha ? "Editar Caixinha" : "Nova Caixinha de Dinheiro"}
        description="Defina um nome, ícone e meta para manter seu dinheiro guardado separadamente."
      >
        <form onSubmit={handleSaveCaixinha} className="space-y-4 mt-2">
          <Input
            label="Nome da Caixinha *"
            placeholder="Ex: Reserva de Emergência, Viagem, IPVA..."
            value={formNome}
            onChange={(e) => setFormNome(e.target.value)}
            required
            autoFocus
          />

          {!editingCaixinha && (
            <Input
              label="Saldo Inicial (R$)"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={formSaldoInicial}
              onChange={(e) => setFormSaldoInicial(e.target.value)}
              hint="Você pode começar com R$ 0,00 ou já separar um valor existente."
            />
          )}

          <Input
            label="Meta de Valor (Opcional)"
            type="number"
            step="0.01"
            min="0"
            placeholder="Ex: 5000,00"
            value={formMeta}
            onChange={(e) => setFormMeta(e.target.value)}
            hint="Defina um objetivo financeiro para acompanhar a barra de progresso."
          />

          <Input
            label="Descrição / Motivo (Opcional)"
            placeholder="Ex: 6 meses de contas pagas para tranquilidade"
            value={formDescricao}
            onChange={(e) => setFormDescricao(e.target.value)}
          />

          {/* Seleção de Ícone */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Ícone da Caixinha</label>
            <div className="grid grid-cols-4 gap-2">
              {CAIXINHA_ICONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFormIcone(item.id as Caixinha["icone"])}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs gap-1 transition-all cursor-pointer ${
                    formIcone === item.id
                      ? "border-fin bg-fin/15 text-fin font-semibold"
                      : "border-border bg-surface-raised text-muted-foreground hover:border-border/80 hover:text-foreground"
                  }`}
                >
                  {renderIcon(item.id as Caixinha["icone"], "size-4")}
                  <span className="text-[10px] truncate max-w-full">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Seleção de Cor */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Cor Temática</label>
            <div className="flex items-center gap-2.5">
              {CAIXINHA_CORES.map((cor) => (
                <button
                  key={cor}
                  type="button"
                  onClick={() => setFormCor(cor)}
                  className={`size-7 rounded-full transition-transform cursor-pointer ${
                    formCor === cor ? "scale-125 ring-2 ring-foreground ring-offset-2 ring-offset-background" : "hover:scale-110 opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: cor }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalCaixinhaOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="bg-fin hover:bg-fin/90 text-white">
              {editingCaixinha ? "Salvar Alterações" : "Criar Caixinha"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal Guardar ou Resgatar Dinheiro */}
      <Dialog
        open={movModalOpen}
        onClose={() => setMovModalOpen(false)}
        title={movTipo === "DEPOSITO" ? `Guardar em "${movCaixinha?.nome}"` : `Resgatar de "${movCaixinha?.nome}"`}
        description={
          movTipo === "DEPOSITO"
            ? "Adicione dinheiro à sua caixinha para render e se aproximar da sua meta."
            : `Saldo atual disponível nesta caixinha: ${brl(movCaixinha?.saldo || 0)}.`
        }
      >
        <form onSubmit={handleConfirmMovimentacao} className="space-y-4 mt-2">
          <div>
            <Input
              label="Valor (R$) *"
              type="number"
              step="0.01"
              min="0.01"
              max={movTipo === "RESGATE" ? movCaixinha?.saldo : undefined}
              placeholder="0,00"
              value={movValor}
              onChange={(e) => setMovValor(e.target.value)}
              required
              autoFocus
            />

            {/* Atalhos Rápidos de Valor */}
            <div className="flex items-center gap-1.5 mt-2">
              {[50, 100, 200, 500].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setMovValor(String(v))}
                  className="rounded-lg border border-border bg-surface-raised px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
                >
                  +{brl(v)}
                </button>
              ))}
              {movTipo === "RESGATE" && movCaixinha && movCaixinha.saldo > 0 && (
                <button
                  type="button"
                  onClick={() => setMovValor(String(movCaixinha.saldo))}
                  className="rounded-lg border border-fin/30 bg-fin/10 px-2.5 py-1 text-xs text-fin hover:bg-fin/20 transition-colors ml-auto font-medium cursor-pointer"
                >
                  Tudo ({brl(movCaixinha.saldo)})
                </button>
              )}
            </div>
          </div>

          <Input
            label="Observação (Opcional)"
            placeholder="Ex: Sobra do salário, Economia no mercado, etc."
            value={movObs}
            onChange={(e) => setMovObs(e.target.value)}
          />

          {onCreateTransaction && (
            <label className="flex items-start gap-2 text-xs text-muted-foreground p-2 rounded-lg bg-surface border border-border/70 cursor-pointer">
              <input
                type="checkbox"
                checked={movSyncExtrato}
                onChange={(e) => setMovSyncExtrato(e.target.checked)}
                className="size-4 mt-0.5 rounded border-border accent-fin"
              />
              <span>
                <strong className="text-foreground block font-medium">
                  {movTipo === "DEPOSITO"
                    ? "Lançar como saída (Despesa) no extrato da conta"
                    : "Lançar como entrada (Receita) no extrato da conta"}
                </strong>
                Atualiza também o saldo em conta corrente além da caixinha.
              </span>
            </label>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMovModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              className={movTipo === "DEPOSITO" ? "bg-fin hover:bg-fin/90 text-white" : "bg-primary hover:bg-primary/90 text-primary-foreground"}
            >
              {movTipo === "DEPOSITO" ? "Confirmar Depósito" : "Confirmar Resgate"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal de Histórico de Movimentações */}
      <Dialog
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title={`Extrato — ${historyCaixinha?.nome}`}
        description={`Saldo atual guardado: ${brl(historyCaixinha?.saldo || 0)}`}
      >
        <div className="mt-3 space-y-3">
          {historyCaixinha?.movimentacoes && historyCaixinha.movimentacoes.length > 0 ? (
            <div className="divide-y divide-border/60 max-h-80 overflow-y-auto pr-1">
              {historyCaixinha.movimentacoes.map((m) => (
                <div key={m.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                        m.tipo === "DEPOSITO" ? "bg-fin/15 text-fin" : "bg-primary/15 text-primary"
                      }`}
                    >
                      {m.tipo === "DEPOSITO" ? (
                        <ArrowUpRight className="size-4" />
                      ) : (
                        <ArrowDownRight className="size-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {m.tipo === "DEPOSITO" ? "Depósito guardado" : "Resgate realizado"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {m.data} {m.observacao ? `• ${m.observacao}` : ""}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-bold shrink-0 font-display ${
                      m.tipo === "DEPOSITO" ? "text-fin" : "text-foreground"
                    }`}
                  >
                    {m.tipo === "DEPOSITO" ? "+" : "-"}
                    {brl(m.valor)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-6">
              Nenhuma movimentação registrada nesta caixinha ainda.
            </p>
          )}

          <div className="flex justify-end pt-3 border-t border-border">
            <Button size="sm" variant="outline" onClick={() => setHistoryModalOpen(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Excluir Caixinha"
        description={`Tem certeza que deseja excluir a caixinha "${deletingCaixinha?.nome}"? ${
          deletingCaixinha && deletingCaixinha.saldo > 0
            ? `Ela possui ${brl(deletingCaixinha.saldo)} guardados.`
            : ""
        }`}
      >
        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={() => setDeleteConfirmOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDeleteConfirm}>
            Excluir Caixinha
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
