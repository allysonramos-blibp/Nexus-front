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
  Smartphone,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import {
  getNotificationPermission,
  getStoredPreferences,
  savePreferences,
  requestNotificationPermission,
  sendTestNotification,
  NotificationPreferences,
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
  const [testSent, setTestSent] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const isMasterAdmin =
    user?.email === "allysonr510@gmail.com" || user?.role === "ROLE_ADMIN";
  const hasEstudos = user?.moduloEstudos !== false || isMasterAdmin;
  const hasTreinos = user?.moduloTreinos !== false || isMasterAdmin;
  const hasFinancas = user?.moduloFinancas !== false || isMasterAdmin;

  useEffect(() => {
    if (isOpen) {
      setPermission(getNotificationPermission());
      setPrefs(getStoredPreferences());
      setTestSent(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    setRequesting(true);
    const granted = await requestNotificationPermission();
    setPermission(getNotificationPermission());
    if (granted) {
      const updated = { ...prefs, enabled: true };
      setPrefs(updated);
      savePreferences(updated);
      await sendTestNotification();
      setTestSent(true);
    }
    setRequesting(false);
  };

  const handleToggle = (key: keyof NotificationPreferences, val: any) => {
    const updated = { ...prefs, [key]: val };
    setPrefs(updated);
    savePreferences(updated);
  };

  const handleSendTest = async () => {
    setTestSent(false);
    const ok = await sendTestNotification();
    if (ok) {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 4000);
    }
  };

  const isGranted = permission === "granted";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
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
                Alertas inteligentes direto no seu celular e navegador
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

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          
          {/* Permission Status Box */}
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
                  (isGranted ? "bg-fin/20 text-fin" : "bg-muted text-muted-foreground")
                }
              >
                {isGranted ? (
                  <CheckCircle2 className="size-5" />
                ) : (
                  <Smartphone className="size-5" />
                )}
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {isGranted
                    ? "Notificações Ativas no Dispositivo"
                    : permission === "denied"
                    ? "Notificações Bloqueadas no Navegador"
                    : "Notificações ainda não ativadas"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isGranted
                    ? "O Nexus enviará alertas na barra de notificações do seu aparelho."
                    : permission === "denied"
                    ? "Permita as notificações nas configurações do navegador/site para receber alertas."
                    : "Clique abaixo para autorizar lembretes do PWA no seu dispositivo."}
                </p>
              </div>
            </div>

            <div className="w-full sm:w-auto">
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
                  onClick={handleSendTest}
                  className="w-full sm:w-auto text-xs"
                >
                  Testar Alerta
                </Button>
              )}
            </div>
          </div>

          {testSent && (
            <div className="p-3 rounded-xl bg-fin/10 border border-fin/30 text-fin text-xs flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="size-4 shrink-0" />
              Notificação de teste disparada! Verifique a barra de notificações do seu aparelho.
            </div>
          )}

          {/* Configurações de Lembretes */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Lembretes Personalizados
            </h3>

            {/* Lembrete de Tarefas */}
            <div className="p-3.5 rounded-xl border border-border/70 bg-surface-raised/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-dash/10 text-dash">
                  <CheckSquare className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Foco Diário & Tarefas Críticas
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Avisa pela manhã se houver tarefas de alta prioridade para o dia.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.enabled}
                onChange={(e) => handleToggle("enabled", e.target.checked)}
                className="size-4 rounded accent-dash cursor-pointer"
              />
            </div>

            {/* Lembrete de Estudos (se tiver módulo) */}
            {hasEstudos && (
              <div className="p-3.5 rounded-xl border border-border/70 bg-surface-raised/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-lg bg-study/10 text-study">
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
                <div className="flex items-center gap-2">
                  <select
                    value={prefs.dailyStudyTime}
                    onChange={(e) => handleToggle("dailyStudyTime", e.target.value)}
                    className="text-xs bg-surface border border-border rounded-lg px-2 py-1 text-foreground"
                  >
                    <option value="09:00">09:00</option>
                    <option value="14:00">14:00</option>
                    <option value="19:00">19:00</option>
                    <option value="21:00">21:00</option>
                  </select>
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

            {/* Lembrete de Treino (se tiver módulo) */}
            {hasTreinos && (
              <div className="p-3.5 rounded-xl border border-border/70 bg-surface-raised/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-lg bg-workout/10 text-workout">
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
                <div className="flex items-center gap-2">
                  <select
                    value={prefs.workoutTime}
                    onChange={(e) => handleToggle("workoutTime", e.target.value)}
                    className="text-xs bg-surface border border-border rounded-lg px-2 py-1 text-foreground"
                  >
                    <option value="06:30">06:30</option>
                    <option value="12:00">12:00</option>
                    <option value="17:30">17:30</option>
                    <option value="19:30">19:30</option>
                  </select>
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

            {/* Lembrete de Finanças (se tiver módulo) */}
            {hasFinancas && (
              <div className="p-3.5 rounded-xl border border-border/70 bg-surface-raised/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-lg bg-fin/10 text-fin">
                    <Wallet className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Fechamento Financeiro & Contas
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Avisa sobre contas nos dias próximos ao vencimento.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.financeReminder}
                  onChange={(e) =>
                    handleToggle("financeReminder", e.target.checked)
                  }
                  className="size-4 rounded accent-fin cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Dica PWA */}
          <div className="p-3.5 rounded-xl bg-surface-raised/20 border border-border/60 text-xs text-muted-foreground flex items-center gap-2.5">
            <Sparkles className="size-4 text-dash shrink-0" />
            <span>
              <strong>Dica Pro:</strong> No Android e iOS, instale o Nexus na tela de início para receber alertas mesmo quando o app estiver fechado.
            </span>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-border/80 bg-surface-raised/30">
          <Button onClick={onClose} size="sm" className="text-xs">
            Concluir
          </Button>
        </div>

      </div>
    </div>
  );
}
