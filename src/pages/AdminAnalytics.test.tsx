import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchClient } from "@/lib/api";
import AdminAnalytics from "./AdminAnalytics";
vi.mock("@/components/admin/AdminLayout", () => ({ default: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock("@/lib/api", () => ({ fetchClient: vi.fn() }));
const mock = vi.mocked(fetchClient);
describe("Analytics clínico", () => {
  beforeEach(() => { mock.mockReset(); });
  it("apresenta indicadores clínicos e financeiros e resume o site", async () => {
    mock.mockResolvedValue({ ok: true, json: async () => ({ clinic: { appointments: [{status: "attended", type: "odontologia", count: 3}], procedures: [{name: "Limpeza", count: 3}], treatments: [], patients: 2, plans: {pending: 4, completed: 2} }, finance: {income: {count: 1, total: 100, categories: {Consulta: {count: 1, total: 100}}}, expense: {count: 0, total: 0, categories: {}}, pending: {count: 0, total: 0} }, website: {visits: 12, leads: 2} }) } as Response);
    render(<AdminAnalytics />);
    expect(await screen.findByText("Limpeza")).toBeInTheDocument();
    expect(screen.getByText("Consultas realizadas")).toBeInTheDocument();
    expect(screen.getByText("Planos de tratamento")).toBeInTheDocument();
    expect(screen.getByText("Site e solicitações")).toBeInTheDocument();
    expect(screen.queryByText("Dispositivos")).not.toBeInTheDocument();
  });
  it("permite tentar novamente após erro", async () => {
    mock.mockRejectedValue(new Error("offline"));
    render(<AdminAnalytics />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar");
  });
});
