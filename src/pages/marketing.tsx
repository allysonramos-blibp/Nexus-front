import { useState } from "react";
import { 
  Download, 
  Copy, 
  Check, 
  FileText, 
  Sparkles, 
  Instagram, 
  Linkedin, 
  Smartphone, 
  ExternalLink,
  ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";

interface AssetCardProps {
  title: string;
  badge: string;
  dimensions: string;
  format: string;
  previewUrl: string;
  caption: string;
  width: number;
  height: number;
}

export default function MarketingPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const downloadAsPng = async (svgUrl: string, filename: string, targetW: number, targetH: number) => {
    setDownloadingId(filename);
    try {
      const resp = await fetch(svgUrl);
      const svgText = await resp.text();
      
      const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(blob);
      
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        
        ctx.fillStyle = "#0B0F19";
        ctx.fillRect(0, 0, targetW, targetH);
        ctx.drawImage(image, 0, 0, targetW, targetH);
        
        canvas.toBlob((pngBlob) => {
          if (!pngBlob) return;
          const pngUrl = URL.createObjectURL(pngBlob);
          const link = document.createElement("a");
          link.href = pngUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(pngUrl);
          URL.revokeObjectURL(blobURL);
          setDownloadingId(null);
        }, "image/png");
      };
      image.src = blobURL;
    } catch (err) {
      console.error("Erro ao converter imagem:", err);
      // Fallback: download svg directly
      const link = document.createElement("a");
      link.href = svgUrl;
      link.download = filename.replace(".png", ".svg");
      link.click();
      setDownloadingId(null);
    }
  };

  const assets: AssetCardProps[] = [
    {
      title: "Banner de Lançamento & Arquitetura",
      badge: "LinkedIn / X / Artigo",
      dimensions: "1200 x 630 px",
      format: "SVG / PNG",
      previewUrl: "/social/nexus-linkedin-launch.svg",
      width: 1200,
      height: 630,
      caption: `🚀 Apresento o NEXUS: O Sistema Operacional de Alta Performance Pessoal e Intelectual.

Quantos apps diferentes você abre por dia para gerenciar sua rotina? Um para estudos de concurso, outro para ficha de academia, uma planilha para finanças e mais um bloco de notas para foco diário? 

A fragmentação cobra um preço alto em atenção e disciplina. Por isso, construí o Nexus — um ecossistema integrado projetado sob medida para quem busca aprovação em concursos de alto nível, progressão física e clareza financeira.

📐 Destaques de Arquitetura & Engenharia:
• Frontend PWA: React 19, Vite, Tailwind CSS e TanStack Query v5. Instalável no celular sem lojas de app e com suporte offline.
• Backend RESTful: Spring Boot 4 + Java 21, arquitetura limpa com 21 Controllers, 28 Services transacionais ACID e autenticação stateless JWT.
• Inteligência Artificial & OCR: Integração com Apache PDFBox e Gemini para ler editais em PDF e verticalizar assuntos automaticamente.
• Caderno de Erros Ativo: Motor de repetição espaçada e categorização por banca para blindar contra pegadinhas.
• Módulo de Finanças & Caixinhas: Gestão visual de fluxo de caixa com segregação de patrimônio e metas de reserva.

📄 Acesse a plataforma: https://nexus-front-phi.vercel.app
👉 Repositório & Documentação: https://github.com/allysonramos-blibp/Nexus-front

#desenvolvimento #react #springboot #java #fullstack #saas #arquitetura #concursos #produtividade`
    },
    {
      title: "Post Quadrado (Feed & Carrossel)",
      badge: "Instagram Feed",
      dimensions: "1080 x 1080 px",
      format: "SVG / PNG",
      previewUrl: "/social/nexus-instagram-carrossel-1.svg",
      width: 1080,
      height: 1080,
      caption: `Chega de usar 5 aplicativos diferentes para tentar organizar a sua vida. 🛑

Você anota o treino em um app, estuda para concurso em outro, controla o dinheiro numa planilha e perde o foco antes das 14h. A fragmentação drena a sua energia.

Por isso eu criei o NEXUS: seu ecossistema definitivo de alta performance em um só lugar.

Arrasta pro lado para ver o que tem dentro: 👉

📚 1. Estudos & Concursos de Elite:
Importe o PDF do seu edital e tenha a grade verticalizada na hora. Faça simulados cronometrados e alimente seu Caderno de Erros com repetição espaçada.

⚡ 2. Treinos & Progressão Real:
Fichas completas divididas (A/B/C/D), registro da carga levantada (kg), evolução corporal e histórico de pesagem.

💰 3. Finanças & Caixinhas de Reserva:
Controle de receitas e despesas com caixinhas separadas para sua reserva de emergência e objetivos futuros.

🎯 4. Cockpit de Foco Único:
Defina a prioridade absoluta do seu dia e execute no bloco de foco sem distrações.

📱 Funciona no computador e instala como aplicativo no seu celular (PWA).

🔗 Toque no link da minha bio para testar gratuitamente!

#produtividade #concursopublico #estudos #treino #financas #desenvolvimentopessoal #foco #nexus`
    },
    {
      title: "Story / Reels Vertical",
      badge: "Instagram Story & WhatsApp",
      dimensions: "1080 x 1920 px (9:16)",
      format: "SVG / PNG",
      previewUrl: "/social/nexus-instagram-story.svg",
      width: 1080,
      height: 1920,
      caption: `Roteiro em 3 Telas:

Tela 1 (Gancho/Enquete):
"Você ainda usa 3 a 5 apps diferentes para treino, estudos e dinheiro?"
[Sim, uma bagunça 😩] / [Preciso unificar urgente 🔥]

Tela 2 (A Solução):
"Eu cansei dessa fragmentação e programei o NEXUS:
✅ Edital verticalizado com IA a partir de PDF
✅ Caderno de Erros inteligente
✅ Fichas de treino com evolução de carga
✅ Caixinhas de reserva financeira"

Tela 3 (Chamada):
"Instale direto no seu celular em 5 segundos (sem baixar de loja). Link: https://nexus-front-phi.vercel.app"`
    }
  ];

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 pb-16">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#07090E]/90 backdrop-blur-md px-4 py-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              to="/" 
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Nexus
            </Link>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h1 className="font-semibold text-sm sm:text-base tracking-wide text-white">Kit de Divulgação Oficial</h1>
            </div>
          </div>

          <a
            href="/nexus-arquitetura-completa.pdf"
            download="nexus-arquitetura-completa.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Baixar PDF da Arquitetura</span>
            <span className="sm:hidden">PDF Arquitetura</span>
          </a>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-8 pb-10">
        <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-950 border border-indigo-900/40 rounded-2xl p-6 sm:p-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Material Pronto para Redes Sociais
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
            Imagens em Alta Resolução & Textos Prontos
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed">
            Faça download das imagens geradas diretamente no seu celular ou computador em PNG (pronto para postar no Instagram e LinkedIn) e copie as legendas com um toque.
          </p>
        </div>
      </div>

      {/* Grid de Assets */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 space-y-12">
        {assets.map((asset, idx) => (
          <div 
            key={idx}
            className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col lg:flex-row"
          >
            {/* Visualização da Imagem */}
            <div className="lg:w-1/2 p-6 flex flex-col justify-center items-center bg-[#0B0F19] border-b lg:border-b-0 lg:border-r border-slate-800">
              <div className="w-full flex items-center justify-between mb-4">
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {asset.badge}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {asset.dimensions}
                </span>
              </div>

              <div className="w-full relative flex items-center justify-center rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 p-2 group">
                <img 
                  src={asset.previewUrl} 
                  alt={asset.title}
                  className="max-h-[380px] w-auto object-contain rounded-lg shadow-md transition-transform group-hover:scale-[1.01]"
                />
              </div>

              {/* Botões de Ação da Imagem */}
              <div className="w-full mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => downloadAsPng(asset.previewUrl, `${asset.title.toLowerCase().replace(/\s+/g, "-")}.png`, asset.width, asset.height)}
                  disabled={downloadingId === `${asset.title.toLowerCase().replace(/\s+/g, "-")}.png`}
                  className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-medium transition-all shadow-md active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  {downloadingId === `${asset.title.toLowerCase().replace(/\s+/g, "-")}.png` 
                    ? "Convertendo..." 
                    : "Baixar PNG (Alta Res.)"}
                </button>

                <a
                  href={asset.previewUrl}
                  download
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  SVG
                </a>

                <a
                  href={asset.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center p-2.5 bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors"
                  title="Abrir em tela cheia"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Texto / Legenda da Postagem */}
            <div className="lg:w-1/2 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg text-white">{asset.title}</h3>
                  <button
                    onClick={() => copyToClipboard(asset.caption, `cap-${idx}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 rounded-lg text-xs font-medium transition-colors"
                  >
                    {copiedId === `cap-${idx}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copiar Legenda
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-[#05070B] border border-slate-800 rounded-xl p-4 max-h-[300px] overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-all scrollbar-thin scrollbar-thumb-slate-800">
                  {asset.caption}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Dica: Copie o texto e poste junto com a imagem PNG gerada.</span>
                <span className="font-medium text-indigo-400">Pronto para publicar</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
