import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AppointmentForm from "./AppointmentForm";

const { toast } = vi.hoisted(() => ({ toast: vi.fn() }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast }) }));

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); toast.mockReset(); });

describe("homepage appointment request", () => {
  it("retains the form and does not announce success or open WhatsApp after HTTP rejection", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 429 }));
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<AppointmentForm />);
    fireEvent.change(screen.getByLabelText("Nome completo *"), { target: { value: "Pessoa Teste" } });
    fireEvent.change(screen.getByLabelText("Telefone / WhatsApp *"), { target: { value: "33999990000" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar e Agendar" }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ variant: "destructive" })));
    expect(open).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Nome completo *")).toHaveValue("Pessoa Teste");
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível enviar");
  });
});
