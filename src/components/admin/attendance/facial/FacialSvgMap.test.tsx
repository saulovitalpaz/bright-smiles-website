import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FacialSvgMap from "./FacialSvgMap";

describe("FacialSvgMap", () => {
  const baseProps = {
    selectedRegionId: null,
    treatedRegionIds: new Set<string>(),
    applications: [],
    markingMode: false,
    onRegionSelect: vi.fn(),
    onApplicationSelect: vi.fn(),
    onMapMark: vi.fn(),
  };

  it("renders bilateral regions as separately focusable accessible controls", () => {
    render(<FacialSvgMap {...baseProps} />);

    expect(screen.getByRole("button", { name: /sulco nasolabial.*direito/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sulco nasolabial.*esquerdo/i })).toBeInTheDocument();
  });

  it("selects a region by keyboard without creating an application", () => {
    const onRegionSelect = vi.fn();
    const onMapMark = vi.fn();
    render(<FacialSvgMap {...baseProps} onRegionSelect={onRegionSelect} onMapMark={onMapMark} />);
    const region = screen.getByRole("button", { name: /sulco nasolabial.*direito/i });

    fireEvent.keyDown(region, { key: "Enter" });

    expect(onRegionSelect).toHaveBeenCalledWith("nasolabial-right");
    expect(onMapMark).not.toHaveBeenCalled();
  });

  it("reports normalized coordinates only in marking mode", () => {
    const onMapMark = vi.fn();
    const onRegionSelect = vi.fn();
    render(<FacialSvgMap {...baseProps} markingMode onMapMark={onMapMark} onRegionSelect={onRegionSelect} />);
    const svg = screen.getByRole("img", { name: /mapa facial/i });
    Object.defineProperty(svg, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ left: 0, top: 0, width: 640, height: 840 }),
    });

    fireEvent.click(svg, { clientX: 320, clientY: 420 });

    expect(onMapMark).toHaveBeenCalledWith({ x: 0.5, y: 0.5 });
    expect(onRegionSelect).not.toHaveBeenCalled();
  });

  it("exposes treated state and application markers", () => {
    render(
      <FacialSvgMap
        {...baseProps}
        treatedRegionIds={new Set(["nasolabial-right"])}
        applications={[{ id: "a1", regionId: "nasolabial-right", procedureType: "filler", coordinates: { x: 0.62, y: 0.48 }, amount: 0.2, unit: "ml" }]}
      />,
    );

    expect(screen.getByRole("button", { name: /sulco nasolabial.*direito/i })).toHaveAttribute("data-state", "treated");
    expect(screen.getByRole("button", { name: /aplicação.*0,2 ml/i })).toBeInTheDocument();
  });
});
