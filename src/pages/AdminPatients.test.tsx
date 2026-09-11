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
