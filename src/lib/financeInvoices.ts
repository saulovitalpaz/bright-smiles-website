export const hasInvoiceDocument = (reference?: string | null): reference is string =>
    typeof reference === "string" && /^bucket:\/\/financial\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+\.(pdf|png|jpe?g|webp)$/i.test(reference);

export const needsInvoiceDocument = (transaction: { type: string; paymentStatus?: string | null; nfeUrl?: string | null }) =>
    transaction.type === "income" && transaction.paymentStatus !== "voided" && !hasInvoiceDocument(transaction.nfeUrl);
