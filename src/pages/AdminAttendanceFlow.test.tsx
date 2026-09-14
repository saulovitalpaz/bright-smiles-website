import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import AdminAttendanceDetail from "./AdminAttendanceDetail";

vi.mock("@/components/admin/AdminLayout", () => ({ default: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock("@/components/admin/PatientPicker", () => ({ PatientPicker: () => <div>Seletor de paciente</div> }));
vi.mock("@/components/admin/attendance/PhotoGallery", () => ({ default: () => null }));
vi.mock("@/components/admin/attendance/EvolutionTimeline", () => ({ default: () => null }));
vi.mock("@/components/admin/attendance/facial/FacialHarmonizationWorkspace", () => ({ default: () => null }));
vi.mock("@/components/admin/attendance/Odontogram", () => ({ default: ({ onPrint }: { onPrint?: () => void }) => onPrint ? <button onClick={onPrint}>Imprimir odontograma</button> : <div>Mapa de impressão</div> }));

beforeEach(() => { localStorage.setItem("admin_user", JSON.stringify({ name: "Profissional Teste", cro: "CRO teste", role: "admin" })); });
afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });
function mount() { return render(<MemoryRouter initialEntries={["/admin/consultas/new"]}><Routes><Route path="/admin/consultas/:id" element={<AdminAttendanceDetail />} /></Routes></MemoryRouter>); }

it("collapses all step-one fields together and preserves values when reopened", async () => {
  mount();
  const toggle = await screen.findByRole("button", { name: /Etapa 1/ });
  const procedure = screen.getByPlaceholderText("Ex: Harmonização Global");
  fireEvent.change(procedure, { target: { value: "Avaliação de teste" } });
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(procedure).not.toBeVisible();
  expect(screen.getByText("Retorno Desejado")).not.toBeVisible();
  expect(screen.getByText("Seletor de paciente")).not.toBeVisible();
  fireEvent.click(toggle);
  expect(procedure).toBeVisible();
  expect(procedure).toHaveValue("Avaliação de teste");
});

it("mounts the isolated odontogram print root before printing and clears it afterwards", async () => {
  const print = vi.spyOn(window, "print").mockImplementation(() => {
    expect(document.querySelector('[data-print-target="odontogram"]')).not.toBeNull();
  });
  let runFrame: FrameRequestCallback | undefined;
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    runFrame = callback;
    return 1;
  });
  const { container } = mount();
  fireEvent.click(await screen.findByRole("button", { name: "Imprimir odontograma" }));
  const logo = await waitFor(() => {
    const image = container.querySelector('[data-print-target="odontogram"] img');
    expect(image).not.toBeNull();
    return image as HTMLImageElement;
  });
  Object.defineProperty(logo, "complete", { configurable: true, value: false });
  expect(runFrame).toBeDefined();
  runFrame!(0);
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(print).not.toHaveBeenCalled();
  logo.dispatchEvent(new Event("load"));
  await waitFor(() => expect(print).toHaveBeenCalledOnce());
  expect(container.querySelector('.print-root')).toHaveTextContent("Profissional Teste");
  fireEvent(window, new Event("afterprint"));
  expect(container.querySelector('.print-root')).toBeNull();
});
