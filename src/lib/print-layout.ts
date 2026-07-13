export type PrintMode = "clinic" | "compact";

export const printModeLabels: Record<PrintMode, string> = {
  clinic: "A4 clínico",
  compact: "A4 compacto",
};

export const printModeDescriptions: Record<PrintMode, string> = {
  clinic: "Margens amplas para documentos oficiais e assinatura.",
  compact: "Margens reduzidas para históricos e relatórios longos.",
};

export const printDocumentClass = (mode: PrintMode) => `print-document print-${mode}`;
