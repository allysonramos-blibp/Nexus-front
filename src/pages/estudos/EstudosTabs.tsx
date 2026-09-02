import { useNavigate } from "react-router-dom";
import { Tabs } from "@/components/ui/Tabs";

export type EstudosTab =
  | "planos"
  | "questoes"
  | "caderno-erros"
  | "revisoes"
  | "simulados"
  | "desempenho"
  | "materiais";

const ROUTES: Record<EstudosTab, string> = {
  planos: "/estudos",
  questoes: "/estudos/questoes",
  "caderno-erros": "/estudos/caderno-erros",
  revisoes: "/estudos/revisoes",
  simulados: "/estudos/simulados",
  desempenho: "/estudos/desempenho",
  materiais: "/estudo",
};

const ITEMS: { value: EstudosTab; label: string }[] = [
  { value: "planos", label: "Meus Planos" },
  { value: "questoes", label: "Questões" },
  { value: "caderno-erros", label: "Caderno de Erros" },
  { value: "revisoes", label: "Revisões" },
  { value: "simulados", label: "Simulados" },
  { value: "desempenho", label: "Desempenho" },
  { value: "materiais", label: "Materiais" },
];

/** Sub-navegação do módulo Estudos, usada no topo de cada página do hub. */
export function EstudosTabs({ active }: { active: EstudosTab }) {
  const navigate = useNavigate();
  return (
    <Tabs
      value={active}
      onChange={(value) => navigate(ROUTES[value as EstudosTab])}
      items={ITEMS}
      className="w-full overflow-x-auto"
    />
  );
}
