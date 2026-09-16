# 🚀 Nexus Web — Ecossistema de Alta Performance (Frontend PWA)

> **Plataforma unificada de alta performance para gestão de estudos para concursos, produtividade diária, rotina de treinos e finanças pessoais.**

<p align="center">
  <img src="https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.7+-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6.0+-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA" />
  <img src="https://img.shields.io/badge/TanStack_Query-v5-FF4154?style=for-the-badge&logo=react-query&logoColor=white" alt="React Query" />
  <img src="https://img.shields.io/badge/PDF_Engine-jsPDF-E11D48?style=for-the-badge" alt="jsPDF" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>

---

## 📌 Sumário

1. [Visão Geral](#-visão-geral)
2. [Diferenciais & Funcionalidades](#-diferenciais--funcionalidades)
3. [Arquitetura & Tecnologias](#-arquitetura--tecnologias)
4. [Telas & Módulos do Sistema](#-telas--módulos-do-sistema)
5. [PWA & Notificações Nativas](#-pwa--notificações-nativas)
6. [Gerador de Relatórios Executivos em PDF](#-gerador-de-relatórios-executivos-em-pdf)
7. [Como Executar Localmente](#-como-executar-localmente)
8. [Variáveis de Ambiente](#-variáveis-de-ambiente)
9. [Build & Deploy](#-build--deploy)
10. [Segurança & Autenticação](#-segurança--autenticação)
11. [Estrutura de Pastas](#-estrutura-de-pastas)

---

## 🌟 Visão Geral

O **Nexus Web** é uma Single Page Application (SPA) progressiva de alta densidade visual e técnica. Projetado para quem busca alto rendimento nos estudos e na vida pessoal, o Nexus consolida em uma única interface intuitiva:

- 🎯 **Rotina de Produtividade:** Foco do dia, checklist de prioridades e gestão de prazos.
- 📚 **Preparação para Concursos Públicos:** Editais verticalizados, resolução de questões com gabarito comentado, caderno de erros inteligente, repetição espaçada e simulados completos com cronômetro.
- 🏋️ **Consistência em Treinos:** Frequência semanal, divisão muscular (ABC/ABCD), controle de séries/repetições/cargas e registro fotográfico.
- 💰 **Controle Financeiro:** Balanço de receitas, despesas, contas a pagar/receber e saldo consolidado.
- 🤖 **Copilot de Inteligência Artificial:** Tutor inteligente flutuante disponível em qualquer tela e extração automática de questões a partir de PDFs de bancas examinadoras.
- 📑 **Relatórios Executivos:** Exportação em vetor A4 para acompanhamento gerencial e auditoria de progresso pessoal.

---

## ✨ Diferenciais & Funcionalidades

### 1. 🎯 Dashboard Dinâmico (`/`)
- Saudação inteligente personalizada com cálculo de período do dia.
- Painel "Foco Único" destacando a prioridade crítica do dia.
- Widget de progresso em tempo real do edital de concurso com cálculo de taxa de domínio.
- Cards rápidos de resumo financeiro e meta de treinos da semana.
- Feed de atividades e pendências com conclusão em 1 clique.

### 2. 📚 Módulo de Estudos & Concursos
- **Planos de Estudos:** Cadastro de editais, definição de datas-alvo e metas de horas disponíveis.
- **Árvore Curricular:** Estruturação hierárquica `Plano ➔ Matéria ➔ Assunto`.
- **Banco de Questões & Simulação:**
  - Resolução interativa com gabaritos detalhados.
  - Simulados cronometrados com trava de alternativa para auditoria fiel de pontuação.
  - Indicador de "Marcar para revisar" e estatísticas de acerto por matéria.
- **Caderno de Erros Inteligente:** Registro automático de erros para fixação por repetição espaçada.
- **Importador de PDFs:** Upload de provas em PDF com estruturação automática de questões e gabaritos via IA.

### 3. 🏋️ Módulo de Treinos & Fisiologia
- Registro diário de treinos por grupo muscular (Peito, Costas, Pernas, etc.).
- Detalhamento de exercícios com séries, repetições e carga (kg).
- Upload de fotos de evolução física com suporte a volume persistente.
- Acompanhamento da meta semanal de treinos com indicador de streak.

### 4. 💰 Módulo Financeiro Pessoal
- Lançamentos de receitas e despesas com categorização.
- Gestão de contas a pagar e receber com confirmação rápida de status (`PENDENTE` / `CONCLUIDA`).
- Indicador visual dinâmico de saldo líquido mensal.

### 5. 🤖 Assistente Virtual Flutuante (AI Copilot)
- Botão flutuante acessível em qualquer tela com interface estilo modal/drawer.
- Conexão direta com a API de IA com contexto acadêmico e pedagógico.
- Atalhos rápidos para geração de perguntas de teste sobre o edital.

### 6. 📑 Relatório Executivo em PDF (1-Clique)
- Emissão oficial instantânea em vetor A4 formatado para impressão ou arquivamento digital.
- Compilação dos dados de tarefas, progresso de matérias, frequência física e balanço financeiro.
- Diagnóstico automático de desempenho gerado com base nos dados reais do usuário.

### 7. 🔔 Central de Notificações Web Push & PWA
- Totalmente instalável no smartphone (iOS e Android) e no desktop como aplicativo nativo.
- Suporte a cache offline via Service Worker (Workbox).
- Gerenciamento de alertas diários e teste prático de notificações locais.

### 8. 🛡️ Controle Comercial & Níveis de Acesso (RBAC)
- Sistema granular de liberação de módulos (`moduloEstudos`, `moduloTreinos`, `moduloFinancas`, `moduloIaExtracao`).
- Suporte a planos `PRO` e `ENTERPRISE`.
- Painel seguro de Master Admin com visão completa de usuários e limites de IA.

---

## 🛠️ Arquitetura & Tecnologias

```
                  ┌─────────────────────────────────┐
                  │      Nexus Web Frontend         │
                  │   React 19 + TypeScript + Vite  │
                  │      Tailwind CSS v4 + PWA      │
                  └───────────────┬─────────────────┘
                                  │
                   HTTPS / REST API (Bearer JWT)
                                  │
                  ┌───────────────▼─────────────────┐
                  │          Nexus API              │
                  │    Spring Boot 4.1 + Java 21    │
                  └───────┬─────────────────┬───────┘
                          │                 │
              ┌───────────▼─────┐     ┌─────▼───────────┐
              │   PostgreSQL    │     │  Anthropic / AI │
              │  Banco de Dados │     │  Processamento  │
              └─────────────────┘     └─────────────────┘
```

| Camada | Tecnologia | Função |
|---|---|---|
| **Core Framework** | React 19 + TypeScript 5.7+ | Renderização reativa, tipagem estrita e DX moderna |
| **Build Tool** | Vite 6 | Compilação ultrarrápida, HMR e otimização de bundles |
| **Estilização** | Tailwind CSS v4 | Design system unificado com tema escuro e suporte a design tokens |
| **Gerenciamento de Estado** | TanStack Query v5 (React Query) | Cache assíncrono, refetch inteligente e mutations otimistas |
| **PWA & Offline** | Vite PWA Plugin + Workbox | Service worker, manifest PWA e estratégias de cache |
| **Roteamento** | React Router DOM v7 (compat layer) | Navegação client-side fluida com SPA fallback |
| **Relatórios** | jsPDF | Geração de PDFs vetoriais A4 direto no navegador |
| **Ícones** | Lucide React | Biblioteca completa e consistente de ícones vetoriais |

---

## 🖥️ Telas & Rotas

| Rota | Tela | Funcionalidade Principal |
|---|---|---|
| `/` | **Hoje (Dashboard)** | Visão unificada diária, foco do dia, progresso do edital, meta de treinos e finanças |
| `/login` | **Autenticação** | Login seguro com JWT, cadastro de usuário e seletor dinâmico de API |
| `/tarefas` | **Produtividade** | Kanban e lista de tarefas cotidianas e tópicos do edital |
| `/estudos` | **Hub de Estudos** | Gestão de planos, matérias, cronograma e materiais de apoio |
| `/estudos/planos/:id` | **Detalhe do Edital** | Gestão de disciplinas, assuntos e árvore de tópicos |
| `/estudos/questoes` | **Banco de Questões** | Resolução interativa, gabarito instantâneo e comentários |
| `/estudos/caderno-erros`| **Caderno de Erros** | Análise de gaps de aprendizagem e re-execução de questões |
| `/estudos/revisoes` | **Revisões Espaçadas** | Fila de tópicos para revisão baseada no histórico de erros |
| `/estudos/simulados` | **Simulados** | Configuração, execução com cronômetro regressivo e análise de performance |
| `/estudos/desempenho` | **Analytics** | Gráficos de acerto por matéria, evolução temporal e assertividade |
| `/treinos` | **Musculação** | Diário de treinos, montagem de séries/repetições/cargas e fotos |
| `/financeiro` | **Finanças** | Lançamentos, fluxo de receitas e despesas, contas pendentes |
| `/perfil` | **Perfil & Assinatura** | Dados da conta, plano contratado, gerador de relatório e notificações |

---

## 📱 PWA & Notificações Nativas

O Nexus foi estruturado com padrão **PWA (Progressive Web App)**:

- **Instalação Nativa:** Adicione à tela inicial no iOS (Safari ➔ Compartilhar ➔ Adicionar à Tela de Início) ou Android/Chrome (botão de instalação automática).
- **Trabalho Offline:** Telas e assets estáticos ficam armazenados em cache local através do Workbox Service Worker.
- **Central de Push:** Permite configurar notificações no dispositivo para lembrar de revisões de concurso, treinos e contas a pagar.

---

## 📑 Gerador de Relatórios Executivos em PDF

Localizado tanto no topo do Dashboard (`/`) quanto na tela de Perfil (`/perfil`), o gerador de relatórios permite:
1. Visualizar um preview interativo na tela.
2. Imprimir com formatação profissional via folha de estilo dedicada `@media print`.
3. Fazer download de um arquivo `.pdf` formatado no padrão A4 oficial com cabeçalho institucional, dados do usuário e métricas consolidadas dos módulos contratados.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- **Node.js**: v18.0.0 ou superior (recomendado Node 20+)
- **npm** ou **bun** instalado

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/allysonramos-blibp/Nexus-front.git
   cd Nexus-front
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   ```bash
   cp .env.example .env
   ```
   Edite o arquivo `.env` para apontar para a sua instância da Nexus API:
   ```env
   VITE_API_URL=http://localhost:8080/api
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   A aplicação estará acessível em: `http://localhost:5173`

---

## ⚙️ Variáveis de Ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080/api` | URL base do backend Nexus (Spring Boot). Pode ser trocada dinamicamente na tela de login |

> 💡 **Dica de Desenvolvimento:** Na tela de login há uma opção de teste de ping da API e um campo para trocar a URL base em tempo de execução, facilitando testes com túneis como ngrok (`https://abc.ngrok-free.app/api`).

---

## 📦 Build & Deploy

### Build de Produção
```bash
npm run build
```
O comando gera os arquivos estáticos e otimizados na pasta `dist/`.

### Pré-visualização Local do Build
```bash
npm run preview
```

### Hospedagens Recomendadas (Vercel, Netlify, Cloudflare Pages, Nginx)

Por se tratar de uma SPA com roteamento dinâmico via browser, configure o servidor para redirecionar todas as requisições não-estáticas para o `index.html`.

#### Configuração Nginx:
```nginx
server {
    listen 80;
    server_name nexus.seudominio.com;
    root /var/www/nexus-front/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache agressivo para assets estáticos
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 🔒 Segurança & Autenticação

- **Autenticação Stateless JWT:** O token recebido no login é anexado automaticamente em todas as requisições HTTP (`Authorization: Bearer <token>`).
- **Auto-Logout em Expiração:** Se a API responder com status HTTP `401`, a sessão local é encerrada com segurança e o usuário é redirecionado ao login.
- **Sanitização de Dados:** Proteção contra injeção em inputs e manipulação de formulários.
- **Isolamento de Tenant:** Todas as requisições utilizam o contexto do usuário autenticado no token da API, garantindo isolamento total de registros.

---

## 📂 Estrutura de Pastas

```
nexus-front/
├── public/                  # Ícones PWA, favicon, manifest.webmanifest
├── src/
│   ├── components/          # Componentes reutilizáveis (AppShell, Modais, Cards)
│   │   ├── ui/              # Design System base (Button, Input, Badge, Dialog)
│   │   ├── ExecutiveReportModal.tsx   # Modal e preview do relatório A4
│   │   ├── NotificationCenterModal.tsx # Central de push notifications
│   │   ├── AiChatFloating.tsx         # Chat flutuante com IA
│   │   └── PwaInstallBanner.tsx       # Banner inteligente de instalação PWA
│   ├── pages/               # Telas da aplicação
│   │   ├── index.tsx        # Dashboard "Hoje"
│   │   ├── login.tsx        # Autenticação e boas-vindas
│   │   ├── tarefas.tsx      # Central de Tarefas & Edital
│   │   ├── financeiro.tsx   # Gestão financeira
│   │   ├── treinos.tsx      # Diário de treinos e fisiologia
│   │   ├── estudos.tsx      # Hub de estudos para concursos
│   │   ├── questoes.tsx     # Banco e resolução de questões
│   │   ├── simulados.tsx    # Simulado com cronômetro
│   │   ├── caderno-erros.tsx# Repetição espaçada e caderno de erros
│   │   ├── perfil.tsx       # Configurações de conta e assinatura
│   │   └── admin.tsx        # Painel Master Admin (gestão de planos)
│   ├── lib/                 # Integrações, helpers e utilitários
│   │   ├── api.ts           # Cliente HTTP fortemente tipado
│   │   ├── auth.tsx         # Contexto de autenticação e sessão
│   │   ├── exportPdfReport.ts # Motor de geração de PDF em vetor A4
│   │   ├── notifications.ts # Driver de notificações nativas
│   │   └── router-compat.tsx# Abstração de roteamento
│   ├── styles.css           # Configurações do Tailwind v4 e estilos de impressão
│   └── main.tsx             # Entry point da aplicação React
├── index.html               # Entry point HTML com metatags PWA
├── package.json             # Dependências e scripts
├── tsconfig.json            # Configuração TypeScript
└── vite.config.ts           # Configurações do Vite e plugin PWA
```

---

## 👨‍💻 Autor

Desenvolvido por **Allyson Ramos**  
- **GitHub:** [@allysonramos-blibp](https://github.com/allysonramos-blibp)  
- **Email:** allysonr510@gmail.com  

---

<p align="center">
  <sub>Nexus Platform © Todos os direitos reservados. Foco, consistência e alta performance.</sub>
</p>
