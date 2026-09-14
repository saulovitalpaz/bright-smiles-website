import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ClinicDocumentPrint } from "./ClinicDocumentPrint";
import { PrintPatientCard } from "./PrintPatientCard";

const props = {
  professional: { name: "Profissional de teste", cro: "CRO TESTE", signatureUrl: "bucket://public/test/signature.png" },
  patient: { name: "Paciente fictício", cpf: "CPF fictício", date: "13/09/2026" },
  content: "<p>Conteúdo selecionado</p>",
  includeElectronic: true,
};

describe("ClinicDocumentPrint", () => {
  it("prints blank patient fields without selected content or electronic signature in manual mode", () => {
    const { container } = render(<ClinicDocumentPrint {...props} manual />);
    expect(screen.getByText("Paciente")).toBeInTheDocument();
    expect(screen.getByText("CPF")).toBeInTheDocument();
    expect(screen.getByText("Telefone")).toBeInTheDocument();
    expect(screen.getByText("Endereço")).toBeInTheDocument();
    expect(container.querySelectorAll('[data-patient-value]')).toHaveLength(4);
    container.querySelectorAll('[data-patient-value]').forEach(field => expect(field).toBeEmptyDOMElement());
    expect(container).not.toHaveTextContent("Paciente fictício");
    expect(container).not.toHaveTextContent("CPF fictício");
    expect(container).not.toHaveTextContent("Conteúdo selecionado");
    expect(screen.getByText("Profissional de teste")).toBeInTheDocument();
    expect(screen.getByText("CRO TESTE")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Logo" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Núcleo Odontológico" })).toBeInTheDocument();
    expect(screen.queryByText("Assinatura do Paciente")).not.toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /assinatura/i })).not.toBeInTheDocument();
    expect(container.querySelector('[data-print-target="document"]')).toBeInTheDocument();
  });

  it("uses the same patient card grid and reserved field heights in blank and populated modes", () => {
    const patient = { ...props.patient, phone: "Telefone fictício", address: "Endereço fictício" };
    const { container, rerender } = render(<PrintPatientCard patient={patient} />);
    const populatedClasses = Array.from(container.querySelectorAll('*')).map(node => node.className);
    rerender(<PrintPatientCard patient={patient} blank />);
    expect(Array.from(container.querySelectorAll('*')).map(node => node.className)).toEqual(populatedClasses);
    expect(container).not.toHaveTextContent(patient.name);
    expect(container).not.toHaveTextContent(patient.cpf);
    expect(container).not.toHaveTextContent(patient.phone);
    expect(container).not.toHaveTextContent(patient.address);
  });

  it("preserves content, patient and optional electronic signature for normal documents", () => {
    const { rerender } = render(<ClinicDocumentPrint {...props} manual />);
    rerender(<ClinicDocumentPrint {...props} />);
    expect(screen.getByText("Conteúdo selecionado")).toBeInTheDocument();
    expect(screen.getByText("Paciente fictício - CPF fictício")).toBeInTheDocument();
    expect(screen.getByText("Assinatura do Paciente")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /assinatura de profissional/i })).toBeInTheDocument();
    expect(screen.queryByText(/Nascimento:/)).not.toBeInTheDocument();
  });
});
