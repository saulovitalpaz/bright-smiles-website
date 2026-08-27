import { describe, expect, it } from "vitest";
import { replaceDocumentTokens } from "./document-template";

describe("replaceDocumentTokens", () => {
  it("replaces only text nodes and keeps unknown tags available for manual editing", () => {
    expect(replaceDocumentTokens('<p>#NOME</p><a href="#NOME">#CPF</a> #NOVO', {
      "#NOME": "Paciente",
      "#CPF": "000",
    })).toBe('<p>Paciente</p><a href="#NOME">000</a> #NOVO');
  });
});
