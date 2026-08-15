import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { API_URL } from "@/lib/api";

type AnalyticsModule = typeof import("./analytics");

const fetchMock = vi.fn();

async function loadAnalyticsModule(): Promise<AnalyticsModule> {
    const module = await import("./analytics").catch(() => null);
    expect(module?.trackAnalyticsEvent).toBeTypeOf("function");
    return module as AnalyticsModule;
}

describe("trackAnalyticsEvent", () => {
    beforeEach(() => {
        fetchMock.mockReset();
        vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("sends a normalized event with keepalive", async () => {
        const { trackAnalyticsEvent } = await loadAnalyticsModule();

        fetchMock.mockResolvedValueOnce({ ok: true });

        trackAnalyticsEvent({ type: "pageview", path: "/blog", source: "Google" });

        expect(fetchMock).toHaveBeenCalledWith(
            `${API_URL}/analytics`,
            expect.objectContaining({
                method: "POST",
                keepalive: true,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "pageview",
                    path: "/blog",
                    source: "Google",
                }),
            }),
        );
    });

    it("silently handles fetch failures", async () => {
        const { trackAnalyticsEvent } = await loadAnalyticsModule();

        fetchMock.mockRejectedValueOnce(new Error("offline"));

        expect(() => {
            trackAnalyticsEvent({ type: "story_view", path: "/story/12", source: "Direto" });
        }).not.toThrow();

        await Promise.resolve();
    });
});
