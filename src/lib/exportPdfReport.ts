import { jsPDF } from "jspdf";

export interface ReportData {
  userName: string;
  userEmail: string;
  userPlan: string;
  generatedAt: string;
  tasks: {
    total: number;
    concluded: number;
    pending: number;
    completionRate: number;
    highPriorityPending: number;
  };
  studies?: {
    totalTopics: number;
    dominatedTopics: number;
    dominatedPercentage: number;
    pendingReviews: number;
  };
  workouts?: {
    completedThisWeek: number;
    weeklyGoal: number;
    lastWorkout?: string;
  };
  finance?: {
    income: number;
    expense: number;
    balance: number;
    transactionsCount: number;
  };
  diagnostic: string;
}

export function generateExecutivePdf(data: ReportData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Background Header Dark Accent
  doc.setFillColor(11, 15, 25); // Dark Slate #0b0f19
  doc.rect(0, 0, pageWidth, 42, "F");

  // Nexus Logo & Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("NEXUS", 16, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text("RELATÓRIO EXECUTIVO DE PERFORMANCE & DISCIPLINA", 16, 25);

  // Badge Plano
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(pageWidth - 65, 12, 49, 8, 2, 2, "F");
  doc.setTextColor(248, 250, 252);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("PLANO: " + data.userPlan.toUpperCase(), pageWidth - 40, 17, { align: "center" });

  doc.setTextColor(148, 163, 184);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Emissão: " + data.generatedAt, pageWidth - 16, 28, { align: "right" });

  // Informações do Usuário
  let y = 52;
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("DADOS DO USUÁRIO", 16, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("Aluno: " + data.userName, 16, y + 6);
  doc.text("Identificador: " + data.userEmail, 16, y + 11);

  // Linha divisória
  y += 18;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(16, y, pageWidth - 16, y);

  // SEÇÃO 1: PRODUTIVIDADE & TAREFAS
  y += 8;
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("1. GESTÃO DE TAREFAS & PRODUTIVIDADE", 16, y);

  const boxWidth = (pageWidth - 32 - 8) / 3;
  const boxHeight = 18;
  y += 4;

  // Box 1
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(16, y, boxWidth, boxHeight, 2, 2, "FD");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("TAREFAS CONCLUÍDAS", 20, y + 6);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(String(data.tasks.concluded) + " / " + String(data.tasks.total), 20, y + 14);

  // Box 2
  doc.roundedRect(16 + boxWidth + 4, y, boxWidth, boxHeight, 2, 2, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("TAXA DE CONCLUSÃO", 20 + boxWidth + 4, y + 6);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(16, 185, 129);
  doc.text(String(data.tasks.completionRate) + "%", 20 + boxWidth + 4, y + 14);

  // Box 3
  doc.roundedRect(16 + (boxWidth + 4) * 2, y, boxWidth, boxHeight, 2, 2, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("PENDÊNCIAS CRÍTICAS", 20 + (boxWidth + 4) * 2, y + 6);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(data.tasks.highPriorityPending > 0 ? 239 : 15, data.tasks.highPriorityPending > 0 ? 68 : 23, data.tasks.highPriorityPending > 0 ? 68 : 42);
  doc.text(String(data.tasks.highPriorityPending) + " alta prioridade", 20 + (boxWidth + 4) * 2, y + 14);

  y += boxHeight + 8;

  // SEÇÃO 2: ESTUDOS & EDITAL (SE ATIVO)
  if (data.studies) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("2. DESEMPENHO EM ESTUDOS & CONCURSOS", 16, y);

    y += 4;
    const sBoxWidth = (pageWidth - 32 - 4) / 2;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);

    doc.roundedRect(16, y, sBoxWidth, boxHeight, 2, 2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("PROGRESSO DO EDITAL", 20, y + 6);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(99, 102, 241);
    doc.text(String(data.studies.dominatedTopics) + " de " + String(data.studies.totalTopics) + " tópicos (" + String(data.studies.dominatedPercentage) + "%)", 20, y + 14);

    doc.roundedRect(16 + sBoxWidth + 4, y, sBoxWidth, boxHeight, 2, 2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("REVISÕES ESPAÇADAS", 20 + sBoxWidth + 4, y + 6);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(String(data.studies.pendingReviews) + " pendentes no caderno", 20 + sBoxWidth + 4, y + 14);

    y += boxHeight + 8;
  }

  // SEÇÃO 3: TREINOS & FÍSICO (SE ATIVO)
  if (data.workouts) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("3. ROTINA DE TREINOS & CONSISTÊNCIA FÍSICA", 16, y);

    y += 4;
    const wBoxWidth = (pageWidth - 32 - 4) / 2;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);

    doc.roundedRect(16, y, wBoxWidth, boxHeight, 2, 2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("FREQUÊNCIA NA SEMANA", 20, y + 6);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(249, 115, 22);
    doc.text(String(data.workouts.completedThisWeek) + " de " + String(data.workouts.weeklyGoal || 4) + " treinos da meta", 20, y + 14);

    doc.roundedRect(16 + wBoxWidth + 4, y, wBoxWidth, boxHeight, 2, 2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("ÚLTIMO GRUPO TRABALHADO", 20 + wBoxWidth + 4, y + 6);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(data.workouts.lastWorkout || "Nenhum registrado", 20 + wBoxWidth + 4, y + 14);

    y += boxHeight + 8;
  }

  // SEÇÃO 4: FINANÇAS PESSOAIS (SE ATIVO)
  if (data.finance) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("4. GESTÃO FINANCEIRA & FLUXO DE CAIXA", 16, y);

    y += 4;
    const fBoxWidth = (pageWidth - 32 - 8) / 3;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);

    // Receitas
    doc.roundedRect(16, y, fBoxWidth, boxHeight, 2, 2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("RECEITAS REGISTRADAS", 20, y + 6);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129);
    doc.text("R$ " + data.finance.income.toFixed(2), 20, y + 14);

    // Despesas
    doc.roundedRect(16 + fBoxWidth + 4, y, fBoxWidth, boxHeight, 2, 2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("DESPESAS REGISTRADAS", 20 + fBoxWidth + 4, y + 6);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(239, 68, 68);
    doc.text("R$ " + data.finance.expense.toFixed(2), 20 + fBoxWidth + 4, y + 14);

    // Saldo Líquido
    doc.roundedRect(16 + (fBoxWidth + 4) * 2, y, fBoxWidth, boxHeight, 2, 2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("SALDO ATUAL", 20 + (fBoxWidth + 4) * 2, y + 6);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(data.finance.balance >= 0 ? 16 : 239, data.finance.balance >= 0 ? 185 : 68, data.finance.balance >= 0 ? 129 : 68);
    doc.text("R$ " + data.finance.balance.toFixed(2), 20 + (fBoxWidth + 4) * 2, y + 14);

    y += boxHeight + 8;
  }

  // DIAGNÓSTICO E AUDITORIA DA IA
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("DIAGNÓSTICO E RECOMENDAÇÕES ESTRATÉGICAS", 16, y);

  y += 4;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  const diagHeight = 28;
  doc.roundedRect(16, y, pageWidth - 32, diagHeight, 2, 2, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const splitText = doc.splitTextToSize(data.diagnostic, pageWidth - 42);
  doc.text(splitText, 21, y + 7);

  // Rodapé do Documento
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("Nexus Ecosystem — Plataforma Integrada de Gestão de Vida, Estudos & Alta Performance", 16, pageHeight - 12);
  doc.text("Documento oficial gerado via PWA", pageWidth - 16, pageHeight - 12, { align: "right" });

  const cleanFileName = "nexus-relatorio-" + data.userName.toLowerCase().replace(/\s+/g, "-") + "-" + new Date().toISOString().slice(0, 10) + ".pdf";
  doc.save(cleanFileName);
}
