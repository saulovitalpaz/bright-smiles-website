import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchClient } from "@/lib/api";
import EvolutionTimeline from "./EvolutionTimeline";
import FaceMap, { FaceRegionData } from "./FaceMap";

vi.mock("@/lib/api", () => ({ fetchClient: vi.fn() }));

const fetchClientMock = vi.mocked(fetchClient);

const REGION_IDS = [
  "frontal",
  "glabela",
  "periorbital",
  "malar",
  "nasolabial",
  "labios",
  "mento",
  "mandibula",
  "pescoço",
];

function renderFaceMap(
  data: Record<string, FaceRegionData> = {},
  onChange = vi.fn(),
) {
  return {
    onChange,
    ...render(<FaceMap data={data} onChange={onChange} />),
  };
}

function getSvgRegion(container: HTMLElement, id: string): SVGGElement {
  const region = container.querySelector<SVGGElement>(
    `svg [data-face-region="${id}"]`,
  );
  expect(region).not.toBeNull();
  return region as SVGGElement;
}

function getTextControl(container: HTMLElement, id: string): HTMLButtonElement {
  const control = container.querySelector<HTMLButtonElement>(
    `button[data-face-region-control="${id}"]`,
  );
  expect(control).not.toBeNull();
  return control as HTMLButtonElement;
}

describe("FaceMap anatomical interaction", () => {
  beforeEach(() => fetchClientMock.mockReset());

  it("renders exactly the nine persisted region IDs", () => {
    const { container } = renderFaceMap();
    const renderedIds = Array.from(
      container.querySelectorAll<SVGGElement>("svg [data-face-region]"),
      (region) => region.dataset.faceRegion,
    );

    expect(renderedIds).toEqual(REGION_IDS);
  });

  it("uses one shared interactive group for both malar sides", async () => {
    const user = userEvent.setup();
    const { container } = renderFaceMap();
    const malarRegion = getSvgRegion(container, "malar");

    expect(malarRegion.querySelectorAll("[data-side]")).toHaveLength(2);
    await user.click(malarRegion);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /malar \/ zigomático/i })).toBeInTheDocument();
  });

  it.each(["Enter", " "])("opens a region with the %s key", (key) => {
    const { container } = renderFaceMap();
    const frontalRegion = getSvgRegion(container, "frontal");

    expect(frontalRegion).toHaveAttribute("role", "button");
    expect(frontalRegion).toHaveAttribute("tabindex", "0");
    fireEvent.keyDown(frontalRegion, { key });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("immutably merges edits while preserving historical keys", () => {
    const frontal = { product: "", dose: "8U", notes: "retorno" };
    const historical = { product: "Legado", dose: "", notes: "preservar" };
    const data = { frontal, "historical-extra": historical };
    const { container, onChange } = renderFaceMap(data);

    fireEvent.click(getTextControl(container, "frontal"));
    fireEvent.change(screen.getByLabelText("Produto"), {
      target: { value: "Toxina botulínica" },
    });

    const nextData = onChange.mock.calls[0][0] as Record<string, FaceRegionData>;
    expect(nextData).not.toBe(data);
    expect(nextData.frontal).not.toBe(frontal);
    expect(nextData.frontal).toEqual({
      product: "Toxina botulínica",
      dose: "8U",
      notes: "retorno",
    });
    expect(nextData["historical-extra"]).toBe(historical);
    expect(data.frontal).toEqual({ product: "", dose: "8U", notes: "retorno" });
  });

  it("treats a notes-only region as filled", () => {
    const { container } = renderFaceMap({
      mento: { product: "", dose: "", notes: "Reavaliar em 15 dias" },
    });
    const control = getTextControl(container, "mento");

    expect(control).toHaveAttribute("data-filled", "true");
    expect(within(control).getByText("Preenchido")).toBeInTheDocument();
    expect(getSvgRegion(container, "mento")).toHaveAttribute("data-filled", "true");
  });

  it("does not expose editing or open a form in read-only mode", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FaceMap
        data={{
          labios: { product: "", dose: "", notes: "Assimetria discreta" },
        }}
        onChange={onChange}
        readOnly
      />,
    );

    const legacyControl = screen.queryByRole("button", { name: /lábios/i });
    if (legacyControl) await user.click(legacyControl);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /lábios/i })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Resumo Clínico" })).toBeInTheDocument();
    expect(screen.getByText("Assimetria discreta")).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("clears an open selection when permissions change to read-only", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container, rerender } = render(
      <FaceMap data={{}} onChange={onChange} />,
    );

    await user.click(getTextControl(container, "labios"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    rerender(<FaceMap data={{}} onChange={onChange} readOnly />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    rerender(<FaceMap data={{}} onChange={onChange} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("uses unique summary labels when history renders multiple maps", () => {
    const data = {
      labios: { product: "Preenchedor", dose: "1 ml", notes: "" },
    };
    const { container } = render(
      <>
        <FaceMap data={data} onChange={() => undefined} readOnly compact />
        <FaceMap data={data} onChange={() => undefined} readOnly compact />
      </>,
    );

    const summaries = screen.getAllByRole("heading", { name: "Resumo Clínico" });
    const ids = summaries.map((summary) => summary.id);
    const sections = container.querySelectorAll("section[aria-labelledby]");

    expect(new Set(ids).size).toBe(2);
    expect(sections[0]).toHaveAttribute("aria-labelledby", ids[0]);
    expect(sections[1]).toHaveAttribute("aria-labelledby", ids[1]);
  });

  it("keeps the card, SVG, controls and dialog structurally mobile-safe", () => {
    const { container } = renderFaceMap();

    expect(container.querySelector("[data-face-map]")).toHaveClass("min-w-0", "max-w-full");
    expect(container.querySelector("svg[aria-labelledby]")).toHaveClass(
      "w-full",
      "max-w-full",
      "h-auto",
    );
    expect(container.querySelector("[data-face-region-controls]")).toHaveClass(
      "grid-cols-1",
      "sm:grid-cols-2",
      "xl:grid-cols-1",
    );

    fireEvent.click(getTextControl(container, "frontal"));
    expect(screen.getByTestId("face-map-fields")).toHaveClass(
      "grid-cols-1",
      "sm:grid-cols-2",
    );
  });

  it("offers a compact presentation without transform scaling", () => {
    const { container } = render(
      <FaceMap data={{}} onChange={() => undefined} readOnly compact />,
    );
    const faceMap = container.querySelector("[data-face-map]");

    expect(faceMap).toHaveAttribute("data-compact", "true");
    expect(faceMap?.className).not.toMatch(/scale-|-[m][btxy]-/);
  });

  it("is consumed compactly by the evolution timeline without transform scaling", async () => {
    const user = userEvent.setup();
    fetchClientMock.mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 17,
          date: "2026-07-01T12:00:00.000Z",
          procedure: "Harmonização",
          notes: "",
          photos: [],
          dentalNotes: {},
          facialNotes: {},
          appointmentType: "harmonizacao",
        },
      ],
    } as Response);

    const { container } = render(<EvolutionTimeline patientId={42} />);
    await user.click(await screen.findByRole("button", { name: /comparar detalhes/i }));

    const timelineFaceMap = container.querySelector("[data-face-map]");
    expect(timelineFaceMap).toHaveAttribute("data-compact", "true");
    expect(timelineFaceMap?.parentElement?.className).not.toMatch(/scale-|-[m][btxy]-/);
  });
});
