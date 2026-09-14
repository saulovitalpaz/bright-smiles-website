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

export function waitForPrintImages(root: ParentNode, signal?: AbortSignal): Promise<void> {
  const pendingImages = Array.from(root.querySelectorAll("img")).filter((image) => !image.complete);
  return Promise.all(pendingImages.map((image) => new Promise<void>((resolve) => {
    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;
      image.removeEventListener("load", settle);
      image.removeEventListener("error", settle);
      signal?.removeEventListener("abort", settle);
      resolve();
    };
    image.addEventListener("load", settle, { once: true });
    image.addEventListener("error", settle, { once: true });
    signal?.addEventListener("abort", settle, { once: true });
    if (image.complete || signal?.aborted) settle();
  }))).then(() => undefined);
}

export async function printWhenReady(
  root: ParentNode,
  selector: string,
  print: () => void,
  signal?: AbortSignal,
): Promise<boolean> {
  const printTarget = root.querySelector(selector);
  if (!printTarget || signal?.aborted) return false;

  await waitForPrintImages(printTarget, signal);
  if (signal?.aborted) return false;

  print();
  return true;
}
