import { useNavigate } from "react-router-dom";
import { Tabs } from "@/components/ui/Tabs";

export type EstudosTab =
  | "planos"
  | "questoes"
  | "caderno-anotacoes"
  | "caderno-erros"
  | "revisoes"
  | "simulados"
  | "desempenho"
  | "materiais";

const ROUTES: Record<EstudosTab, string> = {
  planos: "/estudos",
  questoes: "/estudos/questoes",
  "caderno-anotacoes": "/estudos/caderno-anotacoes",
  "caderno-erros": "/estudos/caderno-erros",
  revisoes: "/estudos/revisoes",
  simulados: "/estudos/simulados",
  desempenho: "/estudos/desempenho",
  materiais: "/estudo",
};

const ITEMS: { value: EstudosTab; label: string }[] = [
  { value: "planos", label: "Meus Planos" },
  { value: "questoes", label: "Questões" },
  { value: "caderno-anotacoes", label: "Caderno de Anotações" },
  { value: "caderno-erros", label: "Caderno de Erros" },
  { value: "revisoes", label: "Revisões" },
  { value: "simulados", label: "Simulados" },
  { value: "desempenho", label: "Desempenho" },
  { value: "materiais", label: "Materiais" },
];

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
