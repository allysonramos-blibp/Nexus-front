import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
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

  const planoOptions = (planos.data ?? []).map((p) => ({
    value: p.id,
    label: p.nome,
  }));

  const subjectOptions = (subjects.data ?? []).map((s) => ({
    value: s.id,
    label: s.nome,
    badge: s.topics?.length ? `${s.topics.length} assuntos` : undefined,
  }));

  const topicOptions = (topics.data ?? []).map((t) => ({
    value: t.id,
    label: t.nome,
  }));

  return (
    <Card className="grid gap-3 sm:grid-cols-3">
      <SearchableSelect
        label="Plano de Estudo"
        value={planoId}
        onChange={(v) => {
          onChangePlano(v);
          onChangeSubject(null);
          onChangeTopic(null);
        }}
        options={planoOptions}
        placeholder="Selecione um plano…"
        searchPlaceholder="Buscar plano..."
        modalTitle="Selecionar Plano de Estudo"
      />

      <SearchableSelect
        label="Matéria"
        value={subjectId}
        disabled={planoId == null}
        onChange={(v) => {
          onChangeSubject(v);
          onChangeTopic(null);
        }}
        options={subjectOptions}
        emptyOptionLabel="Todas as matérias (Geral)"
        placeholder={planoId == null ? "Escolha um plano primeiro" : "Todas as matérias (Geral)"}
        searchPlaceholder="Buscar matéria no plano..."
        modalTitle="Selecionar Matéria"
      />

      <SearchableSelect
        label="Assunto"
        value={topicId}
        disabled={subjectId == null}
        onChange={(v) => onChangeTopic(v)}
        options={topicOptions}
        emptyOptionLabel="Todos os assuntos (Geral)"
        placeholder={subjectId == null ? "Todos os assuntos (Geral)" : "Todos os assuntos (Geral)"}
        searchPlaceholder="Buscar assunto da matéria..."
        modalTitle="Selecionar Assunto"
      />
    </Card>
  );
}
