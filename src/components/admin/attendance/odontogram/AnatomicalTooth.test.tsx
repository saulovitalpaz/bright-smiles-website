import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AnatomicalTooth } from "./AnatomicalTooth";
import { ANATOMICAL_GEOMETRY } from "./odontogramGeometry";

describe("AnatomicalTooth", () => {
  it.each([
    [11, "incisor"],
    [13, "canine"],
    [15, "premolar"],
    [18, "molar"],
  ] as const)("renders tooth %s with %s anatomy", (number, family) => {
    render(
      <AnatomicalTooth
        toothNumber={number}
        data={{ status: "Saudável", notes: "" }}
      />,
    );

    const tooth = screen.getByRole("img", {
      name: new RegExp("dente " + number, "i"),
    });
    expect(tooth).toHaveAttribute("data-tooth-family", family);
    expect(tooth.querySelectorAll("[data-anatomy-layer]").length).toBeGreaterThanOrEqual(6);
  });

  it("keeps the anatomical paint order and clips the enamel highlight", () => {
    render(
      <AnatomicalTooth
        toothNumber={16}
        data={{ status: "Saudável", notes: "" }}
      />,
    );

    const tooth = screen.getByRole("img", { name: /dente 16/i });
    const layers = Array.from(tooth.querySelectorAll("[data-anatomy-layer]"))
      .map((layer) => layer.getAttribute("data-anatomy-layer"));

    expect(layers).toEqual([
      "root-shadow",
      "dentin-roots",
      "cervical-transition",
      "enamel-crown",
      "enamel-highlight",
      "whole-tooth-overlay",
    ]);
    expect(tooth.querySelector('[data-anatomy-layer="enamel-highlight"]'))
      .toHaveAttribute("clip-path", expect.stringMatching(/^url\(#tooth-16-/));
  });

  it.each(["Implante", "Ponte", "Ausente"] as const)(
    "covers roots and crown for %s",
    (status) => {
      render(
        <AnatomicalTooth
          toothNumber={16}
          data={{ status, notes: "" }}
        />,
      );

      const overlay = screen.getByTestId("whole-tooth-overlay");
      const expectedPaths = ANATOMICAL_GEOMETRY.molar.frontal.roots.length + 1;
      expect(overlay).toHaveAttribute("data-status", status);
      expect(overlay.querySelectorAll("path")).toHaveLength(expectedPaths);
    },
  );

  it("uses a visible marker for a missing tooth", () => {
    render(
      <AnatomicalTooth
        toothNumber={16}
        data={{ status: "Ausente", notes: "" }}
      />,
    );

    expect(screen.getByTestId("missing-tooth-mark")).toBeInTheDocument();
  });

  it("uses unique tooth-prefixed paint ids for repeated instances", () => {
    render(
      <>
        <AnatomicalTooth toothNumber={16} data={{ status: "Saudável", notes: "" }} />
        <AnatomicalTooth toothNumber={16} data={{ status: "Saudável", notes: "" }} />
      </>,
    );

    const ids = Array.from(document.querySelectorAll("linearGradient, clipPath"))
      .map((definition) => definition.id);
    expect(ids.every((id) => id.startsWith("tooth-16-"))).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("flips lower teeth and exposes both supported sizes", () => {
    const { rerender } = render(
      <AnatomicalTooth
        toothNumber={36}
        data={{ status: "Saudável", notes: "" }}
        size="arch"
      />,
    );

    const lowerTooth = screen.getByRole("img", { name: /dente 36/i });
    expect(lowerTooth).toHaveClass("anatomical-tooth--arch");
    expect(lowerTooth.querySelector("[data-tooth-orientation]"))
      .toHaveAttribute("data-tooth-orientation", "lower");
    expect(lowerTooth.querySelector("[data-tooth-orientation]"))
      .toHaveAttribute("transform", "translate(0 76) scale(1 -1)");

    rerender(
      <AnatomicalTooth
        toothNumber={36}
        data={{ status: "Saudável", notes: "" }}
        size="editor"
      />,
    );
    expect(screen.getByRole("img", { name: /dente 36/i }))
      .toHaveClass("anatomical-tooth--editor");
  });
});
