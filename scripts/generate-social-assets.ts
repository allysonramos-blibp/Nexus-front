import fs from "fs";
import path from "path";

const dir = path.resolve("./public/social");
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// 1. LinkedIn Banner / Feed Post (1200 x 630)
const linkedinBannerSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630" style="background:#0B0F19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <linearGradient id="blueGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2563EB" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#3B82F6" stop-opacity="0.1"/>
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="accentLine" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#2563EB"/>
      <stop offset="50%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#8B5CF6"/>
    </linearGradient>
  </defs>

  <!-- Background decorative glow -->
  <circle cx="1100" cy="100" r="300" fill="#2563EB" opacity="0.12" filter="blur(60px)"/>
  <circle cx="100" cy="500" r="250" fill="#10B981" opacity="0.08" filter="blur(50px)"/>

  <!-- Top bar accent -->
  <rect x="0" y="0" width="1200" height="6" fill="url(#accentLine)"/>

  <!-- Brand badge -->
  <rect x="80" y="70" width="220" height="36" rx="18" fill="#1E2945" stroke="#3B82F6" stroke-width="1.5"/>
  <circle cx="100" cy="88" r="6" fill="#10B981"/>
  <text x="116" y="93" fill="#93C5FD" font-size="13" font-weight="700" letter-spacing="1">FULL-STACK SAAS 2.0</text>

  <!-- Main Headline -->
  <text x="80" y="170" fill="#FFFFFF" font-size="52" font-weight="800" letter-spacing="-1">NEXUS ECOSYSTEM</text>
  <text x="80" y="225" fill="#94A3B8" font-size="24" font-weight="400">O Sistema Operacional Definitivo de Alta Performance</text>

  <text x="80" y="275" fill="#CBD5E1" font-size="16" font-weight="400">
    <tspan x="80" dy="0">Desenvolvido com arquitetura desacoplada em React 19 + Spring Boot 4.</tspan>
    <tspan x="80" dy="26">Unificando Produtividade, Concursos &amp; Simulados, Treinos e Gestão Financeira.</tspan>
  </text>

  <!-- 3 Highlights Cards -->
  <g transform="translate(80, 350)">
    <!-- Card 1: Frontend -->
    <rect x="0" y="0" width="320" height="180" rx="16" fill="url(#cardGrad)" stroke="#334155" stroke-width="1"/>
    <rect x="20" y="20" width="8" height="8" rx="4" fill="#3B82F6"/>
    <text x="36" y="28" fill="#3B82F6" font-size="12" font-weight="700">CLIENT-SIDE PWA</text>
    <text x="20" y="60" fill="#FFFFFF" font-size="20" font-weight="700">React 19 &amp; Vite</text>
    <text x="20" y="85" fill="#94A3B8" font-size="13">TypeScript, Tailwind v4, TanStack</text>
    <text x="20" y="105" fill="#94A3B8" font-size="13">Query v5 e Caixinhas com reserva.</text>
    <rect x="20" y="135" width="90" height="24" rx="12" fill="#2563EB" opacity="0.2"/>
    <text x="65" y="151" fill="#93C5FD" font-size="11" font-weight="600" text-anchor="middle">OFFLINE READY</text>
  </g>

  <g transform="translate(440, 350)">
    <!-- Card 2: Backend -->
    <rect x="0" y="0" width="320" height="180" rx="16" fill="url(#cardGrad)" stroke="#334155" stroke-width="1"/>
    <rect x="20" y="20" width="8" height="8" rx="4" fill="#10B981"/>
    <text x="36" y="28" fill="#10B981" font-size="12" font-weight="700">SERVER-SIDE REST</text>
    <text x="20" y="60" fill="#FFFFFF" font-size="20" font-weight="700">Spring Boot 4</text>
    <text x="20" y="85" fill="#94A3B8" font-size="13">Java 21, Spring Security, JWT,</text>
    <text x="20" y="105" fill="#94A3B8" font-size="13">21 Controllers e 28 Services ACID.</text>
    <rect x="20" y="135" width="110" height="24" rx="12" fill="#10B981" opacity="0.2"/>
    <text x="75" y="151" fill="#6EE7B7" font-size="11" font-weight="600" text-anchor="middle">STATELESS JWT</text>
  </g>

  <g transform="translate(800, 350)">
    <!-- Card 3: AI & Data -->
    <rect x="0" y="0" width="320" height="180" rx="16" fill="url(#cardGrad)" stroke="#334155" stroke-width="1"/>
    <rect x="20" y="20" width="8" height="8" rx="4" fill="#8B5CF6"/>
    <text x="36" y="28" fill="#8B5CF6" font-size="12" font-weight="700">OCR &amp; AI ENGINE</text>
    <text x="20" y="60" fill="#FFFFFF" font-size="20" font-weight="700">PDFBox + Gemini</text>
    <text x="20" y="85" fill="#94A3B8" font-size="13">Extração de editais e provas,</text>
    <text x="20" y="105" fill="#94A3B8" font-size="13">PostgreSQL 16 e tutor por IA.</text>
    <rect x="20" y="135" width="105" height="24" rx="12" fill="#8B5CF6" opacity="0.2"/>
    <text x="72" y="151" fill="#C4B5FD" font-size="11" font-weight="600" text-anchor="middle">SMART MENTOR</text>
  </g>

  <!-- Bottom author tag -->
  <text x="80" y="585" fill="#64748B" font-size="14">Engenharia por <tspan fill="#F8FAFC" font-weight="600">Allyson Ramos</tspan> | Setembro 2026</text>
  <text x="1120" y="585" fill="#3B82F6" font-size="14" font-weight="600" text-anchor="end">nexus-front-phi.vercel.app</text>
