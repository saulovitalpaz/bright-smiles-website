import type { ReactNode } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { fetchClient } from "@/lib/api";
import AdminAttendanceDetail from "./AdminAttendanceDetail";

vi.mock("@/components/admin/AdminLayout", () => ({ default: ({ children }: { children: ReactNode }) => <main><a href="/admin/consultas">Sair da consulta</a>{children}</main> }));
vi.mock("@/components/admin/PatientPicker", () => ({ PatientPicker: () => <div>Seletor de paciente</div> }));
vi.mock("@/components/admin/attendance/PhotoGallery", () => ({ default: () => null }));
vi.mock("@/components/admin/attendance/EvolutionTimeline", () => ({ default: () => null }));
vi.mock("@/components/admin/attendance/facial/FacialHarmonizationWorkspace", () => ({ default: ({ onChange, readOnly }: { onChange?: (value: unknown) => void; readOnly?: boolean }) => !readOnly && onChange ? <button onClick={() => onChange({ version: 2, applications: [], legacyRegions: { frontal: { product: "Produto", dose: "1 ml", notes: "Aplicação" } } })}>Alterar facemap</button> : null }));
vi.mock("@/components/admin/attendance/Odontogram", () => ({ default: ({ onChange, onPrint, readOnly }: { onChange?: (value: unknown) => void; onPrint?: () => void; readOnly?: boolean }) => <>{!readOnly && <button onClick={() => onChange?.({ version: 2, dentition: "permanent", teeth: { "11": { notes: "alterado", conditions: [] } } })}>Alterar odontograma</button>}{onPrint ? <button onClick={onPrint}>Imprimir odontograma</button> : <div>Mapa de impressão</div>}</> }));
vi.mock("@/lib/api", () => ({ API_URL: "https://api.example.com", fetchClient: vi.fn() }));

const fetchClientMock = vi.mocked(fetchClient);
const response = (body: unknown, ok = true) => ({ ok, json: vi.fn().mockResolvedValue(body) }) as unknown as Response;

beforeEach(() => {
  fetchClientMock.mockReset();
  localStorage.setItem("admin_user", JSON.stringify({ name: "Profissional Teste", cro: "CRO teste", role: "admin" }));
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); localStorage.clear(); });
function mount(path = "/admin/consultas/new") {
  const router = createMemoryRouter([
    { path: "/admin/consultas/:id", element: <AdminAttendanceDetail /> },
    { path: "/admin/consultas", element: <div>Lista de consultas</div> },
  ], { initialEntries: [path] });
  return { ...render(<RouterProvider router={router} />), router };
}

const persistedAppointment = {
  id: 12,
  patientId: 7,
  patientName: "Paciente Teste",
  procedure: "Avaliação",
  professional: "Profissional Teste",
  appointmentType: "ambos",
  dentalNotes: { version: 2, dentition: "permanent", teeth: {} },
  facialNotes: { version: 2, applications: [] },
};

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

