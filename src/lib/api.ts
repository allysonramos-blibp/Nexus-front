/**
 * Cliente HTTP do Nexus — fala com a API Spring Boot.
 * Todas as chamadas rodam no browser.
 */

const STORAGE_KEY = "nexus.apiUrl";
const TOKEN_STORAGE_KEY = "nexus.token";

/** Evento disparado quando a API responde 401. */
export const UNAUTHORIZED_EVENT = "nexus:unauthorized";

/**
 * Limite de espera para as chamadas de importação de PDF.
 * A extração com IA agora roda em pedaços pequenos com novas
 * tentativas e uma segunda passada de recuperação, o que pode
 * levar vários minutos em provas longas.
 */
export const PDF_IMPORT_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutos

// IMPORTANTE: precisa terminar em "/api" — é o prefixo real de todas as rotas do
// backend (ex.: AuthController mapeia @RequestMapping("/api/auth")). setApiBaseUrl()
// garante esse sufixo pra qualquer URL customizada que a pessoa digitar na tela de
// login, mas esse fallback aqui é usado direto (sem passar por setApiBaseUrl) por
// qualquer navegador que ainda não salvou uma URL customizada — ou seja, por padrão,
// para todo mundo. Sem o "/api", toda chamada (login incluso) vai pra um caminho que
// não bate com o permitAll do SecurityConfig, e o Spring Security devolve 401 antes
// de sequer tentar autenticar.
export const DEFAULT_API_URL =
  (import.meta.env["VITE_API_URL"] as string | undefined) ??
  "https://nexus-api-bgsf.onrender.com/api";

/**
 * URL base atual da API.
 */
export function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return DEFAULT_API_URL;
  }

  return (
    window.localStorage.getItem(STORAGE_KEY) ||
    DEFAULT_API_URL
  );
}

export function setApiBaseUrl(url: string) {
  let clean = url.trim().replace(/\/+$/, "");

  if (clean && !clean.endsWith("/api")) {
    clean += "/api";
  }

  if (clean) {
    window.localStorage.setItem(STORAGE_KEY, clean);
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Token JWT atual.
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(
    TOKEN_STORAGE_KEY,
  );
}

export function setAuthToken(token: string) {
  window.localStorage.setItem(
    TOKEN_STORAGE_KEY,
    token,
  );
}

export function clearAuthToken() {
  window.localStorage.removeItem(
    TOKEN_STORAGE_KEY,
  );
}

/**
 * Constrói URL para assets retornados pela API.
 */
export function buildAssetUrl(path: string): string {
  const root = getApiBaseUrl().replace(
    /\/api\/?$/,
    "",
  );

  return `${root}${path}`;
}

/**
 * true quando a página é HTTPS e a API é HTTP.
 */
export function isMixedContent(
  url = getApiBaseUrl(),
): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.location.protocol === "https:" &&
    url.startsWith("http://")
  );
}

export class ApiError extends Error {
  status: number;

