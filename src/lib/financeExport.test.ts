import { describe, expect, it } from "vitest";
import { createFinanceEntriesCsv, financeEntryExportRows } from "./financeExport";

const transactions = [
  {
    id: 42,
    type: "income" as const,
    description: "Limpeza; retorno",
    amount: 350.5,
    date: "2026-09-11T03:00:00.000Z",
    category: "Consulta",
    paymentStatus: "received",
    patient: { name: "Ana; Silva", cpf: "123.456.789-00", phone: "(31) 99999-0000", address: "Rua A, 10" },
  },
  {
    id: 43,
    type: "expense" as const,
    description: "Material",
    amount: 20,
    date: "2026-09-10T03:00:00.000Z",
    category: "Materiais",
    paymentStatus: "received",
    patient: null,
  },
];

describe("finance NF-e export", () => {
  it("exports only entries with patient identity and payment fields", () => {
    expect(financeEntryExportRows(transactions)).toEqual([
      ["42", "11/09/2026", "Ana; Silva", "123.456.789-00", "(31) 99999-0000", "Rua A, 10", "Limpeza; retorno", "Consulta", "350,50", "Recebido", "Sem nota anexada"],
    ]);
  });

  it("quotes delimiters and emits a spreadsheet-compatible UTF-8 CSV", () => {
    const csv = createFinanceEntriesCsv(transactions);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("ID do lançamento;Data da entrada;Paciente;CPF;Telefone;Endereço;Descrição;Categoria;Valor (R$);Pagamento;NF-e");
    expect(csv).toContain('"Ana; Silva"');
    expect(csv).not.toContain("Material");
    expect(csv).toContain("Recebido");
  });
});
