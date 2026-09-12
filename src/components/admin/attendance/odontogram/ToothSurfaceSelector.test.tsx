import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ANATOMICAL_GEOMETRY } from "./odontogramGeometry";
import { ToothSurfaceSelector } from "./ToothSurfaceSelector";

describe("ToothSurfaceSelector", () => {
  it.each([11, 13, 16, 24, 31, 36, 41, 46, 51, 55, 61, 65, 71, 75, 81, 85])("offers all three crown thirds on each lateral face of tooth %i", async toothNumber => {
    const { getFaceLabels, getToothFamily } = await import("./odontogramModel");
    const labels = getFaceLabels(toothNumber);
    const family = getToothFamily(toothNumber);
    const lastThird = family === "incisor" || family === "canine" ? "incisal" : "oclusal";
    const onTargetsChange = vi.fn();
    render(<ToothSurfaceSelector toothNumber={toothNumber} data={{ status: "Saudável", notes: "" }} selectedFace={null} onSelectFace={() => {}} selectedTargets={[]} onTargetsChange={onTargetsChange} />);
    const user = userEvent.setup();
    for (const face of ["top", "right", "bottom", "left"] as const) {
      for (const [label, region] of [["cervical", "cervical"], ["média", "middle"], [lastThird, "incisalOcclusal"]]) {
        await user.click(screen.getByRole("button", { name: `${labels[face]} - ${label}` }));
        expect(onTargetsChange).toHaveBeenLastCalledWith([{ kind: "surface", face, region }]);
      }
    }
  });
  it("exposes an explicit incisal ou oclusal label for the center control in layered mode", () => {
    const { container } = render(
      <ToothSurfaceSelector
        toothNumber={16}
        data={{ status: "Saudável", notes: "" }}
        selectedFace={null}
        onSelectFace={() => undefined}
        selectedTargets={[]}
        onTargetsChange={() => undefined}
      />,
    );

    expect(
      screen.getByRole("button", { name: /oclusal \/ incisal.*incisal ou oclusal/i }),
    ).toBeInTheDocument();
  });

  it("does not expose an ambiguous center face inteira option in the layered region grid", () => {
    render(
      <ToothSurfaceSelector
        toothNumber={16}
        data={{ status: "Saudável", notes: "" }}
        selectedFace={null}
        onSelectFace={() => undefined}
        selectedTargets={[]}
        onTargetsChange={() => undefined}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /oclusal \/ incisal.*face inteira/i }),
    ).not.toBeInTheDocument();
  });

  it("selects one real anatomical face without replacing other selected targets", async () => {
    const user = userEvent.setup();
    const onTargetsChange = vi.fn();
    render(
      <ToothSurfaceSelector
        toothNumber={16}
        data={{ status: "Saudável", notes: "" }}
        selectedFace={null}
        onSelectFace={() => undefined}
        selectedTargets={[{ kind: "surface", face: "center", region: "incisalOcclusal" }]}
        onTargetsChange={onTargetsChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /vestibular.*face inteira/i }));
    expect(onTargetsChange).toHaveBeenCalledWith([
      { kind: "surface", face: "center", region: "incisalOcclusal" },
      { kind: "surface", face: "top", region: "entire" },
    ]);
  });

  it("replaces an overlapping entire target when a subregion is selected", async () => {
    const user = userEvent.setup();
    const onTargetsChange = vi.fn();
    render(
      <ToothSurfaceSelector
        toothNumber={16}
        data={{ status: "Saudável", notes: "" }}
        selectedFace={null}
        onSelectFace={() => undefined}
        selectedTargets={[{ kind: "surface", face: "top", region: "entire" }]}
        onTargetsChange={onTargetsChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /vestibular.*cervical/i }));

    expect(onTargetsChange).toHaveBeenCalledWith([
      { kind: "surface", face: "top", region: "cervical" },
    ]);
  });

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
    const { container } = render(
      <ToothSurfaceSelector
        toothNumber={16}
        data={{ status: "Saudável", notes: "" }}
        selectedFace={null}
        onSelectFace={() => undefined}
      />,
    );

    const controls = container.querySelectorAll("button.surface-selector__control");
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

    const { container } = render(
      <ToothSurfaceSelector
        toothNumber={16}
        data={{ status: "Saudável", notes: "" }}
        selectedFace={null}
        onSelectFace={onSelectFace}
        readOnly
      />,
    );

    await user.click(container.querySelector("button.surface-selector__control--center") as Element);

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
    const firstControl = selector.querySelector("button.surface-selector__control");

    expect(wrapper).toHaveClass("tooth-surface-selector__container");
    expect(selector).toHaveClass("tooth-surface-selector");
    expect(base?.compareDocumentPosition(firstControl)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("supports controlled multi-face selection with clear anatomical labels", async () => {
    const user = userEvent.setup();
    const onSelectedSurfacesChange = vi.fn();
    const { rerender } = render(
      <ToothSurfaceSelector
        data={{ status: "Saudável", notes: "" }}
        onSelectFace={() => undefined}
        onSelectedSurfacesChange={onSelectedSurfacesChange}
        selectedFace={null}
        selectedSurfaces={[]}
        toothNumber={16}
      />,
    );

    expect(screen.getByText("Distal")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /distal.*saudável/i }));
    expect(onSelectedSurfacesChange).toHaveBeenLastCalledWith(["left"]);

    rerender(
      <ToothSurfaceSelector
        data={{ status: "Saudável", notes: "" }}
        onSelectFace={() => undefined}
        onSelectedSurfacesChange={onSelectedSurfacesChange}
        selectedFace={null}
        selectedSurfaces={["left"]}
        toothNumber={16}
      />,
    );
    await user.click(screen.getByRole("button", { name: /vestibular.*saudável/i }));
    expect(onSelectedSurfacesChange).toHaveBeenLastCalledWith(["left", "top"]);
  });

  it("toggles a face when its existing SVG region is clicked", async () => {
    const user = userEvent.setup();
    const onSelectedSurfacesChange = vi.fn();
    const { container } = render(
      <ToothSurfaceSelector
        data={{ status: "Saudável", notes: "" }}
        onSelectFace={() => undefined}
        onSelectedSurfacesChange={onSelectedSurfacesChange}
        selectedFace={null}
        selectedSurfaces={[]}
        toothNumber={16}
      />,
    );

    await user.click(container.querySelector('[data-surface-face="left"]') as Element);
    expect(onSelectedSurfacesChange).toHaveBeenCalledWith(["left"]);
  });

  it("keeps the V2 SVG region and textual selector on the same target state", async () => {
    const user = userEvent.setup();
    const onTargetsChange = vi.fn();
    const { container } = render(
      <ToothSurfaceSelector
        data={{ status: "Saudável", notes: "" }}
        onSelectFace={() => undefined}
        onTargetsChange={onTargetsChange}
        selectedFace={null}
        selectedTargets={[]}
        toothNumber={16}
      />,
    );

    await user.click(container.querySelector('[data-surface-face="top"]') as Element);

    expect(onTargetsChange).toHaveBeenCalledWith([
      { kind: "surface", face: "top", region: "entire" },
    ]);
  });
});