  constructor(
    status: number,
    message: string,
  ) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

/**
 * Testa se a API está respondendo.
 */
export async function pingApi(
  url = getApiBaseUrl(),
): Promise<string> {
  if (isMixedContent(url)) {
    throw new ApiError(
      0,
      "Esta página roda em HTTPS e a API está em HTTP — o navegador bloqueia a chamada (mixed content). Exponha a API por HTTPS (ex.: ngrok) ou rode o front localmente.",
    );
  }

  const res = await fetch(`${url}/auth`, {
    method: "GET",
  }).catch(() => {
    throw new ApiError(
      0,
      `Não respondeu em ${url}. Verifique se a API está rodando e se o CORS libera este domínio (${
        typeof window !== "undefined"
          ? window.location.origin
          : ""
      }).`,
    );
  });

  return `API respondeu (HTTP ${res.status}).`;
}

/**
 * Cliente HTTP centralizado.
 */
async function request<T>(
  path: string,
  init?: RequestInit,
  timeoutMs = 0,
): Promise<T> {
  let res: Response;

  const base = getApiBaseUrl();

  const controller =
    timeoutMs > 0 ? new AbortController() : null;
  const timeoutId =
    controller != null
      ? setTimeout(
          () => controller.abort(),
          timeoutMs,
        )
      : null;

  const headers: Record<string, string> =
    init?.body instanceof FormData
      ? {}
      : {
          "Content-Type":
            "application/json",
        };

  const token = getAuthToken();

  if (token) {
    headers["Authorization"] =
      `Bearer ${token}`;
  }

  if (isMixedContent(base)) {
    throw new ApiError(
      0,
      "Página em HTTPS chamando API em HTTP: o navegador bloqueia. Configure uma URL https da API (ngrok) na tela de login.",
    );
  }

  try {
    res = await fetch(`${base}${path}`, {
      ...init,
      headers,
      signal:
        controller?.signal ?? init?.signal,
    });
  } catch (e) {
    if (
      controller != null &&
      controller.signal.aborted
    ) {
      throw new ApiError(
        0,
        "A importação demorou mais do que o limite de espera e a conexão foi encerrada. Tente novamente — a importação costuma ir mais rápido na segunda tentativa.",
      );
    }

    throw new ApiError(
      0,
      `Não consegui falar com a API em ${base}. Ela está rodando e com CORS liberado para ${
        typeof window !== "undefined"
          ? window.location.origin
          : "este domínio"
      }?`,
    );
  } finally {
    if (timeoutId != null) {
      clearTimeout(timeoutId);
    }
  }

  if (
    res.status === 401 &&
    typeof window !== "undefined"
  ) {
    window.dispatchEvent(
      new CustomEvent(
        UNAUTHORIZED_EVENT,
      ),
    );
  }

  if (!res.ok) {
    const text = await res
      .text()
      .catch(() => "");

    let userMsg = text;
    try {
      const parsed = JSON.parse(text);
      if (parsed.message) {
        userMsg = parsed.message;
      }
    } catch {
      // not json
    }

    throw new ApiError(
      res.status,
      userMsg ||
        `Erro ${res.status} em ${path}`,
    );
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();

  return (
    text
      ? JSON.parse(text)
      : undefined
  ) as T;
}

/* =========================================================
 * TIPOS
 * ========================================================= */

export type TransactionType =
  | "RECEITA"
  | "DESPESA";

export type TransactionStatus =
  | "PENDENTE"
  | "CONCLUIDA";

export type CategoryType =
  | "TASK"
  | "FINANCEIRO";

export type TaskStatus =
  | "PENDENTE"
  | "TEORIA_VISTA"
  | "QUESTOES_FEITAS"
  | "DOMINADO";

export type TaskPriority =
  | "BAIXA"
  | "MEDIA"
  | "ALTA";

export type TaskWorkflowStatus =
  | "PENDENTE"
  | "EM_ANDAMENTO"
  | "CONCLUIDA"
  | "CANCELADA";

/* =========================================================
 * AUTH
 * ========================================================= */

export interface UserResponse {
  id: number;
  email: string;
  role?: string;
  active?: boolean;
  plan?: "STARTER" | "PRO" | "ENTERPRISE";
  moduloEstudos?: boolean;
  moduloTreinos?: boolean;
  moduloFinancas?: boolean;
  moduloIaExtracao?: boolean;
  pdfExtractCount?: number;
  pdfExtractLimit?: number;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresInMs: number;
  user: UserResponse;
}

/* =========================================================
 * CATEGORIAS
 * ========================================================= */

export interface Category {
  id: number;
  nome: string;
  tipo: CategoryType;
  cor?: string | null;
}

export interface CategoryRequest {
  nome: string;
  tipo: CategoryType;
  cor?: string | null;
}

/* =========================================================
 * FINANCEIRO
 * ========================================================= */

export interface FinancialTransaction {
  id: number;
  descricao: string;
  valor: number;
  tipo: TransactionType;
  status: TransactionStatus;
  data: string;
  categoryId?: number | null;
  categoryNome?: string | null;
  categoryCor?: string | null;
}

export interface FinancialTransactionRequest {
  descricao: string;
  valor: number;
  tipo: TransactionType;
  status: TransactionStatus;
  data: string;
  categoryId?: number | null;
}

/* =========================================================
 * TAREFAS
 * ========================================================= */

export interface Task {
  id: number;
  titulo: string;
  descricao?: string | null;
  status: TaskStatus;
  workflowStatus?:
    | TaskWorkflowStatus
    | null;
  prioridade: TaskPriority;
  dataLimite?: string | null;
  horario?: string | null;
  concluidaEm?: string | null;
  ehTopicoEdital: boolean;
  categoryId?: number | null;
  categoryNome?: string | null;
  categoryCor?: string | null;
}

export interface TaskRequest {
  titulo: string;
  descricao?: string | null;
  status?: TaskStatus | null;
  workflowStatus?:
    | TaskWorkflowStatus
    | null;
  prioridade: TaskPriority;
  dataLimite?: string | null;
  horario?: string | null;
  ehTopicoEdital: boolean;
  categoryId?: number | null;
}

/* =========================================================
 * ESTUDOS — NOTAS
 * ========================================================= */

export interface StudyNote {
  id: number;
  titulo: string;
  conteudo?: string | null;
  atualizadoEm: string;
}

/* =========================================================
 * ESTUDOS — ARQUIVOS
 * ========================================================= */

export interface StudyFile {
  id: number;
  nomeOriginal: string;
  nomeArmazenado: string;
  tipoConteudo: string;
  dataUpload: string;
}

/* =========================================================
 * TREINOS
 * ========================================================= */

export interface WorkoutExercise {
  id?: number;
  nome: string;
  series: number;
  repeticoes: number;
  carga?: number | null;
}

export interface Workout {
  id: number;
  grupoMuscular: string;
  exerciciosExecutados?: string | null;
  dataTreino: string;
  concluido: boolean;
  imagemUrl?: string | null;
  exercicios: WorkoutExercise[];
}

export interface WorkoutGoal {
  id: number;
  metaTreinosPorSemana: number;
}

/* =========================================================
 * CHAT
 * ========================================================= */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/* =========================================================
 * ESTUDOS — PLANOS
 * ========================================================= */

export type StudyPlanStatus =
  | "PLANEJADO"
  | "EM_ANDAMENTO"
  | "CONCLUIDO"
  | "PAUSADO";

export interface StudyPlan {
  id: number;
  nome: string;
  objetivo?: string | null;
  descricao?: string | null;
  dataInicio?: string | null;
  dataAlvo?: string | null;
  horasDisponiveis?: number | null;
  status: StudyPlanStatus;
  ativo: boolean;
  totalMaterias: number;
  totalAssuntos: number;
  progresso: number;
  userId: number;
}

export interface StudyPlanRequest {
  nome: string;
  objetivo?: string | null;
  descricao?: string | null;
  dataInicio?: string | null;
  dataAlvo?: string | null;
  horasDisponiveis?: number | null;
  status?: StudyPlanStatus | null;
}

/* =========================================================
 * ESTUDOS — MATÉRIAS
 * ========================================================= */

export interface Subject {
  id: number;
  nome: string;
  pesoNoEdital?: number | null;
  studyPlanId: number;
}

export interface SubjectRequest {
  nome: string;
  pesoNoEdital?: number | null;
}

/* =========================================================
 * ESTUDOS — ASSUNTOS
 * ========================================================= */

export interface Topic {
  id: number;
  nome: string;
  ordem?: number | null;
  subjectId: number;
}

export interface TopicRequest {
  nome: string;
  ordem?: number | null;
}

/* =========================================================
 * ESTUDOS — QUESTÕES
 * ========================================================= */

export type QuestionDifficulty =
  | "FACIL"
  | "MEDIA"
  | "DIFICIL";

export interface Question {
  id: number;
  numero?: number | null;
  enunciado: string;
  alternativas: string[];
  dificuldade?:
    | QuestionDifficulty
    | null;
  gabarito?: string | null;
  explicacao?: string | null;
  pegadinha?: string | null;
  banca?: string | null;
  ano?: number | null;
  topicId: number;
  subjectId: number;
  subjectNome: string;
  topicNome?: string;
}

export interface QuestionRequest {
  numero?: number | null;
  enunciado: string;
  alternativas: string[];
  dificuldade?:
    | QuestionDifficulty
    | null;
  gabarito: string;
  explicacao?: string | null;
  pegadinha?: string | null;

  /**
   * Campos usados durante a extração
   * por PDF e classificação da IA.
   */
  disciplinaSugerida?: string | null;
  assuntoSugerido?: string | null;

  banca?: string | null;
  ano?: number | null;
}

/* =========================================================
 * PDF — IMPORTADOR ANTIGO
 * ========================================================= */

export interface PdfExtractionResponse {
  questoes: QuestionRequest[];

  /**
   * Total efetivamente extraído.
   */
  total: number;

  /**
   * Estimativa heurística.
   */
  possivelTotalNoPdf: number;

  chunksProcessados: number;
  chunksComFalha: number;
}

/* =========================================================
 * PDF — IMPORTADOR POR PLANO
 * ========================================================= */

/**
 * Assunto existente dentro de uma matéria.
 */
export interface ExistingTopicSummary {
  id: number;
  nome: string;
}

/**
 * Matéria existente no plano.
 */
export interface ExistingSubjectSummary {
  id: number;
  nome: string;

  /**
   * Assuntos existentes nesta matéria.
   */
  topics: ExistingTopicSummary[];
}

/**
 * Grupo de questões identificado pela IA.
 *
 * Uma combinação de:
 *
 * matéria + assunto
 */
export interface QuestionGroup {
  subjectNome: string;
  topicNome: string;
  questoes: QuestionRequest[];

  /**
   * Podem ser null quando a matéria/assunto
   * ainda não existe no plano.
   */
  subjectId?: number | null;
  topicId?: number | null;
}

/**
 * Resposta da extração do PDF no nível do plano.
 *
 * Importante:
 * esta etapa NÃO deve salvar as questões.
 */
export interface PlanPdfExtractionResponse {
  grupos: QuestionGroup[];

  /**
   * Matérias já existentes no plano.
   */
  materiasExistentes:
    ExistingSubjectSummary[];

  /**
   * Total real extraído.
   */
  totalExtraido: number;

  /**
   * Estimativa do total de questões
   * aparentemente existente no PDF.
   */
  possivelTotalNoPdf: number;

  /**
   * Questões que parecem estar ausentes.
   */
  numerosAusentes: number[];

  /**
   * Questões que aparecem duplicadas.
   */
  numerosDuplicados: number[];

  /**
   * Quantidade de blocos processados.
   */
  chunksProcessados: number;

  /**
   * Quantidade de blocos que falharam.
   */
  chunksComFalha: number;
}

/**
 * Grupo enviado para a importação definitiva.
 *
 * null significa que o usuário/IA
 * ainda não associou a uma entidade existente.
 */
export interface QuestionGroupImportRequest {
  subjectId?: number | null;
  subjectNome: string | null;

  topicId?: number | null;
  topicNome: string | null;

  questoes: QuestionRequest[];
}

/**
 * Payload usado pelo backend.
 */
export interface PlanQuestionImportRequest {
  grupos: QuestionGroupImportRequest[];
}

/**
 * Resumo de assunto após importação.
 */
export interface TopicImportSummary {
  id: number;
  nome: string;
  totalSalvo: number;
}

/**
 * Resumo de matéria após importação.
 */
export interface SubjectImportSummary {
  id: number;
  nome: string;
  totalSalvo: number;
  topicos: TopicImportSummary[];
}

/**
 * Resposta da importação definitiva.
 */
export interface PlanQuestionImportResponse {
  totalSalvo: number;
  materias: SubjectImportSummary[];
}

/* =========================================================
 * ESTUDOS — RESPOSTAS
 * ========================================================= */

export interface Answer {
  id: number;
  questionId: number;
  respostaEscolhida: string;
  correta: boolean;
  tempoSegundos?: number | null;
  numeroTentativa: number;
  respondidoEm: string;
  mockExamId?: number | null;
}

export interface AnswerRequest {
  questionId: number;
  respostaEscolhida: string;
  tempoSegundos?: number | null;
  mockExamId?: number | null;
}

/* =========================================================
 * CADERNO DE ERROS
 * ========================================================= */

export type ErrorReason =
  | "NAO_SABIA"
  | "INTERPRETACAO"
  | "DISTRACAO"
  | "CHUTE"
  | "ERRO_DE_CALCULO";

export interface StudyError {
  id: number;
  questionId: number;
  enunciadoQuestao: string;
  answerId?: number | null;
  motivo: ErrorReason;
  observacao?: string | null;
  criadoEm: string;
  proximaRevisao?: string | null;
  resolvido: boolean;
}

export interface StudyErrorRequest {
  questionId: number;
  answerId?: number | null;
  motivo: ErrorReason;
  observacao?: string | null;
  proximaRevisao?: string | null;
}

export interface PendingReviewResponse {
  totalPendentes: number;
  itens: StudyError[];
}

/* =========================================================
 * SIMULADOS
 * ========================================================= */

export type MockExamStatus =
  | "CRIADO"
  | "EM_ANDAMENTO"
  | "FINALIZADO";

export interface MockExam {
  id: number;
  titulo: string;
  dataRealizacao: string;
  status: MockExamStatus;
  duracaoMinutos?: number | null;
  totalQuestoes: number;
  acertos?: number | null;
  notaObtida?: number | null;
  percentual: number;
  iniciadoEm?: string | null;
  finalizadoEm?: string | null;
  studyPlanId?: number | null;
  materias: string[];
}

export interface MockExamDetail {
  exam: MockExam;
  questoes: Question[];
}

export interface MockExamRequest {
  titulo: string;
  studyPlanId?: number | null;
  subjectIds: number[];
  quantidadeQuestoes: number;
  duracaoMinutos?: number | null;
}

/* =========================================================
 * ESTATÍSTICAS
 * ========================================================= */

export interface OverallStats {
  questoesRespondidas: number;
  acertos: number;
  erros: number;
  percentualAcerto: number;
}

export interface SubjectPerformance {
  subjectId: number;
  subjectNome: string;
  respondidas: number;
  acertos: number;
}

export interface TopicPerformance {
  topicId: number;
  topicNome: string;
  respondidas: number;
  acertos: number;
}

/* =========================================================
 * API
 * ========================================================= */

export const api = {
  /* =======================================================
   * AUTH
   * ======================================================= */

  login: (
    email: string,
    password: string,
  ) =>
    request<AuthResponse>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      },
    ),

