import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ANATOMICAL_GEOMETRY } from "./odontogramGeometry";
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

    const control = screen.getByRole("button", { name: /oclusal.*tratar/i });
    const hatch = control.querySelector("pattern");
    const treatedFace = control.querySelector(".surface-selector__button-face");

    expect(hatch).toBeInTheDocument();
    expect(treatedFace).toHaveAttribute("fill", `url(#${hatch?.id})`);

    const baseFace = container.querySelector(
      '.surface-selector__base [data-surface-face="center"] .surface-selector__button-face',
    );
    const baseHatch = container.querySelector(
      '.surface-selector__base [data-surface-face="center"] pattern',
    );

    expect(baseHatch).toBeInTheDocument();
    expect(baseFace).toHaveStyle({ fill: `url(#${baseHatch?.id})` });
  });

  it("renders a treated inset inside the treated face button", () => {
    const { container } = render(
      <ToothSurfaceSelector
        toothNumber={16}
        data={{ status: "Saudável", notes: "", faces: { center: { status: "Tratado" } } }}
        selectedFace={null}
        onSelectFace={() => undefined}
      />,
    );

    const control = screen.getByRole("button", { name: /oclusal.*tratado/i });
    const treatedFace = control.querySelector(".surface-selector__button-face");
    const inset = control.querySelector(".surface-selector__treated-inset");
    const baseFace = container.querySelector(
      '.surface-selector__base [data-surface-face="center"] .surface-selector__button-face',
    );

    expect(inset).toBeInTheDocument();
    expect(inset).toHaveAttribute("d", ANATOMICAL_GEOMETRY.molar.occlusal.faces.center);
    expect(treatedFace).toHaveStyle({ fill: "#d9eff3", stroke: "#0e7490", strokeWidth: "2.4" });
    expect(baseFace).toHaveStyle({ fill: "#d9eff3", stroke: "#0e7490", strokeWidth: "2.4" });
  });

  it("renders a selected ring inside the selected face button", () => {
    render(
      <ToothSurfaceSelector
        toothNumber={16}
        data={{ status: "Saudável", notes: "" }}
        selectedFace="center"
        onSelectFace={() => undefined}
      />,
    );

    const control = screen.getByRole("button", { name: /oclusal.*saudável/i });
    const ring = control.querySelector(".surface-selector__selected-ring");

    expect(ring).toBeInTheDocument();
    expect(ring).toHaveAttribute("d", ANATOMICAL_GEOMETRY.molar.occlusal.faces.center);
  });

  it("uses the anatomical path inside every face button", () => {
    render(
      <ToothSurfaceSelector
        toothNumber={16}
        data={{ status: "Saudável", notes: "" }}
        selectedFace={null}
        onSelectFace={() => undefined}
      />,
    );

    const control = screen.getByRole("button", { name: /oclusal.*saudável/i });
    expect(control.querySelector(".surface-selector__button-face"))
      .toHaveAttribute("d", ANATOMICAL_GEOMETRY.molar.occlusal.faces.center);
  });

  it("selects the focused face with Enter and Space", async () => {
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

    const control = screen.getByRole("button", { name: /oclusal.*saudável/i });
    control.focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");

    expect(onSelectFace).toHaveBeenNthCalledWith(1, "center");
    expect(onSelectFace).toHaveBeenNthCalledWith(2, "center");
  });

  it("keeps the base in its own fallback row before the fluid control grid", () => {
    const { container } = render(
      <ToothSurfaceSelector
        toothNumber={16}
        data={{ status: "Saudável", notes: "" }}
        selectedFace={null}
        onSelectFace={() => undefined}
      />,
    );

    const wrapper = screen.getByTestId("tooth-surface-selector-container");
    const selector = screen.getByTestId("tooth-surface-selector");
    const base = selector.querySelector(".surface-selector__base");
    const firstControl = screen.getAllByRole("button")[0];

    expect(wrapper).toHaveClass("tooth-surface-selector__container");
    expect(selector).toHaveClass("tooth-surface-selector");
    expect(base?.compareDocumentPosition(firstControl)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
