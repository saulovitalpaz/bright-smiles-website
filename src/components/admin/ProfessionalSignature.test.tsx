import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  electronicSignatureLabel,
  hasCompleteProfessionalIdentity,
  hasUsableProfessionalSignature,
} from "@/lib/professional-signature";
import { ProfessionalSignature } from "./ProfessionalSignature";

const professional = {
  name: "Ana Karolina",
  cro: "CRO/MG 60.514",
  signatureUrl: "bucket://public/7/signature.png",
};

describe("ProfessionalSignature", () => {
  it("always identifies the logged professional", () => {
    render(<ProfessionalSignature professional={professional} />);

    expect(screen.getByText("Ana Karolina")).toBeInTheDocument();
    expect(screen.getByText("CRO/MG 60.514")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByText(/assinado eletronicamente por/i)).not.toBeInTheDocument();
  });

  it("includes the uploaded image and electronic signature label when enabled", () => {
    render(<ProfessionalSignature professional={professional} includeElectronic />);

    expect(screen.getByRole("img", { name: /assinatura de ana karolina/i }))
      .toHaveAttribute("src", expect.stringContaining("/assets?reference="));
    expect(
      screen.getByText(
        "Assinado eletronicamente por: Ana Karolina - CRO/MG 60.514",
      ),
    ).toBeInTheDocument();
  });

  it("does not claim an electronic signature without a valid public image", () => {
    render(
      <ProfessionalSignature
        professional={{ ...professional, signatureUrl: "bucket://public/7/signature.pdf" }}
        includeElectronic
      />,
    );

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByText(/assinado eletronicamente por/i)).not.toBeInTheDocument();
  });

  it("requires a complete professional identity before signing", () => {
    const incomplete = { name: "Ana Karolina", cro: "", signatureUrl: professional.signatureUrl };

    expect(hasCompleteProfessionalIdentity(professional)).toBe(true);
    expect(hasUsableProfessionalSignature(professional)).toBe(true);
    expect(hasCompleteProfessionalIdentity(incomplete)).toBe(false);
    expect(hasUsableProfessionalSignature(incomplete)).toBe(false);
    expect(() => electronicSignatureLabel(incomplete)).toThrow(/nome e cro/i);
  });
});
