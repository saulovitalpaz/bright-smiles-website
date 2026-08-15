import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { API_URL, fetchClient } from "@/lib/api";
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
    topPaths: {
        "/": 5,
        "/blog": 4,
        "/blog/clareamento": 3,
    },
    devices: {
        mobile: 8,
        desktop: 4,
    },
};

const postsResponse = [
    { id: 1, title: "Clareamento dental", views: 14 },
    { id: 2, title: "Lentes de contato dental", views: 9 },
];

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
        fetchMock.mockResolvedValue(response(postsResponse));
    });

    it("loads protected stats with fetchClient and renders aggregate analytics", async () => {
        render(<AdminAnalytics />);

        await waitFor(() => {
            expect(fetchClientMock).toHaveBeenCalledWith("/analytics/stats");
        });
        expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/posts`);

        expect(await screen.findByText("40.00%")).toBeInTheDocument();
        expect(screen.getByText("Clareamento dental")).toBeInTheDocument();
        expect(screen.getByText("/blog")).toBeInTheDocument();
        expect(screen.getByText("mobile")).toBeInTheDocument();
        expect(screen.getByText("MG")).toBeInTheDocument();
    });

    it("keeps metrics visible when the posts request fails", async () => {
        fetchMock.mockRejectedValueOnce(new Error("posts offline"));

        render(<AdminAnalytics />);

        await waitFor(() => {
            expect(fetchClientMock).toHaveBeenCalledWith("/analytics/stats");
        });

        expect(await screen.findByText("40.00%")).toBeInTheDocument();
        expect(await screen.findByText(/não foi possível carregar os posts/i)).toBeInTheDocument();
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
