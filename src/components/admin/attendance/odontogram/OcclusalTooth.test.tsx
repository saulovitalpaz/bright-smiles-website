import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OcclusalTooth } from "./OcclusalTooth";

describe("OcclusalTooth", () => {
  it("renders an oclusal image with the recorded central target", () => {
    render(
      <OcclusalTooth
        toothNumber={16}
        record={{
          notes: "",
          conditions: [{
            id: "c1",
            category: "achado",
            type: "carie",
            stage: "planejado",
            targets: [{ kind: "surface", face: "center", region: "incisalOcclusal" }],
          }],
        }}
      />,
    );

    const image = screen.getByRole("img", { name: /vista oclusal.*dente 16/i });
    expect(image).toHaveClass("occlusal-tooth--arch");
    expect(image.querySelector('[data-occlusal-face="center"]')).toHaveAttribute("data-condition-count", "1");
  });

  it("names the affected face, condition, and stage for assistive technology", () => {
    render(
      <OcclusalTooth
        toothNumber={16}
        record={{
          notes: "",
          conditions: [{
            id: "c1",
            category: "achado",
            type: "carie",
            stage: "planejado",
            targets: [{ kind: "surface", face: "center", region: "incisalOcclusal" }],
          }],
        }}
      />,
    );

    expect(screen.getByRole("img", {
      name: /vista oclusal do dente 16.*oclusal.*carie.*planejado/i,
    })).toBeInTheDocument();
  });
});
