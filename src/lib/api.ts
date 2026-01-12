const getApiUrl = () => {
    // 1. Smart fallback based on browser URL (Prioridade para produção)
    if (typeof window !== "undefined") {
        const hostname = window.location.hostname;
        if (hostname.includes("odontoeharmonizacao.com.br") || hostname.includes("railway.app")) {
            return "https://backend-production-e175.up.railway.app";
        }
    }

    // 2. Check for environment variable (Vite approach)
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

    // 3. Produção como fallback final (removido localhost)
    return "https://backend-production-e175.up.railway.app";
};

export const API_URL = getApiUrl();
