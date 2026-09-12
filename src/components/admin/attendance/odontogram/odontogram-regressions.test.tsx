import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Odontogram from "../Odontogram";
import { type OdontogramData } from "./odontogramModel";

function Harness() {
  const [data, setData] = useState<OdontogramData>({ "16": { status: "Saudável", notes: "preservar", faces: { left: { status: "Tratar" } } } });
  return <Odontogram data={data} onChange={setData} />;
}

describe("odontogram regressions", () => {
  it("uses one editor for legacy data and retains multiple regions after saving and editing", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: /Abrir dente 16,/ }));
    expect(screen.queryByRole("button", { name: "Mais opções clínicas" })).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Categoria"), "achado");
    await user.selectOptions(screen.getByLabelText("Procedimento"), "carie");
    await user.click(screen.getByRole("button", { name: "Vestibular - cervical" }));
    await user.click(screen.getByRole("button", { name: "Mesial - média" }));
    expect(screen.getByRole("button", { name: "Mapa: desselecionar face Vestibular" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Selecionar situação Planejado / a tratar" }));
    await user.click(screen.getByRole("button", { name: "Salvar ocorrência" }));
    await user.click(screen.getByRole("button", { name: /editar carie/i }));
    expect(screen.getByRole("button", { name: "Vestibular - cervical" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Mesial - média" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Observações Clínicas")).toHaveValue("preservar");
    await user.click(screen.getByRole("button", { name: "Mapa: desselecionar face Vestibular" }));
    expect(screen.getByRole("button", { name: "Vestibular - cervical" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Mesial - média" })).toHaveAttribute("aria-pressed", "true");
  }, 15000);

  it("identifies every occurrence on the arch even when two share a face", () => {
    render(<Odontogram data={{ version: 2, dentition: "permanent", teeth: { "16": { notes: "", conditions: [
      { id: "a", category: "achado", type: "carie", stage: "planejado", targets: [{ kind: "surface", face: "top", region: "cervical" }] },
      { id: "b", category: "achado", type: "fratura", stage: "planejado", targets: [{ kind: "surface", face: "top", region: "middle" }] },
    ] } } }} onChange={() => undefined} />);
    const tooth = screen.getByRole("button", { name: /Abrir dente 16,/ });
    expect(within(tooth).getByText("carie")).toBeVisible();
    expect(within(tooth).getByText("fratura")).toBeVisible();
    const occlusal = within(tooth).getByRole("img", { name: /Vista oclusal/ });
    expect(occlusal).toHaveAccessibleName(/carie.*fratura/);
  });
});
