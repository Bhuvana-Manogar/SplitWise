import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download } from "lucide-react";
import { Group, CATEGORY_CONFIG } from "@/types/expense";

function exportCSV(group: Group) {
  const memberMap = Object.fromEntries(group.members.map((m) => [m.id, m.name]));
  const rows = [["Date", "Description", "Category", "Amount", "Paid By", ...group.members.map((m) => m.name)]];

  group.expenses.forEach((e) => {
    const splitMap = Object.fromEntries(e.splits.map((s) => [s.memberId, s.amount]));
    rows.push([
      new Date(e.date).toLocaleDateString(),
      e.description,
      CATEGORY_CONFIG[e.category].label,
      e.amount.toFixed(2),
      memberMap[e.paidBy],
      ...group.members.map((m) => (splitMap[m.id] || 0).toFixed(2)),
    ]);
  });

  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  downloadFile(csv, `${group.name}-expenses.csv`, "text/csv");
}

function exportPDF(group: Group) {
  const memberMap = Object.fromEntries(group.members.map((m) => [m.id, m.name]));
  const total = group.expenses.reduce((s, e) => s + e.amount, 0);

  let html = `
    <html><head><style>
      body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a1a; }
      h1 { color: #0d9668; margin-bottom: 4px; }
      .subtitle { color: #666; margin-bottom: 24px; }
      table { width: 100%; border-collapse: collapse; margin: 16px 0; }
      th { background: #0d9668; color: white; padding: 10px 12px; text-align: left; }
      td { padding: 8px 12px; border-bottom: 1px solid #e5e5e5; }
      tr:nth-child(even) { background: #f9f9f9; }
      .total { font-size: 18px; font-weight: bold; margin-top: 16px; }
    </style></head><body>
    <h1>${group.name}</h1>
    <p class="subtitle">Expense Report · ${group.members.length} members · Generated ${new Date().toLocaleDateString()}</p>
    <table>
      <tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th><th>Paid By</th></tr>`;

  group.expenses.forEach((e) => {
    html += `<tr>
      <td>${new Date(e.date).toLocaleDateString()}</td>
      <td>${e.description}</td>
      <td>${CATEGORY_CONFIG[e.category].emoji} ${CATEGORY_CONFIG[e.category].label}</td>
      <td>₹${e.amount.toFixed(2)}</td>
      <td>${memberMap[e.paidBy]}</td>
    </tr>`;
  });

  html += `</table><p class="total">Total: ₹${total.toFixed(2)}</p></body></html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportButton({ group }: { group: Group }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Download className="h-4 w-4" /> Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => exportCSV(group)}>Download CSV</DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportPDF(group)}>Print / Save as PDF</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
