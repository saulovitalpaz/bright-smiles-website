import { createElement } from "react";
import { pdf } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import { PrescriptionDocument } from "@/components/PrescriptionGenerator";
import {
  getPdfOdontogramSummary,
  htmlToPlainText,
} from "@/lib/prescription-document";

describe("PrescriptionGenerator document helpers", () => {
  it("preserves paragraph and list breaks when converting rich text", () => {
    expect(
      htmlToPlainText("<p>Uso oral</p><ul><li>Item A</li><li>Item B</li></ul>"),
    ).toBe("Uso oral\n• Item A\n• Item B");
  });

  it("summarizes whole-tooth and face conditions for the PDF", () => {
    expect(
      getPdfOdontogramSummary({
        "16": {
          status: "Implante",
          notes: "controle",
          faces: { center: { status: "Tratado" } },
        },
      }),
    ).toEqual([
      "16: implante concluido (dente inteiro); tratado concluido (Oclusal / Incisal - face inteira); controle",
    ]);
  });

  it("renders a long signed A4 document with an anatomical odontogram", async () => {
    const document = createElement(PrescriptionDocument, {
      data: {
        name: "Paciente Teste",
        cpf: "000.000.000-00",
        professionalName: "Ana Karolina",
        professionalCro: "CRO/MG 60.514",
        signatureUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      },
      content: `<p>${"Prescrição clínica extensa. ".repeat(120)}</p>`,
      includeElectronicSignature: true,
      includeOdontogram: true,
      odontogram: {
        "16": {
          status: "Implante",
          notes: "Acompanhar evolução",
          faces: { center: { status: "Tratado" } },
        },
      },
    });

    const output = await pdf(document).toBlob();
    const rawPdf = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => resolve(String(reader.result));
      reader.readAsBinaryString(output);
    });
    const pageCount = rawPdf.match(/\/Type \/Page\b/g)?.length ?? 0;

    expect(output.type).toBe("application/pdf");
    expect(output.size).toBeGreaterThan(1_000);
    expect(pageCount).toBeGreaterThan(1);
  }, 20_000);
});
