import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ClinicalConditionList } from "./ClinicalConditionList";

describe("ClinicalConditionList", () => {
  it("shows clinical details and removes the exact occurrence id", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();

    render(<ClinicalConditionList toothNumber={16} onRemove={onRemove} conditions={[{
      id: "c1",
      category: "achado",
      type: "carie",
      stage: "planejado",
      targets: [{ kind: "surface", face: "center", region: "incisalOcclusal" }],
      notes: "acompanhar evolução",
    }]} />);

    expect(screen.getByText("carie")).toBeInTheDocument();
    expect(screen.getByText("Planejado")).toBeInTheDocument();
    expect(screen.getByText("Oclusal / Incisal")).toBeInTheDocument();
    expect(screen.getByText("acompanhar evolução")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /remover carie.*planejado.*oclusal/i }));

    expect(onRemove).toHaveBeenCalledWith("c1");
  });

  it("groups repeated faces into concise multi-region summaries", () => {
    render(<ClinicalConditionList toothNumber={16} conditions={[{
      id: "c1",
      category: "achado",
      type: "carie",
      stage: "planejado",
      targets: [
        { kind: "surface", face: "top", region: "cervical" },
        { kind: "surface", face: "top", region: "middle" },
        { kind: "surface", face: "center", region: "incisalOcclusal" },
      ],
    }]} />);

    expect(screen.getByText("Vestibular (cervical, média), Oclusal / Incisal")).toBeInTheDocument();
  });

  it("distinguishes a legacy whole-center target from an incisal occlusal target", () => {
    render(<ClinicalConditionList toothNumber={16} conditions={[
      {
        id: "c1",
        category: "achado",
        type: "carie",
        stage: "planejado",
        targets: [{ kind: "surface", face: "center", region: "entire" }],
      },
      {
        id: "c2",
        category: "restauracao",
        type: "resina_composta",
        stage: "concluido",
        targets: [{ kind: "surface", face: "center", region: "incisalOcclusal" }],
      },
    ]} />);

    expect(screen.getByText("Oclusal / Incisal (face inteira)")).toBeInTheDocument();
    expect(screen.getByText("Oclusal / Incisal")).toBeInTheDocument();
  });

  it("uses unique removal labels to remove the second same-type occurrence", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();

    render(<ClinicalConditionList toothNumber={16} onRemove={onRemove} conditions={[
      {
        id: "c1",
        category: "achado",
        type: "carie",
        stage: "planejado",
        targets: [
          { kind: "surface", face: "top", region: "cervical" },
          { kind: "surface", face: "top", region: "middle" },
        ],
      },
      {
        id: "c2",
        category: "achado",
        type: "carie",
        stage: "planejado",
        targets: [{ kind: "tooth" }],
      },
    ]} />);

    await user.click(screen.getByRole("button", { name: /remover carie.*planejado.*dente inteiro/i }));

    expect(onRemove).toHaveBeenCalledWith("c2");
  });

  it("keeps removal labels unique for identical occurrences", () => {
    render(<ClinicalConditionList toothNumber={16} onRemove={() => undefined} conditions={[
      {
        id: "c1",
        category: "achado",
        type: "carie",
        stage: "planejado",
        targets: [{ kind: "tooth" }],
      },
      {
        id: "c2",
        category: "achado",
        type: "carie",
        stage: "planejado",
        targets: [{ kind: "tooth" }],
      },
    ]} />);

    const buttons = screen.getAllByRole("button", { name: /remover carie.*dente inteiro/i });
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).not.toHaveAccessibleName(buttons[1].getAttribute("aria-label") ?? "");
  });
});
