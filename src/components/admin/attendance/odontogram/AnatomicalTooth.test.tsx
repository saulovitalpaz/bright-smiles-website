import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AnatomicalTooth } from "./AnatomicalTooth";

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
    expect(tooth.querySelectorAll("[data-anatomy-layer]").length).toBeGreaterThanOrEqual(3);
  });

  it("uses a visible marker for a missing tooth", () => {
    render(
      <AnatomicalTooth
        toothNumber={16}
        data={{ status: "Ausente", notes: "" }}
      />,
    );

    expect(screen.getByTestId("missing-tooth-mark")).toBeInTheDocument();
  });
});
