import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useRef, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Dumbbell,
  ImagePlus,
  Minus,
  Plus,
  Target,
  Flame,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Calculator,
  Search,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Award,
  Clock,
  Calendar,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { api, buildAssetUrl, today, type Workout, type WorkoutExercise } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/contexts/ToastContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { AuthenticatedImage } from "@/components/ui/AuthenticatedImage";
import { Dialog } from "@/components/ui/Dialog";

function startOfWeek(): string {
  const d = new Date();
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

function getWeekDays(): { dateStr: string; label: string; dayNum: number }[] {
  const d = new Date();
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  const labels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const days = [];
  for (let i = 0; i < 7; i++) {
    const current = new Date(d);
    current.setDate(d.getDate() + i);
    days.push({
      dateStr: current.toISOString().slice(0, 10),
      label: labels[i],
      dayNum: current.getDate(),
    });
  }
  return days;
}

function playTimerChime() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      gain.gain.setValueAtTime(0.25, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.8);
    });
  } catch {

  }
}

interface WorkoutPreset {
  nome: string;
  badge: string;
  grupo: string;
  exercicios: WorkoutExercise[];
}

const PRESETS: WorkoutPreset[] = [
  {
    nome: "Push (Peito, Ombros & Tríceps)",
    badge: "Empurrar",
    grupo: "Peito, Ombros e Tríceps",
    exercicios: [
      { nome: "Supino Reto com Barra", series: 4, repeticoes: 10, carga: 30 },
      { nome: "Supino Inclinado com Halteres", series: 3, repeticoes: 12, carga: 20 },
      { nome: "Desenvolvimento Militar", series: 3, repeticoes: 10, carga: 16 },
      { nome: "Elevação Lateral", series: 4, repeticoes: 12, carga: 10 },
      { nome: "Tríceps Pulley na Corda", series: 3, repeticoes: 12, carga: 25 },
    ],
  },
  {
    nome: "Pull (Costas, Trapézio & Bíceps)",
    badge: "Puxar",
    grupo: "Costas, Trapézio e Bíceps",
    exercicios: [
      { nome: "Puxada Alta Frontal", series: 4, repeticoes: 10, carga: 45 },
      { nome: "Remada Curvada com Barra", series: 4, repeticoes: 10, carga: 35 },
      { nome: "Remada Baixa no Triângulo", series: 3, repeticoes: 12, carga: 40 },
      { nome: "Rosca Direta com Barra W", series: 3, repeticoes: 10, carga: 15 },
      { nome: "Rosca Martelo com Halteres", series: 3, repeticoes: 12, carga: 12 },
    ],
  },
  {
    nome: "Legs (Inferiores Completo)",
    badge: "Pernas",
    grupo: "Pernas Completo",
    exercicios: [
      { nome: "Agachamento Livre", series: 4, repeticoes: 10, carga: 50 },
      { nome: "Leg Press 45°", series: 4, repeticoes: 12, carga: 120 },
      { nome: "Cadeira Extensora", series: 3, repeticoes: 15, carga: 40 },
      { nome: "Mesa Flexora", series: 4, repeticoes: 12, carga: 35 },
      { nome: "Panturrilha no Smith / em Pé", series: 4, repeticoes: 15, carga: 45 },
    ],
  },
  {
    nome: "Full Body (Corpo Todo)",
    badge: "Geral",
    grupo: "Full Body",
    exercicios: [
      { nome: "Agachamento Livre", series: 3, repeticoes: 10, carga: 40 },
      { nome: "Supino Reto", series: 3, repeticoes: 10, carga: 30 },
      { nome: "Puxada Frontal", series: 3, repeticoes: 10, carga: 40 },
      { nome: "Desenvolvimento com Halteres", series: 3, repeticoes: 10, carga: 14 },
      { nome: "Prancha Abdominal (segundos)", series: 3, repeticoes: 45, carga: 0 },
    ],
  },
  {
    nome: "Cardio & Resistência (TAF)",
    badge: "Fôlego",
    grupo: "Cardio e Foco TAF",
    exercicios: [
      { nome: "Corrida Contínua (min)", series: 1, repeticoes: 30, carga: 0 },
      { nome: "Tiros na Esteira / Pista (100m)", series: 5, repeticoes: 1, carga: 0 },
      { nome: "Abdominais Remador", series: 3, repeticoes: 25, carga: 0 },
      { nome: "Barra Fixa / Isometria", series: 3, repeticoes: 6, carga: 0 },
    ],
  },
];

