import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminDocuments from "./AdminDocuments";
import AdminPrescription from "./AdminPrescription";

vi.mock("@/components/admin/AdminLayout", () => ({ default: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock("@/components/admin/attendance/AttendanceWorkspace", () => ({
  AttendanceWorkspace: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AttendanceSection: ({ children }: { children: ReactNode }) => <section>{children}</section>,
}));
vi.mock("@/components/admin/PatientPicker", () => ({ PatientPicker: () => <div>Seletor de paciente</div> }));
vi.mock("@/components/admin/RichTextEditor", () => ({
  default: ({ content, onChange }: { content: string; onChange: (value: string) => void }) => (
    <textarea aria-label="Conteúdo" value={content} onChange={(event) => onChange(event.target.value)} />
  ),
}));
vi.mock("@/components/admin/attendance/Odontogram", () => ({ default: () => <div>Odontograma</div> }));
vi.mock("@/components/PrescriptionGenerator", () => ({ DownloadPrescriptionButton: () => null }));
vi.mock("@/components/ConsentDialog", () => ({ ConsentDialog: () => null }));
vi.mock("@/lib/api", () => ({ fetchClient: vi.fn(() => Promise.resolve({ ok: true, json: async () => [] })) }));

beforeEach(() => {
  localStorage.setItem("admin_user", JSON.stringify({ name: "Profissional Teste", cro: "CRO teste", role: "admin" }));
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

function holdPrintFrame() {
  let callback: FrameRequestCallback | undefined;
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((next) => {
    callback = next;
    return 1;
  });
  return () => {
    expect(callback).toBeDefined();
    callback!(0);
  };
}

async function assertPrintWaitsForLogo(targetSelector: string, startPrint: () => void) {
  const print = vi.spyOn(window, "print").mockImplementation(() => {
    expect(document.querySelector(targetSelector)).not.toBeNull();
  });
  const runFrame = holdPrintFrame();
  startPrint();
  const target = await waitFor(() => {
    const found = document.querySelector(targetSelector);
    expect(found).not.toBeNull();
    return found as HTMLElement;
  });
  const logo = target.querySelector("img");
  expect(logo).not.toBeNull();
  Object.defineProperty(logo, "complete", { configurable: true, value: false });
  runFrame();
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(print).not.toHaveBeenCalled();
  logo!.dispatchEvent(new Event("load"));
  await waitFor(() => expect(print).toHaveBeenCalledOnce());
  fireEvent(window, new Event("afterprint"));
  await waitFor(() => expect(document.querySelector(targetSelector)).toBeNull());
}

describe("browser printable flows", () => {
  it("waits for the Terms and Documents logo before printing", async () => {
    render(<AdminDocuments />);
    await assertPrintWaitsForLogo('[data-print-target="document"]', () => {
      fireEvent.click(screen.getByRole("button", { name: "Documento para preenchimento manual" }));
      fireEvent.click(screen.getByRole("button", { name: /Apenas Imprimir/ }));
    });
  });

  it("waits for the Prescription logo before printing", async () => {
    render(<MemoryRouter><AdminPrescription /></MemoryRouter>);
    fireEvent.change(screen.getByRole("textbox", { name: "Conteúdo" }), { target: { value: "Receita de teste" } });
    await assertPrintWaitsForLogo('[data-print-target="prescription"]', () => {
      fireEvent.click(screen.getByRole("button", { name: /Imprimir/ }));
    });
  });
});
