import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { Transaccion } from "@/lib/types/transaction";
import { formatCurrency } from "@/lib/utils";

export function exportToExcel(transactions: Transaccion[], filename: string) {
    const data = transactions.map((t) => ({
        Fecha: format(new Date(t.fecha), "dd/MM/yyyy"),
        Descripción: t.descripcion,
        Monto: t.monto,
        Categoría: t.categoria,
        Tipo: t.tipo,
        "Método de Pago": t.metodo_pago,
        Notas: t.notas || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transacciones");

    // Ajustar ancho de columnas básico
    const wscols = [
        { wch: 12 }, // Fecha
        { wch: 40 }, // Descripción
        { wch: 12 }, // Monto
        { wch: 20 }, // Categoría
        { wch: 15 }, // Tipo
        { wch: 15 }, // Método de Pago
        { wch: 30 }, // Notas
    ];
    worksheet["!cols"] = wscols;

    XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToPDF(
    transactions: Transaccion[],
    monthLabel: string,
    kpis: { income: number; expenses: number; investments: number; savings: number }
) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // --- CABECERA ---
    doc.setFillColor(59, 130, 246); // Primary blue
    doc.rect(0, 0, pageWidth, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("Txus Finance Factory", 15, 22);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`REPORTE MENSUAL DE GESTIÓN FINANCIERA`, 15, 30);
    doc.setFont("helvetica", "bold");
    doc.text(monthLabel.toUpperCase(), 15, 35);

    // --- KPIs ---
    doc.setTextColor(51, 65, 85); // Slate 700
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Resumen Ejecutivo", 15, 55);

    const kpiData = [
        ["Ingresos Totales", formatCurrency(kpis.income)],
        ["Gastos Totales", formatCurrency(kpis.expenses)],
        ["Inversiones", formatCurrency(kpis.investments)],
        ["Ahorro Neto", formatCurrency(kpis.savings)],
    ];

    autoTable(doc, {
        startY: 60,
        head: [["Concepto", "Monto"]],
        body: kpiData,
        theme: "striped",
        headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontSize: 10, fontStyle: 'bold' },
        styles: { fontSize: 11, font: "helvetica", cellPadding: 5 },
        columnStyles: {
            1: { halign: "right", fontStyle: "bold" },
        },
        margin: { left: 15, right: 15 },
    });

    // --- TABLA DE TRANSACCIONES ---
    const previousTable = (doc as any).lastAutoTable;
    const tableStartY = previousTable ? previousTable.finalY + 20 : 100;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Detalle de Transacciones", 15, tableStartY);

    const tableData = transactions.map((t) => [
        format(new Date(t.fecha), "dd/MM/yy"),
        t.descripcion,
        t.categoria,
        formatCurrency(t.monto),
    ]);

    autoTable(doc, {
        startY: tableStartY + 5,
        head: [["Fecha", "Descripción", "Categoría", "Monto"]],
        body: tableData,
        theme: "grid",
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, font: "helvetica", cellPadding: 3 },
        columnStyles: {
            3: { halign: "right", fontStyle: 'bold' },
        },
        margin: { left: 15, right: 15 },
        didParseCell: function (data: any) {
            if (data.column.index === 3 && data.cell.section === 'body') {
                const val = transactions[data.row.index].monto;
                if (val > 0) {
                    data.cell.styles.textColor = [16, 185, 129]; // Emerald (Ingreso)
                } else if (val < 0) {
                    data.cell.styles.textColor = [225, 29, 72]; // Rose (Gasto)
                }
            }
        }
    });

    // --- PIE DE PÁGINA ---
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // Slate 400
        doc.text(
            `Generado por TxusFinance el ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
            15,
            doc.internal.pageSize.getHeight() - 10
        );
        doc.text(
            `Página ${i} de ${pageCount}`,
            pageWidth - 25,
            doc.internal.pageSize.getHeight() - 10
        );
    }

    doc.save(`TxusFinance_${monthLabel.replace(/\s+/g, "_")}.pdf`);
}
