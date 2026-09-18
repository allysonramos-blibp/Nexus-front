import { Construction } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { EstudosTabs, type EstudosTab } from "./EstudosTabs";

export function EstudosPlaceholder({
  tab,
  title,
  description,
}: {
  tab: EstudosTab;
  title: string;
  description: string;
}) {
  return (
    <AppShell title={title} subtitle="Estudos">
      <EstudosTabs active={tab} />
      <EmptyState
        icon={Construction}
        title="Em construção"
        description={description}
        className="mt-2"
      />
    </AppShell>
  );
}
