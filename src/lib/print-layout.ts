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

export function waitForPrintImages(root: ParentNode): Promise<void> {
  const pendingImages = Array.from(root.querySelectorAll("img")).filter((image) => !image.complete);
  return Promise.all(pendingImages.map((image) => new Promise<void>((resolve) => {
    const settle = () => {
      image.removeEventListener("load", settle);
      image.removeEventListener("error", settle);
      resolve();
    };
    image.addEventListener("load", settle, { once: true });
    image.addEventListener("error", settle, { once: true });
    if (image.complete) settle();
  }))).then(() => undefined);
}
