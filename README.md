# 🚀 Nexus Web — Ecossistema de Alta Performance (Frontend PWA)

> **Plataforma unificada de alta densidade para gestão de estudos para concursos públicos, produtividade diária, treinos de musculação e finanças pessoais com Caixinhas & Metas.**

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
2. [Módulos do Sistema](#-módulos-do-sistema)
3. [Arquitetura & Estrutura de Pastas](#-arquitetura--estrutura-de-pastas)
4. [Auditoria & Análise de Segurança](#-auditoria--análise-de-segurança)
5. [Caixinhas & Metas Financeiras](#-caixinhas--metas-financeiras)
6. [PWA, Cache & Notificações](#-pwa-cache--notificações)
7. [Relatórios Executivos em PDF](#-relatórios-executivos-em-pdf)
8. [Como Executar Localmente](#-como-executar-localmente)
9. [Variáveis de Ambiente](#-variáveis-de-ambiente)
10. [Build & Deploy na Vercel](#-build--deploy-na-vercel)
11. [Documentação do Backend](#-documentação-do-backend)

---

## 🌟 Visão Geral

O **Nexus Web** é uma Single Page Application (SPA) progressiva de alta performance concebida para concurseiros, atletas e pessoas que buscam disciplina e alta produtividade.

O sistema elimina a necessidade de múltiplos aplicativos avulsos ao integrar:
- **Gestão de Tarefas & Produtividade:** Foco único diário, tarefas por prioridade e cronômetro Pomodoro.
- **Preparação para Concursos:** Edital verticalizado, simulados cronometrados com travamento de gabarito, caderno de erros para repetição espaçada e importação de provas em PDF com IA.
- **Treinos de Academia:** Fichas de treino divididas (A, B, C, D), registro de séries, repetições e cargas, com upload de fotos de evolução física.
- **Finanças & Caixinhas:** Fluxo de caixa mensal, gráficos de projeção diária, divisão de gastos por categoria e sistema de **Caixinhas de Reserva** (estilo bancos digitais).
- **Assistente IA Integrado:** Chat flutuante em todas as telas conectado ao Google Gemini para tirar dúvidas pedagógicas e analisar questões.

---

## 📦 Módulos do Sistema

### 1. 🎯 Cockpit Executivo (`/`)
- Saudação contextual automática com base no horário do dia.
- Painel "Foco Único" destacando a meta mais crítica do dia.
- Widget de progresso do edital em tempo real com taxa de domínio de matérias.
- Indicador consolidado de patrimônio líquido (saldo em conta + caixinhas).
- Feed de atividades recentes e pendências financeiras e de treino.

### 2. 📚 Concursos & Estudos (`/estudos`)
- **Edital Verticalizado:** Criação hierárquica `Edital ➔ Matéria ➔ Tópico` com pesos e barras de domínio.
- **Banco de Questões:** Resolução com alternativas interativas, estatísticas de acerto e explicação comentada.
- **Simulados Auditados:** Provas com temporizador decrescente, trava de alternativas e cálculo percentual de nota final.
- **Caderno de Erros:** Repetição espaçada baseada em FSRS das questões erradas em simulados anteriores.
- **Importador de PDFs:** Upload de provas ou editais com extração automatizada de tópicos via Inteligência Artificial.

### 3. 🏋️ Treinos & Fisiologia (`/treinos`)
- Divisão de fichas de treino por grupos musculares (Peito, Costas, Pernas, Ombros, Braços).
- Registro detalhado de exercícios com controle de séries, repetições e progressão de carga (kg).
- Histórico visual de evolução corporal com galeria de fotos e registro do peso (kg).
- Indicador de frequência semanal (streak) para manutenção do hábito.

### 4. 💰 Finanças Pessoais & Caixinhas (`/financeiro`)
- **Saldo Atual & Projeção:** Saldo inicial, atual e previsto para o final do mês.
- **Gráfico de Fluxo de Caixa Diário:** Visualização interativa dia a dia de entradas e saídas.
- **Gastos por Categoria:** Gráfico Donut de despesas com badges coloridos e percentuais.
- **Caixinhas & Metas:** Separação de dinheiro da conta corrente em caixinhas de reserva (ex: Reserva de Emergência de R$ 1.000,00 a 100% CDI).
- **Extrato & Contas:** Lançamentos com parcelamento, status `PENDENTE` ou `CONCLUIDA`, filtros rápidos e busca textual.

### 5. 🤖 Tutor de Inteligência Artificial Flutuante
- Botão flutuante acessível em todas as telas da aplicação.
- Integração direta e segura com modelos Google Gemini (Gemini 2.5 Flash / Lite).
- Alternância automática multi-modelo caso ocorra sobrecarga temporária da API do Google.

### 6. 🛡️ Painel de Master Admin (`/admin`)
- Listagem completa de usuários cadastrados com pesquisa instantânea.
- Controle granular de papéis (`USER`, `ADMIN`, `MASTER_ADMIN`).
- Ativação ou desativação de acesso em 1 clique.
- Gerenciamento comercial de módulos contratados (`moduloEstudos`, `moduloTreinos`, `moduloFinancas`, `moduloIaExtracao`).

---

## 📂 Arquitetura & Estrutura de Pastas

```
nexus-web/
├── public/                     # Favicons, ícones do PWA e manifest.webmanifest
├── src/
│   ├── components/             # Componentes reutilizáveis do sistema
│   │   ├── ui/                 # Primitivas de UI (Button, Card, Dialog, Select, etc.)
│   │   ├── AiChatPopup.tsx     # Janela flutuante do assistente de inteligência artificial
│   │   ├── AppShell.tsx        # Shell de navegação lateral, header e responsividade
│   │   ├── CaixinhasSection.tsx# Gestor de Caixinhas de Reserva e Metas Financeiras
│   │   ├── CheckoutModal.tsx   # Modal de contratação SaaS com PIX e Cartão
│   │   ├── ErrorBoundary.tsx   # Captura global de erros de renderização
│   │   ├── GlobalSearchModal.tsx# Busca universal rápida por atalho de teclado
│   │   ├── NotificationCenterModal.tsx # Central de permissões e agendamento push
│   │   └── ReceiptModal.tsx    # Modal de emissão de recibo comercial
│   ├── contexts/
│   │   └── ToastContext.tsx    # Provedor global de notificações estilo toast
│   ├── hooks/
│   │   └── useNotificationScheduler.ts # Agendador nativo de lembretes no navegador
│   ├── lib/
│   │   ├── api.ts              # Cliente HTTP centralizado e tipagem completa de dados
│   │   ├── auth.tsx            # Contexto de autenticação, sessão JWT e controle RBAC
│   │   ├── caixinhasStorage.ts # Motor de persistência local das Caixinhas de Reserva
│   │   ├── geminiDirectService.ts # Conexão direta com Google Gemini com failover inteligente
│   │   ├── generateExecutiveReportPdf.ts # Emissor de relatório oficial de desempenho em A4
│   │   ├── generateReceiptPdf.ts # Emissor de comprovante de pagamento via jsPDF
│   │   └── utils.ts            # Utilitários de classes Tailwind e formatação
│   ├── pages/                  # Telas roteadas da aplicação
│   │   ├── admin.tsx           # Painel de controle e governança de usuários
│   │   ├── configuracoes.tsx   # Preferências de perfil, URL da API e exportação
│   │   ├── dashboard.tsx       # Cockpit inicial executivo
│   │   ├── estudos.tsx         # Módulo de concursos, matérias e caderno de erros
│   │   ├── financeiro.tsx      # Módulo financeiro completo e caixinhas
│   │   ├── login.tsx           # Fluxo de autenticação e criação de contas
│   │   ├── simulado.tsx        # Interface focada de simulado cronometrado
│   │   └── treinos.tsx         # Fichas de musculação e fotos de evolução
│   ├── App.tsx                 # Roteamento principal com guards de segurança
│   ├── main.tsx                # Ponto de entrada com limpeza preventiva de Service Worker
│   └── styles.css              # Estilos globais e tokens de cor do Tailwind CSS v4
├── index.html                  # HTML base com meta tags, PWA e pré-carregamento de fontes
├── package.json                # Dependências do projeto e scripts de build
├── tsconfig.json               # Configurações do compilador TypeScript
├── vercel.json                 # Regras de roteamento SPA e cabeçalhos de segurança na Vercel
├── vite.config.ts              # Configuração do Vite, alias @ e PWA
├── README.md                   # Este manual do Frontend
└── README-BACKEND.md           # Especificação técnica completa do Backend REST
```

---

## 🛡️ Auditoria & Análise de Segurança

### 1. Proteção contra Cross-Site Scripting (XSS)
- Todo conteúdo dinâmico (enunciados de questões, comentários de gabarito e textos de IA) é sanitizado via biblioteca `DOMPurify` ou renderizado por meio de nós seguros do React, impedindo injeção de tags `<script>` ou eventos `onload`/`onerror`.

### 2. Autenticação JWT e Gerenciamento de Tokens
- O token JWT recebido no login é mantido sob `nexus.token` no `localStorage`.
- O cliente HTTP (`api.ts`) anexa automaticamente o cabeçalho `Authorization: Bearer <token>` em todas as requisições autenticadas.
- Caso o servidor retorne status `401 Unauthorized`, um evento global customizado (`nexus:unauthorized`) é disparado, deslogando a sessão e redirecionando o usuário para `/login` de forma transparente.

### 3. Controle de Acesso Baseado em Funções (RBAC)
- O componente `ProtectedRoute` valida se o usuário possui a role necessária antes de renderizar páginas restritas.
- O componente `SubscriptionGuard` bloqueia o acesso caso a conta esteja com plano expirado ou sem permissão para o módulo em questão (`moduloEstudos`, `moduloTreinos`, `moduloFinancas`, `moduloIaExtracao`).

### 4. Isolamento de Chaves de API
- A chave da API do Google Gemini é gerenciada prioritariamente pelo backend. O frontend também permite inserção opcional de chave pessoal do usuário armazenada localmente sem nunca ser enviada a servidores intermediários.

---

## 🐷 Caixinhas & Metas Financeiras

Inspirado no conceito dos bancos digitais modernos, o recurso de **Caixinhas** permite separar o dinheiro do dia a dia da conta corrente:

- **Reserva de Emergência Automática:** Já inicia com uma caixinha de R$ 1.000,00 guardados e meta de R$ 5.000,00.
- **Guardar & Resgatar:** Modais intuitivos com botões de atalho rápido (+R$ 50, +R$ 100, +R$ 200, +R$ 500) e sincronização opcional com o extrato bancário da conta.
- **Metas Visuais:** Barra de progresso percentual dinâmica e cálculo do montante restante para atingir o objetivo.
- **Personalização:** Criação de caixinhas ilimitadas com escolha de ícones temáticos e paleta de cores customizadas.

---

## 📲 PWA, Cache & Notificações

- **Instalação Nativa:** O Nexus pode ser instalado no iOS (via "Adicionar à Tela de Início"), Android e Desktop Chrome/Edge.
- **Estratégia de Cache Seguro:** Foi implementado no arquivo `main.tsx` um mecanismo que desregistra Service Workers legados ao detectar novas versões, garantindo que o usuário nunca fique preso a versões em cache desatualizadas após um deploy na Vercel.
- **Notificações Web Push:** Agendamento inteligente no navegador para lembrar horários de estudos, treinos da academia e vencimento de contas a pagar.

---

## 📑 Relatórios Executivos em PDF

O sistema conta com um motor vetorial nativo em `jsPDF`:
- **Relatório Executivo A4:** Gera um dossiê completo de auditoria do usuário contendo o total de matérias concluídas, horas de estudo, taxa de acerto em simulados, frequência na academia e balanço financeiro.
- **Comprovante de Pagamento:** Emissão de recibos de assinatura do plano com código de pedido e dados cadastrais.

---

## 💻 Como Executar Localmente

### Pré-requisitos
- Node.js versão 20 ou superior
- Gerenciador de pacotes `npm` ou `bun`

### Passos

1. Clone o repositório:
```bash
git clone https://github.com/allysonramos-blibp/Nexus-front.git
cd Nexus-front
```

2. Instale as dependências:
```bash
npm install
```

3. Crie o arquivo `.env` a partir do modelo:
```bash
cp .env.example .env
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```
Acesse a aplicação no navegador em `http://localhost:3000`.

---

## 🔑 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes chaves:

```env
# URL da API Backend (ex: Render ou localhost)
VITE_API_URL=https://nexus-api-bgsf.onrender.com/api

# Chave opcional do Google Gemini para chamadas diretas client-side
VITE_GEMINI_API_KEY=
```

---

## 🚀 Build & Deploy na Vercel

O projeto possui um arquivo `vercel.json` configurado para reescrita de rotas SPA:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Para gerar a compilação de produção manualmente:
```bash
npm run build
```
Os arquivos otimizados e minificados serão gerados na pasta `/dist`.

Ao realizar `git push origin main`, a **Vercel** detecta o commit e dispara a esteira de CI/CD automaticamente.

---

## 📖 Documentação do Backend

Para consultar a especificação completa de banco de dados (PostgreSQL), endpoints REST, modelo de segurança JWT e Dockerfile da API, consulte o arquivo:
👉 **[README-BACKEND.md](./README-BACKEND.md)**
