# 🛡️ Nexus API — Arquitetura e Especificação do Backend

> **Documentação Técnica Oficial da API RESTful do Ecossistema Nexus.**
> Suporta autenticação JWT, controle de acesso baseado em papéis (RBAC), gestão de estudos e concursos, treinos físicos de musculação, finanças pessoais e orquestração de IA.

---

## 📌 Sumário

1. [Visão Geral da Arquitetura](#-visão-geral-da-arquitetura)
2. [Stack Tecnológica Recomendada](#-stack-tecnológica-recomendada)
3. [Modelo Relacional do Banco de Dados (PostgreSQL)](#-modelo-relacional-do-banco-de-dados-postgresql)
4. [Segurança, Autenticação & RBAC](#-segurança-autenticação--rbac)
5. [Especificação Completa dos Endpoints REST](#-especificação-completa-dos-endpoints-rest)
   - [Autenticação (`/api/auth`)](#1-autenticação-apiauth)
   - [Usuários & Admin (`/api/users`)](#2-usuários--admin-apiusers)
   - [Tarefas & Produtividade (`/api/tasks`)](#3-tarefas--produtividade-apitasks)
   - [Planos de Estudo & Matérias (`/api/study-plans`)](#4-planos-de-estudo--matérias-apistudy-plans)
   - [Banco de Questões & Simulados (`/api/questions` & `/api/simulados`)](#5-banco-de-questões--simulados)
   - [Treinos & Fisiologia (`/api/workouts` & `/api/evolucao-photos`)](#6-treinos--fisiologia-apiworkouts)
   - [Finanças Pessoais (`/api/transactions` & `/api/categories`)](#7-finanças-pessoais-apitransactions)
   - [Serviços de IA & Extração (`/api/ai`)](#8-serviços-de-ia--extração-apiai)
6. [Deploy & Infraestrutura (Render / Docker)](#-deploy--infraestrutura-render--docker)
7. [Variáveis de Ambiente do Backend](#-variáveis-de-ambiente-do-backend)

---

## 🏗️ Visão Geral da Arquitetura

O backend do **Nexus** é desenhado como uma API REST stateless orientada a serviços com as seguintes premissas:

- **Autenticação Stateless:** Uso de JSON Web Tokens (JWT) com algoritmo `HMAC-SHA256` ou `RS256`. O cliente envia o token via header `Authorization: Bearer <token>`.
- **RBAC Granular:** Papéis de usuário (`USER`, `ADMIN`, `MASTER_ADMIN`) combinados com flags comerciais de habilitação por módulo (`moduloEstudos`, `moduloTreinos`, `moduloFinancas`, `moduloIaExtracao`).
- **Isolamento de Dados (Multi-Tenancy por Usuário):** Todo recurso (`tasks`, `study-plans`, `workouts`, `transactions`) pertence estritamente a um `userId`. Usuários comuns não conseguem acessar nem modificar recursos de terceiros.
- **Tratamento Global de Erros:** Respostas de erro padronizadas no formato RFC 7807 (`status`, `error`, `message`, `timestamp`).

---

## 💻 Stack Tecnológica Recomendada

A API foi projetada para execução de alto desempenho podendo ser implementada em:

| Componente | Opção A (Java Enterprise - Padrão de Mercado) | Opção B (Node.js / TypeScript) |
| :--- | :--- | :--- |
| **Linguagem** | Java 21 (LTS) | TypeScript 5+ |
| **Framework** | Spring Boot 3.3+ (Web, Data JPA, Security) | NestJS 10+ ou Fastify/Express |
| **ORM / Driver** | Hibernate / Spring Data JPA | Prisma / Drizzle ORM |
| **Banco de Dados** | PostgreSQL 15+ | PostgreSQL 15+ |
| **Autenticação** | Spring Security + jjwt | Passport-JWT / jose |
| **Storage de Mídia** | AWS S3 / Cloudflare R2 / Render Disk | AWS S3 / Cloudflare R2 |
| **Documentação** | SpringDoc OpenAPI (Swagger 3) | NestJS Swagger |

---

## 🗄️ Modelo Relacional do Banco de Dados (PostgreSQL)

Abaixo está o DDL SQL completo para criação das tabelas essenciais no PostgreSQL:

```sql
-- 1. ENUMS DO SISTEMA
CREATE TYPE role_type AS ENUM ('USER', 'ADMIN', 'MASTER_ADMIN');
CREATE TYPE plan_type AS ENUM ('STARTER', 'PRO', 'ENTERPRISE');
CREATE TYPE task_status AS ENUM ('PENDENTE', 'EM_PROGRESSO', 'CONCLUIDA');
CREATE TYPE task_priority AS ENUM ('BAIXA', 'MEDIA', 'ALTA');
CREATE TYPE transaction_type AS ENUM ('RECEITA', 'DESPESA');
CREATE TYPE transaction_status AS ENUM ('PENDENTE', 'CONCLUIDA');

-- 2. TABELA DE USUÁRIOS
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(180) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    role role_type DEFAULT 'USER' NOT NULL,
    ativo BOOLEAN DEFAULT TRUE NOT NULL,
    plano plan_type DEFAULT 'STARTER' NOT NULL,
    plano_expira_em TIMESTAMP WITH TIME ZONE,
    modulo_estudos BOOLEAN DEFAULT TRUE NOT NULL,
    modulo_treinos BOOLEAN DEFAULT TRUE NOT NULL,
    modulo_financas BOOLEAN DEFAULT TRUE NOT NULL,
    modulo_ia_extracao BOOLEAN DEFAULT FALSE NOT NULL,
    limite_requisicoes_ia INT DEFAULT 50 NOT NULL,
    requisicoes_ia_usadas INT DEFAULT 0 NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. TAREFAS / PRODUTIVIDADE
CREATE TABLE tasks (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    prioridade task_priority DEFAULT 'MEDIA' NOT NULL,
    status task_status DEFAULT 'PENDENTE' NOT NULL,
    data_limite DATE,
    ordem INT DEFAULT 0,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. PLANOS DE ESTUDO & CONCURSOS
CREATE TABLE study_plans (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    titulo VARCHAR(160) NOT NULL,
    banca VARCHAR(100),
    orgao VARCHAR(100),
    data_prova DATE,
    horas_semanais INT DEFAULT 20,
    ativo BOOLEAN DEFAULT TRUE NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE subjects (
    id BIGSERIAL PRIMARY KEY,
    plan_id BIGINT REFERENCES study_plans(id) ON DELETE CASCADE NOT NULL,
    nome VARCHAR(120) NOT NULL,
    cor VARCHAR(16) DEFAULT '#3B82F6',
    peso INT DEFAULT 1,
    ordem INT DEFAULT 0
);

CREATE TABLE topics (
    id BIGSERIAL PRIMARY KEY,
    subject_id BIGINT REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    teoria_estudada BOOLEAN DEFAULT FALSE,
    questoes_resolvidas INT DEFAULT 0,
    questoes_acertadas INT DEFAULT 0,
    proxima_revisao DATE
);

-- 5. BANCO DE QUESTÕES & RESPOSTAS
CREATE TABLE questions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    subject_id BIGINT REFERENCES subjects(id) ON DELETE SET NULL,
    banca VARCHAR(80),
    orgao VARCHAR(80),
    ano INT,
    enunciado TEXT NOT NULL,
    alternativas JSONB NOT NULL, -- Array de strings: ["A) ...", "B) ..."]
    resposta_correta VARCHAR(5) NOT NULL,
    gabarito_comentado TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE user_answers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    question_id BIGINT REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
    resposta_usuario VARCHAR(5) NOT NULL,
    acertou BOOLEAN NOT NULL,
    tempo_segundos INT DEFAULT 0,
    marcada_para_revisao BOOLEAN DEFAULT FALSE,
    respondida_em TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 6. TREINOS & FISIOLOGIA
CREATE TABLE workouts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    nome VARCHAR(100) NOT NULL, -- Ex: "Treino A - Peito e Tríceps"
    descricao VARCHAR(255),
    divisao VARCHAR(10), -- A, B, C, D
    ordem INT DEFAULT 0
);

CREATE TABLE exercises (
    id BIGSERIAL PRIMARY KEY,
    workout_id BIGINT REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
    nome VARCHAR(120) NOT NULL,
    series INT DEFAULT 4,
    repeticoes VARCHAR(20) DEFAULT '10-12',
    carga_kg NUMERIC(6,2) DEFAULT 0.00,
    observacoes VARCHAR(255),
    ordem INT DEFAULT 0
);

CREATE TABLE evolucao_photos (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    url_foto VARCHAR(500) NOT NULL,
    peso_kg NUMERIC(5,2),
    data_registro DATE NOT NULL,
    observacao VARCHAR(255),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 7. FINANÇAS PESSOAIS
CREATE TABLE financial_categories (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    nome VARCHAR(80) NOT NULL,
    cor VARCHAR(16) DEFAULT '#10B981',
    tipo transaction_type NOT NULL
);

CREATE TABLE financial_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    category_id BIGINT REFERENCES financial_categories(id) ON DELETE SET NULL,
    tipo transaction_type NOT NULL,
    valor NUMERIC(12,2) NOT NULL,
    descricao VARCHAR(180) NOT NULL,
    data DATE NOT NULL,
    status transaction_status DEFAULT 'CONCLUIDA' NOT NULL,
    parcela_atual INT DEFAULT 1,
    total_parcelas INT DEFAULT 1,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ÍNDICES CRÍTICOS PARA PERFORMANCE
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_transactions_user_data ON financial_transactions(user_id, data);
CREATE INDEX idx_user_answers_user_question ON user_answers(user_id, question_id);
```

---

## 🔒 Segurança, Autenticação & RBAC

### 1. Fluxo de Autenticação JWT
1. O usuário submete credenciais (`email`, `senha`) em `POST /api/auth/login`.
2. A API valida a senha com `BCryptPasswordEncoder` (fator de custo 12).
3. Se válido e com status `ativo = true`, gera um JWT contendo:
   - `sub`: ID do usuário.
   - `email`: E-mail.
   - `role`: Role (`USER`, `ADMIN`, `MASTER_ADMIN`).
   - `exp`: Expiração (padrão: 7 dias).
4. O cliente armazena o token no `localStorage` sob a chave `nexus.token`.

### 2. Filtro de Segurança & Validação de Cabeçalhos
Toda requisição para rotas protegidas deve incluir:
```http
Authorization: Bearer <seu_token_jwt>
Content-Type: application/json
```

Se o token for inválido, expirado ou ausente, a API deve retornar `401 Unauthorized`:
```json
{
  "status": 401,
  "error": "Unauthorized",
  "message": "Token de autenticação ausente ou expirado.",
  "timestamp": "2026-09-17T14:00:00Z"
}
```

### 3. Filtro CORS Seguro
No Spring Boot ou Express, o CORS deve permitir especificamente a URL do frontend na Vercel e o ambiente local de desenvolvimento:
- `http://localhost:3000`
- `http://localhost:5173`
- `https://nexus-web.vercel.app`
- Métodos permitidos: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `OPTIONS`
- Cabeçalhos permitidos: `Authorization`, `Content-Type`, `X-Requested-With`

---

## 📡 Especificação Completa dos Endpoints REST

### 1. Autenticação (`/api/auth`)

#### `POST /api/auth/login`
Autentica o usuário e retorna o token de sessão.
- **Request Body:**
  ```json
  {
    "email": "usuario@exemplo.com",
    "senha": "MinhaSenhaForte123@"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "nome": "Allyson Ramos",
      "email": "usuario@exemplo.com",
      "role": "MASTER_ADMIN",
      "plano": "ENTERPRISE",
      "moduloEstudos": true,
      "moduloTreinos": true,
      "moduloFinancas": true,
      "moduloIaExtracao": true
    }
  }
  ```

#### `POST /api/auth/register`
Registra uma nova conta no Nexus.
- **Request Body:**
  ```json
  {
    "nome": "João Silva",
    "email": "joao@email.com",
    "senha": "SenhaSegura123!"
  }
  ```
- **Response `201 Created`:** Retorna o mesmo payload de usuário do login com o token.

#### `GET /api/auth/me`
Retorna os dados do usuário autenticado a partir do token enviado.
- **Header:** `Authorization: Bearer <token>`
- **Response `200 OK`:** Objeto do usuário autenticado.

---

### 2. Usuários & Admin (`/api/users`)

- `GET /api/users` — **Requer `ADMIN` ou `MASTER_ADMIN`**. Lista todos os usuários cadastrados com paginação.
- `GET /api/users/{id}` — Detalhes de um usuário específico.
- `PUT /api/users/{id}` — Atualização cadastral (nome, email).
- `PUT /api/users/{id}/status` — Ativa ou desativa o acesso de um usuário (`{ "ativo": false }`).
- `PUT /api/users/{id}/plano` — Altera plano e data de expiração (`{ "plano": "PRO", "planoExpiraEm": "2027-12-31T23:59:59Z" }`).
- `PUT /api/users/{id}/permissoes` — Habilita/desabilita módulos individuais (`moduloEstudos`, `moduloTreinos`, `moduloFinancas`, `moduloIaExtracao`).

---

### 3. Tarefas & Produtividade (`/api/tasks`)

- `GET /api/users/{userId}/tasks` — Lista tarefas com filtros (`status`, `prioridade`).
- `POST /api/users/{userId}/tasks` — Cria uma nova tarefa.
- `PUT /api/tasks/{id}` — Atualiza título, descrição, status ou prioridade.
- `DELETE /api/tasks/{id}` — Exclui tarefa permanentemente.

---

### 4. Planos de Estudo & Matérias (`/api/study-plans`)

- `GET /api/users/{userId}/study-plans` — Retorna editais verticalizados do usuário.
- `POST /api/users/{userId}/study-plans` — Cria novo plano de estudos.
- `GET /api/study-plans/{id}/subjects` — Lista matérias do edital.
- `POST /api/study-plans/{id}/subjects` — Cadastra matéria com peso e cor.
- `GET /api/subjects/{id}/topics` — Lista tópicos/assuntos da matéria.
- `POST /api/subjects/{id}/topics` — Adiciona tópico ao edital.
- `PUT /api/topics/{id}` — Atualiza progresso teórico ou status de revisão.

---

### 5. Banco de Questões & Simulados

- `GET /api/users/{userId}/questions` — Busca questões cadastradas com filtros de matéria, banca e ano.
- `POST /api/users/{userId}/questions` — Cadastra nova questão com gabarito e alternativas.
- `POST /api/questions/{id}/answer` — Submete resposta do aluno, calcula taxa de acerto e atualiza FSRS (repetição espaçada).
- `GET /api/users/{userId}/caderno-erros` — Lista questões que o aluno errou para revisão espaçada.
- `GET /api/users/{userId}/simulados` — Histórico de simulados realizados com pontuação percentual.
- `POST /api/users/{userId}/simulados` — Inicia novo simulado com seleção de questões e cronômetro.
- `POST /api/simulados/{id}/finalizar` — Encerra simulado, trava respostas e gera nota auditada.

---

### 6. Treinos & Fisiologia (`/api/workouts`)

- `GET /api/users/{userId}/workouts` — Lista fichas de treino (A, B, C, D).
- `POST /api/users/{userId}/workouts` — Cadastra nova ficha de treino.
- `GET /api/workouts/{id}/exercises` — Lista exercícios da ficha.
- `POST /api/workouts/{id}/exercises` — Adiciona exercício com séries, repetições e carga (kg).
- `PUT /api/exercises/{id}` — Atualiza progressão de carga e repetições.
- `GET /api/users/{userId}/evolucao-photos` — Histórico de fotos de evolução física com peso.
- `POST /api/users/{userId}/evolucao-photos` — Upload de foto (Multipart Form-Data) com gravação de peso corporal.

---

### 7. Finanças Pessoais (`/api/transactions`)

- `GET /api/users/{userId}/transactions` — Retorna extrato de receitas e despesas por mês/ano.
- `POST /api/users/{userId}/transactions` — Cadastra nova movimentação financeira.
  ```json
  {
    "tipo": "DESPESA",
    "valor": 150.00,
    "descricao": "Supermercado Mensal",
    "data": "2026-09-17",
    "status": "CONCLUIDA",
    "categoriaId": 3
  }
  ```
- `PUT /api/transactions/{id}/concluir` — Confirma pagamento de despesa pendente ou recebimento de receita.
- `DELETE /api/transactions/{id}` — Remove lançamento financeiro.
- `GET /api/users/{userId}/categories` — Lista categorias financeiras com suas respectivas cores.

---

### 8. Serviços de IA & Extração (`/api/ai`)

- `POST /api/ai/chat` — Proxy seguro para o Google Gemini sem expor a API Key ao navegador.
- `POST /api/study-plans/{id}/import-pdf` — Recebe arquivo PDF de edital/prova, extrai texto com OCR e gera a estrutura de matérias e questões automaticamente via IA.

---

## 🚀 Deploy & Infraestrutura (Render / Docker)

### Arquivo `Dockerfile` para Deploy no Render / Railway

```dockerfile
# Etapa de Compilação (Multi-stage build)
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY . .
RUN ./mvnw clean package -DskipTests

# Etapa de Execução Leve
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "-Dserver.port=${PORT}", "app.jar"]
```

---

## 🔑 Variáveis de Ambiente do Backend

Configure no painel do Render, Railway ou `.env` do servidor:

```env
# Servidor & Porta
PORT=8080
SPRING_PROFILES_ACTIVE=prod

# Banco de Dados PostgreSQL
SPRING_DATASOURCE_URL=jdbc:postgresql://ep-xyz.render.com/nexus_db?sslmode=require
SPRING_DATASOURCE_USERNAME=nexus_admin
SPRING_DATASOURCE_PASSWORD=segredo_super_seguro_do_banco

# Segurança JWT (Assinatura de no mínimo 256 bits)
NEXUS_JWT_SECRET=super_chave_secreta_nexus_com_alta_entropia_2026_seguranca_maxima
NEXUS_JWT_EXPIRATION_DAYS=7

# Integração com Google Gemini AI
GEMINI_API_KEY=AIzaSy...sua_chave_do_google_ai_studio

# Configuração de CORS Permitido
CORS_ALLOWED_ORIGINS=https://nexus-web.vercel.app,http://localhost:3000,http://localhost:5173
```
