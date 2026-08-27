export type DocumentTokenValues = Record<string, string>;

export function replaceDocumentTokens(content: string, values: DocumentTokenValues): string {
  return content
    .split(/(<[^>]*>)/g)
    .map((part) => {
      if (part.startsWith("<")) return part;
      return part.replace(/#[A-ZÀ-Ü_]+/gi, (token) => values[token.toUpperCase()] ?? token);
    })
    .join("");
}
