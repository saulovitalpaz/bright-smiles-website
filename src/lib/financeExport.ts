import { hasInvoiceDocument } from "./financeInvoices";

export type FinanceExportTransaction = {
  id: number;
  type: "income" | "expense";
  description?: string | null;
  amount: number;
  date: string;
  category?: string | null;
  paymentStatus?: string | null;
  patient?: {
    name?: string | null;
    cpf?: string | null;
    phone?: string | null;
    address?: string | null;
  } | null;
  nfeUrl?: string | null;
};

const EXPORT_HEADERS = [
  "ID do lançamento",
  "Data da entrada",
  "Paciente",
  "CPF",
  "Telefone",
  "Endereço",
  "Descrição",
  "Categoria",
  "Valor (R$)",
  "Pagamento",
  "NF-e",
];

const paymentLabel = (status?: string | null) => {
  switch (status) {
    case "received":
    case "paid":
      return "Recebido";
    case "pending":
      return "Pendente";
    case "courtesy":
      return "Cortesia";
    case "voided":
      return "Cancelado";
    default:
      return status?.trim() || "Não informado";
  }
};

const formatDate = (value: string) => new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(new Date(value));
const formatAmount = (value: number) => value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const financeEntryExportRows = (transactions: FinanceExportTransaction[]) => transactions
  .filter((transaction) => transaction.type === "income")
  .map((transaction) => [
    String(transaction.id),
    formatDate(transaction.date),
    transaction.patient?.name || "Paciente não vinculado",
    transaction.patient?.cpf || "Não informado",
    transaction.patient?.phone || "Não informado",
    transaction.patient?.address || "Não informado",
    transaction.description || "",
    transaction.category || "Receita",
    formatAmount(transaction.amount),
    paymentLabel(transaction.paymentStatus),
    transaction.paymentStatus === "voided" ? "Não se aplica" : hasInvoiceDocument(transaction.nfeUrl) ? "Anexada" : "Sem nota anexada",
  ]);

const csvCell = (value: string) => {
  const normalized = value.replace(/[\r\n]+/g, " ");
  const safe = /^[=+\-@]/.test(normalized) ? `'${normalized}` : normalized;
  return `"${safe.replace(/"/g, '""')}"`;
};

export const createFinanceEntriesCsv = (transactions: FinanceExportTransaction[]) => {
  const rows = financeEntryExportRows(transactions);
  return `\uFEFF${EXPORT_HEADERS.join(";")}\n${rows.map((row) => row.map(csvCell).join(";")).join("\n")}`;
};