</svg>
`;

// 2. Instagram Square Post 1 - O Ecossistema (1080 x 1080)
const igPost1Svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080" style="background:#0B0F19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <linearGradient id="igAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#10B981"/>
    </linearGradient>
    <linearGradient id="cardGradSq" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
  </defs>

  <!-- Ambient Light -->
  <circle cx="540" cy="200" r="400" fill="#2563EB" opacity="0.15" filter="blur(80px)"/>

  <!-- Header -->
  <rect x="70" y="70" width="160" height="34" rx="17" fill="#1E2945" stroke="#3B82F6" stroke-width="1.5"/>
  <text x="150" y="92" fill="#93C5FD" font-size="12" font-weight="700" letter-spacing="1" text-anchor="middle">ALL-IN-ONE OS</text>

  <text x="70" y="190" fill="#FFFFFF" font-size="64" font-weight="900" letter-spacing="-1.5">NEXUS</text>
  <text x="70" y="245" fill="#38BDF8" font-size="30" font-weight="600">Chega de usar 5 aplicativos diferentes.</text>
  <text x="70" y="295" fill="#94A3B8" font-size="20">Sua vida intelectual, física, financeira e produtiva em um único lugar.</text>

  <!-- 4 Pillars Bento Grid -->
  <g transform="translate(70, 350)">
    <!-- Quadrant 1: Estudos -->
    <rect x="0" y="0" width="450" height="240" rx="20" fill="url(#cardGradSq)" stroke="#334155" stroke-width="1.5"/>
    <circle cx="50" cy="50" r="22" fill="#10B981" opacity="0.2"/>
    <text x="50" y="56" fill="#10B981" font-size="20" font-weight="900" text-anchor="middle">📚</text>
    <text x="90" y="56" fill="#FFFFFF" font-size="24" font-weight="700">Estudos &amp; Simulados</text>
    <text x="30" y="110" fill="#94A3B8" font-size="16">Edital verticalizado interativo, cronômetro oficial de provas, Caderno de Erros com repetição espaçada.</text>
    <text x="30" y="195" fill="#10B981" font-size="14" font-weight="700">✓ EXTRAÇÃO VIA PDF E IA</text>
  </g>

  <g transform="translate(560, 350)">
    <!-- Quadrant 2: Treinos -->
    <rect x="0" y="0" width="450" height="240" rx="20" fill="url(#cardGradSq)" stroke="#334155" stroke-width="1.5"/>
    <circle cx="50" cy="50" r="22" fill="#F59E0B" opacity="0.2"/>
    <text x="50" y="56" fill="#F59E0B" font-size="20" font-weight="900" text-anchor="middle">⚡</text>
    <text x="90" y="56" fill="#FFFFFF" font-size="24" font-weight="700">Treinos &amp; Cargas</text>
    <text x="30" y="110" fill="#94A3B8" font-size="16">Fichas personalizadas (A/B/C/D), evolução de quilagem (kg), histórico de pesagem e galeria corporal.</text>
    <text x="30" y="195" fill="#F59E0B" font-size="14" font-weight="700">✓ PROGRESSÃO REAL DE CARGA</text>
  </g>

  <g transform="translate(70, 620)">
    <!-- Quadrant 3: Finanças -->
    <rect x="0" y="0" width="450" height="240" rx="20" fill="url(#cardGradSq)" stroke="#334155" stroke-width="1.5"/>
    <circle cx="50" cy="50" r="22" fill="#8B5CF6" opacity="0.2"/>
    <text x="50" y="56" fill="#8B5CF6" font-size="20" font-weight="900" text-anchor="middle">💰</text>
    <text x="90" y="56" fill="#FFFFFF" font-size="24" font-weight="700">Finanças &amp; Caixinhas</text>
    <text x="30" y="110" fill="#94A3B8" font-size="16">Fluxo de caixa inteligente, Caixinhas de Reserva com metas visuais e segregação de patrimônio.</text>
    <text x="30" y="195" fill="#8B5CF6" font-size="14" font-weight="700">✓ RESERVA DE EMERGÊNCIA</text>
  </g>

  <g transform="translate(560, 620)">
    <!-- Quadrant 4: Foco & Cockpit -->
    <rect x="0" y="0" width="450" height="240" rx="20" fill="url(#cardGradSq)" stroke="#334155" stroke-width="1.5"/>
    <circle cx="50" cy="50" r="22" fill="#3B82F6" opacity="0.2"/>
    <text x="50" y="56" fill="#3B82F6" font-size="20" font-weight="900" text-anchor="middle">🎯</text>
    <text x="90" y="56" fill="#FFFFFF" font-size="24" font-weight="700">Cockpit &amp; Foco Único</text>
    <text x="30" y="110" fill="#94A3B8" font-size="16">Elimine a sobrecarga mental: defina sua prioridade absoluta do dia, use o Pomodoro integrado e vença.</text>
    <text x="30" y="195" fill="#3B82F6" font-size="14" font-weight="700">✓ ZERO DISTRAÇÕES</text>
  </g>

  <!-- Bottom Call to Action -->
  <g transform="translate(70, 910)">
    <rect x="0" y="0" width="940" height="90" rx="24" fill="#1E293B" stroke="#3B82F6" stroke-width="1.5"/>
    <text x="40" y="52" fill="#FFFFFF" font-size="24" font-weight="700">Experimente agora no seu navegador ou celular</text>
    <rect x="670" y="20" width="230" height="50" rx="14" fill="#2563EB"/>
    <text x="785" y="51" fill="#FFFFFF" font-size="18" font-weight="700" text-anchor="middle">ACESSE O APP →</text>
  </g>
</svg>
`;

