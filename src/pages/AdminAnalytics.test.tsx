import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchClient } from "@/lib/api";
import AdminAnalytics from "./AdminAnalytics";

vi.mock("@/components/admin/AdminLayout", () => ({
    default: ({ children, title }: { children: ReactNode; title: string }) => (
        <main aria-label={title}>{children}</main>
    ),
}));

vi.mock("@/lib/api", () => ({
    API_URL: "https://api.example.com",
    fetchClient: vi.fn(),
}));

const fetchClientMock = vi.mocked(fetchClient);
const fetchMock = vi.fn();

const statsResponse = {
    totalVisits: 12,
    uniqueVisitors: 5,
    conversionRate: "40.00",
    leadsCount: 2,
    sources: {
        Google: 6,
        Instagram: 3,
        Direto: 3,
    },
    locations: {
        "Belo Horizonte": 7,
        "Nova Lima": 5,
    },
    regions: {
        MG: 12,
    },
    nearbyRegions: [
        { city: "Governador Valadares", state: "MG", latitude: -18.85, longitude: -41.95, distanceKm: 0, count: 2 },
        { city: "Ipatinga", state: "MG", latitude: -19.47, longitude: -42.54, distanceKm: 93, count: 8 },
    ],
    topPaths: {
        "/": 5,
        "/tratamentos": 4,
        "/tratamento/clareamento": 3,
    },
    devices: {
        mobile: 8,
        desktop: 4,
    },
};

const response = (body: unknown, ok = true, status = ok ? 200 : 500) => ({
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
}) as unknown as Response;

describe("AdminAnalytics", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal("fetch", fetchMock);
        fetchClientMock.mockResolvedValue(response(statsResponse));
    });

    it("loads protected stats with fetchClient and renders aggregate analytics", async () => {
        render(<AdminAnalytics />);

        await waitFor(() => {
            expect(fetchClientMock).toHaveBeenCalledWith("/analytics/stats");
        });
        expect(fetchMock).not.toHaveBeenCalled();

        expect(await screen.findByText("40.00%")).toBeInTheDocument();
        expect(screen.getByText("/tratamentos")).toBeInTheDocument();
        expect(screen.getByText("mobile")).toBeInTheDocument();
        expect(screen.getByText("Governador Valadares, MG")).toBeInTheDocument();
        expect(screen.getByText(/até 200 km da clínica/i)).toBeInTheDocument();
        const nearbyCard = screen.getByText("Regiões Aproximadas").closest("div[data-admin-card]");
        expect(nearbyCard).not.toBeNull();
        expect(nearbyCard!.textContent!.indexOf("Governador Valadares")).toBeLessThan(nearbyCard!.textContent!.indexOf("Ipatinga"));
        expect(nearbyCard).toHaveTextContent("20%");
        expect(nearbyCard).toHaveTextContent("80%");
    });

    it("shows a recoverable error when the protected request rejects", async () => {
        fetchClientMock.mockRejectedValueOnce(new Error("offline"));
        render(<AdminAnalytics />);
        expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar as métricas.");
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("shows a retry state when protected stats fail", async () => {
        const user = userEvent.setup();

        fetchClientMock
            .mockResolvedValueOnce(response({ error: "unauthorized" }, false, 401))
            .mockResolvedValueOnce(response(statsResponse));

        render(<AdminAnalytics />);

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Não foi possível carregar as métricas.",
        );

        await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

        await waitFor(() => {
            expect(fetchClientMock).toHaveBeenCalledTimes(2);
        });
        expect(await screen.findByText("40.00%")).toBeInTheDocument();
    });
});
