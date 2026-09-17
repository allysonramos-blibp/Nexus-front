import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  PlusCircle,
  Lightbulb,
  AlertTriangle,
  FileText,
  Save,
  Search,
  CheckCircle2,
  Trash2,
  Edit3,
  RotateCcw,
  Sparkles,
  BookMarked,
  Layers,
  ChevronRight,
  Eye,
  EyeOff,
  Printer,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EstudosTabs } from "./EstudosTabs";
import { api } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/Dialog";
import {
  CadernoPersonalNote,
  listCadernoPersonalNotes,
  saveCadernoPersonalNote,
  deleteCadernoPersonalNote,
  recordCadernoNoteReview,
} from "@/lib/cadernoPersonalNotesStorage";

type ViewMode = "escrever" | "folhear" | "cards" | "treinar";

export default function CadernoAnotacoesPage() {
  const { toast } = useToast();
  const [notes, setNotes] = useState<CadernoPersonalNote[]>(() => listCadernoPersonalNotes());
  const [viewMode, setViewMode] = useState<ViewMode>("escrever");

  // Carrega planos do backend para sugestão/autocomplete
  const { data: studyPlans } = useQuery({
    queryKey: ["study-plans"],
    queryFn: api.listStudyPlans,
    staleTime: 60_000,
  });

  // Estado do formulário
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [materia, setMateria] = useState("");
  const [planoEstudo, setPlanoEstudo] = useState("");
  const [ideiasMnemonic, setIdeiasMnemonic] = useState("");
  const [pegadinhas, setPegadinhas] = useState("");
  const [resumoEsquematizado, setResumoEsquematizado] = useState("");
  const [nivelImportancia, setNivelImportancia] = useState<"alta" | "media" | "baixa">("alta");

  // Filtros e busca
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMateria, setFilterMateria] = useState("todas");
  const [filterPlano, setFilterPlano] = useState("todos");

  // Modais e visualização
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(notes[0]?.id || null);
  const [deleteCandidate, setDeleteCandidate] = useState<CadernoPersonalNote | null>(null);
  const [revealedPegadinhas, setRevealedPegadinhas] = useState<Record<string, boolean>>({});

  // Lista de matérias e planos únicos existentes nas anotações + sugestões padrão
  const availableMaterias = useMemo(() => {
    const defaultList = [
      "Direito Administrativo",
      "Direito Constitucional",
      "Direito Penal",
      "Direito Processual Penal",
      "Direito Civil",
      "Língua Portuguesa",
      "Raciocínio Lógico",
      "Informática",
      "Contabilidade Geral",
      "Legislação Especial",
    ];
    const set = new Set<string>(defaultList);
    notes.forEach((n) => n.materia && set.add(n.materia));
    return Array.from(set).sort();
  }, [notes]);

  const availablePlanos = useMemo(() => {
    const set = new Set<string>(["Geral / Concursos", "Polícia Federal", "Receita Federal", "Tribunais"]);
    notes.forEach((n) => n.planoEstudo && set.add(n.planoEstudo));
    studyPlans?.forEach((p) => p.nome && set.add(p.nome));
    return Array.from(set).sort();
  }, [notes, studyPlans]);

  // Filtragem
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchSearch =
        !searchQuery ||
        n.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.materia.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.ideiasMnemonic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.pegadinhas.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.resumoEsquematizado.toLowerCase().includes(searchQuery.toLowerCase());

      const matchMateria = filterMateria === "todas" || n.materia === filterMateria;
      const matchPlano = filterPlano === "todos" || n.planoEstudo === filterPlano;

      return matchSearch && matchMateria && matchPlano;
    });
  }, [notes, searchQuery, filterMateria, filterPlano]);

  const activeFolhearNote = useMemo(() => {
    if (!selectedNoteId) return filteredNotes[0] || notes[0] || null;
    return notes.find((n) => n.id === selectedNoteId) || filteredNotes[0] || notes[0] || null;
  }, [selectedNoteId, notes, filteredNotes]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      toast("Informe um título para sua anotação de revisão.", "info");
      return;
    }
    if (!materia.trim()) {
      toast("Informe ou selecione a matéria correspondente.", "info");
      return;
    }

    const saved = saveCadernoPersonalNote({
      id: editingId || undefined,
      titulo: titulo.trim(),
      materia: materia.trim(),
      planoEstudo: planoEstudo.trim() || "Geral / Concursos",
      ideiasMnemonic: ideiasMnemonic.trim(),
      pegadinhas: pegadinhas.trim(),
      resumoEsquematizado: resumoEsquematizado.trim(),
      nivelImportancia,
    });

    const updated = listCadernoPersonalNotes();
    setNotes(updated);
    setSelectedNoteId(saved.id);

    toast(
      editingId ? "Anotação atualizada no caderno!" : "Nova revisão registrada com sucesso no Caderno!",
      "success"
    );

    if (!editingId) {
      setTitulo("");
      setIdeiasMnemonic("");
      setPegadinhas("");
      setResumoEsquematizado("");
    }
    setEditingId(null);
  };

  const handleEdit = (note: CadernoPersonalNote) => {
    setEditingId(note.id);
    setTitulo(note.titulo);
    setMateria(note.materia);
    setPlanoEstudo(note.planoEstudo);
    setIdeiasMnemonic(note.ideiasMnemonic);
    setPegadinhas(note.pegadinhas);
    setResumoEsquematizado(note.resumoEsquematizado);
    setNivelImportancia(note.nivelImportancia || "alta");
    setViewMode("escrever");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = () => {
    if (!deleteCandidate) return;
    deleteCadernoPersonalNote(deleteCandidate.id);
    const updated = listCadernoPersonalNotes();
    setNotes(updated);
    if (selectedNoteId === deleteCandidate.id) {
      setSelectedNoteId(updated[0]?.id || null);
    }
    setDeleteCandidate(null);
    toast("Anotação removida do caderno.", "info");
  };

  const handleMarkReviewed = (id: string) => {
    recordCadernoNoteReview(id);
    setNotes(listCadernoPersonalNotes());
    toast("Revisão registrada! Contagem de fixação atualizada.", "success");
  };

  const togglePegadinha = (id: string) => {
    setRevealedPegadinhas((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const fillTemplate = (tipo: "dir_adm" | "portugues" | "constitucional") => {
    if (tipo === "dir_adm") {
      setTitulo("Desapropriação — Competência e Casos");
      setMateria("Direito Administrativo");
      setPlanoEstudo(availablePlanos[0] || "Polícia Federal");
      setIdeiasMnemonic("DECLARAR utilidade pública: União, Estados, DF e Municípios podem! EXECUTAR: concessionárias também podem se autorizadas por lei ou contrato.");
      setPegadinhas("A pegadinha clássica é dizer que Município não pode desapropriar imóvel rural para reforma agrária. Lembre-se: Reforma Agrária é competência EXCLUSIVA DA UNIÃO!");
      setResumoEsquematizado("• Utilidade Pública (Decreto-lei 3.365/41)\n• Interesse Social (Lei 4.132/62)\n• Indenização: Prévia, justa e em dinheiro (regra geral, CF Art. 5º, XXIV).\n• Exceções (Títulos da Dívida Pública / Agrária): descumprimento de função social.");
      setNivelImportancia("alta");
    } else if (tipo === "portugues") {
      setTitulo("Regência Verbal Perigosa: Visar, Assistir, Aspirar");
      setMateria("Língua Portuguesa");
      setPlanoEstudo("Concurso Geral");
      setIdeiasMnemonic("VISAR (almejar): VTI com 'a'. Ex: Viso ao cargo público (e não 'viso o cargo').\nASSISTIR (ver): VTI com 'a'. Ex: Assisti ao filme.");
      setPegadinhas("A banca coloca 'Assistir o paciente' como erro, mas no sentido de DAR ASSISTÊNCIA / SOCORRER é VTD (sem preposição)! No sentido de VER é VTI (com preposição 'a').");
      setResumoEsquematizado("• Aspirar = cheirar (VTD) | almejar (VTI com 'a')\n• Visar = mirar/assinar (VTD) | ter em vista (VTI com 'a')\n• Esquecer/Lembrar = sem pronome (VTD) | com pronome pronominal (VTI com 'de')");
      setNivelImportancia("alta");
    } else {
      setTitulo("Controle de Constitucionalidade Concentrado");
      setMateria("Direito Constitucional");
      setPlanoEstudo(availablePlanos[0] || "Tribunais");
      setIdeiasMnemonic("Mnemônico dos Legitimados da ADI/ADC/ADO (Art. 103, CF): 3 pessoas, 3 mesas, 3 entidades!");
      setPegadinhas("Cuidado com a legitimidade ativa: nem todos são universais! Governador, Assembleia Legislativa e Confederação Sindical precisam demonstrar PERTINÊNCIA TEMÁTICA!");
      setResumoEsquematizado("• Legitimados Universais: Presidente, PGR, Mesa da Câmara, Mesa do Senado, Conselho Federal da OAB, Partido Político com representação no CN.\n• Efeitos da decisão: Erga Omnes e Ex Tunc vinculante (regra).");
      setNivelImportancia("alta");
    }
    toast("Modelo preenchido no formulário para você personalizar!", "info");
  };

  return (
    <AppShell title="Caderno de Anotações & Revisões" subtitle="Estudos">
      <EstudosTabs active="caderno-anotacoes" />

      {/* Barra de estatísticas e visualizações */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-surface-raised/40 border border-border/80 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-study/15 text-study shrink-0">
            <BookMarked className="size-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              Meu Caderno de Anotações Pessoais
              <Badge variant="default" className="text-[11px] font-semibold">
                {notes.length} fichas salvas
              </Badge>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Crie suas próprias anotações com ideias, pegadinhas de prova e resumos esquematizados para revisar sempre que quiser.
            </p>
          </div>
        </div>

        {/* Seletor de Modo */}
        <div className="flex flex-wrap items-center gap-1.5 bg-surface p-1 rounded-xl border border-border shrink-0">
          <button
            onClick={() => {
              setViewMode("escrever");
              if (!editingId) {
                setTitulo("");
                setIdeiasMnemonic("");
                setPegadinhas("");
                setResumoEsquematizado("");
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              viewMode === "escrever"
                ? "bg-dash text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <PlusCircle className="size-3.5" /> Escrever Anotação
          </button>
          <button
            onClick={() => setViewMode("folhear")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              viewMode === "folhear"
                ? "bg-dash text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="size-3.5" /> Folhear Caderno
          </button>
          <button
            onClick={() => setViewMode("cards")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              viewMode === "cards"
                ? "bg-dash text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="size-3.5" /> Ver em Cards
          </button>
          <button
            onClick={() => setViewMode("treinar")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              viewMode === "treinar"
                ? "bg-dash text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <AlertTriangle className="size-3.5" /> Treinar Pegadinhas
          </button>
        </div>
      </div>

      {/* MODO 1: ESCREVER NO CADERNO */}
      {viewMode === "escrever" && (
        <div className="space-y-4">
          {/* Sugestões rápidas de modelos */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Sparkles className="size-3 text-study" /> Modelos rápidos de inspiração:
            </span>
            <button
              type="button"
              onClick={() => fillTemplate("dir_adm")}
              className="px-2.5 py-1 bg-surface border border-border hover:border-study rounded-lg text-xs text-foreground transition-colors"
            >
              Direito Administrativo
            </button>
            <button
              type="button"
              onClick={() => fillTemplate("portugues")}
              className="px-2.5 py-1 bg-surface border border-border hover:border-study rounded-lg text-xs text-foreground transition-colors"
            >
              Língua Portuguesa
            </button>
            <button
              type="button"
              onClick={() => fillTemplate("constitucional")}
              className="px-2.5 py-1 bg-surface border border-border hover:border-study rounded-lg text-xs text-foreground transition-colors"
            >
              Direito Constitucional
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <Card className="p-5 space-y-4 border-study/30 shadow-sm">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Edit3 className="size-4 text-study" />
                  {editingId ? "Editar Anotação de Revisão" : "Nova Página de Revisão no Caderno"}
                </h3>
                {editingId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingId(null);
                      setTitulo("");
                      setIdeiasMnemonic("");
                      setPegadinhas("");
                      setResumoEsquematizado("");
                    }}
                  >
                    Cancelar Edição
                  </Button>
                )}
              </div>

              {/* Título */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Título da Revisão / Conceito Chave *
                </label>
                <Input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Atos Administrativos — Convalidação ou Regência Verbal"
                  className="font-medium"
                  required
                />
              </div>

              {/* Matéria e Plano de Estudo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    1. Matéria / Disciplina *
                  </label>
                  <Input
                    value={materia}
                    onChange={(e) => setMateria(e.target.value)}
                    placeholder="Ex: Direito Administrativo, RLM, Português..."
                    list="materias-sugestoes"
                    required
                  />
                  <datalist id="materias-sugestoes">
                    {availableMaterias.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Digite o nome da matéria ou selecione das existentes.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    2. Plano de Estudo / Meta
                  </label>
                  <Input
                    value={planoEstudo}
                    onChange={(e) => setPlanoEstudo(e.target.value)}
                    placeholder="Ex: Polícia Federal, Receita Federal, Geral..."
                    list="planos-sugestoes"
                  />
                  <datalist id="planos-sugestoes">
                    {availablePlanos.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Vincula a revisão ao seu edital ou foco correspondente.
                  </p>
                </div>
              </div>

              {/* Importância */}
              <div className="flex items-center gap-4 text-xs pt-1">
                <span className="font-semibold text-foreground">Importância para Prova:</span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="importancia"
                    checked={nivelImportancia === "alta"}
                    onChange={() => setNivelImportancia("alta")}
                    className="text-study focus:ring-study"
                  />
                  <span className="text-destructive font-semibold">Alta (Cai Sempre)</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="importancia"
                    checked={nivelImportancia === "media"}
                    onChange={() => setNivelImportancia("media")}
                    className="text-study focus:ring-study"
                  />
                  <span className="text-gym font-semibold">Média</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="importancia"
                    checked={nivelImportancia === "baixa"}
                    onChange={() => setNivelImportancia("baixa")}
                    className="text-study focus:ring-study"
                  />
                  <span className="text-muted-foreground">Baixa / Detalhe</span>
                </label>
              </div>

              {/* 3 Blocos Essenciais */}
              <div className="space-y-4 pt-2">
                {/* 1. Minhas Ideias e Mnemônicos */}
                <div className="p-4 rounded-xl border border-dash/30 bg-dash/5 space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-dash">
                    <Lightbulb className="size-4" />
                    💡 Minhas Próprias Ideias, Raciocínios & Mnemônicos
                  </label>
                  <Textarea
                    value={ideiasMnemonic}
                    onChange={(e) => setIdeiasMnemonic(e.target.value)}
                    rows={3}
                    placeholder="Escreva com suas próprias palavras: como você explica essa matéria para si mesmo? Qual macete mental, analogia ou mnemônico funciona para memorizar?"
                    className="bg-surface text-foreground"
                  />
                </div>

                {/* 2. Pegadinhas de Prova */}
                <div className="p-4 rounded-xl border border-gym/30 bg-gym/5 space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-gym">
                    <AlertTriangle className="size-4" />
                    ⚠️ Pegadinhas de Prova, Cascas de Banana & Bancas
                  </label>
                  <Textarea
                    value={pegadinhas}
                    onChange={(e) => setPegadinhas(e.target.value)}
                    rows={3}
                    placeholder="O que a banca examinadora (Cespe, FGV, FCC) faz para tentar te derrubar? Quais palavras perigosas costumam aparecer (ex: 'salvo', 'exclusivamente', 'vedado')?"
                    className="bg-surface text-foreground"
                  />
                </div>

                {/* 3. Resumo Esquematizado */}
                <div className="p-4 rounded-xl border border-fin/30 bg-fin/5 space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-fin">
                    <FileText className="size-4" />
                    📝 Resumo Esquematizado & Regras Chave
                  </label>
                  <Textarea
                    value={resumoEsquematizado}
                    onChange={(e) => setResumoEsquematizado(e.target.value)}
                    rows={4}
                    placeholder="Esquematize os tópicos principais em tópicos (bullets), regras, prazos e artigos de lei fundamentais."
                    className="bg-surface text-foreground font-mono text-xs"
                  />
                </div>
              </div>

              {/* Ação Salvar */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <Button type="submit" variant="primary" className="gap-2">
                  <Save className="size-4" />
                  {editingId ? "Atualizar Anotação" : "Salvar no Caderno de Revisões"}
                </Button>
              </div>
            </Card>
          </form>
        </div>
      )}

      {/* MODO 2: FOLHEAR CADERNO (VISUALIZAÇÃO DE LEITURA) */}
      {viewMode === "folhear" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Sumário Lateral */}
          <div className="lg:col-span-4 space-y-3">
            <div className="p-3 bg-surface border border-border rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-foreground">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="size-3.5 text-study" /> Sumário do Caderno
                </span>
                <span className="text-muted-foreground">{filteredNotes.length} fichas</span>
              </div>
              <Input
                placeholder="Filtrar tópicos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs h-8"
              />
            </div>

            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
              {filteredNotes.map((n) => {
                const isSelected = activeFolhearNote?.id === n.id;
                return (
                  <button
                    key={n.id}
                    onClick={() => setSelectedNoteId(n.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex items-start justify-between gap-2 ${
                      isSelected
                        ? "bg-study/10 border-study/40 text-foreground font-medium shadow-sm"
                        : "bg-surface border-border/70 hover:border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Badge variant="default" className="text-[10px] py-0 px-1.5">
                          {n.materia}
                        </Badge>
                        {n.revisadoVezes > 0 && (
                          <span className="text-[10px] text-fin">
                            {n.revisadoVezes}x revisado
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-foreground truncate">{n.titulo}</p>
                    </div>
                    <ChevronRight className={`size-4 shrink-0 mt-1 ${isSelected ? "text-study" : "text-muted-foreground/40"}`} />
                  </button>
                );
              })}
              {filteredNotes.length === 0 && (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  Nenhuma anotação encontrada com os filtros atuais.
                </div>
              )}
            </div>
          </div>

          {/* Página Aberta do Caderno */}
          <div className="lg:col-span-8">
            {activeFolhearNote ? (
              <Card className="p-6 space-y-5 border-study/30 relative">
                {/* Cabeçalho da Folha */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <Badge variant="default">{activeFolhearNote.materia}</Badge>
                      <Badge variant="info">{activeFolhearNote.planoEstudo}</Badge>
                      {activeFolhearNote.revisadoVezes > 0 ? (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="size-3" /> {activeFolhearNote.revisadoVezes}x revisada
                        </Badge>
                      ) : (
                        <Badge variant="warning">Ainda não revisada</Badge>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-foreground">{activeFolhearNote.titulo}</h2>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkReviewed(activeFolhearNote.id)}
                      className="gap-1.5 text-xs"
                    >
                      <RotateCcw className="size-3.5 text-study" /> Marcar Revisada Hoje
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(activeFolhearNote)}
                      className="gap-1.5 text-xs"
                    >
                      <Edit3 className="size-3.5" /> Editar
                    </Button>
                  </div>
                </div>

                {/* Bloco 1: Ideias & Mnemônicos */}
                {activeFolhearNote.ideiasMnemonic && (
                  <div className="p-4 rounded-xl border border-dash/20 bg-dash/5 space-y-1.5">
                    <h4 className="text-xs font-bold text-dash flex items-center gap-1.5">
                      <Lightbulb className="size-3.5" /> Minhas Ideias, Raciocínios & Mnemônicos
                    </h4>
                    <p className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed">
                      {activeFolhearNote.ideiasMnemonic}
                    </p>
                  </div>
                )}

                {/* Bloco 2: Pegadinhas */}
                {activeFolhearNote.pegadinhas && (
                  <div className="p-4 rounded-xl border border-gym/20 bg-gym/5 space-y-1.5">
                    <h4 className="text-xs font-bold text-gym flex items-center gap-1.5">
                      <AlertTriangle className="size-3.5" /> Pegadinhas de Prova & Armadilhas
                    </h4>
                    <p className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed">
                      {activeFolhearNote.pegadinhas}
                    </p>
                  </div>
                )}

                {/* Bloco 3: Resumo Esquematizado */}
                {activeFolhearNote.resumoEsquematizado && (
                  <div className="p-4 rounded-xl border border-fin/20 bg-fin/5 space-y-2">
                    <h4 className="text-xs font-bold text-fin flex items-center gap-1.5">
                      <FileText className="size-3.5" /> Resumo Esquematizado
                    </h4>
                    <pre className="text-xs text-foreground/90 font-mono whitespace-pre-wrap leading-relaxed">
                      {activeFolhearNote.resumoEsquematizado}
                    </pre>
                  </div>
                )}

                {/* Rodapé da Folha */}
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-3 border-t border-border">
                  <span>
                    Criada em: {new Date(activeFolhearNote.criadoEm).toLocaleDateString("pt-BR")}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => window.print()}
                      className="hover:text-foreground inline-flex items-center gap-1"
                    >
                      <Printer className="size-3" /> Imprimir ficha
                    </button>
                    <button
                      onClick={() => setDeleteCandidate(activeFolhearNote)}
                      className="text-destructive hover:opacity-80 inline-flex items-center gap-1"
                    >
                      <Trash2 className="size-3" /> Excluir
                    </button>
                  </div>
                </div>
              </Card>
            ) : (
              <EmptyState
                icon={BookOpen}
                title="Nenhuma anotação selecionada"
                description="Clique em uma anotação no sumário ou escreva uma nova página de revisão."
              />
            )}
          </div>
        </div>
      )}

      {/* MODO 3: CARDS COM FILTROS */}
      {viewMode === "cards" && (
        <div className="space-y-4">
          {/* Filtros e Busca */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por conceito, matéria, pegadinha ou resumo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={filterMateria}
              onChange={(e) => setFilterMateria(e.target.value)}
              className="h-10 px-3 bg-surface-raised border border-border rounded-lg text-xs text-foreground focus:ring-2 focus:ring-dash outline-none"
            >
              <option value="todas">Todas as Matérias</option>
              {availableMaterias.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={filterPlano}
              onChange={(e) => setFilterPlano(e.target.value)}
              className="h-10 px-3 bg-surface-raised border border-border rounded-lg text-xs text-foreground focus:ring-2 focus:ring-dash outline-none"
            >
              <option value="todos">Todos os Planos</option>
              {availablePlanos.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Grade de Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNotes.map((n) => (
              <Card key={n.id} className="p-4 flex flex-col justify-between hover:border-study/40 transition-colors">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <Badge variant="default" className="text-[10px]">
                          {n.materia}
                        </Badge>
                        <Badge variant="info" className="text-[10px]">
                          {n.planoEstudo}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-sm text-foreground">{n.titulo}</h3>
                    </div>
                    {n.revisadoVezes > 0 && (
                      <Badge variant="success" className="text-[10px] shrink-0">
                        {n.revisadoVezes}x
                      </Badge>
                    )}
                  </div>

                  {n.ideiasMnemonic && (
                    <div className="p-2.5 rounded-lg bg-dash/5 border border-dash/20 text-xs">
                      <span className="font-semibold text-dash block mb-0.5">💡 Ideia / Mnemônico:</span>
                      <p className="text-foreground/80 line-clamp-2">{n.ideiasMnemonic}</p>
                    </div>
                  )}

                  {n.pegadinhas && (
                    <div className="p-2.5 rounded-lg bg-gym/5 border border-gym/20 text-xs">
                      <span className="font-semibold text-gym block mb-0.5">⚠️ Pegadinha:</span>
                      <p className="text-foreground/80 line-clamp-2">{n.pegadinhas}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-border text-xs">
                  <span className="text-[11px] text-muted-foreground">
                    {n.revisadoVezes > 0 ? `Revisado ${n.revisadoVezes}x` : "Nunca revisado"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleMarkReviewed(n.id)}
                      className="h-7 px-2 text-xs"
                      title="Marcar revisão"
                    >
                      <RotateCcw className="size-3 text-study" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(n)}
                      className="h-7 px-2 text-xs"
                    >
                      <Edit3 className="size-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteCandidate(n)}
                      className="h-7 px-2 text-xs text-destructive hover:opacity-80"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredNotes.length === 0 && (
            <EmptyState
              icon={BookMarked}
              title="Nenhuma anotação encontrada"
              description="Escreva uma nova anotação ou limpe os filtros de busca."
            />
          )}
        </div>
      )}

      {/* MODO 4: TREINAR PEGADINHAS (FLASHCARDS DE ARMADILHAS) */}
      {viewMode === "treinar" && (
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="p-3 bg-gym/10 border border-gym/20 rounded-xl text-xs text-gym flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" />
            <span>
              <strong>Treino de Atenção & Pegadinhas:</strong> Teste sua recordação ativa das armadilhas mais comuns de prova antes de revelar a resposta.
            </span>
          </div>

          <div className="space-y-4">
            {notes
              .filter((n) => Boolean(n.pegadinhas))
              .map((n) => {
                const isRevealed = revealedPegadinhas[n.id];
                return (
                  <Card key={n.id} className="p-5 space-y-4 border-gym/30">
                    <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
                      <div>
                        <span className="text-[10px] font-bold text-study uppercase">{n.materia}</span>
                        <h3 className="font-bold text-sm text-foreground">{n.titulo}</h3>
                      </div>
                      <Badge variant="info" className="text-[10px]">
                        {n.planoEstudo}
                      </Badge>
                    </div>

                    {/* Mnemônico como dica */}
                    {n.ideiasMnemonic && (
                      <div className="p-3 bg-dash/5 rounded-lg border border-dash/20 text-xs">
                        <span className="text-dash font-semibold block mb-0.5">💡 Dica / Raciocínio:</span>
                        <p className="text-foreground/80">{n.ideiasMnemonic}</p>
                      </div>
                    )}

                    {/* Área da Pegadinha Oculta / Revelada */}
                    <div className="p-4 rounded-xl bg-gym/5 border border-gym/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gym flex items-center gap-1.5">
                          <AlertTriangle className="size-4" /> Pegadinha da Banca
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => togglePegadinha(n.id)}
                          className="h-7 text-xs gap-1.5"
                        >
                          {isRevealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                          {isRevealed ? "Ocultar" : "Revelar Pegadinha"}
                        </Button>
                      </div>

                      {isRevealed ? (
                        <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">
                          {n.pegadinhas}
                        </p>
                      ) : (
                        <div
                          onClick={() => togglePegadinha(n.id)}
                          className="py-4 text-center text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors border border-dashed border-border rounded-lg bg-surface/50"
                        >
                          Clique para revelar a armadilha que você anotou para esta matéria...
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-muted-foreground text-[11px]">
                        Revisado {n.revisadoVezes} vezes
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMarkReviewed(n.id)}
                        className="gap-1 text-xs"
                      >
                        <RotateCcw className="size-3 text-study" /> Marcar Dominado
                      </Button>
                    </div>
                  </Card>
                );
              })}

            {notes.filter((n) => Boolean(n.pegadinhas)).length === 0 && (
              <EmptyState
                icon={AlertTriangle}
                title="Nenhuma pegadinha cadastrada ainda"
                description="Vá na aba 'Escrever Anotação' e preencha o campo de Pegadinhas para treinar aqui."
              />
            )}
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmDialog
        open={Boolean(deleteCandidate)}
        title="Excluir Anotação do Caderno"
        description={`Deseja realmente remover a ficha "${deleteCandidate?.titulo}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir Anotação"
        destructive
        onConfirm={handleDelete}
        onClose={() => setDeleteCandidate(null)}
      />
    </AppShell>
  );
}
