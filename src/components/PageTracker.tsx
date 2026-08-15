import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackAnalyticsEvent } from "@/lib/analytics";

const PageTracker = () => {
    const location = useLocation();

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const source = searchParams.get("utm_source") ||
            searchParams.get("source") ||
            (document.referrer.includes("instagram.com") ? "Instagram" :
                document.referrer.includes("google.com") ? "Google" : "Direto");

        trackAnalyticsEvent({
            path: location.pathname,
            type: "pageview",
            source,
        });
    }, [location.pathname]);

    return null;
};

export default PageTracker;