it("autosaves clinical maps only after a persisted appointment id", async () => {
  fetchClientMock
    .mockResolvedValueOnce(response(persistedAppointment))
    .mockResolvedValueOnce(response(persistedAppointment))
    .mockResolvedValueOnce(response(persistedAppointment));
  mount("/admin/consultas/12");
  const changeOdontogram = await screen.findByRole("button", { name: "Alterar odontograma" });
  vi.useFakeTimers();
  fireEvent.click(changeOdontogram);
  await vi.advanceTimersByTimeAsync(1000);

  expect(fetchClientMock).toHaveBeenCalledTimes(2);
  expect(fetchClientMock).toHaveBeenLastCalledWith("/appointments/12", expect.objectContaining({
    method: "PUT",
    body: expect.stringContaining('"dentalNotes"'),
  }));
  expect(screen.getByText("Salvo automaticamente")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Alterar facemap" }));
  await vi.advanceTimersByTimeAsync(1000);
  expect(fetchClientMock).toHaveBeenCalledTimes(3);
  expect(fetchClientMock).toHaveBeenLastCalledWith("/appointments/12", expect.objectContaining({
    method: "PUT",
    body: expect.stringContaining('"facialNotes"'),
  }));
  expect(screen.getByText("Salvo automaticamente")).toBeInTheDocument();
  const exitEvent = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(exitEvent);
  expect(exitEvent.defaultPrevented).toBe(false);
});

it("does not autosave a new appointment before the first manual save", async () => {
  mount();
  fireEvent.click(await screen.findByRole("button", { name: "Alterar odontograma" }));
  vi.useFakeTimers();
  await vi.advanceTimersByTimeAsync(1500);
  expect(fetchClientMock).not.toHaveBeenCalled();
});

it("does not autosave for read-only users", async () => {
  localStorage.setItem("admin_user", JSON.stringify({ name: "Gestor", role: "manager" }));
  fetchClientMock.mockResolvedValueOnce(response(persistedAppointment));
  mount("/admin/consultas/12");
  await screen.findByText("Paciente Teste");
  expect(screen.queryByRole("button", { name: "Alterar odontograma" })).not.toBeInTheDocument();
  expect(fetchClientMock).toHaveBeenCalledTimes(1);
});

it("prevents browser exit while a clinical change is pending", async () => {
  fetchClientMock.mockResolvedValueOnce(response(persistedAppointment));
  mount("/admin/consultas/12");
  fireEvent.click(await screen.findByRole("button", { name: "Alterar odontograma" }));
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
});

it("blocks programmatic navigation when the immediate autosave fails", async () => {
  fetchClientMock
    .mockResolvedValueOnce(response(persistedAppointment))
    .mockRejectedValueOnce(new Error("offline"));
  const { router } = mount("/admin/consultas/12");
  fireEvent.click(await screen.findByRole("button", { name: "Alterar facemap" }));
  await router.navigate("/admin/consultas");

  expect(await screen.findByRole("alertdialog")).toHaveTextContent("Alterações clínicas não salvas");
  expect(router.state.location.pathname).toBe("/admin/consultas/12");
  expect(screen.getByRole("button", { name: "Permanecer" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Descartar e sair" })).toBeInTheDocument();
});

it("flushes pending clinical data before programmatic navigation proceeds", async () => {
  fetchClientMock
    .mockResolvedValueOnce(response(persistedAppointment))
    .mockResolvedValueOnce(response(persistedAppointment));
  const { router } = mount("/admin/consultas/12");
  fireEvent.click(await screen.findByRole("button", { name: "Alterar odontograma" }));
  await router.navigate("/admin/consultas");

  expect(fetchClientMock).toHaveBeenCalledTimes(2);
  expect(await screen.findByText("Lista de consultas")).toBeInTheDocument();
  expect(router.state.location.pathname).toBe("/admin/consultas");
});

it("waits for an in-flight autosave before the manual save and locks clinical editing", async () => {
  let releaseAutosave: ((response: Response) => void) | undefined;
  fetchClientMock
    .mockResolvedValueOnce(response(persistedAppointment))
    .mockImplementationOnce(() => new Promise<Response>((resolve) => { releaseAutosave = resolve; }))
    .mockResolvedValueOnce(response({
      ...persistedAppointment,
      dentalNotes: { version: 2, dentition: "permanent", teeth: { "11": { notes: "alterado", conditions: [] } } },
    }));
  mount("/admin/consultas/12");
  const changeOdontogram = await screen.findByRole("button", { name: "Alterar odontograma" });
  vi.useFakeTimers();
  fireEvent.click(changeOdontogram);
  await vi.advanceTimersByTimeAsync(1000);
  expect(fetchClientMock).toHaveBeenCalledTimes(2);

  fireEvent.click(screen.getByRole("button", { name: "Salvar Prontuário Atualizado" }));
  await Promise.resolve();
  expect(fetchClientMock).toHaveBeenCalledTimes(2);
  expect(screen.queryByRole("button", { name: "Alterar odontograma" })).not.toBeInTheDocument();

  await act(async () => {
    releaseAutosave?.(response(persistedAppointment));
    await Promise.resolve();
    await Promise.resolve();
  });
  expect(fetchClientMock).toHaveBeenCalledTimes(3);
});

it("flushes pending clinical data before deleting and then leaves without blocking", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  fetchClientMock
    .mockResolvedValueOnce(response(persistedAppointment))
    .mockResolvedValueOnce(response(persistedAppointment))
    .mockResolvedValueOnce(response({}));
  const { router } = mount("/admin/consultas/12");
  fireEvent.click(await screen.findByRole("button", { name: "Alterar odontograma" }));
  fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

  await waitFor(() => expect(fetchClientMock).toHaveBeenCalledTimes(3));
  expect(fetchClientMock.mock.calls[1][0]).toBe("/appointments/12");
  expect(fetchClientMock.mock.calls[1][1]).toEqual(expect.objectContaining({ method: "PUT" }));
  expect(fetchClientMock.mock.calls[2][0]).toBe("/appointments/12");
  expect(fetchClientMock.mock.calls[2][1]).toEqual(expect.objectContaining({ method: "DELETE" }));
  expect(await screen.findByText("Lista de consultas")).toBeInTheDocument();
  expect(router.state.location.pathname).toBe("/admin/consultas");
  expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
});
