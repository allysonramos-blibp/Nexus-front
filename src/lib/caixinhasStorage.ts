export interface CaixinhaMovimentacao {
  id: string;
  tipo: "DEPOSITO" | "RESGATE";
  valor: number;
  data: string; // YYYY-MM-DD
  observacao?: string;
}

export interface Caixinha {
  id: string;
  userId: number;
  nome: string;
  icone: "shield" | "piggy" | "plane" | "car" | "home" | "heart" | "star" | "wallet";
  cor: string;
  saldo: number;
  metaValor?: number;
  dataMeta?: string;
  descricao?: string;
  criadoEm: string;
  movimentacoes: CaixinhaMovimentacao[];
}

const STORAGE_KEY_PREFIX = "nexus.caixinhas.";

function getTodayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const CAIXINHA_ICONS = [
  { id: "shield", label: "Proteção / Reserva" },
  { id: "piggy", label: "Cofrinho" },
  { id: "plane", label: "Viagem" },
  { id: "car", label: "Veículo" },
  { id: "home", label: "Moradia / Reforma" },
  { id: "heart", label: "Saúde / Pessoal" },
  { id: "star", label: "Sonhos" },
  { id: "wallet", label: "Livre" },
] as const;

export const CAIXINHA_CORES = [
  "#10b981", // Esmeralda / Financeiro
  "#06b6d4", // Ciano
  "#3b82f6", // Azul
  "#8b5cf6", // Roxo
  "#ec4899", // Rosa
  "#f59e0b", // Âmbar
  "#ef4444", // Vermelho
  "#14b8a6", // Teal
];

export function getCaixinhas(userId: number): Caixinha[] {
  if (!userId) return [];
  const key = `${STORAGE_KEY_PREFIX}${userId}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      // Cria a primeira caixinha padrão solicitada pelo usuário (ex: R$ 1.000 separados)
      const defaultCaixinha: Caixinha = {
        id: `c-default-${Date.now()}`,
        userId,
        nome: "Reserva de Emergência",
        icone: "shield",
        cor: "#10b981",
        saldo: 1000,
        metaValor: 5000,
        descricao: "Dinheiro guardado separado para imprevistos e segurança",
        criadoEm: getTodayIso(),
        movimentacoes: [
          {
            id: `m-init-${Date.now()}`,
            tipo: "DEPOSITO",
            valor: 1000,
            data: getTodayIso(),
            observacao: "Saldo inicial reservado",
          },
        ],
      };
      const initialList = [defaultCaixinha];
      localStorage.setItem(key, JSON.stringify(initialList));
      return initialList;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Erro ao carregar caixinhas:", err);
    return [];
  }
}

function saveCaixinhasList(userId: number, list: Caixinha[]): void {
  const key = `${STORAGE_KEY_PREFIX}${userId}`;
  try {
    localStorage.setItem(key, JSON.stringify(list));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("nexus-caixinhas-updated", { detail: { userId } }));
    }
  } catch (err) {
    console.error("Erro ao salvar caixinhas:", err);
  }
}

export function saveCaixinha(
  userId: number,
  data: {
    id?: string;
    nome: string;
    icone: Caixinha["icone"];
    cor: string;
    metaValor?: number;
    saldo?: number;
    descricao?: string;
    dataMeta?: string;
  }
): Caixinha {
  const list = getCaixinhas(userId);
  if (data.id) {
    const idx = list.findIndex((c) => c.id === data.id);
    if (idx >= 0) {
      const existing = list[idx];
      const updated: Caixinha = {
        ...existing,
        nome: data.nome,
        icone: data.icone,
        cor: data.cor,
        metaValor: data.metaValor,
        descricao: data.descricao,
        dataMeta: data.dataMeta,
        saldo: data.saldo !== undefined ? data.saldo : existing.saldo,
      };
      list[idx] = updated;
      saveCaixinhasList(userId, list);
      return updated;
    }
  }

  const initialSaldo = Math.max(0, Number(data.saldo) || 0);
  const newCaixinha: Caixinha = {
    id: `cx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId,
    nome: data.nome,
    icone: data.icone || "piggy",
    cor: data.cor || "#10b981",
    saldo: initialSaldo,
    metaValor: data.metaValor,
    descricao: data.descricao,
    dataMeta: data.dataMeta,
    criadoEm: getTodayIso(),
    movimentacoes: initialSaldo > 0
      ? [
          {
            id: `m-${Date.now()}`,
            tipo: "DEPOSITO",
            valor: initialSaldo,
            data: getTodayIso(),
            observacao: "Saldo inicial da caixinha",
          },
        ]
      : [],
  };

  list.push(newCaixinha);
  saveCaixinhasList(userId, list);
  return newCaixinha;
}

export function deleteCaixinha(userId: number, id: string): void {
  const list = getCaixinhas(userId);
  const filtered = list.filter((c) => c.id !== id);
  saveCaixinhasList(userId, filtered);
}

export function movimentarCaixinha(
  userId: number,
  id: string,
  tipo: "DEPOSITO" | "RESGATE",
  valor: number,
  observacao?: string
): Caixinha | null {
  const list = getCaixinhas(userId);
  const idx = list.findIndex((c) => c.id === id);
  if (idx === -1) return null;

  const item = list[idx];
  const numValor = Math.max(0, Number(valor));
  if (numValor <= 0) return item;

  let newSaldo = item.saldo;
  if (tipo === "DEPOSITO") {
    newSaldo += numValor;
  } else {
    newSaldo = Math.max(0, newSaldo - numValor);
  }

  const mov: CaixinhaMovimentacao = {
    id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    tipo,
    valor: numValor,
    data: getTodayIso(),
    observacao: observacao?.trim() || (tipo === "DEPOSITO" ? "Depósito na caixinha" : "Resgate da caixinha"),
  };

  const updated: Caixinha = {
    ...item,
    saldo: newSaldo,
    movimentacoes: [mov, ...(item.movimentacoes || [])],
  };

  list[idx] = updated;
  saveCaixinhasList(userId, list);
  return updated;
}
