import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  CashFlowReport,
  ByCategoryReport,
  ByAccountReport,
  DreReport,
  ReportGroupBy,
} from "@/services/financial-reports.service";
import { addInstitutionalHeader } from "./pdf-institutional-header";

const fmt = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const groupByLabel: Record<ReportGroupBy, string> = {
  DAY: "Dia",
  WEEK: "Semana",
  MONTH: "Mes",
};

const addReportHeader = (
  doc: jsPDF,
  title: string,
  subtitle: string,
): number => {
  const startY = addInstitutionalHeader(doc);

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

const addSummaryRow = (
  doc: jsPDF,
  items: { label: string; value: string }[],
  y: number,
): number => {
  const colWidth = 182 / items.length;
  doc.setFontSize(8);

  items.forEach((item, i) => {
    const x = 14 + i * colWidth;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120);
    doc.text(item.label, x, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text(item.value, x, y + 5);
  });

  return y + 14;
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

// ── Fluxo de Caixa ─────────────────────────────────────────────────────────
export const exportCashFlowPDF = (report: CashFlowReport) => {
  const doc = new jsPDF();

  const subtitle = `Periodo: ${report.startDate} a ${report.endDate}  |  Agrupado por: ${groupByLabel[report.groupBy]}`;
  let y = addReportHeader(doc, "Fluxo de Caixa", subtitle);

  y = addSummaryRow(
    doc,
    [
      { label: "Total Receitas", value: fmt(report.totalIncome) },
      { label: "Total Despesas", value: fmt(report.totalExpense) },
      { label: "Saldo Liquido", value: fmt(report.netBalance) },
    ],
    y,
  );

  autoTable(doc, {
    startY: y,
    head: [
      [
        groupByLabel[report.groupBy],
        "Receitas",
        "Despesas",
        "Saldo",
        "Lancamentos",
      ],
    ],
    body: report.periods.map((p) => [
      p.period,
      fmt(p.totalIncome),
      fmt(p.totalExpense),
      fmt(p.netBalance),
      String(p.transactions.length),
    ]),
    headStyles: { fillColor: [59, 130, 246], fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right", cellWidth: 28 },
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    didParseCell: (data) => {
      if (data.section === "head" && data.column.index >= 1) {
        data.cell.styles.halign = "right";
      }
    },
  });

  addFooter(doc);
  doc.save(`fluxo-caixa_${report.startDate}_${report.endDate}.pdf`);
};

// ── Por Categoria ──────────────────────────────────────────────────────────
export const exportByCategoryPDF = (report: ByCategoryReport) => {
  const doc = new jsPDF();

  const parts: string[] = [];
  if (report.startDate) parts.push(`De: ${report.startDate}`);
  if (report.endDate) parts.push(`Ate: ${report.endDate}`);
  if (report.type)
    parts.push(`Tipo: ${report.type === "INCOME" ? "Receita" : "Despesa"}`);
  const subtitle = parts.join("  |  ") || "Todos os periodos";

  let y = addReportHeader(doc, "Movimentacao por Categoria", subtitle);

  y = addSummaryRow(
    doc,
    [{ label: "Total Movimentado", value: fmt(report.totalAmount) }],
    y,
  );

  autoTable(doc, {
    startY: y,
    head: [["Categoria", "Tipo", "Total", "Qtd.", "% do Total"]],
    body: report.categories.map((c) => [
      c.category?.name ?? "—",
      c.category?.type === "INCOME" ? "Receita" : "Despesa",
      fmt(c.totalAmount),
      String(c.transactionCount),
      report.totalAmount > 0
        ? `${((c.totalAmount / report.totalAmount) * 100).toFixed(1)}%`
        : "—",
    ]),
    headStyles: { fillColor: [124, 58, 237], fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      2: { halign: "right" },
      3: { halign: "right", cellWidth: 18 },
      4: { halign: "right", cellWidth: 22 },
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    didParseCell: (data) => {
      if (data.section === "head" && data.column.index >= 2) {
        data.cell.styles.halign = "right";
      }
    },
  });

  addFooter(doc);
  doc.save(`por-categoria_${report.startDate ?? "todos"}_${report.endDate ?? "todos"}.pdf`);
};

// ── Por Conta ──────────────────────────────────────────────────────────────
export const exportByAccountPDF = (report: ByAccountReport) => {
  const doc = new jsPDF();

  const parts: string[] = [];
  if (report.startDate) parts.push(`De: ${report.startDate}`);
  if (report.endDate) parts.push(`Ate: ${report.endDate}`);
  const subtitle = parts.join("  |  ") || "Todos os periodos";

  let y = addReportHeader(doc, "Extrato por Conta", subtitle);

  report.accounts.forEach((stmt, idx) => {
    if (idx > 0) {
      doc.addPage();
      y = 18;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30);
    doc.text(stmt.account.name, 14, y);
    y += 6;

    y = addSummaryRow(
      doc,
      [
        {
          label: "Saldo Abertura",
          value: fmt(stmt.openingBalance),
        },
        { label: "Entradas", value: fmt(stmt.totalIncome) },
        { label: "Saidas", value: fmt(stmt.totalExpense) },
        {
          label: "Saldo Fechamento",
          value: fmt(stmt.closingBalance),
        },
      ],
      y,
    );

    if (stmt.transactions.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["Descricao", "Categoria", "Status", "Vencimento", "Valor"]],
        body: stmt.transactions.map((tx: any) => [
          tx.description ?? "—",
          tx.category?.name ?? "—",
          tx.status === "CONFIRMED"
            ? "Confirmado"
            : tx.status === "PENDING"
            ? "Pendente"
            : "Cancelado",
          tx.dueDate
            ? new Date(tx.dueDate).toLocaleDateString("pt-BR")
            : "—",
          `${tx.type === "EXPENSE" ? "-" : "+"}${fmt(tx.amount)}`,
        ]),
        headStyles: {
          fillColor: [16, 185, 129],
          fontStyle: "bold",
          fontSize: 8,
        },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 52 },
          4: { halign: "right" },
        },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        didParseCell: (data) => {
          if (data.section === "head" && data.column.index === 4) {
            data.cell.styles.halign = "right";
          }
          if (data.column.index === 4 && data.section === "body") {
            const raw = data.cell.raw as string;
            if (raw?.startsWith("-")) {
              data.cell.styles.textColor = [220, 38, 38];
            } else {
              data.cell.styles.textColor = [22, 163, 74];
            }
          }
        },
      });

      y = (doc as any).lastAutoTable.finalY + 10;
    }
  });

  addFooter(doc);
  doc.save(`extrato-por-conta_${report.startDate ?? "todos"}_${report.endDate ?? "todos"}.pdf`);
};

