import { jsPDF } from "jspdf";

export function downloadArchitecturePdf(): void {
  const doc = createArchitecturePdf();
  doc.save("Nexus_Arquitetura_Executiva_Apresentacao.pdf");
}

export function createArchitecturePdf(): jsPDF {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4", // 297 x 210 mm
  });

  const pageWidth = 297;
  const pageHeight = 210;

  // Helper colors
  const C_DARK_BG = [11, 15, 25];       // #0B0F19
  const C_DARK_CARD = [19, 26, 43];     // #131A2B
  const C_DARK_BORDER = [30, 41, 69];   // #1E2945
  const C_LIGHT_BG = [248, 250, 252];   // #F8FAFC
  const C_WHITE = [255, 255, 255];
  const C_PRIMARY_BLUE = [37, 99, 235]; // #2563EB
  const C_EMERALD = [16, 185, 129];     // #10B981
  const C_PURPLE = [139, 92, 246];      // #8B5CF6
  const C_AMBER = [245, 158, 11];       // #F59E0B
  const C_TEXT_MAIN = [15, 23, 42];     // #0F172A
  const C_TEXT_MUTED = [100, 116, 139]; // #64748B
  const C_TEXT_LIGHT = [226, 232, 240]; // #E2E8F0
  const C_CARD_BORDER = [226, 232, 240];// #E2E8F0

  function drawSlideHeader(slideNum: string, category: string, title: string, subtitle: string) {
    // Header background bar
    doc.setFillColor(11, 15, 25);
    doc.rect(0, 0, pageWidth, 28, "F");

    // Decorative line
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 27.2, pageWidth, 0.8, "F");

    // Badge
    doc.setFillColor(30, 41, 69);
    doc.roundedRect(16, 6, 42, 6, 1.5, 1.5, "F");
    doc.setTextColor(147, 197, 253);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(category, 37, 10.2, { align: "center" });

    // Slide number on right
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(`SLIDE ${slideNum} / 06`, pageWidth - 16, 10.2, { align: "right" });

    // Main title
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(title, 16, 21.5);

    // Subtitle on right
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(subtitle, pageWidth - 16, 21.5, { align: "right" });
  }

  function drawSlideFooter(current: number, total: number = 6) {
    // Footer line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(16, pageHeight - 12, pageWidth - 16, pageHeight - 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("NEXUS ECOSYSTEM  •  ARQUITETURA DE ALTA PERFORMANCE  •  CONFIDENCIAL", 16, pageHeight - 7);
    doc.text(`Página ${current} de ${total}`, pageWidth - 16, pageHeight - 7, { align: "right" });
  }

  // =========================================================================
  // SLIDE 1: CAPA EXECUTIVA
  // =========================================================================
  {
    // Full dark canvas
    doc.setFillColor(C_DARK_BG[0], C_DARK_BG[1], C_DARK_BG[2]);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    // Decorative top-right abstract grid/glow
    doc.setFillColor(20, 29, 48);
    doc.roundedRect(pageWidth - 95, -20, 120, 90, 8, 8, "F");
    doc.setFillColor(30, 41, 69);
    doc.roundedRect(pageWidth - 75, -10, 95, 75, 6, 6, "F");

    // Glowing accent line
    doc.setFillColor(C_PRIMARY_BLUE[0], C_PRIMARY_BLUE[1], C_PRIMARY_BLUE[2]);
    doc.rect(20, 36, 12, 2, "F");

    // Top Brand Tag
    doc.setFillColor(30, 41, 69);
    doc.roundedRect(20, 44, 68, 8, 2, 2, "F");
    doc.setTextColor(147, 197, 253);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("ECOSSISTEMA INTEGRADO NEXUS", 54, 49.3, { align: "center" });

    // Main Title
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(32);
    doc.text("NEXUS ARCHITECTURE", 20, 68);

    // Subtitle
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(13);
    doc.text("Apresentação Técnica Executiva: Frontend SPA/PWA & Backend RESTful API", 20, 78);

    doc.setFontSize(9.5);
    doc.setTextColor(203, 213, 225);
    doc.text(
      "Documento oficial de especificação arquitetural, modelagem de dados relacional (PostgreSQL),",
      20,
      87
    );
    doc.text(
      "segurança stateless JWT, pipeline de OCR para bancas de concurso e módulos de alta produtividade.",
      20,
      93
    );

    // 3 Highlight Feature Cards on Cover
    const cards = [
      {
        title: "FRONTEND (PWA)",
        subtitle: "React 19 + TypeScript + Vite",
        desc: "Tailwind CSS v4, TanStack Query, Caixinhas de Reserva, offline-ready e renderização reativa.",
        color: C_PRIMARY_BLUE,
        tag: "CLIENT-SIDE",
      },
      {
        title: "BACKEND (REST API)",
        subtitle: "Java 21 + Spring Boot 4",
        desc: "Spring Security, stateless JWT, 21 Controllers, 28 Services, Apache PDFBox 3.0 determinístico.",
        color: C_EMERALD,
        tag: "SERVER-SIDE",
      },
      {
        title: "DATABASE & AI",
        subtitle: "PostgreSQL 16 + Google Gemini",
        desc: "Mapeamento JPA relacional, isolamento multi-tenant por usuário e tutor pedagógico de IA.",
        color: C_PURPLE,
        tag: "DATA & AI",
      },
    ];

    cards.forEach((c, idx) => {
      const cx = 20 + idx * 87;
      const cy = 110;
      const cw = 82;
      const ch = 52;

      doc.setFillColor(C_DARK_CARD[0], C_DARK_CARD[1], C_DARK_CARD[2]);
      doc.roundedRect(cx, cy, cw, ch, 3, 3, "F");

      doc.setDrawColor(C_DARK_BORDER[0], C_DARK_BORDER[1], C_DARK_BORDER[2]);
      doc.setLineWidth(0.4);
      doc.roundedRect(cx, cy, cw, ch, 3, 3, "S");

      // Top color bar
      doc.setFillColor(c.color[0], c.color[1], c.color[2]);
      doc.rect(cx + 3, cy + 3, cw - 6, 1.2, "F");

      // Card Tag
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(c.color[0], c.color[1], c.color[2]);
      doc.text(c.tag, cx + 6, cy + 11);

      // Card Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text(c.title, cx + 6, cy + 18);

      // Subtitle
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(c.subtitle, cx + 6, cy + 24);

      // Desc
      doc.setFontSize(7.5);
      doc.setTextColor(203, 213, 225);
      const lines = doc.splitTextToSize(c.desc, cw - 12);
      doc.text(lines, cx + 6, cy + 32);
    });

    // Author & Metadata Box at bottom
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 180, pageWidth, 30, "F");
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 180, pageWidth, 0.5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(248, 250, 252);
    doc.text("AUTOR & RESPONSÁVEL TÉCNICO:", 20, 192);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(147, 197, 253);
    doc.text("Allyson Ramos (allysonr510@gmail.com)", 78, 192);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(248, 250, 252);
    doc.text("STATUS DO SISTEMA:", 20, 199);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(52, 211, 153);
    doc.text("Código Fonte 100% Limpo & Auditado  |  Pronto para Produção (Vercel + Render)", 65, 199);

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Setembro / 2026", pageWidth - 20, 192, { align: "right" });
    doc.text("Versão 2.0.0 Enterprise", pageWidth - 20, 199, { align: "right" });
  }

  // =========================================================================
  // SLIDE 2: TOPOLOGIA E FLUXO GLOBAL
  // =========================================================================
  {
    doc.addPage();
    drawSlideHeader("02", "TOPOLOGIA GLOBAL", "Arquitetura Distribuída & Fluxo de Comunicação", "Interação entre Cliente, API e Banco");

    // Canvas background
    doc.setFillColor(C_LIGHT_BG[0], C_LIGHT_BG[1], C_LIGHT_BG[2]);
    doc.rect(0, 28, pageWidth, pageHeight - 28, "F");

    // 3 Main architectural columns
    const cols = [
      {
        header: "1. CLIENTE (NEXUS-FRONT)",
        badge: "Single Page App & PWA",
        badgeColor: C_PRIMARY_BLUE,
        items: [
          "• Navegador Web & Dispositivos Móveis (PWA instalado)",
          "• Renderização reativa com React 19 e TypeScript",
          "• TanStack Query para cache e estado de rede assíncrono",
          "• Armazenamento local: token JWT em 'nexus.token'",
          "• Detecção automática de sessão expirada (401 Unauthorized)",
          "• Desregistro preventivo de caches antigos em novos deploys",
          "• Cabeçalho automático: Authorization: Bearer <token>",
        ],
        footerTitle: "TECNOLOGIAS",
        footerVal: "React 19 • Vite 6 • Tailwind CSS v4 • jsPDF",
      },
      {
        header: "2. SERVIÇOS (NEXUS-API)",
        badge: "Stateless REST API",
        badgeColor: C_EMERALD,
        items: [
          "• Spring Boot 4 rodando sobre Java 21 LTS de alta performance",
          "• 21 REST Controllers padronizados sob prefixo /api/*",
          "• Camada de Segurança: Spring Security + JwtAuthenticationFilter",
          "• Controle de Acesso Baseado em Funções (USER, ADMIN, MASTER)",
          "• Validação rigorosa de payload com Jakarta Bean Validation",
          "• Motor de extração de provas determinístico via Apache PDFBox",
          "• Proxy blindado para Google Gemini sem expor API Key ao browser",
        ],
        footerTitle: "TECNOLOGIAS",
        footerVal: "Java 21 • Spring Boot 4 • JJWT 0.12 • PDFBox 3.0",
      },
      {
        header: "3. DADOS & INTELIGÊNCIA",
        badge: "Persistência & AI",
        badgeColor: C_PURPLE,
        items: [
          "• Banco Relacional PostgreSQL 16 com SSL obrigatório",
          "• Mapeamento Objeto-Relacional via Spring Data JPA / Hibernate",
          "• Isolamento multi-tenant: todo registro é amarrado ao userId",
          "• Índices compostos em (user_id, status) e (user_id, data)",
          "• Integridade referencial com ON DELETE CASCADE em cascata",
          "• Google Gemini 3.6 Flash para mentoria pedagógica de concursos",
          "• Armazenamento de mídia física/fotos via multipart uploads",
        ],
        footerTitle: "TECNOLOGIAS",
        footerVal: "PostgreSQL 16 • HikariCP • Google Gemini AI",
      },
    ];

    cols.forEach((col, idx) => {
      const x = 16 + idx * 89.3;
      const y = 35;
      const w = 86;
      const h = 120;

      // Card container
      doc.setFillColor(C_WHITE[0], C_WHITE[1], C_WHITE[2]);
      doc.roundedRect(x, y, w, h, 3, 3, "F");
      doc.setDrawColor(C_CARD_BORDER[0], C_CARD_BORDER[1], C_CARD_BORDER[2]);
      doc.setLineWidth(0.4);
      doc.roundedRect(x, y, w, h, 3, 3, "S");

      // Top color indicator
      doc.setFillColor(col.badgeColor[0], col.badgeColor[1], col.badgeColor[2]);
      doc.rect(x + 3, y + 3, w - 6, 1.2, "F");

      // Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(C_TEXT_MAIN[0], C_TEXT_MAIN[1], C_TEXT_MAIN[2]);
      doc.text(col.header, x + 6, y + 12);

      // Badge
      doc.setFillColor(col.badgeColor[0] * 0.15 + 220, col.badgeColor[1] * 0.15 + 220, col.badgeColor[2] * 0.15 + 220);
      doc.roundedRect(x + 6, y + 16, 45, 5, 1, 1, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(col.badgeColor[0], col.badgeColor[1], col.badgeColor[2]);
      doc.text(col.badge, x + 8, y + 19.5);

      // Items list
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      let curY = y + 27;
      col.items.forEach((item) => {
        const lines = doc.splitTextToSize(item, w - 12);
        doc.text(lines, x + 6, curY);
        curY += lines.length * 4.2 + 2;
      });

      // Card bottom tech box
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(x + 4, y + h - 16, w - 8, 12, 1.5, 1.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(C_TEXT_MUTED[0], C_TEXT_MUTED[1], C_TEXT_MUTED[2]);
      doc.text(col.footerTitle, x + 7, y + h - 11);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(C_TEXT_MAIN[0], C_TEXT_MAIN[1], C_TEXT_MAIN[2]);
      doc.text(col.footerVal, x + 7, y + h - 6.5);
    });

    // Connecting bottom banner
    const by = 160;
    const bw = pageWidth - 32;
    const bh = 34;
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(16, by, bw, bh, 3, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(147, 197, 253);
    doc.text("DIRETRIZES FUNDAMENTAIS DA ARQUITETURA NEXUS:", 22, by + 9);

    const principles = [
      "1. Autenticação Stateless: Sessões não geram estado no servidor, permitindo escala horizontal instantânea.",
      "2. Isolamento Multi-Tenancy: Nenhuma query expõe dados de outro aluno/usuário — id sempre extraído do JWT.",
      "3. Resiliência Client-Side: Se a rede oscilar, o cache local preserva o cockpit e exibe indicadores não bloqueantes.",
      "4. Segurança em Camadas: XSS mitigado no front (DOMPurify/React), CSRF desabilitado com segurança por ser Bearer.",
    ];

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(226, 232, 240);
    principles.forEach((p, pIdx) => {
      doc.text(p, 22, by + 16 + pIdx * 4.2);
    });

    drawSlideFooter(2);
  }

  // =========================================================================
  // SLIDE 3: FRONTEND ARCHITECTURE
  // =========================================================================
  {
    doc.addPage();
    drawSlideHeader("03", "FRONTEND (NEXUS-FRONT)", "Arquitetura do Cliente: React 19, TypeScript e PWA", "Componentes, Estado e Módulos");

    doc.setFillColor(C_LIGHT_BG[0], C_LIGHT_BG[1], C_LIGHT_BG[2]);
    doc.rect(0, 28, pageWidth, pageHeight - 28, "F");

    // Left Column: Folder Structure & Layout (Width 125mm)
    {
      const x = 16;
      const y = 35;
      const w = 125;
      const h = 158;

      doc.setFillColor(C_WHITE[0], C_WHITE[1], C_WHITE[2]);
      doc.roundedRect(x, y, w, h, 3, 3, "F");
      doc.setDrawColor(C_CARD_BORDER[0], C_CARD_BORDER[1], C_CARD_BORDER[2]);
      doc.setLineWidth(0.4);
      doc.roundedRect(x, y, w, h, 3, 3, "S");

      doc.setFillColor(C_PRIMARY_BLUE[0], C_PRIMARY_BLUE[1], C_PRIMARY_BLUE[2]);
      doc.rect(x + 3, y + 3, w - 6, 1.2, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(C_TEXT_MAIN[0], C_TEXT_MAIN[1], C_TEXT_MAIN[2]);
      doc.text("ESTRUTURA MODULAR DO FRONTEND", x + 6, y + 12);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(C_TEXT_MUTED[0], C_TEXT_MUTED[1], C_TEXT_MUTED[2]);
      doc.text("Organização orientada a domínio de alta coesão e baixo acoplamento:", x + 6, y + 18);

      const tree = [
        "src/",
        "├── pages/                     # Telas da Aplicação (Lazy Loaded)",
        "│   ├── dashboard.tsx          # Cockpit Inicial com Foco Único",
        "│   ├── estudos.tsx            # Edital Verticalizado e Simulados",
        "│   ├── treinos.tsx            # Fichas Musculares e Cargas",
        "│   ├── financeiro.tsx         # Extrato, Gráfico e Caixinhas",
        "│   ├── admin.tsx              # Gestão de Usuários e RBAC",
        "│   └── login.tsx              # Autenticação JWT e Cadastro",
        "├── components/                # Orquestradores e UI Reutilizável",
        "│   ├── AppShell.tsx           # Layout com Header e Navegação",
        "│   ├── CaixinhasSection.tsx   # Gestão de Caixinhas e Metas",
        "│   ├── CheckoutModal.tsx      # Contratação SaaS com PIX e Cartão",
        "│   ├── AiChatPopup.tsx        # Tutor Flutuante com Google Gemini",
        "│   └── ui/                    # 15+ Primitivas Visuais (Card, Dialog...)",
        "├── lib/                       # Serviços e Integração",
        "│   ├── api.ts                 # Cliente HTTP centralizado e DTOs",
        "│   ├── auth.tsx               # Contexto de Autenticação e RBAC",
        "│   └── caixinhasStorage.ts    # Persistência de Caixinhas de Reserva",
        "└── styles.css                 # Tokens Globais do Tailwind CSS v4",
      ];

      doc.setFont("courier", "normal");
      doc.setFontSize(6.8);
      doc.setTextColor(30, 41, 59);
      let ty = y + 26;
      tree.forEach((t) => {
        doc.text(t, x + 6, ty);
        ty += 4.2;
      });

      // Bottom box inside column
      doc.setFillColor(239, 246, 255);
      doc.roundedRect(x + 5, y + h - 42, w - 10, 36, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(C_PRIMARY_BLUE[0], C_PRIMARY_BLUE[1], C_PRIMARY_BLUE[2]);
      doc.text("DESTAQUES DE IMPLEMENTAÇÃO NO FRONTEND:", x + 8, y + h - 35);

      const frontHighlights = [
        "• Zero Comentários: Código 100% limpo, sem ruídos nem comentários mortos.",
        "• Sistema de Caixinhas: Reserva de Emergência R$ 1.000 pré-configurada.",
        "• Resiliência PWA: main.tsx desregistra caches legados ao atualizar versão.",
        "• Emissão de Relatório: Motor jsPDF gera dossiê A4 vetorial com 1 clique.",
      ];
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.2);
      doc.setTextColor(30, 41, 59);
      frontHighlights.forEach((fh, fidx) => {
        doc.text(fh, x + 8, y + h - 28 + fidx * 4.3);
      });
    }

    // Right Column: Functional Modules Breakdown (Width 134mm)
    {
      const x = 147;
      const y = 35;
      const w = 134;
      const h = 158;

      doc.setFillColor(C_WHITE[0], C_WHITE[1], C_WHITE[2]);
      doc.roundedRect(x, y, w, h, 3, 3, "F");
      doc.setDrawColor(C_CARD_BORDER[0], C_CARD_BORDER[1], C_CARD_BORDER[2]);
      doc.setLineWidth(0.4);
      doc.roundedRect(x, y, w, h, 3, 3, "S");

      doc.setFillColor(C_EMERALD[0], C_EMERALD[1], C_EMERALD[2]);
      doc.rect(x + 3, y + 3, w - 6, 1.2, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(C_TEXT_MAIN[0], C_TEXT_MAIN[1], C_TEXT_MAIN[2]);
      doc.text("MÓDULOS DE NEGÓCIO DO ECOSSISTEMA", x + 6, y + 12);

      const modules = [
        {
          name: "1. COCKPIT & PRODUTIVIDADE DIÁRIA",
          desc: "Foco Único diário, Pomodoro customizado, tarefas com prioridade (Alta, Média, Baixa) e saudação dinâmica contextual.",
          color: [37, 99, 235],
        },
        {
          name: "2. CONCURSOS, SIMULADOS & CADERNO DE ERROS",
          desc: "Edital verticalizado com cálculo de domínio teórico, simulados com cronômetro decrescente e repetição espaçada no Caderno de Erros.",
          color: [16, 185, 129],
        },
        {
          name: "3. TREINOS, CARGAS & EVOLUÇÃO FÍSICA",
          desc: "Fichas divididas (A, B, C, D), registro de séries, repetições e cargas (kg), com histórico de pesagem corporal e fotos.",
          color: [245, 158, 11],
        },
        {
          name: "4. FINANÇAS & CAIXINHAS DE RESERVA",
          desc: "Fluxo de caixa diário, gráfico Donut de gastos, metas visuais com progresso e segregação de saldo (Conta Corrente vs. Caixinhas).",
          color: [139, 92, 246],
        },
        {
          name: "5. GOVERNANÇA & MASTER ADMIN",
          desc: "Gestão completa de usuários, ativação/desativação instantânea e habilitação comercial de módulos individuais (RBAC).",
          color: [239, 68, 68],
        },
      ];

      let my = y + 20;
      modules.forEach((mod) => {
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(x + 5, my, w - 10, 23, 1.5, 1.5, "F");
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.roundedRect(x + 5, my, w - 10, 23, 1.5, 1.5, "S");

        doc.setFillColor(mod.color[0], mod.color[1], mod.color[2]);
        doc.circle(x + 10, my + 6.5, 1.8, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(C_TEXT_MAIN[0], C_TEXT_MAIN[1], C_TEXT_MAIN[2]);
        doc.text(mod.name, x + 15, my + 8);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.2);
        doc.setTextColor(C_TEXT_MUTED[0], C_TEXT_MUTED[1], C_TEXT_MUTED[2]);
        const dlines = doc.splitTextToSize(mod.desc, w - 20);
        doc.text(dlines, x + 10, my + 14);

        my += 26;
      });
    }

    drawSlideFooter(3);
  }

  // =========================================================================
  // SLIDE 4: BACKEND ARCHITECTURE
  // =========================================================================
  {
    doc.addPage();
    drawSlideHeader("04", "BACKEND (NEXUS-API)", "Arquitetura do Servidor: Java 21, Spring Boot e Clean Architecture", "Camadas, Pacotes e Pipeline de OCR");

    doc.setFillColor(C_LIGHT_BG[0], C_LIGHT_BG[1], C_LIGHT_BG[2]);
    doc.rect(0, 28, pageWidth, pageHeight - 28, "F");

    // 4 Layered Boxes
    const layers = [
      {
        title: "1. CAMADA DE CONTROLADORES (21 REST CONTROLLERS)",
        badge: "PACOTE: com.nexus.nexus_api.controller",
        color: C_PRIMARY_BLUE,
        items: [
          "• AuthController: login público, refresh e recuperação de senha.",
          "• AdminController: governança e salvaguarda do mestre (allysonr510@gmail.com).",
          "• UserController, TaskController, StudyPlanController, SubjectController, TopicController.",
          "• QuestionController, AnswerController, MockExamController, StudyErrorController.",
          "• WorkoutController, WorkoutGoalController, FinancialTransactionController, CategoryController.",
          "• ChatController: proxy blindado do Google Gemini e Chat pedagógico.",
        ],
      },
      {
        title: "2. CAMADA DE REGRAS DE NEGÓCIO (28 SERVICES)",
        badge: "PACOTE: com.nexus.nexus_api.service",
        color: C_EMERALD,
        items: [
          "• Transações ACID anotadas com @Transactional (rollback automático em erro).",
          "• Pipeline PDFBox 3.0.3: PdfQuestionParserService e PdfAnswerKeyParserService.",
          "• PlanQuestionGroupingService: agrupamento automático de questões por matéria do edital.",
          "• FSRS & Spaced Repetition: cálculo de intervalo ótimo para o Caderno de Erros.",
          "• GeminiChatService & GeminiClient: orquestração resiliente com tratamento de cota (429).",
        ],
      },
      {
        title: "3. CAMADA DE PERSISTÊNCIA & MODELO (29 MODELS + 19 REPOSITORIES)",
        badge: "PACOTE: com.nexus.nexus_api.model / repository",
        color: C_PURPLE,
        items: [
          "• Entidades JPA: User, Task, StudyPlan, Subject, Topic, Question, Answer, Workout, etc.",
          "• Spring Data JPA: queries derivadas e consultas otimizadas via JPQL.",
          "• Chaves estrangeiras com integridade relacional e deleção em cascata (ON DELETE CASCADE).",
          "• Mapeamento de coleções com FetchType.LAZY prevenindo o problema de N+1 queries.",
        ],
      },
      {
        title: "4. CAMADA DE SEGURANÇA & DTOs (SECURITY + 38 DTOs)",
        badge: "PACOTE: com.nexus.nexus_api.security / dto",
        color: C_AMBER,
        items: [
          "• SecurityConfig: filtros stateless com JwtAuthenticationFilter antes do UsernamePassword.",
          "• JJWT 0.12.6: assinatura criptográfica com chave de 256 bits e claims customizadas.",
          "• Princípio do Menor Privilégio: Request e Response DTOs para cada fluxo da API.",
          "• RestAuthenticationEntryPoint & RestAccessDeniedHandler: retornos padronizados RFC 7807.",
        ],
      },
    ];

    layers.forEach((l, idx) => {
      const x = 16;
      const y = 35 + idx * 39;
      const w = pageWidth - 32;
      const h = 35;

      doc.setFillColor(C_WHITE[0], C_WHITE[1], C_WHITE[2]);
      doc.roundedRect(x, y, w, h, 2.5, 2.5, "F");
      doc.setDrawColor(C_CARD_BORDER[0], C_CARD_BORDER[1], C_CARD_BORDER[2]);
      doc.setLineWidth(0.4);
      doc.roundedRect(x, y, w, h, 2.5, 2.5, "S");

      // Left Accent
      doc.setFillColor(l.color[0], l.color[1], l.color[2]);
      doc.rect(x + 2, y + 2, 2.5, h - 4, "F");

      // Title & Badge
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(C_TEXT_MAIN[0], C_TEXT_MAIN[1], C_TEXT_MAIN[2]);
      doc.text(l.title, x + 9, y + 8);

      doc.setFillColor(241, 245, 249);
      doc.roundedRect(x + w - 75, y + 4, 70, 5, 1, 1, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(C_TEXT_MUTED[0], C_TEXT_MUTED[1], C_TEXT_MUTED[2]);
      doc.text(l.badge, x + w - 40, y + 7.5, { align: "center" });

      // Items in 2 columns
      const half = Math.ceil(l.items.length / 2);
      const col1 = l.items.slice(0, half);
      const col2 = l.items.slice(half);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.2);
      doc.setTextColor(51, 65, 85);

      col1.forEach((it, iIdx) => {
        doc.text(it, x + 9, y + 14 + iIdx * 4.4);
      });

      col2.forEach((it, iIdx) => {
        doc.text(it, x + w / 2 + 5, y + 14 + iIdx * 4.4);
      });
    });

    drawSlideFooter(4);
  }

  // =========================================================================
  // SLIDE 5: MODELO DE DADOS & ENDPOINTS
  // =========================================================================
  {
    doc.addPage();
    drawSlideHeader("05", "DADOS & ROTAS REST", "Modelo Relacional PostgreSQL e Matriz de Endpoints", "Esquemas de Tabelas e Mapeamento de Rotas");

    doc.setFillColor(C_LIGHT_BG[0], C_LIGHT_BG[1], C_LIGHT_BG[2]);
    doc.rect(0, 28, pageWidth, pageHeight - 28, "F");

    // Left Column: Database Relational Model (130mm)
    {
      const x = 16;
      const y = 35;
      const w = 130;
      const h = 158;

      doc.setFillColor(C_WHITE[0], C_WHITE[1], C_WHITE[2]);
      doc.roundedRect(x, y, w, h, 3, 3, "F");
      doc.setDrawColor(C_CARD_BORDER[0], C_CARD_BORDER[1], C_CARD_BORDER[2]);
      doc.setLineWidth(0.4);
      doc.roundedRect(x, y, w, h, 3, 3, "S");

      doc.setFillColor(C_PURPLE[0], C_PURPLE[1], C_PURPLE[2]);
      doc.rect(x + 3, y + 3, w - 6, 1.2, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(C_TEXT_MAIN[0], C_TEXT_MAIN[1], C_TEXT_MAIN[2]);
      doc.text("TABELAS PRINCIPAIS (POSTGRESQL)", x + 6, y + 12);

      const tables = [
        {
          name: "users",
          fields: "id (PK), nome, email (UQ), senha_hash, role, ativo, plano, modulos_flags, criado_em",
        },
        {
          name: "tasks",
          fields: "id (PK), user_id (FK), titulo, descricao, prioridade, status, data_limite",
        },
        {
          name: "study_plans -> subjects -> topics",
          fields: "Hierarquia do edital: plano (1) -> matérias (N) -> tópicos com teoria e questões",
        },
        {
          name: "questions -> user_answers",
          fields: "id (PK), enunciado, alternativas (JSONB), resposta_correta, gabarito_comentado",
        },
        {
          name: "workouts -> exercises -> evolucao_photos",
          fields: "Divisões A/B/C/D, séries, repetições, carga (kg) e fotos com peso corporal",
        },
        {
          name: "financial_transactions -> categories",
          fields: "id (PK), user_id (FK), tipo (REC/DESP), valor, status, data, parcelamento",
        },
      ];

      let ty = y + 20;
      tables.forEach((t) => {
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(x + 5, ty, w - 10, 19, 1.5, 1.5, "F");
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.roundedRect(x + 5, ty, w - 10, 19, 1.5, 1.5, "S");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.2);
        doc.setTextColor(C_PURPLE[0], C_PURPLE[1], C_PURPLE[2]);
        doc.text(t.name, x + 8, ty + 6.5);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(C_TEXT_MAIN[0], C_TEXT_MAIN[1], C_TEXT_MAIN[2]);
        const fl = doc.splitTextToSize(t.fields, w - 18);
        doc.text(fl, x + 8, ty + 12);

        ty += 22;
      });
    }

    // Right Column: REST Endpoints Matrix (129mm)
    {
      const x = 152;
      const y = 35;
      const w = 129;
      const h = 158;

      doc.setFillColor(C_WHITE[0], C_WHITE[1], C_WHITE[2]);
      doc.roundedRect(x, y, w, h, 3, 3, "F");
      doc.setDrawColor(C_CARD_BORDER[0], C_CARD_BORDER[1], C_CARD_BORDER[2]);
      doc.setLineWidth(0.4);
      doc.roundedRect(x, y, w, h, 3, 3, "S");

      doc.setFillColor(C_PRIMARY_BLUE[0], C_PRIMARY_BLUE[1], C_PRIMARY_BLUE[2]);
      doc.rect(x + 3, y + 3, w - 6, 1.2, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(C_TEXT_MAIN[0], C_TEXT_MAIN[1], C_TEXT_MAIN[2]);
      doc.text("MATRIZ DE ENDPOINTS REST PRINCIPAIS", x + 6, y + 12);

      const endpoints = [
        { method: "POST", path: "/api/auth/login", auth: "Público", desc: "Autentica e emite token JWT" },
        { method: "POST", path: "/api/users/register", auth: "Público", desc: "Criação de nova conta" },
        { method: "GET",  path: "/api/users/{id}/study-plans", auth: "Bearer", desc: "Editais do usuário" },
        { method: "POST", path: "/api/study-plans/{id}/import-pdf", auth: "Bearer", desc: "Extração de PDF e tópicos" },
        { method: "POST", path: "/api/questions/{id}/answer", auth: "Bearer", desc: "Submissão de resposta simulada" },
        { method: "GET",  path: "/api/users/{id}/caderno-erros", auth: "Bearer", desc: "Questões para repetição" },
        { method: "POST", path: "/api/workouts/{id}/exercises", auth: "Bearer", desc: "Carga e repetições de treino" },
        { method: "POST", path: "/api/transactions", auth: "Bearer", desc: "Lançamento de receita/despesa" },
        { method: "POST", path: "/api/ai/chat", auth: "Bearer", desc: "Proxy protegido para Gemini" },
        { method: "GET",  path: "/api/admin/users", auth: "ADMIN", desc: "Listagem e governança de contas" },
      ];

      let ey = y + 18;
      endpoints.forEach((ep) => {
        // Method badge
        const isPost = ep.method === "POST";
        doc.setFillColor(isPost ? 220 : 230, isPost ? 252 : 240, isPost ? 231 : 255);
        doc.roundedRect(x + 6, ey, 13, 5, 1, 1, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.setTextColor(isPost ? 22 : 37, isPost ? 101 : 99, isPost ? 52 : 235);
        doc.text(ep.method, x + 12.5, ey + 3.8, { align: "center" });

        // Path
        doc.setFont("courier", "bold");
        doc.setFontSize(7.2);
        doc.setTextColor(C_TEXT_MAIN[0], C_TEXT_MAIN[1], C_TEXT_MAIN[2]);
        doc.text(ep.path, x + 22, ey + 4);

        // Auth badge
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(C_TEXT_MUTED[0], C_TEXT_MUTED[1], C_TEXT_MUTED[2]);
        doc.text(`[${ep.auth}]`, x + w - 24, ey + 4);

        // Description
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.8);
        doc.setTextColor(71, 85, 105);
        doc.text(ep.desc, x + 22, ey + 8.5);

        ey += 13.5;
      });
    }

    drawSlideFooter(5);
  }

  // =========================================================================
  // SLIDE 6: DEVOPS, DEPLOY & ROADMAP
  // =========================================================================
  {
    doc.addPage();
    drawSlideHeader("06", "DEVOPS & ROADMAP", "Deploy em Produção, Pipeline de CI/CD e Roadmap", "Vercel, Render/Railway e Próximos Passos");

    doc.setFillColor(C_LIGHT_BG[0], C_LIGHT_BG[1], C_LIGHT_BG[2]);
    doc.rect(0, 28, pageWidth, pageHeight - 28, "F");

    // 3 Pillars
    const pillars = [
      {
        title: "FRONTEND DEPLOY (VERCEL)",
        badge: "CI/CD AUTOMÁTICO",
        color: C_PRIMARY_BLUE,
        items: [
          "• Gatilho automático a cada git push na branch main.",
          "• Compilação Vite minificada e otimizada em dist/.",
          "• vercel.json configurado com reescrita SPA:",
          "  { 'source': '/(.*)', 'destination': '/index.html' }",
          "• Headers de segurança (X-Frame-Options, CSP, etc.).",
          "• Distribuição global via Edge Network de baixa latência.",
        ],
      },
      {
        title: "BACKEND DEPLOY (RENDER / DOCKER)",
        badge: "CONTAINER MULTI-STAGE",
        color: C_EMERALD,
        items: [
          "• Dockerfile Multi-stage build:",
          "  Etapa 1: eclipse-temurin:21-jdk para compilação Maven.",
          "  Etapa 2: eclipse-temurin:21-jre-alpine (imagem leve < 180MB).",
          "• Configuração de porta dinâmica via variável PORT.",
          "• Banco PostgreSQL gerenciado com pooling HikariCP.",
          "• Reinicialização automática e monitoramento de uptime.",
        ],
      },
      {
        title: "ROADMAP & EVOLUÇÃO 2026+",
        badge: "MELHORIAS PLANEJADAS",
        color: C_PURPLE,
        items: [
          "• Algoritmo FSRS-4.5 avançado para retenção mnemônica.",
          "• Caixinhas Financeiras com rendimento simulado do CDI.",
          "• Modo Offline Total com sincronização em segundo plano.",
          "• Reconhecimento de áudio (TTS/STT) no tutor de simulados.",
          "• Exportação de dossiês em formato Excel (.xlsx).",
        ],
      },
    ];

    pillars.forEach((p, idx) => {
      const x = 16 + idx * 89.3;
      const y = 35;
      const w = 86;
      const h = 100;

      doc.setFillColor(C_WHITE[0], C_WHITE[1], C_WHITE[2]);
      doc.roundedRect(x, y, w, h, 3, 3, "F");
      doc.setDrawColor(C_CARD_BORDER[0], C_CARD_BORDER[1], C_CARD_BORDER[2]);
      doc.setLineWidth(0.4);
      doc.roundedRect(x, y, w, h, 3, 3, "S");

      doc.setFillColor(p.color[0], p.color[1], p.color[2]);
      doc.rect(x + 3, y + 3, w - 6, 1.2, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(C_TEXT_MAIN[0], C_TEXT_MAIN[1], C_TEXT_MAIN[2]);
      doc.text(p.title, x + 6, y + 12);

      doc.setFillColor(p.color[0] * 0.15 + 220, p.color[1] * 0.15 + 220, p.color[2] * 0.15 + 220);
      doc.roundedRect(x + 6, y + 16, 42, 5, 1, 1, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(p.color[0], p.color[1], p.color[2]);
      doc.text(p.badge, x + 8, y + 19.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      let curY = y + 27;
      p.items.forEach((it) => {
        const lines = doc.splitTextToSize(it, w - 12);
        doc.text(lines, x + 6, curY);
        curY += lines.length * 4.2 + 2;
      });
    });

    // Final Technical Checklist Card at bottom
    const cy = 142;
    const cw = pageWidth - 32;
    const ch = 52;

    doc.setFillColor(15, 23, 42);
    doc.roundedRect(16, cy, cw, ch, 3, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(147, 197, 253);
    doc.text("CHECKLIST TÉCNICO DE CONCLUSÃO & PRONTIDÃO:", 22, cy + 10);

    const checklistItems = [
      "✓ Frontend Nexus-front: 68 arquivos limpos, zero comentários desnecessários, compilação 100% verde.",
      "✓ Backend Nexus-api: 83 arquivos Java e properties higienizados, patch salvo em 'nexus-api-clean.patch'.",
      "✓ Documentações: README.md principal atualizado e manual técnico completo do backend em README-BACKEND.md.",
      "✓ Arquitetura: Totalmente validada, responsiva, com autenticação JWT, proteção RBAC e isolamento multi-tenant.",
    ];

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.2);
    doc.setTextColor(248, 250, 252);
    checklistItems.forEach((item, cIdx) => {
      doc.text(item, 22, cy + 19 + cIdx * 6.5);
    });

    // Contact badge
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(52, 211, 153);
    doc.text("SISTEMA PRONTO PARA APRESENTAÇÃO E HOMOLOGAÇÃO EM PRODUÇÃO", pageWidth - 22, cy + 45, { align: "right" });

    drawSlideFooter(6);
  }

  return doc;
}
