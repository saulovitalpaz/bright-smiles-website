import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { FinanceInvoiceAction } from "./FinanceInvoiceAction";
import { fetchClient } from "@/lib/api";
import { needsInvoiceDocument } from "@/lib/financeInvoices";

vi.mock("@/lib/api", () => ({ fetchClient: vi.fn(), API_URL: "https://api.example.test" }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
const reference = "bucket://financial/3/test.pdf";
beforeEach(() => vi.clearAllMocks());

async function openAndUpload() {
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Anexar nota" }));
    await user.upload(screen.getByLabelText("Documento da nota fiscal"), new File(["%PDF-1.7"], "nota.pdf", { type: "application/pdf" }));
    await user.click(screen.getByRole("button", { name: "Salvar nota" }));
}

it("sends the real document and updates the invoice only after server success", async () => {
    vi.mocked(fetchClient).mockResolvedValue({ ok: true, json: async () => ({ nfeUrl: reference }) } as Response);
    const onSaved = vi.fn();
    render(<FinanceInvoiceAction transaction={{ id: 7, type: "income" }} onSaved={onSaved} />);
    await openAndUpload();
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(7, reference));
    const [endpoint, options] = vi.mocked(fetchClient).mock.calls[0];
    expect(endpoint).toBe("/finance/nfe");
    const body = options?.body as FormData;
    expect(body.get("transactionId")).toBe("7");
    expect(body.get("file")).toBeInstanceOf(File);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("keeps the dialog and file available for retry when the API fails", async () => {
    vi.mocked(fetchClient).mockResolvedValue({ ok: false, status: 500, json: async () => ({}) } as Response);
    const onSaved = vi.fn();
    render(<FinanceInvoiceAction transaction={{ id: 7, type: "income" }} onSaved={onSaved} />);
    await openAndUpload();
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível anexar");
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Salvar nota" })).toBeEnabled();
});

it("opens attached invoices through the authenticated financial asset route", () => {
    render(<FinanceInvoiceAction transaction={{ id: 7, type: "income", nfeUrl: reference }} onSaved={vi.fn()} />);
    expect(screen.getByRole("link", { name: "Ver nota" })).toHaveAttribute("href", `https://api.example.test/financial-assets?reference=${encodeURIComponent(reference)}`);
});

it("does not treat mock references or voided transactions as fiscal documents", () => {
    for (const nfeUrl of ["", "mock-data", "javascript:alert(1)", "https://example.test/mock.pdf", "bucket://public/3/test.pdf"]) {
        expect(needsInvoiceDocument({ type: "income", nfeUrl })).toBe(true);
    }
    expect(needsInvoiceDocument({ type: "income", nfeUrl: reference })).toBe(false);
    expect(needsInvoiceDocument({ type: "income", paymentStatus: "voided" })).toBe(false);
    expect(needsInvoiceDocument({ type: "expense" })).toBe(false);
});
