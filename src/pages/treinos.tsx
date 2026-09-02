import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Dumbbell,
  ImagePlus,
  Minus,
  Plus,
  Target,
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

function startOfWeek() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

const emptyExercise: WorkoutExercise = { nome: "", series: 4, repeticoes: 10, carga: null };

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
    <div className="flex flex-col gap-2 border-b border-border/50 pb-3 last:border-0 last:pb-0 sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_auto] sm:items-end sm:border-0 sm:pb-0">
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
          label="Repetições"
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
        className="flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive sm:mb-0.5 sm:w-10"
      >
        <Minus className="size-4" />
        <span className="sm:hidden">Remover exercício</span>
      </button>
    </div>
  );
}

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
          className="size-10 shrink-0 overflow-hidden rounded-lg border border-border"
          aria-label="Ver foto do treino"
        >
          <AuthenticatedImage src={url} alt={`Foto de ${workout.grupoMuscular}`} className="size-10 object-cover" />
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
        className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:border-gym hover:text-gym disabled:opacity-50"
      >
        <ImagePlus className="size-4" />
      </button>
    </>
  );
}

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
      toast("Treino registrado!", "success");
    },
  });

  const saveGoal = useMutation({
    mutationFn: () => api.setGoal(userId!, Number(meta)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goal", userId] });
      toast("Meta atualizada.", "success");
    },
  });

  const list = [...(workouts.data ?? [])].sort((a, b) => b.dataTreino.localeCompare(a.dataTreino));
  const semana = startOfWeek();
  const feitosNaSemana = list.filter((w) => w.concluido && w.dataTreino >= semana).length;
  const metaAtual = goal.data?.metaTreinosPorSemana ?? 0;

  return (
    <AppShell title="Treinos" subtitle="Consistência na academia">
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gym">
            <Target className="size-4" /> Meta semanal
          </h2>
          <p className="mt-3 font-display text-3xl font-bold">
            {feitosNaSemana} <span className="text-muted-foreground">/ {metaAtual || "—"}</span>
          </p>
          <ProgressBar
            className="mt-3"
            value={feitosNaSemana}
            max={metaAtual || 1}
            accent="var(--gym)"
          />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveGoal.mutate();
            }}
            className="mt-4 flex gap-2"
          >
            <Input
              type="number"
              min={1}
              max={7}
              placeholder="Treinos/semana"
              value={meta}
              onChange={(e) => setMeta(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={!meta} loading={saveGoal.isPending} className="bg-gym">
              Definir
            </Button>
          </form>
          {saveGoal.error && <ErrorState error={saveGoal.error} compact className="mt-3" />}
        </Card>

        <Card className="flex flex-col gap-3 lg:col-span-2">
          <h2 className="text-lg font-semibold">Registrar treino</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
            className="flex flex-col gap-3"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                required
                label="Grupo muscular"
                placeholder="Ex.: Costas e bíceps"
                value={grupoMuscular}
                onChange={(e) => setGrupoMuscular(e.target.value)}
              />
              <Input
                label="Data"
                type="date"
                value={dataTreino}
                onChange={(e) => setDataTreino(e.target.value)}
              />
            </div>

            {exercicios.length > 0 && (
              <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-surface p-3">
                {exercicios.map((ex, i) => (
                  <ExerciseRow
                    key={i}
                    exercise={ex}
                    onChange={(v) => setExercicios((arr) => arr.map((e, idx) => (idx === i ? v : e)))}
                    onRemove={() => setExercicios((arr) => arr.filter((_, idx) => idx !== i))}
                  />
                ))}
              </div>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="self-start"
              onClick={() => setExercicios((arr) => [...arr, { ...emptyExercise }])}
            >
              <Plus className="size-3.5" /> Adicionar exercício (séries/repetições/carga)
            </Button>

            <Textarea
              label="Notas (opcional)"
              rows={2}
              placeholder="Qualquer observação livre sobre o treino"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />

            <Button type="submit" loading={create.isPending} className="self-start bg-gym">
              Salvar treino
            </Button>
          </form>
          {create.error && <ErrorState error={create.error} compact />}
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold">Histórico</h2>
        {workouts.isLoading && <Loading />}
        {workouts.error && (
          <ErrorState error={workouts.error} onRetry={() => workouts.refetch()} className="mt-4" />
        )}
        {!workouts.isLoading && !workouts.error && list.length === 0 && (
          <EmptyState
            icon={Dumbbell}
            title="Nenhum treino registrado"
            description="Registre seu primeiro treino no formulário acima."
            className="mt-4"
          />
        )}
        {!workouts.isLoading && list.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2">
            {list.map((w) => (
              <li
                key={w.id}
                className="flex items-center gap-3 rounded-lg border border-border/70 bg-surface-raised px-4 py-3"
              >
                <WorkoutImage workout={w} />
                {w.concluido ? (
                  <CheckCircle2 className="size-4 shrink-0 text-gym" />
                ) : (
                  <Circle className="size-4 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{w.grupoMuscular}</p>
                  {w.exercicios.length > 0 && (
                    <p className="truncate text-xs text-muted-foreground">
                      {w.exercicios
                        .map((e) => `${e.nome} ${e.series}x${e.repeticoes}${e.carga ? ` ${e.carga}kg` : ""}`)
                        .join(" · ")}
                    </p>
                  )}
                  {!w.exercicios.length && w.exerciciosExecutados && (
                    <p className="truncate text-xs text-muted-foreground">{w.exerciciosExecutados}</p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{w.dataTreino}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AppShell>
  );
}

export default TreinosPage;
