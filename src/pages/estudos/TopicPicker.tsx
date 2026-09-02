import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Select } from "@/components/ui/Select";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Card } from "@/components/ui/Card";

export function TopicPicker({
  planoId,
  subjectId,
  topicId,
  onChangePlano,
  onChangeSubject,
  onChangeTopic,
}: {
  planoId: number | null;
  subjectId: number | null;
  topicId: number | null;
  onChangePlano: (id: number | null) => void;
  onChangeSubject: (id: number | null) => void;
  onChangeTopic: (id: number | null) => void;
}) {
  const planos = useQuery({ queryKey: ["study-plans"], queryFn: api.listStudyPlans });
  const subjects = useQuery({
    queryKey: ["subjects", planoId],
    queryFn: () => api.listSubjects(planoId!),
    enabled: planoId != null,
  });
  const topics = useQuery({
    queryKey: ["topics", subjectId],
    queryFn: () => api.listTopics(subjectId!),
    enabled: subjectId != null,
  });

  if (planos.isLoading) return <Loading label="Carregando seus planos…" />;
  if (planos.error) return <ErrorState error={planos.error} onRetry={() => planos.refetch()} />;

  if ((planos.data ?? []).length === 0) {
    return (
      <EmptyState
        title="Nenhum plano de estudo ainda"
        description="Crie um plano em Meus Planos, adicione matérias e assuntos, e volte aqui para resolver questões."
      />
    );
  }

  return (
    <Card className="grid gap-3 sm:grid-cols-3">
      <Select
        label="Plano"
        value={planoId ?? ""}
        onChange={(e) => {
          const v = e.target.value ? Number(e.target.value) : null;
          onChangePlano(v);
          onChangeSubject(null);
          onChangeTopic(null);
        }}
      >
        <option value="">Selecione…</option>
        {(planos.data ?? []).map((p) => (
          <option key={p.id} value={p.id}>
            {p.nome}
          </option>
        ))}
      </Select>

      <Select
        label="Matéria"
        value={subjectId ?? ""}
        disabled={planoId == null}
        onChange={(e) => {
          const v = e.target.value ? Number(e.target.value) : null;
          onChangeSubject(v);
          onChangeTopic(null);
        }}
      >
        <option value="">{planoId == null ? "Escolha um plano primeiro" : "Selecione…"}</option>
        {(subjects.data ?? []).map((s) => (
          <option key={s.id} value={s.id}>
            {s.nome}
          </option>
        ))}
      </Select>

      <Select
        label="Assunto"
        value={topicId ?? ""}
        disabled={subjectId == null}
        onChange={(e) => onChangeTopic(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">{subjectId == null ? "Escolha uma matéria primeiro" : "Selecione…"}</option>
        {(topics.data ?? []).map((t) => (
          <option key={t.id} value={t.id}>
            {t.nome}
          </option>
        ))}
      </Select>
    </Card>
  );
}
