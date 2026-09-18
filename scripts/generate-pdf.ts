import { createArchitecturePdf } from "../src/lib/generateArchitecturePresentationPdf.ts";
import fs from "fs";
import path from "path";

try {
  console.log("Gerando PDF de Apresentação da Arquitetura Nexus...");
  const doc = createArchitecturePdf();
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

  const publicDir = path.resolve("./public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const outputPath = path.join(publicDir, "nexus-arquitetura-completa.pdf");
  fs.writeFileSync(outputPath, pdfBuffer);

  console.log("PDF gerado com sucesso em:", outputPath);
  console.log("Tamanho do arquivo:", (pdfBuffer.length / 1024).toFixed(2), "KB");
} catch (err) {
  console.error("Erro ao gerar PDF:", err);
  process.exit(1);
}
