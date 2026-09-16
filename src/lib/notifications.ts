export interface NotificationPreferences {
  enabled: boolean;
  dailyStudyReminder: boolean;
  dailyStudyTime: string;
  workoutReminder: boolean;
  workoutTime: string;
  financeReminder: boolean;
  reviewReminder: boolean;
}

const STORAGE_KEY = "nexus_notification_settings";
const SENT_LOG_KEY = "nexus_notification_sent_log";

export const defaultPreferences: NotificationPreferences = {
  enabled: false,
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

  const defaultOptions: NotificationOptions = {
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    ...options,
  };

  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        await reg.showNotification(title, defaultOptions);
        return true;
      }
    }
    new Notification(title, defaultOptions);
    return true;
  } catch (err) {
    console.error("Falha ao emitir notificacao:", err);
    return false;
  }
}

export async function sendTestNotification(): Promise<boolean> {
  return dispatchNativeNotification("Nexus Produtividade 🚀", {
    body: "Notificações ativas! Você receberá seus lembretes diários de estudos, treinos e metas aqui.",
    tag: "nexus-test-notification",
  });
}
