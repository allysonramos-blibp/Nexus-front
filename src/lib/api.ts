/**
 * Cliente HTTP do Nexus — fala com a API Spring Boot.
 * Todas as chamadas rodam no browser (a API vive em localhost do usuário).
 */

const STORAGE_KEY = "nexus.apiUrl";
const TOKEN_STORAGE_KEY = "nexus.token";

/** Evento disparado quando a API responde 401 — o AuthProvider escuta isso para deslogar. */
export const UNAUTHORIZED_EVENT = "nexus:unauthorized";

export const DEFAULT_API_URL =
  (import.meta.env["VITE_API_URL"] as string | undefined) ?? "https://nexus-api-bgsf.onrender.com";

/** URL base atual — pode ser trocada em tempo de execução (ex.: túnel https do ngrok). */
export function getApiBaseUrl(): string {
  if (typeof window === "undefined") return DEFAULT_API_URL;
  return window.localStorage.getItem(STORAGE_KEY) || DEFAULT_API_URL;
}

export function setApiBaseUrl(url: string) {
  let clean = url.trim().replace(/\/+$/, "");
  if (clean && !clean.endsWith("/api")) {
    clean += "/api";
  }
  if (clean) window.localStorage.setItem(STORAGE_KEY, clean);
  else window.localStorage.removeItem(STORAGE_KEY);
}

