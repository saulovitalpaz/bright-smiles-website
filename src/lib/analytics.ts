import { API_URL } from "@/lib/api";

export type AnalyticsEventType = "pageview" | "blog_view" | "story_view";

export interface AnalyticsEvent {
    type: AnalyticsEventType;
    path: string;
    source?: string;
}

export const trackAnalyticsEvent = (event: AnalyticsEvent): void => {
    void fetch(`${API_URL}/analytics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify(event),
    }).catch(() => undefined);
};
