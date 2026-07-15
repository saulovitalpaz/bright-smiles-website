import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ToothSurfaceSelector } from "./ToothSurfaceSelector";

describe("ToothSurfaceSelector", () => {
  it("selects the oclusal face without writing a condition", async () => {
    const user = userEvent.setup();
    const onSelectFace = vi.fn();

    render(
      <ToothSurfaceSelector
        toothNumber={16}
        data={{ status: "Saudável", notes: "" }}
        selectedFace={null}
        onSelectFace={onSelectFace}
      />,
    );

    await user.click(screen.getByRole("button", { name: /oclusal.*saudável/i }));

    expect(onSelectFace).toHaveBeenCalledWith("center");
  });

  it("renders five semantic anatomical face controls", () => {
    render(
      <ToothSurfaceSelector
        toothNumber={16}
        data={{ status: "Saudável", notes: "" }}
        selectedFace={null}
        onSelectFace={() => undefined}
      />,
    );

    const controls = screen.getAllByRole("button");
    expect(controls).toHaveLength(5);
    controls.forEach((control) => {
      expect(control.querySelector("path")).toBeInTheDocument();
      expect(control).toHaveAttribute("aria-pressed", "false");
    });
  });

  it("announces the selected face", () => {
    render(
      <ToothSurfaceSelector
        toothNumber={16}
        data={{ status: "Saudável", notes: "" }}
        selectedFace="left"
        onSelectFace={() => undefined}
      />,
    );

    expect(screen.getByRole("button", { name: /distal.*saudável/i }))
      .toHaveAttribute("aria-pressed", "true");
  });

  it("does not select in read-only mode", async () => {
    const user = userEvent.setup();
    const onSelectFace = vi.fn();

    render(
      <ToothSurfaceSelector
        toothNumber={16}
        data={{ status: "Saudável", notes: "" }}
        selectedFace={null}
        onSelectFace={onSelectFace}
        readOnly
      />,
    );

    await user.click(screen.getByRole("button", { name: /oclusal/i }));

    expect(onSelectFace).not.toHaveBeenCalled();
  });

  it.each([
    ["Tratar", "surface-selector__face--treat"],
    ["Tratado", "surface-selector__face--treated"],
  ] as const)("renders the %s face state", (status, className) => {
    render(
      <ToothSurfaceSelector
        toothNumber={16}
        data={{ status: "Saudável", notes: "", faces: { center: { status } } }}
        selectedFace={null}
        onSelectFace={() => undefined}
      />,
    );

    expect(screen.getByRole("button", { name: new RegExp(`oclusal.*${status}`, "i") }))
      .toHaveClass(className);
  });

  it("uses a hatch pattern for a face marked to treat", () => {
    const { container } = render(
      <ToothSurfaceSelector
        toothNumber={16}
        data={{ status: "Saudável", notes: "", faces: { center: { status: "Tratar" } } }}
        selectedFace={null}
        onSelectFace={() => undefined}
      />,
    );

    const treatedFace = container.querySelector('[data-surface-face="center"] path');
    expect(treatedFace).not.toBeNull();
    expect(treatedFace?.getAttribute("style")).toMatch(/^fill: url\(#surface-hatch-/);
  });
});
