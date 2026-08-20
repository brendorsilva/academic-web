import jsPDF from "jspdf";
import { LOGO_IFTSJN_BASE64 } from "@/assets/logo-ifitsjn-base64";

const INSTITUTION_LINES = [
  "DIOCESE DE PENEDO",
  "CNPJ 12.398.749-0001/18",
  "INSTITUTO DE FILOSOFIA E TEOLOGIA SAO JOAO NEWMAN",
  "RUA GERUZA ROCHA MOTA, 70 - SENHOR DO BONFIM",
  "PENEDO - ALAGOAS - 57200-000",
];

/**
 * Desenha o cabeçalho institucional fixo (logo + dados da instituição) no topo
 * da página atual. Deve ser chamado uma única vez, no início de cada documento.
 * Retorna a coordenada Y a partir da qual o conteúdo específico do PDF pode começar.
 */
export function addInstitutionalHeader(doc: jsPDF): number {
  const logoSize = 20;
  const logoX = 14;
  const logoY = 10;
  doc.addImage(LOGO_IFTSJN_BASE64, "PNG", logoX, logoY, logoSize, logoSize);

  const textX = logoX + logoSize + 6;
  let y = logoY + 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30);
  doc.text(INSTITUTION_LINES[0], textX, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80);
  for (let i = 1; i < INSTITUTION_LINES.length; i++) {
    doc.text(INSTITUTION_LINES[i], textX, y);
    y += 4;
  }
  doc.setTextColor(0);

  const bottom = Math.max(logoY + logoSize, y) + 4;
  doc.setDrawColor(200);
  doc.line(14, bottom, 196, bottom);

  return bottom + 6;
}