// ── DRE ────────────────────────────────────────────────────────────────────
export const exportDrePDF = (report: DreReport) => {
  const doc = new jsPDF();

  const subtitle = `Periodo: ${report.period.startDate} a ${report.period.endDate}`;
  let y = addReportHeader(doc, "DRE Simplificado", subtitle);

  y = addSummaryRow(
    doc,
    [
      { label: "Total Receitas", value: fmt(report.totalRevenue) },
      { label: "Total Despesas", value: fmt(report.totalExpense) },
      { label: "Resultado Liquido", value: fmt(report.netResult) },
    ],
    y,
  );

  // Receitas
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(22, 163, 74);
  doc.text("RECEITAS", 14, y);
  doc.setTextColor(0);
  y += 2;

  autoTable(doc, {
    startY: y,
    head: [["Categoria", "Total", "Qtd."]],
    body: [
      ...report.revenues.map((r) => [
        r.category?.name ?? "—",
        fmt(r.amount),
        String(r.count),
      ]),
      ["TOTAL RECEITAS", fmt(report.totalRevenue), ""],
    ],
    headStyles: { fillColor: [22, 163, 74], fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right", cellWidth: 18 },
    },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    didParseCell: (data) => {
      if (data.section === "head" && data.column.index >= 1) {
        data.cell.styles.halign = "right";
      }
      if (
        data.section === "body" &&
        data.row.index === report.revenues.length
      ) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [187, 247, 208];
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Despesas
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(220, 38, 38);
  doc.text("DESPESAS", 14, y);
  doc.setTextColor(0);
  y += 2;

  autoTable(doc, {
    startY: y,
    head: [["Categoria", "Total", "Qtd."]],
    body: [
      ...report.expenses.map((e) => [
        e.category?.name ?? "—",
        fmt(e.amount),
        String(e.count),
      ]),
      ["TOTAL DESPESAS", fmt(report.totalExpense), ""],
    ],
    headStyles: { fillColor: [220, 38, 38], fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right", cellWidth: 18 },
    },
    alternateRowStyles: { fillColor: [254, 242, 242] },
    didParseCell: (data) => {
      if (data.section === "head" && data.column.index >= 1) {
        data.cell.styles.halign = "right";
      }
      if (
        data.section === "body" &&
        data.row.index === report.expenses.length
      ) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [254, 202, 202];
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Resultado líquido
  const resultColor: [number, number, number] =
    report.netResult >= 0 ? [37, 99, 235] : [234, 88, 12];
  doc.setFillColor(...resultColor);
  doc.roundedRect(14, y, 182, 14, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255);
  doc.text("RESULTADO LIQUIDO DO PERIODO", 18, y + 9);
  doc.text(
    `${report.netResult >= 0 ? "+" : ""}${fmt(report.netResult)}`,
    192,
    y + 9,
    { align: "right" },
  );
  doc.setTextColor(0);

  addFooter(doc);
  doc.save(`dre_${report.period.startDate}_${report.period.endDate}.pdf`);
};