  register: (
    email: string,
    password: string,
  ) =>
    request<UserResponse>(
      "/users/register",
      {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      },
    ),
  forgotPassword: (email: string) =>
    request<{ success: boolean; message: string; code?: string; email?: string }>(
      "/auth/forgot-password",
      {
        method: "POST",
        body: JSON.stringify({ email }),
      },
    ),
  resetPassword: (email: string, token: string, newPassword: string) =>
    request<{ message: string }>(
      "/auth/reset-password",
      {
        method: "POST",
        body: JSON.stringify({ email, token, newPassword }),
      },
    ),

  /* =======================================================
   * FINANCEIRO
   * ======================================================= */

  listTransactions: (
    userId: number,
  ) =>
    request<FinancialTransaction[]>(
      `/transactions/user/${userId}`,
    ),

  createTransaction: (
    userId: number,
    body: FinancialTransactionRequest,
  ) =>
    request<FinancialTransaction>(
      `/transactions/user/${userId}`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),

  updateTransaction: (
    id: number,
    body: FinancialTransactionRequest,
  ) =>
    request<FinancialTransaction>(
      `/transactions/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(body),
      },
    ),

  concludeTransaction: (
    id: number,
  ) =>
    request<FinancialTransaction>(
      `/transactions/${id}/concluir`,
      {
        method: "PATCH",
      },
    ),

  deleteTransaction: (
    id: number,
  ) =>
    request<void>(
      `/transactions/${id}`,
      {
        method: "DELETE",
      },
    ),

  /* =======================================================
   * CATEGORIAS
   * ======================================================= */

  listCategories: (
    tipo: CategoryType = "FINANCEIRO",
  ) =>
    request<Category[]>(
      `/categories?tipo=${tipo}`,
    ),

  createCategory: (
    body: CategoryRequest,
  ) =>
    request<Category>(
      "/categories",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),

  updateCategory: (
    id: number,
    body: CategoryRequest,
  ) =>
    request<Category>(
      `/categories/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(body),
      },
    ),

  deleteCategory: (
    id: number,
  ) =>
    request<void>(
      `/categories/${id}`,
      {
        method: "DELETE",
      },
    ),

  /* =======================================================
   * TAREFAS
   * ======================================================= */

  listTasks: (
    userId: number,
  ) =>
    request<Task[]>(
      `/tasks/user/${userId}`,
    ),

  listEdital: (
    userId: number,
  ) =>
    request<Task[]>(
      `/tasks/user/${userId}/edital`,
    ),

  createTask: (
    body: TaskRequest,
  ) =>
    request<Task>(
      "/tasks",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),

  updateTask: (
    id: number,
    body: TaskRequest,
  ) =>
    request<Task>(
      `/tasks/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(body),
      },
    ),

  deleteTask: (
    id: number,
  ) =>
    request<void>(
      `/tasks/${id}`,
      {
        method: "DELETE",
      },
    ),

  /**
   * Status de progresso dos tópicos de edital.
   */
  updateTaskStatus: (
    id: number,
    status: TaskStatus,
  ) =>
    request<Task>(
      `/tasks/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          status,
        }),
      },
    ),

  /**
   * Status de fluxo das tarefas comuns.
   */
  updateTaskWorkflowStatus: (
    id: number,
    workflowStatus: TaskWorkflowStatus,
  ) =>
    request<Task>(
      `/tasks/${id}/workflow-status`,
      {
        method: "PATCH",
        body: JSON.stringify({
          workflowStatus,
        }),
      },
    ),

  /* =======================================================
   * NOTAS
   * ======================================================= */

  listNotes: (
    userId: number,
  ) =>
    request<StudyNote[]>(
      `/study-notes/user/${userId}`,
    ),

  createNote: (
    userId: number,
    titulo: string,
    conteudo: string,
  ) =>
    request<StudyNote>(
      "/study-notes",
      {
        method: "POST",
        body: JSON.stringify({
          titulo,
          conteudo,
          atualizadoEm:
            new Date()
              .toISOString()
              .slice(0, 19),
          user: {
            id: userId,
          },
        }),
      },
    ),

  updateNote: (
    id: number,
    userId: number,
    titulo: string,
    conteudo: string,
  ) =>
    request<StudyNote>(
      `/study-notes/${id}`,
      {
        method: "PUT",
        body: JSON.stringify({
          titulo,
          conteudo,
          atualizadoEm:
            new Date()
              .toISOString()
              .slice(0, 19),
          user: {
            id: userId,
          },
        }),
      },
    ),

  deleteNote: (
    id: number,
  ) =>
    request<void>(
      `/study-notes/${id}`,
      {
        method: "DELETE",
      },
    ),

  /* =======================================================
   * ARQUIVOS
   * ======================================================= */

  listFiles: (
    userId: number,
  ) =>
    request<StudyFile[]>(
      `/study-files/user/${userId}`,
    ),

  uploadFile: (
    userId: number,
    file: File,
  ) => {
    const form = new FormData();

    form.append(
      "file",
      file,
    );

    return request<StudyFile>(
      `/study-files/upload/user/${userId}`,
      {
        method: "POST",
        body: form,
      },
    );
  },

  deleteFile: (
    id: number,
  ) =>
    request<void>(
      `/study-files/${id}`,
      {
        method: "DELETE",
      },
    ),

  fileDownloadUrl: (
    id: number,
  ) =>
    `${getApiBaseUrl()}/study-files/download/${id}`,

  /* =======================================================
   * CHAT
   * ======================================================= */

  chat: (
    message: string,
    history: ChatMessage[],
  ) =>
    request<{ reply: string }>(
      "/study-chat",
      {
        method: "POST",
        body: JSON.stringify({
          message,
          history,
        }),
      },
    ),

  /* =======================================================
   * TREINOS
   * ======================================================= */

  listWorkouts: (
    userId: number,
  ) =>
    request<Workout[]>(
      `/workouts/user/${userId}`,
    ),

  createWorkout: (body: {
    grupoMuscular: string;
    dataTreino: string;
    concluido: boolean;
    exerciciosExecutados?: string;
    exercicios?: WorkoutExercise[];
  }) =>
    request<Workout>(
      "/workouts",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),

  uploadWorkoutImage: (
    workoutId: number,
    file: File,
  ) => {
    const form = new FormData();

    form.append(
      "file",
      file,
    );

    return request<Workout>(
      `/workouts/${workoutId}/image`,
      {
        method: "POST",
        body: form,
      },
    );
  },

  deleteWorkout: (
    workoutId: number,
  ) =>
    request<void>(
      `/workouts/${workoutId}`,
      {
        method: "DELETE",
      },
    ),

  getGoal: (
    userId: number,
  ) =>
    request<WorkoutGoal>(
      `/workout-goals/user/${userId}`,
    ),

  setGoal: (
    userId: number,
    metaTreinosPorSemana: number,
  ) =>
    request<WorkoutGoal>(
      `/workout-goals/user/${userId}`,
      {
        method: "PUT",
        body: JSON.stringify({
          metaTreinosPorSemana,
        }),
      },
    ),

  /* =======================================================
   * ESTUDOS — PLANOS
   * ======================================================= */

  listStudyPlans: () =>
    request<StudyPlan[]>(
      "/study-plans",
    ),

  getStudyPlan: (
    id: number,
  ) =>
    request<StudyPlan>(
      `/study-plans/${id}`,
    ),

  createStudyPlan: (
    body: StudyPlanRequest,
  ) =>
    request<StudyPlan>(
      "/study-plans",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),

  updateStudyPlan: (
    id: number,
    body: StudyPlanRequest,
  ) =>
    request<StudyPlan>(
      `/study-plans/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(body),
      },
    ),

  deleteStudyPlan: (
    id: number,
  ) =>
    request<void>(
      `/study-plans/${id}`,
      {
        method: "DELETE",
      },
    ),

  /* =======================================================
   * ESTUDOS — MATÉRIAS
   * ======================================================= */

  listSubjects: (
    studyPlanId: number,
  ) =>
    request<Subject[]>(
      `/study-plans/${studyPlanId}/subjects`,
    ),

  createSubject: (
    studyPlanId: number,
    body: SubjectRequest,
  ) =>
    request<Subject>(
      `/study-plans/${studyPlanId}/subjects`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),

  updateSubject: (
    id: number,
    body: SubjectRequest,
  ) =>
    request<Subject>(
      `/subjects/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(body),
      },
    ),

  deleteSubject: (
    id: number,
  ) =>
    request<void>(
      `/subjects/${id}`,
      {
        method: "DELETE",
      },
    ),

  /* =======================================================
   * ESTUDOS — ASSUNTOS
   * ======================================================= */

  listTopics: (
    subjectId: number,
  ) =>
    request<Topic[]>(
      `/subjects/${subjectId}/topics`,
    ),

  createTopic: (
    subjectId: number,
    body: TopicRequest,
  ) =>
    request<Topic>(
      `/subjects/${subjectId}/topics`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),

  updateTopic: (
    id: number,
    body: TopicRequest,
  ) =>
    request<Topic>(
      `/topics/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(body),
      },
    ),

  deleteTopic: (
    id: number,
  ) =>
    request<void>(
      `/topics/${id}`,
      {
        method: "DELETE",
      },
    ),

  /* =======================================================
   * ESTUDOS — QUESTÕES
   * ======================================================= */

  listQuestions: (
    topicId: number,
  ) =>
    request<Question[]>(
      `/topics/${topicId}/questions`,
    ),

  getQuestion: (
    id: number,
  ) =>
    request<Question>(
      `/questions/${id}`,
    ),

  createQuestion: (
    topicId: number,
    body: QuestionRequest,
  ) =>
    request<Question>(
      `/topics/${topicId}/questions`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),

  /**
   * Importador antigo:
   * todas as questões vão para o topicId informado.
   */
  bulkCreateQuestions: (
    topicId: number,
    body: QuestionRequest[],
  ) =>
    request<Question[]>(
      `/topics/${topicId}/questions/bulk`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),

  /**
   * Extração antiga por assunto.
   */
  extractQuestionsFromPdf: (
    file: File,
  ): Promise<PdfExtractionResponse> => {
    const form = new FormData();

    form.append(
      "file",
      file,
    );

    return request<PdfExtractionResponse>(
      "/questions/extract-pdf",
      {
        method: "POST",
        body: form,
      },
      PDF_IMPORT_TIMEOUT_MS,
    );
  },

  /**
   * =====================================================
   * NOVO IMPORTADOR POR PLANO
   * =====================================================
   *
   * O PDF completo é enviado ao backend.
   *
   * A API:
   * - extrai as questões;
   * - identifica disciplina;
   * - identifica assunto;
   * - agrupa as questões;
   * - informa matérias existentes;
   * - não deve persistir nesta etapa.
   */
  extractQuestionsFromPdfForPlan: (
    planId: number,
    file: File,
  ): Promise<PlanPdfExtractionResponse> => {
    const form = new FormData();

    form.append(
      "file",
      file,
    );

    return request<PlanPdfExtractionResponse>(
      `/study-plans/${planId}/questions/extract-pdf`,
      {
        method: "POST",
        body: form,
      },
      PDF_IMPORT_TIMEOUT_MS,
    );
  },

  /**
   * =====================================================
   * IMPORTAÇÃO DEFINITIVA POR PLANO
   * =====================================================
   *
   * O componente envia um array de grupos.
   *
   * Aqui transformamos:
   *
   * [
   *   {...},
   *   {...}
   * ]
   *
   * em:
   *
   * {
   *   grupos: [
   *     {...},
   *     {...}
   *   ]
   * }
   */
  importQuestionsToPlan: (
    planId: number,
    body: QuestionGroupImportRequest[],
  ): Promise<PlanQuestionImportResponse> =>
    request<PlanQuestionImportResponse>(
      `/study-plans/${planId}/questions/import`,
      {
        method: "POST",
        body: JSON.stringify({
          grupos: body,
        }),
      },
    ),

  updateQuestion: (
    id: number,
    body: QuestionRequest,
  ) =>
    request<Question>(
      `/questions/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(body),
      },
    ),

  deleteQuestion: (
    id: number,
  ) =>
    request<void>(
      `/questions/${id}`,
      {
        method: "DELETE",
      },
    ),

  /* =======================================================
   * ESTUDOS — RESPOSTAS
   * ======================================================= */

  submitAnswer: (
    body: AnswerRequest,
  ) =>
    request<Answer>(
      "/answers",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),

  listAnswers: () =>
    request<Answer[]>(
      "/answers",
    ),

  /* =======================================================
   * ESTUDOS — CADERNO DE ERROS
   * ======================================================= */

  listStudyErrors: () =>
    request<StudyError[]>(
      "/study-errors",
    ),

  registerStudyError: (
    body: StudyErrorRequest,
  ) =>
    request<StudyError>(
      "/study-errors",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),

  resolveStudyError: (
    id: number,
  ) =>
    request<StudyError>(
      `/study-errors/${id}/resolver`,
      {
        method: "PATCH",
      },
    ),

  deleteStudyError: (
    id: number,
  ) =>
    request<void>(
      `/study-errors/${id}`,
      {
        method: "DELETE",
      },
    ),

  /* =======================================================
   * ESTUDOS — REVISÕES
   * ======================================================= */

  listPendingReviews: () =>
    request<PendingReviewResponse>(
      "/study-stats/pendentes-revisao",
    ),

  /* =======================================================
   * ESTUDOS — SIMULADOS
   * ======================================================= */

  listMockExams: () =>
    request<MockExam[]>(
      "/mock-exams",
    ),

  getMockExam: (
    id: number,
  ) =>
    request<MockExamDetail>(
      `/mock-exams/${id}`,
    ),

  createMockExam: (
    body: MockExamRequest,
  ) =>
    request<MockExam>(
      "/mock-exams",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),

  startMockExam: (
    id: number,
  ) =>
    request<MockExam>(
      `/mock-exams/${id}/iniciar`,
      {
        method: "POST",
      },
    ),

  finishMockExam: (
    id: number,
  ) =>
    request<MockExam>(
      `/mock-exams/${id}/finalizar`,
      {
        method: "POST",
      },
    ),

  deleteMockExam: (
    id: number,
  ) =>
    request<void>(
      `/mock-exams/${id}`,
      {
        method: "DELETE",
      },
    ),

  /* =======================================================
   * ESTUDOS — ESTATÍSTICAS
   * ======================================================= */

  statsGeral: () =>
    request<OverallStats>(
      "/study-stats/geral",
    ),

  statsPorMateria: () =>
    request<SubjectPerformance[]>(
      "/study-stats/por-materia",
    ),

  statsPorAssunto: () =>
    request<TopicPerformance[]>(
      "/study-stats/por-assunto",
    ),

  statsPorPeriodo: (
    inicio: string,
    fim: string,
  ) =>
    request<OverallStats>(
      `/study-stats/por-periodo?inicio=${inicio}&fim=${fim}`,
    ),

  /* =======================================================
   * ADMIN SAAS
   * ======================================================= */
  listAdminUsers: () =>
    request<
      Array<{
        id: number;
        email: string;
        role: string;
        active: boolean;
        status: "ATIVO" | "SUSPENSO" | "PENDENTE";
        plan: "STARTER" | "PRO" | "ENTERPRISE";
        modules: {
          estudos: boolean;
          treinos: boolean;
          financas: boolean;
          iaExtracao: boolean;
        };
        pdfExtractCount: number;
        pdfExtractLimit: number;
        totalQuestoes: number;
        simuladosCriados: number;
        totalPlanos: number;
        ultimoAcesso: string;
      }>
    >("/admin/users"),

  updateAdminUserStatus: (id: number, nextStatus: string) =>
    request<{ userId: number; status: string; message: string }>(
      `/admin/users/${id}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      },
    ),

  updateAdminUserModules: (id: number, payload: any) =>
    request<{ userId: number; message: string }>(
      `/admin/users/${id}/modules`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    ),

  /* =======================================================
   * GABARITO OFICIAL
   * ======================================================= */
  importPlanAnswerKey: (planId: number, file: File, tipoProva?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (tipoProva && tipoProva.trim()) {
      formData.append("tipoProva", tipoProva.trim());
    }
    return request<{
      totalEncontrado: number;
      totalAtualizado: number;
      questoesSemCorrespondencia: number[];
      numerosAusentesNoGabarito: number[];
      numerosAnulados: number[];
      numerosDuplicadosIgnorados: number[];
    }>(`/study-plans/${planId}/questions/import-gabarito`, {
      method: "POST",
      body: formData,
    });
  },
};

/* =========================================================
 * HELPERS
 * ========================================================= */

export const brl = (
  v: number,
) =>
  new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  ).format(v);

export const today = () =>
  new Date()
    .toISOString()
    .slice(0, 10);

export const statusLabel: Record<
  TaskStatus,
  string
> = {
  PENDENTE: "Pendente",
  TEORIA_VISTA: "Teoria vista",
  QUESTOES_FEITAS:
    "Questões feitas",
  DOMINADO: "Dominado",
};

export const priorityLabel: Record<
  TaskPriority,
  string
> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
};

export const workflowStatusLabel: Record<
  TaskWorkflowStatus,
  string
> = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO:
    "Em andamento",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

/**
 * Tarefas de edital usam TaskStatus.
 * Tarefas comuns usam TaskWorkflowStatus.
 */
export function isTaskConcluded(
  t: Task,
): boolean {
  return t.ehTopicoEdital
    ? t.status === "DOMINADO"
    : t.workflowStatus ===
        "CONCLUIDA";
}

export function isTaskCancelled(
  t: Task,
): boolean {
  return (
    !t.ehTopicoEdital &&
    t.workflowStatus ===
      "CANCELADA"
  );
}

export const studyPlanStatusLabel: Record<
  StudyPlanStatus,
  string
> = {
  PLANEJADO: "Planejado",
  EM_ANDAMENTO:
    "Em andamento",
  CONCLUIDO: "Concluído",
  PAUSADO: "Pausado",
};

export const difficultyLabel: Record<
  QuestionDifficulty,
  string
> = {
  FACIL: "Fácil",
  MEDIA: "Média",
  DIFICIL: "Difícil",
};

export const errorReasonLabel: Record<
  ErrorReason,
  string
> = {
  NAO_SABIA: "Não sabia",
  INTERPRETACAO:
    "Erro de interpretação",
  DISTRACAO: "Distração",
  CHUTE: "Chute",
  ERRO_DE_CALCULO:
    "Erro de cálculo",
};

export const mockExamStatusLabel: Record<
  MockExamStatus,
  string
> = {
  CRIADO: "Não iniciado",
  EM_ANDAMENTO:
    "Em andamento",
  FINALIZADO: "Finalizado",
};