const emptyExercise: WorkoutExercise = { nome: "", series: 4, repeticoes: 10, carga: null };

function RestTimerWidget() {
  const [totalSeconds, setTotalSeconds] = useState(60);
  const [remaining, setRemaining] = useState(60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (running && remaining > 0) {
      interval = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            playTimerChime();
            setRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [running, remaining]);

  function startWith(sec: number) {
    setTotalSeconds(sec);
    setRemaining(sec);
    setRunning(true);
  }

  function toggle() {
    if (remaining === 0) {
      setRemaining(totalSeconds);
      setRunning(true);
    } else {
      setRunning(!running);
    }
  }

  function reset() {
    setRunning(false);
    setRemaining(totalSeconds);
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progressPct = totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0;

  return (
    <div className="rounded-xl border border-gym/30 bg-gym/5 p-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gym">
          <Timer className="size-4 text-gym" /> Descanso entre Séries
        </h3>
        <span
          className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
            running ? "bg-gym/20 text-gym animate-pulse" : "bg-surface text-muted-foreground"
          }`}
        >
          {running ? "Descansando..." : remaining === 0 ? "Hora da próxima série!" : "Pronto"}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-4">
        <div className="font-display text-3xl font-bold tracking-tight text-foreground">
          {formatTime(remaining)}
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={toggle}
            className="h-9 px-3 text-xs flex items-center gap-1"
          >
            {running ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            {running ? "Pausar" : remaining === 0 ? "Repetir" : "Iniciar"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={reset}
            className="h-9 px-2 text-xs"
            title="Reiniciar"
          >
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-raised">
        <div
          className="h-full bg-gym transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {[30, 45, 60, 90, 120].map((sec) => (
          <button
            key={sec}
            type="button"
            onClick={() => startWith(sec)}
            className={`rounded-md px-2 py-1 text-[11px] font-medium transition-all ${
              totalSeconds === sec && (running || remaining > 0)
                ? "bg-gym text-white font-semibold shadow-xs"
                : "bg-surface-raised text-muted-foreground hover:text-foreground border border-border/70"
            }`}
          >
            {sec >= 60 ? `${sec / 60} min` : `${sec}s`}
          </button>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
 * CALCULADORA DE 1RM (UMA REPETIÇÃO MÁXIMA / EPLEY)
 * ========================================================= */

function OneRepMaxDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [weight, setWeight] = useState("80");
  const [reps, setReps] = useState("8");

  const w = parseFloat(weight) || 0;
  const r = parseInt(reps) || 0;

  // Fórmula de Epley: 1RM = Carga * (1 + Reps / 30)
  const oneRm = r > 0 && w > 0 ? Math.round(w * (1 + r / 30)) : 0;

  return (
    <Dialog open={open} onClose={onClose} title="Calculadora de 1RM (Força Máxima)">
      <div className="flex flex-col gap-4 text-xs">
        <p className="text-muted-foreground leading-relaxed">
          Estime sua carga máxima teórica para 1 repetição (Fórmula de Epley) e planeje suas zonas de intensidade.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Carga Utilizada (kg)"
            type="number"
            min={1}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
          <Input
            label="Repetições Feitas"
            type="number"
            min={1}
            max={30}
            value={reps}
            onChange={(e) => setReps(e.target.value)}
          />
        </div>

        {oneRm > 0 && (
          <div className="rounded-xl border border-gym/40 bg-gym/10 p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Sua 1RM Estimada</p>
            <p className="mt-1 font-display text-3xl font-bold text-gym">{oneRm} kg</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Baseado em {w}kg para {r} repetições
            </p>

            <div className="mt-4 grid grid-cols-4 gap-2 pt-3 border-t border-gym/20 text-center">
              <div>
                <p className="text-[10px] text-muted-foreground">90% (Força)</p>
                <p className="font-semibold text-foreground">{Math.round(oneRm * 0.9)} kg</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">80% (Hipertrofia)</p>
                <p className="font-semibold text-foreground">{Math.round(oneRm * 0.8)} kg</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">70% (Volume)</p>
                <p className="font-semibold text-foreground">{Math.round(oneRm * 0.7)} kg</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">60% (Resistência)</p>
                <p className="font-semibold text-foreground">{Math.round(oneRm * 0.6)} kg</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}

/* =========================================================
 * LINHA DE EXERCÍCIO COM SÉRIES, REPS E CARGA
 * ========================================================= */

function ExerciseRow({
  exercise,
  onChange,
  onRemove,
}: {
  exercise: WorkoutExercise;
  onChange: (e: WorkoutExercise) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-border/50 pb-3 last:border-0 last:pb-0 sm:grid sm:grid-cols-[2fr_1fr_1fr_1.2fr_auto] sm:items-end sm:border-0 sm:pb-0">
      <Input
        label="Exercício"
        value={exercise.nome}
        onChange={(e) => onChange({ ...exercise, nome: e.target.value })}
        placeholder="Ex.: Supino reto"
      />
      <div className="grid grid-cols-3 gap-2 sm:contents">
        <Input
          label="Séries"
          type="number"
          min={1}
          value={exercise.series}
          onChange={(e) => onChange({ ...exercise, series: Number(e.target.value) || 1 })}
        />
        <Input
          label="Reps"
          type="number"
          min={1}
          value={exercise.repeticoes}
          onChange={(e) => onChange({ ...exercise, repeticoes: Number(e.target.value) || 1 })}
        />
        <Input
          label="Carga (kg)"
          type="number"
          min={0}
          step="0.5"
          value={exercise.carga ?? ""}
          onChange={(e) =>
            onChange({ ...exercise, carga: e.target.value ? Number(e.target.value) : null })
          }
        />
      </div>
      <button
        type="button"
        aria-label="Remover exercício"
        onClick={onRemove}
        className="flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive sm:mb-0.5 sm:w-10 shrink-0"
      >
        <Minus className="size-4" />
        <span className="sm:hidden text-xs">Remover exercício</span>
      </button>
    </div>
  );
}

/* =========================================================
 * FOTO DO TREINO
 * ========================================================= */

function WorkoutImage({ workout }: { workout: Workout }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [viewing, setViewing] = useState(false);

  const upload = useMutation({
    mutationFn: (file: File) => api.uploadWorkoutImage(workout.id, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workouts"] });
      toast("Foto adicionada ao treino.", "success");
    },
    onError: () => toast("Não consegui enviar a imagem.", "error"),
  });

  if (workout.imagemUrl) {
    const url = buildAssetUrl(workout.imagemUrl);
    return (
      <>
        <button
          type="button"
          onClick={() => setViewing(true)}
          className="size-11 shrink-0 overflow-hidden rounded-lg border border-border hover:border-gym transition-colors relative group"
          aria-label="Ver foto do treino"
        >
          <AuthenticatedImage
            src={url}
            alt={`Foto de ${workout.grupoMuscular}`}
            className="size-11 object-cover"
          />
        </button>
        <Dialog open={viewing} onClose={() => setViewing(false)} title={workout.grupoMuscular}>
          <AuthenticatedImage
            src={url}
            alt={`Foto de ${workout.grupoMuscular}`}
            className="max-h-[70vh] w-full rounded-lg object-contain"
          />
        </Dialog>
      </>
    );
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload.mutate(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        aria-label="Adicionar foto ao treino"
        onClick={() => fileRef.current?.click()}
        disabled={upload.isPending}
        className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:border-gym hover:text-gym disabled:opacity-50"
      >
        <ImagePlus className="size-4" />
      </button>
    </>
  );
}

/* =========================================================
 * PÁGINA PRINCIPAL DE TREINOS
 * ========================================================= */

function TreinosPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const userId = user?.id;

  const [grupoMuscular, setGrupoMuscular] = useState("");
  const [dataTreino, setDataTreino] = useState(today());
  const [notas, setNotas] = useState("");
  const [exercicios, setExercicios] = useState<WorkoutExercise[]>([]);
  const [meta, setMeta] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState<"todos" | "semana" | "mes">("semana");
  const [oneRmOpen, setOneRmOpen] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(false);

  const workouts = useQuery({
    queryKey: ["workouts", userId],
    queryFn: () => api.listWorkouts(userId!),
    enabled: !!userId,
  });

  const goal = useQuery({
    queryKey: ["goal", userId],
    queryFn: () => api.getGoal(userId!).catch(() => null),
    enabled: !!userId,
  });

  const create = useMutation({
    mutationFn: () =>
      api.createWorkout({
        grupoMuscular,
        dataTreino,
        concluido: true,
        exerciciosExecutados: notas || undefined,
        exercicios: exercicios.filter((e) => e.nome.trim()),
      }),
    onSuccess: () => {
      setGrupoMuscular("");
      setNotas("");
      setExercicios([]);
      qc.invalidateQueries({ queryKey: ["workouts", userId] });
      toast("Treino registrado com sucesso! Parabéns pela consistência.", "success");
    },
    onError: () => toast("Erro ao salvar treino.", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteWorkout(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workouts", userId] });
      toast("Treino removido.", "success");
    },
    onError: () => toast("Não foi possível excluir o treino.", "error"),
  });

  const saveGoal = useMutation({
    mutationFn: () => api.setGoal(userId!, Number(meta)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goal", userId] });
      toast("Meta semanal atualizada!", "success");
    },
  });

  // Aplica um modelo pronto
  function applyPreset(p: WorkoutPreset) {
    setGrupoMuscular(p.grupo);
    setExercicios(p.exercicios.map((ex) => ({ ...ex })));
    setPresetsOpen(false);
    toast(`Modelo "${p.nome}" aplicado! Ajuste as cargas como desejar.`, "success");
  }

  const list = [...(workouts.data ?? [])].sort((a, b) => b.dataTreino.localeCompare(a.dataTreino));
  const semana = startOfWeek();
  const currentMonthPrefix = new Date().toISOString().slice(0, 7);

  const feitosNaSemana = list.filter((w) => w.concluido && w.dataTreino >= semana).length;
  const feitosNoMes = list.filter((w) => w.concluido && w.dataTreino.startsWith(currentMonthPrefix)).length;
  const metaAtual = goal.data?.metaTreinosPorSemana ?? 0;

  // Tonelagem total da semana (Séries x Reps x Carga)
  const volumeCargaSemana = list
    .filter((w) => w.concluido && w.dataTreino >= semana)
    .reduce((acc, w) => {
      const volTreino = w.exercicios.reduce((soma, ex) => {
        return soma + (ex.series || 0) * (ex.repeticoes || 0) * (ex.carga || 0);
      }, 0);
      return acc + volTreino;
    }, 0);

  // Dias da semana para faixa visual
  const weekDays = getWeekDays();
  const weekTrainingDates = new Set(
    list.filter((w) => w.concluido && w.dataTreino >= semana).map((w) => w.dataTreino)
  );

  // Filtros da lista
  const filteredList = list.filter((w) => {
    // Filtro por período
    if (periodFilter === "semana" && w.dataTreino < semana) return false;
    if (periodFilter === "mes" && !w.dataTreino.startsWith(currentMonthPrefix)) return false;

    // Filtro de busca
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const inGrupo = w.grupoMuscular.toLowerCase().includes(q);
      const inEx = w.exercicios.some((e) => e.nome.toLowerCase().includes(q));
      const inObs = w.exerciciosExecutados?.toLowerCase().includes(q);
      return inGrupo || inEx || inObs;
    }
    return true;
  });

  return (
    <AppShell title="Treinos & Físico" subtitle="Consistência na academia e preparação para o TAF">

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Target className="size-4 text-gym" /> Meta Semanal
              </span>
              <span className="text-[11px] font-medium text-gym bg-gym/10 px-2 py-0.5 rounded border border-gym/20">
                {feitosNaSemana >= (metaAtual || 1) ? "Meta Batida! 🔥" : "Em andamento"}
              </span>
            </div>
            <p className="mt-3 font-display text-3xl font-bold text-foreground">
              {feitosNaSemana}{" "}
              <span className="text-base font-normal text-muted-foreground">
                / {metaAtual || "Defina"}
              </span>
            </p>
            <ProgressBar
              className="mt-3"
              value={feitosNaSemana}
              max={metaAtual || 1}
              accent="var(--gym)"
            />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveGoal.mutate();
            }}
            className="mt-4 flex gap-1.5 pt-2 border-t border-border/50"
          >
            <Input
              type="number"
              min={1}
              max={7}
              placeholder="Meta (dias)"
              value={meta}
              onChange={(e) => setMeta(e.target.value)}
              className="h-8 text-xs flex-1"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!meta}
              loading={saveGoal.isPending}
              className="h-8 bg-gym hover:opacity-90 text-white text-xs px-3"
            >
              Definir
            </Button>
          </form>
        </Card>

        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="size-4 text-gym" /> Frequência da Semana
              </span>
              <span className="text-[11px] text-muted-foreground">Seg a Dom</span>
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1.5 text-center">
              {weekDays.map((d) => {
                const trained = weekTrainingDates.has(d.dateStr);
                const isToday = d.dateStr === today();
                return (
                  <div
                    key={d.dateStr}
                    className={`flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all ${
                      trained
                        ? "bg-gym text-white border-gym shadow-xs"
                        : isToday
                        ? "border-dash bg-surface-raised font-bold text-foreground"
                        : "border-border/60 bg-surface-raised/40 text-muted-foreground"
                    }`}
                  >
                    <span className="text-[10px] uppercase font-medium">{d.label}</span>
                    <span className="text-xs font-bold mt-0.5">{d.dayNum}</span>
                    {trained ? (
                      <CheckCircle2 className="size-3 mt-1 text-white" />
                    ) : (
                      <div className="size-1.5 rounded-full bg-border mt-2" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3 pt-2 border-t border-border/50">
            {feitosNaSemana > 0
              ? `${feitosNaSemana} dias ativos nesta semana`
              : "Nenhum treino registrado ainda nesta semana."}
          </p>
        </Card>

        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Flame className="size-4 text-gym" /> Volume de Carga
              </span>
              <span className="text-[11px] text-gym font-medium">Tonelagem</span>
            </div>
            <p className="mt-3 font-display text-3xl font-bold text-foreground">
              {volumeCargaSemana >= 1000
                ? `${(volumeCargaSemana / 1000).toFixed(1)} t`
                : `${volumeCargaSemana} kg`}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Total movimentado somando séries, repetições e cargas esta semana.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Treinos no mês: {feitosNoMes}</span>
            <button
              type="button"
              onClick={() => setOneRmOpen(true)}
              className="text-gym font-medium hover:underline flex items-center gap-1"
            >
              <Calculator className="size-3" /> Calcular 1RM
            </button>
          </div>
        </Card>

        <RestTimerWidget />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-12">
        <Card className="lg:col-span-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Dumbbell className="size-5 text-gym" /> Registrar Treino
              </h2>
              <p className="text-xs text-muted-foreground">
                Monte sua sessão de treino com séries, repetições e carga, ou use uma ficha pronta com 1 clique.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPresetsOpen(!presetsOpen)}
                className="text-xs flex items-center gap-1.5 border-gym/40 text-gym hover:bg-gym/10"
              >
                <Sparkles className="size-3.5" />
                Fichas Prontas (Modelos)
                {presetsOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOneRmOpen(true)}
                className="text-xs flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Calculator className="size-3.5" /> 1RM
              </Button>
            </div>
          </div>

          {presetsOpen && (
            <div className="my-4 rounded-xl border border-gym/30 bg-gym/5 p-4 animate-in fade-in duration-200">
              <p className="text-xs font-semibold text-gym mb-2 flex items-center gap-1">
                <Sparkles className="size-3.5" /> Selecione um modelo para preencher automaticamente:
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {PRESETS.map((p) => (
                  <button
                    key={p.nome}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="flex flex-col items-start gap-1 rounded-lg border border-border/70 bg-surface p-3 text-left transition-all hover:border-gym hover:shadow-xs group"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-foreground group-hover:text-gym transition-colors">
                        {p.nome}
                      </span>
                      <span className="text-[10px] font-medium text-gym bg-gym/10 px-1.5 py-0.5 rounded">
                        {p.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      {p.exercicios.map((e) => e.nome).join(", ")}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
            className="mt-4 flex flex-col gap-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                required
                label="Grupo Muscular / Foco da Sessão"
                placeholder="Ex.: Peito e Tríceps, Dorsal, Pernas, etc."
                value={grupoMuscular}
                onChange={(e) => setGrupoMuscular(e.target.value)}
              />
              <Input
                label="Data do Treino"
                type="date"
                value={dataTreino}
                onChange={(e) => setDataTreino(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-surface/50 p-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Award className="size-3.5 text-gym" /> Exercícios da Sessão
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {exercicios.length} {exercicios.length === 1 ? "exercício" : "exercícios"}
                </span>
              </div>

              {exercicios.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  Nenhum exercício detalhado adicionado. Você pode registrar as anotações livres abaixo ou adicionar os exercícios com suas cargas.
                </div>
              ) : (
                <div className="flex flex-col gap-3 pt-2">
                  {exercicios.map((ex, i) => (
                    <ExerciseRow
                      key={i}
                      exercise={ex}
                      onChange={(v) =>
                        setExercicios((arr) => arr.map((e, idx) => (idx === i ? v : e)))
                      }
                      onRemove={() =>
                        setExercicios((arr) => arr.filter((_, idx) => idx !== i))
                      }
                    />
                  ))}
                </div>
              )}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 self-start text-xs border border-dashed border-border hover:border-gym hover:text-gym"
                onClick={() => setExercicios((arr) => [...arr, { ...emptyExercise }])}
              >
                <Plus className="size-3.5 mr-1" /> Adicionar Exercício
              </Button>
            </div>

            <Textarea
              label="Notas & Observações do Treino (opcional)"
              rows={2}
              placeholder="Sensação de esforço, ajustes de pegada, cardio pós-treino ou pontos a melhorar..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/50">
              <Button
                type="submit"
                disabled={!grupoMuscular.trim()}
                loading={create.isPending}
                className="bg-gym hover:opacity-90 text-white font-semibold px-6 shadow-md"
              >
                <CheckCircle2 className="size-4 mr-1.5" /> Salvar Treino
              </Button>
            </div>
          </form>
          {create.error && <ErrorState error={create.error} compact className="mt-3" />}
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Clock className="size-5 text-gym" /> Histórico de Treinos
            </h2>
            <p className="text-xs text-muted-foreground">
              Acompanhe sua consistência e evolução de cargas ao longo do tempo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">

            <div className="flex rounded-lg bg-surface-raised p-0.5 border border-border text-xs">
              <button
                type="button"
                onClick={() => setPeriodFilter("semana")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  periodFilter === "semana" ? "bg-gym text-white font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Esta Semana
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter("mes")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  periodFilter === "mes" ? "bg-gym text-white font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Este Mês
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter("todos")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  periodFilter === "todos" ? "bg-gym text-white font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Todos ({list.length})
              </button>
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filtrar treino ou exercício..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="h-8 w-full rounded-lg border border-border bg-surface-raised pl-8 pr-3 text-xs text-foreground outline-none focus:border-gym"
              />
            </div>
          </div>
        </div>

        {workouts.isLoading && <Loading />}
        {workouts.error && (
          <ErrorState error={workouts.error} onRetry={() => workouts.refetch()} className="mt-4" />
        )}

        {!workouts.isLoading && !workouts.error && filteredList.length === 0 && (
          <EmptyState
            icon={Dumbbell}
            title={
              searchFilter
                ? "Nenhum treino encontrado"
                : periodFilter === "semana"
                ? "Nenhum treino nesta semana"
                : "Nenhum treino registrado"
            }
            description={
              searchFilter
                ? `Nenhum treino corresponde à busca "${searchFilter}".`
                : "Registre seu treino no painel acima para construir seu histórico."
            }
            className="mt-4"
          />
        )}

        {!workouts.isLoading && filteredList.length > 0 && (
          <ul className="mt-4 flex flex-col gap-3">
            {filteredList.map((w) => {
              const totalKg = w.exercicios.reduce(
                (sum, ex) => sum + (ex.series || 0) * (ex.repeticoes || 0) * (ex.carga || 0),
                0
              );

              return (
                <li
                  key={w.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/70 bg-surface-raised p-4 transition-all hover:border-border"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <WorkoutImage workout={w} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground text-sm">
                          {w.grupoMuscular}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-muted-foreground border border-border">
                          <Calendar className="size-3 text-gym" /> {w.dataTreino}
                        </span>
                        {totalKg > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gym/10 px-2 py-0.5 text-[11px] font-semibold text-gym border border-gym/20">
                            <Flame className="size-3" /> {totalKg} kg movimentados
                          </span>
                        )}
                      </div>

                      {w.exercicios.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {w.exercicios.map((e, idx) => (
                            <span
                              key={idx}
                              className="rounded-md bg-surface px-2 py-1 text-[11px] text-muted-foreground border border-border/60"
                            >
                              <strong className="text-foreground">{e.nome}</strong>: {e.series}x{e.repeticoes}
                              {e.carga ? ` @ ${e.carga}kg` : ""}
                            </span>
                          ))}
                        </div>
                      )}

                      {w.exerciciosExecutados && (
                        <p className="mt-2 text-xs text-muted-foreground leading-relaxed italic">
                          "{w.exerciciosExecutados}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Deseja excluir o registro do treino de ${w.grupoMuscular}?`)) {
                          deleteMutation.mutate(w.id);
                        }
                      }}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      title="Excluir treino"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <OneRepMaxDialog open={oneRmOpen} onClose={() => setOneRmOpen(false)} />
    </AppShell>
  );
}

export default TreinosPage;
