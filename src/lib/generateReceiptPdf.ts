import { jsPDF } from "jspdf";

export interface PlanDetails {
  id: "STARTER" | "PRO" | "ENTERPRISE";
  name: string;
  priceMonthly: number;
  priceYearly: number;
  popular?: boolean;
  description: string;
  features: string[];
}

export interface ReceiptData {
  orderId: string;
  userName: string;
  userEmail: string;
  plan: PlanDetails;
  billingCycle: "MONTHLY" | "YEARLY";
  paymentMethod: "PIX" | "CREDIT_CARD";
  amount: number;
  pixKey: string;
  pixReceiverName: string;
  pixCity: string;
  cardLast4?: string;
  cardHolder?: string;
  installments?: number;
  paidAt: string;
}

export function generateReceiptPdf(data: ReceiptData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFillColor(11, 15, 25);
  doc.rect(0, 0, pageWidth, 45, "F");

  doc.setFillColor(56, 189, 248);
  doc.rect(0, 0, pageWidth, 3, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("NEXUS", 18, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text("GESTAO DE VIDA, ESTUDOS, TREINOS & FINANCAS", 18, 26);
  doc.text("https://nexus-front-phi.vercel.app", 18, 31);

  doc.setFillColor(16, 185, 129);
  doc.roundedRect(pageWidth - 65, 15, 47, 10, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("PEDIDO CONFIRMADO", pageWidth - 63, 21.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`PEDIDO: #${data.orderId}`, pageWidth - 65, 31);

  // Title Box
  let y = 56;
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("COMPROVANTE OFICIAL DE ASSINATURA", 18, y);

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Emitido em ${data.paidAt} | Documento comprobatorio de adesao ao plano Nexus.`,
    18,
    y
  );

  y += 6;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(18, y, pageWidth - 18, y);

  // Informacoes do Assinante e Beneficiario
  y += 10;
  const colWidth = (pageWidth - 36 - 8) / 2;

  // Assinante
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(18, y, colWidth, 38, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("DADOS DO ASSINANTE", 24, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Nome: ${data.userName || "Usuario Nexus"}`, 24, y + 16);
  doc.text(`E-mail: ${data.userEmail}`, 24, y + 23);
  doc.text(`Plano: ${data.plan.name}`, 24, y + 30);

  // Recebedor
  const col2X = 18 + colWidth + 8;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(col2X, y, colWidth, 38, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("DADOS DO RECEBEDOR", col2X + 6, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Titular: ${data.pixReceiverName}`, col2X + 6, y + 16);
  doc.text(`Chave PIX (Celular): ${data.pixKey}`, col2X + 6, y + 23);
  doc.text(`Praca: ${data.pixCity} - MG (Brasil)`, col2X + 6, y + 30);

  // Tabela
  y += 46;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("DETALHAMENTO DO PEDIDO", 18, y);

  y += 5;
  doc.setFillColor(15, 23, 42);
  doc.rect(18, y, pageWidth - 36, 9, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("DESCRICAO", 24, y + 6);
  doc.text("CICLO", 110, y + 6);
  doc.text("METODO", 140, y + 6);
  doc.text("VALOR", pageWidth - 35, y + 6);

  y += 9;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.rect(18, y, pageWidth - 36, 16, "FD");

  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(data.plan.name, 24, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Acesso total a todas as ferramentas do Nexus", 24, y + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(data.billingCycle === "YEARLY" ? "Anual (12x)" : "Mensal", 110, y + 8);
  doc.text(data.paymentMethod === "PIX" ? "PIX Instantaneo" : "Cartao de Credito", 140, y + 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(16, 185, 129);
  doc.text(`R$ ${data.amount.toFixed(2).replace(".", ",")}`, pageWidth - 35, y + 8);

  // Total
  y += 20;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(pageWidth - 95, y, 77, 24, 2, 2, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Total Liquidado:", pageWidth - 90, y + 8);
  doc.text("Status da Transacao:", pageWidth - 90, y + 15);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`R$ ${data.amount.toFixed(2).replace(".", ",")}`, pageWidth - 45, y + 8);

  doc.setFontSize(9);
  doc.setTextColor(16, 185, 129);
  doc.text("APROVADO", pageWidth - 45, y + 15);

  // Dados de liquidacao
  y += 32;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("DETALHES DA TRANSACAO", 18, y);

  y += 5;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(18, y, pageWidth - 36, 32, 3, 3, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  if (data.paymentMethod === "PIX") {
    doc.text(`- Forma: Transferencia Instantanea PIX`, 24, y + 8);
    doc.text(`- Chave PIX: ${data.pixKey} (Celular)`, 24, y + 15);
    doc.text(`- Favorecido: ${data.pixReceiverName}`, 24, y + 22);
    doc.text(`- Comprovante gerado digitalmente pelo Nexus`, 24, y + 28);
  } else {
    doc.text(`- Forma: Cartao de Credito / Debito Online`, 24, y + 8);
    doc.text(`- Cartao Final: **** **** **** ${data.cardLast4 || "4242"}`, 24, y + 15);
    doc.text(`- Titular: ${data.cardHolder || data.userName}`, 24, y + 22);
    doc.text(`- Parcelamento: ${data.installments || 1}x sem juros`, 24, y + 28);
  }

  // Beneficios
  y += 38;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("BENEFICIOS CONTRATADOS:", 18, y);

  y += 5;
  data.plan.features.slice(0, 5).forEach((feat: string, index: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`[x] ${feat}`, 22, y + index * 5.5);
  });

  // Footer
  doc.setFillColor(15, 23, 42);
  doc.rect(0, pageHeight - 16, pageWidth, 16, "F");

  doc.setTextColor(148, 163, 184);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(
    "Nexus Produtividade - Chave Pix: 34992005737 - Contato: allysonr510@gmail.com",
    pageWidth / 2,
    pageHeight - 9,
    { align: "center" }
  );
  doc.text(
    "Recibo oficial de adesao a plataforma Nexus.",
    pageWidth / 2,
    pageHeight - 5,
    { align: "center" }
  );

  const cleanPlan = data.plan.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
  doc.save(`Comprovante_Nexus_${cleanPlan}_${data.orderId}.pdf`);
}
