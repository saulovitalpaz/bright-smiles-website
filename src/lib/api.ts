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

export const fetchClient = async (endpoint: string, options: RequestInit = {}) => {
    // Determine if endpoint is full URL or relative path
    const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
        credentials: 'include' as RequestCredentials, // Enable HttpOnly cookies
    };

    const response = await fetch(url, config);

    // Global error handling (e.g. 401 logout) could go here
    if (response.status === 401) {
        // Redirect to login if needed, or let component handle
        // window.location.href = '/admin'; 
    }

    return response;
};
