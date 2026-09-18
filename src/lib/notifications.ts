import { useEffect } from "react";

export interface NotificationPreferences {
  enabled: boolean;
  dailyStudyReminder: boolean;
  dailyStudyTime: string;
  workoutReminder: boolean;
  workoutTime: string;
  financeReminder: boolean;
  reviewReminder: boolean;
}

export type ReminderType = "study" | "workout" | "task" | "finance";

const STORAGE_KEY = "nexus_notification_settings";
const SENT_LOG_KEY = "nexus_notification_sent_log";

export const defaultPreferences: NotificationPreferences = {
  enabled: true,
  dailyStudyReminder: true,
  dailyStudyTime: "14:00",
  workoutReminder: true,
  workoutTime: "17:30",
  financeReminder: true,
  reviewReminder: true,
};

export function getStoredPreferences(): NotificationPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPreferences;
    return { ...defaultPreferences, ...JSON.parse(raw) };
  } catch {
    return defaultPreferences;
  }
}

export function savePreferences(prefs: NotificationPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.error("Erro ao salvar preferencias de notificacao:", err);
  }
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const current = getStoredPreferences();
      savePreferences({ ...current, enabled: true });
      return true;
    }
    return false;
  } catch (err) {
    console.error("Erro ao solicitar permissao:", err);
    return false;
  }
}

export async function dispatchNativeNotification(
  title: string,
  options?: NotificationOptions
): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  if (Notification.permission !== "granted") {
    return false;
  }

  const defaultOptions: NotificationOptions & { vibrate?: number[] } = {
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    vibrate: [200, 100, 200],
    ...options,
  };

  try {

    if ("serviceWorker" in navigator) {
      try {
        const reg = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 800)),
        ]);
        if (reg && reg.showNotification) {
          await reg.showNotification(title, defaultOptions);
          return true;
        }
      } catch (swErr) {
        console.warn("Falha no SW showNotification, usando fallback:", swErr);
      }
    }

    new Notification(title, defaultOptions);
    return true;
  } catch (err) {
    console.error("Falha ao emitir notificacao:", err);
    return false;
  }
}

export const REMINDER_DETAILS: Record<
  ReminderType,
  { title: string; body: string; tag: string }
> = {
  study: {
    title: "📚 Hora dos Estudos — Nexus",
    body: "Mantenha a consistência no seu edital! Revise seus flashcards e complete a meta de questões do dia.",
    tag: "nexus-study-reminder",
  },
  workout: {
    title: "💪 Hora do Treino — Nexus",
    body: "Não quebre a sequência de treinos! Registre os exercícios e cargas do seu treino de hoje.",
    tag: "nexus-workout-reminder",
  },
  task: {
    title: "🎯 Foco do Dia & Tarefas — Nexus",
    body: "Você possui tarefas prioritárias aguardando seu foco hoje. Abra o painel e planeje o dia!",
    tag: "nexus-task-reminder",
  },
  finance: {
    title: "💳 Fechamento Financeiro — Nexus",
    body: "Lembrete para lançar seus gastos diários e verificar contas com vencimento próximo.",
    tag: "nexus-finance-reminder",
  },
};

export async function sendSpecificReminder(type: ReminderType): Promise<boolean> {
  const reminder = REMINDER_DETAILS[type];
  if (!reminder) return false;

  return dispatchNativeNotification(reminder.title, {
    body: reminder.body,
    tag: reminder.tag,
  });
}

export async function sendTestNotification(): Promise<boolean> {
  return dispatchNativeNotification("Nexus Produtividade 🚀", {
    body: "Notificações ativas! Você receberá seus lembretes diários de estudos, treinos e metas aqui.",
    tag: "nexus-test-notification",
  });
}

function getSentLog(): Record<string, number> {
  try {
    const raw = localStorage.getItem(SENT_LOG_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function markAsSent(key: string): void {
  try {
    const log = getSentLog();
    log[key] = Date.now();

    const cutoff = Date.now() - 5 * 24 * 60 * 60 * 1000;
    const cleaned: Record<string, number> = {};
    for (const [k, timestamp] of Object.entries(log)) {
      if (timestamp > cutoff) {
        cleaned[k] = timestamp;
      }
    }
    localStorage.setItem(SENT_LOG_KEY, JSON.stringify(cleaned));
  } catch (err) {
    console.error("Erro ao registrar envio:", err);
  }
}

export async function checkAndDispatchScheduledReminders(
  force: boolean = false
): Promise<ReminderType[]> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return [];
  }
  if (Notification.permission !== "granted") {
    return [];
  }

  const prefs = getStoredPreferences();
  if (!prefs.enabled && !force) {
    return [];
  }

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const currentHourMinute = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const sentLog = getSentLog();
  const dispatched: ReminderType[] = [];

  // 1. Estudos
  if (prefs.dailyStudyReminder || force) {
    const key = `${todayStr}_study`;
    if (force || (!sentLog[key] && currentHourMinute >= prefs.dailyStudyTime)) {
      const ok = await sendSpecificReminder("study");
      if (ok) {
        markAsSent(key);
        dispatched.push("study");
      }
    }
  }

  // 2. Treinos
  if (prefs.workoutReminder || force) {
    const key = `${todayStr}_workout`;
    if (force || (!sentLog[key] && currentHourMinute >= prefs.workoutTime)) {
      const ok = await sendSpecificReminder("workout");
      if (ok) {
        markAsSent(key);
        dispatched.push("workout");
      }
    }
  }

  // 3. Tarefas / Foco Matinal
  if (prefs.enabled || force) {
    const key = `${todayStr}_task`;
    if (force || (!sentLog[key] && currentHourMinute >= "08:30")) {
      const ok = await sendSpecificReminder("task");
      if (ok) {
        markAsSent(key);
        dispatched.push("task");
      }
    }
  }

  // 4. Finanças
  if (prefs.financeReminder || force) {
    const key = `${todayStr}_finance`;
    if (force || (!sentLog[key] && currentHourMinute >= "18:00")) {
      const ok = await sendSpecificReminder("finance");
      if (ok) {
        markAsSent(key);
        dispatched.push("finance");
      }
    }
  }

  return dispatched;
}

/**
 * Hook do React que roda em segundo plano para monitorar o horário dos lembretes.
 */
export function useNotificationScheduler() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Dispara a checagem ao carregar
    checkAndDispatchScheduledReminders().catch(() => {});

    // Checa a cada 30 segundos
    const interval = setInterval(() => {
      checkAndDispatchScheduledReminders().catch(() => {});
    }, 30000);

    // Checa sempre que o usuário voltar à aba/app
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkAndDispatchScheduledReminders().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);
}