// 3. Instagram Story / Reels Poster (1080 x 1920)
const igStorySvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920" style="background:#0B0F19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <linearGradient id="storyGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2563EB"/>
      <stop offset="100%" stop-color="#10B981"/>
    </linearGradient>
    <linearGradient id="cardStory" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
  </defs>

  <circle cx="540" cy="300" r="400" fill="#2563EB" opacity="0.2" filter="blur(90px)"/>
  <circle cx="540" cy="1400" r="400" fill="#10B981" opacity="0.15" filter="blur(90px)"/>

  <!-- Header -->
  <rect x="80" y="140" width="180" height="42" rx="21" fill="#1E2945" stroke="#3B82F6" stroke-width="2"/>
  <text x="170" y="167" fill="#93C5FD" font-size="15" font-weight="700" letter-spacing="1" text-anchor="middle">DISCIPLINA 2.0</text>

  <text x="80" y="270" fill="#FFFFFF" font-size="78" font-weight="900" letter-spacing="-2">NEXUS</text>
  <text x="80" y="340" fill="#38BDF8" font-size="36" font-weight="700">Seu Foco Diário, Blindado.</text>

  <text x="80" y="410" fill="#94A3B8" font-size="26">
    <tspan x="80" dy="0">Desenvolvido para quem busca</tspan>
    <tspan x="80" dy="38">aprovação em concursos, evolução física</tspan>
    <tspan x="80" dy="38">e clareza financeira absoluta.</tspan>
  </text>

  <!-- Mobile UI Floating Mockup Card -->
  <g transform="translate(80, 580)">
    <rect x="0" y="0" width="920" height="850" rx="36" fill="url(#cardStory)" stroke="#334155" stroke-width="2"/>

    <!-- Simulated Top Bar -->
    <text x="50" y="70" fill="#94A3B8" font-size="20">Cockpit do Dia</text>
    <text x="50" y="115" fill="#FFFFFF" font-size="34" font-weight="800">Foco Único: Estudo Dirigido</text>

    <!-- Progress Meter -->
    <rect x="50" y="150" width="820" height="12" rx="6" fill="#334155"/>
    <rect x="50" y="150" width="620" height="12" rx="6" fill="url(#storyGlow)"/>

    <!-- 3 Mini Metric Cards -->
    <g transform="translate(50, 190)">
      <rect x="0" y="0" width="250" height="160" rx="20" fill="#0F172A" stroke="#1E293B" stroke-width="1.5"/>
      <text x="25" y="45" fill="#10B981" font-size="16" font-weight="700">QUESTÕES HOJE</text>
      <text x="25" y="100" fill="#FFFFFF" font-size="44" font-weight="800">84/100</text>
      <text x="25" y="135" fill="#94A3B8" font-size="14">84% de acerto</text>
    </g>

    <g transform="translate(335, 190)">
      <rect x="0" y="0" width="250" height="160" rx="20" fill="#0F172A" stroke="#1E293B" stroke-width="1.5"/>
      <text x="25" y="45" fill="#F59E0B" font-size="16" font-weight="700">TREINO (B)</text>
      <text x="25" y="100" fill="#FFFFFF" font-size="44" font-weight="800">Costa</text>
      <text x="25" y="135" fill="#94A3B8" font-size="14">8 exercícios concluídos</text>
    </g>

    <g transform="translate(620, 190)">
      <rect x="0" y="0" width="250" height="160" rx="20" fill="#0F172A" stroke="#1E293B" stroke-width="1.5"/>
      <text x="25" y="45" fill="#8B5CF6" font-size="16" font-weight="700">RESERVA</text>
      <text x="25" y="100" fill="#FFFFFF" font-size="34" font-weight="800">R$ 1.000</text>
      <text x="25" y="135" fill="#94A3B8" font-size="14">Meta 100% batida</text>
    </g>

    <!-- Features List inside Mockup -->
    <g transform="translate(50, 400)">
      <rect x="0" y="0" width="820" height="110" rx="20" fill="#0F172A" stroke="#1E293B" stroke-width="1.5"/>
      <circle cx="50" cy="55" r="20" fill="#2563EB" opacity="0.3"/>
      <text x="50" y="62" fill="#3B82F6" font-size="18" font-weight="900" text-anchor="middle">✓</text>
      <text x="90" y="48" fill="#FFFFFF" font-size="22" font-weight="700">Edital Verticalizado com IA</text>
      <text x="90" y="78" fill="#94A3B8" font-size="16">Importe o PDF da sua banca e tenha o plano montado em segundos.</text>
    </g>

    <g transform="translate(50, 530)">
      <rect x="0" y="0" width="820" height="110" rx="20" fill="#0F172A" stroke="#1E293B" stroke-width="1.5"/>
      <circle cx="50" cy="55" r="20" fill="#10B981" opacity="0.3"/>
      <text x="50" y="62" fill="#10B981" font-size="18" font-weight="900" text-anchor="middle">✓</text>
      <text x="90" y="48" fill="#FFFFFF" font-size="22" font-weight="700">Caderno de Erros com Repetição Espaçada</text>
      <text x="90" y="78" fill="#94A3B8" font-size="16">Nunca mais erre a mesma pegadinha em dia de prova.</text>
    </g>

    <g transform="translate(50, 660)">
      <rect x="0" y="0" width="820" height="110" rx="20" fill="#0F172A" stroke="#1E293B" stroke-width="1.5"/>
      <circle cx="50" cy="55" r="20" fill="#8B5CF6" opacity="0.3"/>
      <text x="50" y="62" fill="#8B5CF6" font-size="18" font-weight="900" text-anchor="middle">✓</text>
      <text x="90" y="48" fill="#FFFFFF" font-size="22" font-weight="700">PWA Instalável no Celular</text>
      <text x="90" y="78" fill="#94A3B8" font-size="16">Adicione à tela de início no iOS e Android com 1 toque.</text>
    </g>
  </g>

  <!-- Bottom CTA Swipe / Link -->
  <g transform="translate(80, 1500)">
    <rect x="0" y="0" width="920" height="140" rx="30" fill="#2563EB"/>
    <text x="460" y="65" fill="#FFFFFF" font-size="30" font-weight="800" text-anchor="middle">ACESSE AGORA O NEXUS</text>
    <text x="460" y="105" fill="#BFDBFE" font-size="20" font-weight="500" text-anchor="middle">Link na Bio ou nexus-front-phi.vercel.app</text>
  </g>

  <text x="540" y="1740" fill="#64748B" font-size="20" text-anchor="middle">Desenvolvido por Allyson Ramos</text>
</svg>
`;

fs.writeFileSync(path.join(dir, "nexus-linkedin-launch.svg"), linkedinBannerSvg.trim(), "utf8");
fs.writeFileSync(path.join(dir, "nexus-instagram-carrossel-1.svg"), igPost1Svg.trim(), "utf8");
fs.writeFileSync(path.join(dir, "nexus-instagram-story.svg"), igStorySvg.trim(), "utf8");

console.log("SVGs de mídia social gerados com sucesso em public/social/");
