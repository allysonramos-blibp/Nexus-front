const STORAGE_KEY = "nexus.apiUrl";
const TOKEN_STORAGE_KEY = "nexus.token";

export const UNAUTHORIZED_EVENT = "nexus:unauthorized";

/**
 * URL padrão da API em produção.
 *
 * IMPORTANTE:
 * O backend Spring Boot utiliza:
 *
 * /api/auth
 * /api/users
 * /api/tasks
 * /api/workouts
 * etc.
 *
 * Portanto /api faz parte da URL base.
 */
export const DEFAULT_API_URL =
  (import.meta.env["VITE_API_URL"] as string | undefined)?.trim().replace(/\/+$/, "") ||
  "https://nexus-api-bgsf.onrender.com";

/**
 * Retorna a URL base da API.
 *
 * O localStorage permite alterar a API pelo painel
 * de conexão da tela de login.
 */
export function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return DEFAULT_API_URL;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return DEFAULT_API_URL;
  }

  return stored.trim().replace(/\/+$/, "");
}

/**
 * Define manualmente a URL da API.
 */
export function setApiBaseUrl(url: string): void {
  const clean = url.trim().replace(/\/+$/, "");

  if (clean) {
    window.localStorage.setItem(STORAGE_KEY, clean);
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Retorna o JWT salvo.
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

/**
 * Salva o JWT.
 */
export function setAuthToken(token: string): void {
  window.localStorage.setItem(
    TOKEN_STORAGE_KEY,
    token,
  );
}

/**
 * Remove o JWT.
 */
export function clearAuthToken(): void {
  window.localStorage.removeItem(
    TOKEN_STORAGE_KEY,
  );
}

/**
 * Monta URL para arquivos/assets da API.
 */
export function buildAssetUrl(path: string): string {
  const root = getApiBaseUrl().replace(/\/+$/, "");

  const cleanPath = path.startsWith("/")
    ? path
    : `/${path}`;

  return `${root}${cleanPath}`;
}

/**
 * Verifica se existe mixed content.
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

/**
 * Erro padronizado da API.
 */
export class ApiError extends Error {
  status: number;

  constructor(
    status: number,
    message: string,
  ) {
    super(message);

    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Testa a conexão com a API.
 *
 * Como o backend possui:
 *
 * GET /api/auth
 *
 * essa chamada é usada como health check.
 */
export async function pingApi(
  url = getApiBaseUrl(),
): Promise<string> {
  const base = url.trim().replace(/\/+$/, "");

  if (isMixedContent(base)) {
    throw new ApiError(
      0,
      "Esta página roda em HTTPS e a API está em HTTP. O navegador bloqueia essa chamada.",
    );
  }

  let response: Response;

  try {
    response = await fetch(base, {
      method: "GET",
    });
  } catch {
    throw new ApiError(
      0,
      `Não foi possível conectar à API em ${base}. Verifique se a API está online e se o CORS está configurado.`,
    );
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");

    throw new ApiError(
      response.status,
      text ||
        `API respondeu com HTTP ${response.status}.`,
    );
  }

  return `API respondeu corretamente (HTTP ${response.status}).`;
}

/**
 * Cliente HTTP genérico.
 */
async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const base = getApiBaseUrl().replace(
    /\/+$/,
    "",
  );

  const cleanPath = path.startsWith("/")
    ? path
    : `/${path}`;

  const url = `${base}${cleanPath}`;

  if (isMixedContent(base)) {
    throw new ApiError(
      0,
      "Página em HTTPS chamando API em HTTP. O navegador bloqueou a chamada.",
    );
  }

  const headers = new Headers(
    init?.headers,
  );

  /**
   * FormData não pode receber Content-Type manualmente.
   * O navegador precisa gerar o boundary automaticamente.
   */
  if (!(init?.body instanceof FormData)) {
    if (!headers.has("Content-Type")) {
      headers.set(
        "Content-Type",
        "application/json",
      );
    }
  }

  /**
   * Adiciona JWT automaticamente.
   */
  const token = getAuthToken();

  if (
    token &&
    !headers.has("Authorization")
  ) {
    headers.set(
      "Authorization",
      `Bearer ${token}`,
    );
  }

  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      headers,
    });
  } catch {
    throw new ApiError(
      0,
      `Não consegui conectar à API em ${base}. Verifique se a API está online e se o CORS está liberado.`,
    );
  }

  /**
   * JWT inválido/expirado.
   */
  if (
    response.status === 401 &&
    typeof window !== "undefined"
  ) {
    window.dispatchEvent(
      new CustomEvent(
        UNAUTHORIZED_EVENT,
      ),
    );
  }

  /**
   * Erros HTTP.
   */
  if (!response.ok) {
    const text = await response
      .text()
      .catch(() => "");

    let message = text;

    if (text) {
      try {
        const json = JSON.parse(text);

        message =
          json.message ??
          json.error ??
          json.detail ??
          text;
      } catch {
        message = text;
      }
    }

    throw new ApiError(
      response.status,
      message ||
        `Erro ${response.status} em ${cleanPath}`,
    );
  }

  /**
   * HTTP 204 — No Content.
   */
  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

/* =========================================================
 * TIPOS
 * ========================================================= */

export type TransactionType =
  | "RECEITA"
  | "DESPESA";

export type TaskStatus =
  | "PENDENTE"
  | "TEORIA_VISTA"
  | "QUESTOES_FEITAS"
  | "DOMINADO";

export type TaskPriority =
  | "BAIXA"
  | "MEDIA"
  | "ALTA";

/* =========================================================
 * USUÁRIO / AUTH
 * ========================================================= */

export interface UserResponse {
  id: number;
  email: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresInMs: number;
  user: UserResponse;
}

/* =========================================================
 * FINANCEIRO
 * ========================================================= */

export interface FinancialTransaction {
  id: number;
  descricao: string;
  valor: number;
  tipo: TransactionType;
  data: string;
}

/* =========================================================
 * TAREFAS
 * ========================================================= */

export interface Task {
  id: number;
  titulo: string;
  descricao?: string | null;
  status: TaskStatus;
  prioridade: TaskPriority;
  dataLimite?: string | null;
  ehTopicoEdital: boolean;
}

/* =========================================================
 * ANOTAÇÕES
 * ========================================================= */

export interface StudyNote {
  id: number;
  titulo: string;
  conteudo?: string | null;
  atualizadoEm: string;
}

/* =========================================================
 * ARQUIVOS
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
 * PLANOS DE ESTUDO
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
 * MATÉRIAS
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
 * ASSUNTOS
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
 * QUESTÕES
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
  dificuldade?: QuestionDifficulty | null;
  gabarito?: string | null;
  explicacao?: string | null;
  banca?: string | null;
  ano?: number | null;
  topicId: number;
  subjectId: number;
  subjectNome: string;
}

export interface QuestionRequest {
  numero?: number | null;
  enunciado: string;
  alternativas: string[];
  dificuldade?: QuestionDifficulty | null;
  gabarito: string;
  explicacao?: string | null;
  banca?: string | null;
  ano?: number | null;
}

/* =========================================================
 * RESPOSTAS
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
  /* =========================
   * AUTH
   * ========================= */

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

  /* =========================
   * FINANCEIRO
   * ========================= */

  listTransactions: (
    userId: number,
  ) =>
    request<FinancialTransaction[]>(
      `/transactions/user/${userId}`,
    ),

  createTransaction: (
    userId: number,
    body: Omit<FinancialTransaction, "id">,
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
    body: Omit<FinancialTransaction, "id">,
  ) =>
    request<FinancialTransaction>(
      `/transactions/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(body),
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

  /* =========================
   * TAREFAS
   * ========================= */

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
    userId: number,
    body: Omit<Task, "id">,
  ) =>
    request<Task>(
      "/tasks",
      {
        method: "POST",
        body: JSON.stringify({
          ...body,
          user: {
            id: userId,
          },
        }),
      },
    ),

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

  /* =========================
   * ANOTAÇÕES
   * ========================= */

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
          atualizadoEm: new Date()
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
          atualizadoEm: new Date()
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

  /* =========================
   * ARQUIVOS
   * ========================= */

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

    form.append("file", file);

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

  /* =========================
   * CHAT
   * ========================= */

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

  /* =========================
   * TREINOS
   * ========================= */

  listWorkouts: (
    userId: number,
  ) =>
    request<Workout[]>(
      `/workouts/user/${userId}`,
    ),

  createWorkout: (
    body: {
      grupoMuscular: string;
      dataTreino: string;
      concluido: boolean;
      exerciciosExecutados?: string;
      exercicios?: WorkoutExercise[];
    },
  ) =>
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

    form.append("file", file);

    return request<Workout>(
      `/workouts/${workoutId}/image`,
      {
        method: "POST",
        body: form,
      },
    );
  },

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

  /* =========================
   * PLANOS
   * ========================= */

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

  /* =========================
   * MATÉRIAS
   * ========================= */

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

  /* =========================
   * ASSUNTOS
   * ========================= */

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

  /* =========================
   * QUESTÕES
   * ========================= */

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

  /* =========================
   * RESPOSTAS
   * ========================= */

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

  /* =========================
   * CADERNO DE ERROS
   * ========================= */

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

  /* =========================
   * REVISÕES
   * ========================= */

  listPendingReviews: () =>
    request<PendingReviewResponse>(
      "/study-stats/pendentes-revisao",
    ),

  /* =========================
   * SIMULADOS
   * ========================= */

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

  /* =========================
   * ESTATÍSTICAS
   * ========================= */

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
      `/study-stats/por-periodo?inicio=${encodeURIComponent(
        inicio,
      )}&fim=${encodeURIComponent(fim)}`,
    ),
};

/* =========================================================
 * HELPERS
 * ========================================================= */

export const brl = (
  value: number,
): string =>
  new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  ).format(value);

export const today = (): string =>
  new Date()
    .toISOString()
    .slice(0, 10);

/* =========================================================
 * LABELS
 * ========================================================= */

export const statusLabel: Record<
  TaskStatus,
  string
> = {
  PENDENTE: "Pendente",
  TEORIA_VISTA: "Teoria vista",
  QUESTOES_FEITAS: "Questões feitas",
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

export const studyPlanStatusLabel: Record<
  StudyPlanStatus,
  string
> = {
  PLANEJADO: "Planejado",
  EM_ANDAMENTO: "Em andamento",
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
  INTERPRETACAO: "Erro de interpretação",
  DISTRACAO: "Distração",
  CHUTE: "Chute",
  ERRO_DE_CALCULO: "Erro de cálculo",
};

export const mockExamStatusLabel: Record<
  MockExamStatus,
  string
> = {
  CRIADO: "Não iniciado",
  EM_ANDAMENTO: "Em andamento",
  FINALIZADO: "Finalizado",
};