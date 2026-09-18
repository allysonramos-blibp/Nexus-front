import { useState, useEffect } from "react";
import {
  Bell,
  BellRing,
  CheckCircle2,
  X,
  Sparkles,
  Dumbbell,
  BookOpen,
  Wallet,
  CheckSquare,
  Send,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import {
  getNotificationPermission,
  getStoredPreferences,
  savePreferences,
  requestNotificationPermission,
  sendTestNotification,
  sendSpecificReminder,
  checkAndDispatchScheduledReminders,
  NotificationPreferences,
  ReminderType,
} from "@/lib/notifications";

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenterModal({
  isOpen,
  onClose,
}: NotificationCenterModalProps) {
  const { user } = useAuth();
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");
  const [prefs, setPrefs] = useState<NotificationPreferences>(
    getStoredPreferences()
  );
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [dispatchingAll, setDispatchingAll] = useState(false);

  const isMasterAdmin =
    user?.email === "allysonr510@gmail.com" || user?.role === "ROLE_ADMIN";
  const hasEstudos = user?.moduloEstudos !== false || isMasterAdmin;
  const hasTreinos = user?.moduloTreinos !== false || isMasterAdmin;
  const hasFinancas = user?.moduloFinancas !== false || isMasterAdmin;

  useEffect(() => {
    if (isOpen) {
      setPermission(getNotificationPermission());
      setPrefs(getStoredPreferences());
      setFeedbackMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  const handleRequestPermission = async () => {
    setRequesting(true);
    const granted = await requestNotificationPermission();
    setPermission(getNotificationPermission());
    if (granted) {
      const updated = { ...prefs, enabled: true };
      setPrefs(updated);
      savePreferences(updated);
      await sendTestNotification();
      showFeedback("Notificações ativadas! Enviamos um alerta de teste na sua barra de status.");
    }
    setRequesting(false);
  };

  const handleToggle = (key: keyof NotificationPreferences, val: any) => {
    const updated = { ...prefs, [key]: val };
    setPrefs(updated);
    savePreferences(updated);
  };

  const handleSendSingleTest = async (type: ReminderType, label: string) => {
    const ok = await sendSpecificReminder(type);
    if (ok) {
      showFeedback(`Lembrete de ${label} disparado! Veja na barra de notificações.`);
    } else {
      showFeedback("Não foi possível disparar. Verifique se as notificações estão permitidas.");
    }
  };

  const handleDispatchAllNow = async () => {
    setDispatchingAll(true);
    const list = await checkAndDispatchScheduledReminders(true);
    setDispatchingAll(false);
    if (list.length > 0) {
      showFeedback(`🚀 ${list.length} lembretes disparados agora no seu dispositivo!`);
    } else {
      await sendTestNotification();
      showFeedback("Alerta de teste enviado com sucesso!");
    }
  };

  const isGranted = permission === "granted";

  const TIME_OPTIONS = [
    "06:00", "06:30", "07:00", "07:30", "08:00", "08:30",
    "09:00", "10:00", "11:00", "12:00", "13:00", "14:00",
    "15:00", "16:00", "17:00", "17:30", "18:00", "19:00",
    "19:30", "20:00", "21:00", "22:00"
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">

        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-surface-raised/40">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-dash/15 text-dash">
              <BellRing className="size-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-display font-semibold text-foreground">
                Central de Notificações & Lembretes
              </h2>
              <p className="text-xs text-muted-foreground">
                Lembretes automáticos direto no seu celular e navegador
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">

          <div
            className={
              "p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 " +
              (isGranted
                ? "bg-fin/10 border-fin/30"
                : "bg-surface-raised/60 border-border/80")
            }
          >
            <div className="flex items-center gap-3">
              <span
                className={
                  "p-2 rounded-lg " +
                  (isGranted
                    ? "bg-fin/20 text-fin"
                    : "bg-surface-raised text-muted-foreground")
                }
              >
                <Bell className="size-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Status no Dispositivo:{" "}
                  <strong className={isGranted ? "text-fin" : "text-amber-400"}>
                    {isGranted
                      ? "Autorizado e Ativo ✅"
                      : permission === "denied"
                      ? "Bloqueado pelo Navegador 🚫"
                      : "Pendente de Autorização ⚠️"}
                  </strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  {isGranted
                    ? "O Nexus está programado para enviar lembretes nos horários agendados."
                    : permission === "denied"
                    ? "Permita as notificações nas configurações do navegador/site para receber alertas."
                    : "Clique abaixo para autorizar lembretes do PWA no seu dispositivo."}
                </p>
              </div>
            </div>

            <div className="w-full sm:w-auto flex items-center gap-2">
              {!isGranted && permission !== "denied" && (
                <Button
                  onClick={handleRequestPermission}
                  disabled={requesting}
                  className="w-full sm:w-auto text-xs bg-dash text-white hover:bg-dash/90"
                >
                  {requesting ? "Solicitando..." : "Ativar Notificações"}
                </Button>
              )}
              {isGranted && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDispatchAllNow}
                  disabled={dispatchingAll}
                  className="w-full sm:w-auto text-xs gap-1.5 border-dash/40 text-dash hover:bg-dash/10"
                >
                  <Zap className="size-3.5" />
                  {dispatchingAll ? "Disparando..." : "Testar Todos Agora"}
                </Button>
              )}
            </div>
          </div>

          {feedbackMsg && (
            <div className="p-3.5 rounded-xl bg-fin/15 border border-fin/40 text-fin text-xs flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-dash/5 border border-dash/20 flex items-start gap-2.5 text-xs text-muted-foreground">
            <Sparkles className="size-4 text-dash shrink-0 mt-0.5" />
            <p>
              <strong>Como funcionam os lembretes:</strong> O Nexus monitora os horários definidos abaixo. Quando der a hora exata, um alerta nativo com som e vibração aparecerá na barra de notificações do seu celular.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Lembretes Programados
            </h3>

            <div className="p-3.5 rounded-xl border border-border/70 bg-surface-raised/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-dash/10 text-dash shrink-0">
                  <CheckSquare className="size-4" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      Foco Diário & Tarefas Críticas
                    </p>
                    <span className="text-[11px] font-semibold text-muted-foreground px-1.5 py-0.5 rounded bg-surface border border-border">
                      08:30
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Avisa pela manhã as tarefas de alta prioridade do dia.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2.5">
                {isGranted && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSendSingleTest("task", "Tarefas")}
                    className="text-xs text-dash hover:bg-dash/10 px-2 h-7 gap-1"
                    title="Disparar este lembrete agora no celular"
                  >
                    <Send className="size-3" /> Testar
                  </Button>
                )}
                <input
                  type="checkbox"
                  checked={prefs.enabled}
                  onChange={(e) => handleToggle("enabled", e.target.checked)}
                  className="size-4 rounded accent-dash cursor-pointer"
                />
              </div>
            </div>

            {hasEstudos && (
              <div className="p-3.5 rounded-xl border border-border/70 bg-surface-raised/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-lg bg-study/10 text-study shrink-0">
                    <BookOpen className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Lembrete de Estudos & Edital
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Notifica para manter a meta de questões e repetição espaçada.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2">
                  <select
                    value={prefs.dailyStudyTime}
                    onChange={(e) => handleToggle("dailyStudyTime", e.target.value)}
                    className="text-xs bg-surface border border-border rounded-lg px-2 py-1 text-foreground"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>

                  {isGranted && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSendSingleTest("study", "Estudos")}
                      className="text-xs text-study hover:bg-study/10 px-2 h-7 gap-1"
                      title="Disparar este lembrete agora no celular"
                    >
                      <Send className="size-3" /> Testar
                    </Button>
                  )}

                  <input
                    type="checkbox"
                    checked={prefs.dailyStudyReminder}
                    onChange={(e) =>
                      handleToggle("dailyStudyReminder", e.target.checked)
                    }
                    className="size-4 rounded accent-study cursor-pointer"
                  />
                </div>
              </div>
            )}

            {hasTreinos && (
              <div className="p-3.5 rounded-xl border border-border/70 bg-surface-raised/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-lg bg-workout/10 text-workout shrink-0">
                    <Dumbbell className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Consistência de Treinos
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Lembra caso ainda não tenha registrado seu treino do dia.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2">
                  <select
                    value={prefs.workoutTime}
                    onChange={(e) => handleToggle("workoutTime", e.target.value)}
                    className="text-xs bg-surface border border-border rounded-lg px-2 py-1 text-foreground"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>

                  {isGranted && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSendSingleTest("workout", "Treinos")}
                      className="text-xs text-workout hover:bg-workout/10 px-2 h-7 gap-1"
                      title="Disparar este lembrete agora no celular"
                    >
                      <Send className="size-3" /> Testar
                    </Button>
                  )}

                  <input
                    type="checkbox"
                    checked={prefs.workoutReminder}
                    onChange={(e) =>
                      handleToggle("workoutReminder", e.target.checked)
                    }
                    className="size-4 rounded accent-workout cursor-pointer"
                  />
                </div>
              </div>
            )}

            {hasFinancas && (
              <div className="p-3.5 rounded-xl border border-border/70 bg-surface-raised/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-lg bg-fin/10 text-fin shrink-0">
                    <Wallet className="size-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        Fechamento Financeiro & Contas
                      </p>
                      <span className="text-[11px] font-semibold text-muted-foreground px-1.5 py-0.5 rounded bg-surface border border-border">
                        18:00
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Avisa sobre contas nos dias próximos ao vencimento e fechamento diário.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2.5">
                  {isGranted && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSendSingleTest("finance", "Finanças")}
                      className="text-xs text-fin hover:bg-fin/10 px-2 h-7 gap-1"
                      title="Disparar este lembrete agora no celular"
                    >
                      <Send className="size-3" /> Testar
                    </Button>
                  )}
                  <input
                    type="checkbox"
                    checked={prefs.financeReminder}
                    onChange={(e) =>
                      handleToggle("financeReminder", e.target.checked)
                    }
                    className="size-4 rounded accent-fin cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-3.5 border-t border-border/80 bg-surface-raised/30">
          <p className="text-[11px] text-muted-foreground hidden sm:block">
            Os lembretes tocam com som e vibração no horário escolhido.
          </p>
          <Button onClick={onClose} size="sm" className="text-xs ml-auto">
            Concluir
          </Button>
        </div>
      </div>
    </div>
  );
}
