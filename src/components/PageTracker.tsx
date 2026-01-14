import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { API_URL } from "@/lib/api";

const PageTracker = () => {
    const location = useLocation();

    useEffect(() => {
        const trackPage = async () => {
            try {
                // Determine source from URL params if any (e.g. ?utm_source=instagram)
                const searchParams = new URLSearchParams(window.location.search);
                const source = searchParams.get('utm_source') ||
                    searchParams.get('source') ||
                    (document.referrer.includes('instagram.com') ? 'Instagram' :
                        document.referrer.includes('google.com') ? 'Google' : 'Direto');

                await fetch(`${API_URL}/analytics`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        path: location.pathname,
                        type: 'pageview',
                        source: source
                    })
                });
            } catch (error) {
                // Silent fail for analytics
            }
        };

        trackPage();
    }, [location.pathname]);

    return null;
};

export default PageTracker;
