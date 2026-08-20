import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addInstitutionalHeader } from "./pdf-institutional-header";

const addHeader = (
  doc: jsPDF,
  title: string,
  subtitle: string,
  startY: number,
): number => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, 14, startY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(subtitle, 14, startY + 7);
  doc.setTextColor(0);

  doc.setDrawColor(220);
  doc.line(14, startY + 10, 196, startY + 10);

  return startY + 16;
};

const addFooter = (doc: jsPDF) => {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(160);
    const pageHeight = doc.internal.pageSize.height;
    doc.text(
      `Gestao Academica - Gerado em ${new Date().toLocaleDateString("pt-BR")}`,
      14,
      pageHeight - 8,
    );
    doc.text(`Pagina ${i} de ${pageCount}`, 196, pageHeight - 8, {
      align: "right",
    });
  }
};

export const exportClassDiariesPDF = (
  rows: { date: string; content: string }[],
  classInfo: { className: string; subjectName: string },
) => {
  const doc = new jsPDF();

  const headerY = addInstitutionalHeader(doc);
  const subtitle = `Turma: ${classInfo.className}  |  Disciplina: ${classInfo.subjectName}  |  ${rows.length} aula(s)`;
  const y = addHeader(doc, "Diario de Aulas", subtitle, headerY);

  autoTable(doc, {
    startY: y,
    head: [["Data", "Conteudo Lecionado"]],
    body: rows.map((r) => [r.date, r.content]),
    headStyles: { fillColor: [59, 130, 246], fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 26 },
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  addFooter(doc);
  doc.save(`diario-de-aulas_${classInfo.className}.pdf`);
};
