import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PatientPicker } from "./PatientPicker";

describe("PatientPicker", () => {
    it("displays the linked patient when a selection is provided", () => {
        render(
            <PatientPicker
                selectedPatient={{ id: 7, name: "Paciente Cadastrado", cpf: "123.456.789-00" }}
                onSelect={vi.fn()}
            />
        );

        expect(screen.getByRole("combobox")).toHaveTextContent("Paciente Cadastrado");
    });
});