/** Token JWT atual (Bearer). `auth.tsx` é o dono da sessão; isto é só o storage cru. */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAuthToken(token: string) {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearAuthToken() {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

/**
 * `imagemUrl` do treino já vem como "/api/workouts/image/xyz.jpg" (path completo,
 * incluindo o /api). getApiBaseUrl() também termina em /api, então aqui tiramos esse
 * sufixo antes de concatenar, senão duplicaria "/api/api/...".
 */
export function buildAssetUrl(path: string): string {
  const root = getApiBaseUrl().replace(/\/api\/?$/, "");
  return `${root}${path}`;
}

/** true quando a página é https e a API é http — o browser bloqueia (mixed content). */
export function isMixedContent(url = getApiBaseUrl()): boolean {
  if (typeof window === "undefined") return false;
  return window.location.protocol === "https:" && url.startsWith("http://");
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export async function pingApi(url = getApiBaseUrl()): Promise<string> {
  if (isMixedContent(url)) {
    throw new ApiError(
      0,
      "Esta página roda em HTTPS e a API está em HTTP — o navegador bloqueia a chamada (mixed content). Exponha a API por HTTPS (ex.: ngrok) ou rode o front localmente.",
    );
  }
  const res = await fetch(`${url}/auth`, { method: "GET" }).catch(() => {
    throw new ApiError(
      0,
      `Não respondeu em ${url}. Verifique se a API está rodando e se o CORS libera este domínio (${typeof window !== "undefined" ? window.location.origin : ""}).`,
    );
  });
  return `API respondeu (HTTP ${res.status}).`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  const base = getApiBaseUrl();
  const headers: Record<string, string> =
    init?.body instanceof FormData ? {} : { "Content-Type": "application/json" };
  const token = getAuthToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (isMixedContent(base)) {
    throw new ApiError(
      0,
      "Página em HTTPS chamando API em HTTP: o navegador bloqueia. Configure uma URL https da API (ngrok) na tela de login.",
    );
  }
  try {
    res = await fetch(`${base}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(
      0,
      `Não consegui falar com a API em ${base}. Ela está rodando e com CORS liberado para ${typeof window !== "undefined" ? window.location.origin : "este domínio"}?`,
    );
  }

  if (res.status === 401 && typeof window !== "undefined") {
    // Token ausente/expirado/inválido — o AuthProvider escuta isto para encerrar a sessão.
    window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(res.status, text || `Erro ${res.status} em ${path}`);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/* ---------- Tipos ---------- */

export type TransactionType = "RECEITA" | "DESPESA";
export type TaskStatus = "PENDENTE" | "TEORIA_VISTA" | "QUESTOES_FEITAS" | "DOMINADO";
export type TaskPriority = "BAIXA" | "MEDIA" | "ALTA";

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

export interface FinancialTransaction {
  id: number;
  descricao: string;
  valor: number;
  tipo: TransactionType;
  data: string; // yyyy-MM-dd
}

export interface Task {
  id: number;
  titulo: string;
  descricao?: string | null;
  status: TaskStatus;
  prioridade: TaskPriority;
  dataLimite?: string | null;
  ehTopicoEdital: boolean;
}

export interface StudyNote {
  id: number;
  titulo: string;
  conteudo?: string | null;
  atualizadoEm: string;
}

export interface StudyFile {
  id: number;
  nomeOriginal: string;
  nomeArmazenado: string;
  tipoConteudo: string;
  dataUpload: string;
}

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

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/* ---------- Estudos (Planos / Matérias / Assuntos) ---------- */

export type StudyPlanStatus = "PLANEJADO" | "EM_ANDAMENTO" | "CONCLUIDO" | "PAUSADO";

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

/* ---------- Estudos: Questões e Respostas ---------- */

export type QuestionDifficulty = "FACIL" | "MEDIA" | "DIFICIL";

export interface Question {
  id: number;
  numero?: number | null;
  enunciado: string;
  alternativas: string[];
  dificuldade?: QuestionDifficulty | null;
  /** Só vem preenchido fora de um simulado em andamento. */
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

/* ---------- Estudos: Caderno de Erros ---------- */

export type ErrorReason = "NAO_SABIA" | "INTERPRETACAO" | "DISTRACAO" | "CHUTE" | "ERRO_DE_CALCULO";

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

/* ---------- Estudos: Simulados ---------- */

export type MockExamStatus = "CRIADO" | "EM_ANDAMENTO" | "FINALIZADO";

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

/* ---------- Estudos: Estatísticas ---------- */

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

/* ---------- Auth ---------- */

export const api = {
  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  // O backend não emite token no cadastro — só cria o usuário. O login deve ser chamado
  // logo em seguida para obter o AuthResponse (ver `submit` em pages/login.tsx).
  register: (email: string, password: string) =>
    request<UserResponse>("/users/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  /* Financeiro */
  listTransactions: (userId: number) =>
    request<FinancialTransaction[]>(`/transactions/user/${userId}`),
  createTransaction: (
    userId: number,
    body: Omit<FinancialTransaction, "id">,
  ) =>
    request<FinancialTransaction>(`/transactions/user/${userId}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateTransaction: (id: number, body: Omit<FinancialTransaction, "id">) =>
    request<FinancialTransaction>(`/transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deleteTransaction: (id: number) =>
    request<void>(`/transactions/${id}`, { method: "DELETE" }),

  /* Tarefas */
  listTasks: (userId: number) => request<Task[]>(`/tasks/user/${userId}`),
  listEdital: (userId: number) => request<Task[]>(`/tasks/user/${userId}/edital`),
  createTask: (
    userId: number,
    body: Omit<Task, "id">,
  ) =>
    request<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify({ ...body, user: { id: userId } }),
    }),
  updateTaskStatus: (id: number, status: TaskStatus) =>
    request<Task>(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  /* Estudo */
  listNotes: (userId: number) => request<StudyNote[]>(`/study-notes/user/${userId}`),
  createNote: (userId: number, titulo: string, conteudo: string) =>
    request<StudyNote>("/study-notes", {
      method: "POST",
      body: JSON.stringify({
        titulo,
        conteudo,
        atualizadoEm: new Date().toISOString().slice(0, 19),
        user: { id: userId },
      }),
    }),
  updateNote: (id: number, userId: number, titulo: string, conteudo: string) =>
    request<StudyNote>(`/study-notes/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        titulo,
        conteudo,
        atualizadoEm: new Date().toISOString().slice(0, 19),
        user: { id: userId },
      }),
    }),
  deleteNote: (id: number) => request<void>(`/study-notes/${id}`, { method: "DELETE" }),

  listFiles: (userId: number) => request<StudyFile[]>(`/study-files/user/${userId}`),
  uploadFile: (userId: number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<StudyFile>(`/study-files/upload/user/${userId}`, {
      method: "POST",
      body: form,
    });
  },
  deleteFile: (id: number) => request<void>(`/study-files/${id}`, { method: "DELETE" }),
  fileDownloadUrl: (id: number) => `${getApiBaseUrl()}/study-files/download/${id}`,

  chat: (message: string, history: ChatMessage[]) =>
    request<{ reply: string }>("/study-chat", {
      method: "POST",
      body: JSON.stringify({ message, history }),
    }),

  /* Treinos */
  listWorkouts: (userId: number) => request<Workout[]>(`/workouts/user/${userId}`),
  createWorkout: (body: {
    grupoMuscular: string;
    dataTreino: string;
    concluido: boolean;
    exerciciosExecutados?: string;
    exercicios?: WorkoutExercise[];
  }) =>
    request<Workout>("/workouts", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  uploadWorkoutImage: (workoutId: number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<Workout>(`/workouts/${workoutId}/image`, { method: "POST", body: form });
  },
  getGoal: (userId: number) => request<WorkoutGoal>(`/workout-goals/user/${userId}`),
  setGoal: (userId: number, metaTreinosPorSemana: number) =>
    request<WorkoutGoal>(`/workout-goals/user/${userId}`, {
      method: "PUT",
      body: JSON.stringify({ metaTreinosPorSemana }),
    }),

  /* Estudos: Planos — dono resolvido pelo token, sem userId na URL */
  listStudyPlans: () => request<StudyPlan[]>("/study-plans"),
  getStudyPlan: (id: number) => request<StudyPlan>(`/study-plans/${id}`),
  createStudyPlan: (body: StudyPlanRequest) =>
    request<StudyPlan>("/study-plans", { method: "POST", body: JSON.stringify(body) }),
  updateStudyPlan: (id: number, body: StudyPlanRequest) =>
    request<StudyPlan>(`/study-plans/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteStudyPlan: (id: number) => request<void>(`/study-plans/${id}`, { method: "DELETE" }),

  /* Estudos: Matérias */
  listSubjects: (studyPlanId: number) =>
    request<Subject[]>(`/study-plans/${studyPlanId}/subjects`),
  createSubject: (studyPlanId: number, body: SubjectRequest) =>
    request<Subject>(`/study-plans/${studyPlanId}/subjects`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateSubject: (id: number, body: SubjectRequest) =>
    request<Subject>(`/subjects/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteSubject: (id: number) => request<void>(`/subjects/${id}`, { method: "DELETE" }),

  /* Estudos: Assuntos */
  listTopics: (subjectId: number) => request<Topic[]>(`/subjects/${subjectId}/topics`),
  createTopic: (subjectId: number, body: TopicRequest) =>
    request<Topic>(`/subjects/${subjectId}/topics`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateTopic: (id: number, body: TopicRequest) =>
    request<Topic>(`/topics/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteTopic: (id: number) => request<void>(`/topics/${id}`, { method: "DELETE" }),

  /* Estudos: Questões */
  listQuestions: (topicId: number) => request<Question[]>(`/topics/${topicId}/questions`),
  getQuestion: (id: number) => request<Question>(`/questions/${id}`),
  createQuestion: (topicId: number, body: QuestionRequest) =>
    request<Question>(`/topics/${topicId}/questions`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateQuestion: (id: number, body: QuestionRequest) =>
    request<Question>(`/questions/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteQuestion: (id: number) => request<void>(`/questions/${id}`, { method: "DELETE" }),

  /* Estudos: Respostas */
  submitAnswer: (body: AnswerRequest) =>
    request<Answer>("/answers", { method: "POST", body: JSON.stringify(body) }),
  listAnswers: () => request<Answer[]>("/answers"),

  /* Estudos: Caderno de Erros — sem filtros por querystring no backend; filtrar no client */
  listStudyErrors: () => request<StudyError[]>("/study-errors"),
  registerStudyError: (body: StudyErrorRequest) =>
    request<StudyError>("/study-errors", { method: "POST", body: JSON.stringify(body) }),
  resolveStudyError: (id: number) =>
    request<StudyError>(`/study-errors/${id}/resolver`, { method: "PATCH" }),
  deleteStudyError: (id: number) => request<void>(`/study-errors/${id}`, { method: "DELETE" }),

  /* Estudos: Revisões — usa /study-stats/pendentes-revisao (mesma fonte de dados do
     caderno de erros, mas já vem com o total pronto) */
  listPendingReviews: () => request<PendingReviewResponse>("/study-stats/pendentes-revisao"),

  /* Estudos: Simulados */
  listMockExams: () => request<MockExam[]>("/mock-exams"),
  getMockExam: (id: number) => request<MockExamDetail>(`/mock-exams/${id}`),
  createMockExam: (body: MockExamRequest) =>
    request<MockExam>("/mock-exams", { method: "POST", body: JSON.stringify(body) }),
  startMockExam: (id: number) => request<MockExam>(`/mock-exams/${id}/iniciar`, { method: "POST" }),
  finishMockExam: (id: number) => request<MockExam>(`/mock-exams/${id}/finalizar`, { method: "POST" }),
  deleteMockExam: (id: number) => request<void>(`/mock-exams/${id}`, { method: "DELETE" }),

  /* Estudos: Estatísticas — percentual vem calculado do lado do client (o record de
     por-matéria/por-assunto do backend expõe um método percentual() que não é
     serializado pelo Jackson, só respondidas/acertos) */
  statsGeral: () => request<OverallStats>("/study-stats/geral"),
  statsPorMateria: () => request<SubjectPerformance[]>("/study-stats/por-materia"),
  statsPorAssunto: () => request<TopicPerformance[]>("/study-stats/por-assunto"),
  statsPorPeriodo: (inicio: string, fim: string) =>
    request<OverallStats>(`/study-stats/por-periodo?inicio=${inicio}&fim=${fim}`),
};

/* ---------- Helpers ---------- */

export const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export const today = () => new Date().toISOString().slice(0, 10);

export const statusLabel: Record<TaskStatus, string> = {
  PENDENTE: "Pendente",
  TEORIA_VISTA: "Teoria vista",
  QUESTOES_FEITAS: "Questões feitas",
  DOMINADO: "Dominado",
};

export const priorityLabel: Record<TaskPriority, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
};

export const studyPlanStatusLabel: Record<StudyPlanStatus, string> = {
  PLANEJADO: "Planejado",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
  PAUSADO: "Pausado",
};

export const difficultyLabel: Record<QuestionDifficulty, string> = {
  FACIL: "Fácil",
  MEDIA: "Média",
  DIFICIL: "Difícil",
};

export const errorReasonLabel: Record<ErrorReason, string> = {
  NAO_SABIA: "Não sabia",
  INTERPRETACAO: "Erro de interpretação",
  DISTRACAO: "Distração",
  CHUTE: "Chute",
  ERRO_DE_CALCULO: "Erro de cálculo",
};

export const mockExamStatusLabel: Record<MockExamStatus, string> = {
  CRIADO: "Não iniciado",
  EM_ANDAMENTO: "Em andamento",
  FINALIZADO: "Finalizado",
};