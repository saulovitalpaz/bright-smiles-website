import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { fetchClient } from "@/lib/api";
import AdminPatients from "./AdminPatients";

vi.mock("@/components/admin/AdminLayout", () => ({ default: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock("@/lib/api", () => ({ fetchClient: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
    vi.mocked(fetchClient).mockImplementation(async path => ({ ok: true, json: async () => String(path).startsWith("/patients") ? [{ id: 1, name: "Paciente fictício", cpf: "00000000000" }] : [] }) as Response);
});

it("takes Edit and New directly to the patient form without submitting changes", async () => {
    render(<MemoryRouter><AdminPatients /></MemoryRouter>);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Editar Paciente fictício" }));
    expect(screen.getByLabelText("Nome *")).toHaveValue("Paciente fictício");
    expect(screen.getByLabelText("Nome *")).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Novo paciente" }));
    expect(screen.getByLabelText("Nome *")).toHaveValue("");
    expect(screen.getByLabelText("Nome *")).toHaveFocus();
    expect(vi.mocked(fetchClient).mock.calls.some(([, options]) => options?.method)).toBe(false);
});

it("loads, changes and clears the patient's sex in the edit form", async () => {
    vi.mocked(fetchClient).mockImplementation(async path => ({ ok: true, json: async () => String(path).startsWith("/patients") ? [{ id: 1, name: "Paciente fictício", cpf: "00000000000", sex: "female" }] : [] }) as Response);
    render(<MemoryRouter><AdminPatients /></MemoryRouter>);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Editar Paciente fictício" }));
    expect(screen.getByLabelText("Sexo")).toHaveValue("female");
    await user.selectOptions(screen.getByLabelText("Sexo"), "male");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    const saved = vi.mocked(fetchClient).mock.calls.find(([, options]) => options?.method === "PUT");
    expect(JSON.parse(String(saved?.[1]?.body))).toMatchObject({ sex: "male" });
    await user.click(await screen.findByRole("button", { name: "Editar Paciente fictício" }));
    await user.selectOptions(screen.getByLabelText("Sexo"), "");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    const cleared = vi.mocked(fetchClient).mock.calls.filter(([, options]) => options?.method === "PUT").at(-1);
    expect(JSON.parse(String(cleared?.[1]?.body))).toMatchObject({ sex: null });
    await user.click(screen.getByRole("button", { name: "Novo paciente" }));
    expect(screen.getByLabelText("Sexo")).toHaveValue("");
});

it("loads and saves weight in the patient record and allows clearing it", async () => {
    vi.mocked(fetchClient).mockImplementation(async path => ({ ok: true, json: async () => String(path).startsWith("/patients") ? [{ id: 1, name: "Paciente fictício", cpf: "00000000000", weight: "72.5" }] : [] }) as Response);
    render(<MemoryRouter><AdminPatients /></MemoryRouter>);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Editar Paciente fictício" }));
    const weight = screen.getByLabelText("Peso (kg)");
    expect(weight).toHaveValue("72.5");
    await user.clear(weight); await user.type(weight, "73,2");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(JSON.parse(String(vi.mocked(fetchClient).mock.calls.find(([, options]) => options?.method === "PUT")?.[1]?.body))).toMatchObject({ weight: "73,2" });
    await user.click(await screen.findByRole("button", { name: "Editar Paciente fictício" }));
    await user.clear(screen.getByLabelText("Peso (kg)"));
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(JSON.parse(String(vi.mocked(fetchClient).mock.calls.filter(([, options]) => options?.method === "PUT").at(-1)?.[1]?.body))).toMatchObject({ weight: null });
});
