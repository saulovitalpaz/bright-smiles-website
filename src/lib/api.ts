const getApiUrl = () => {
    // Prefer the value injected at build time. This is important when the
    // frontend and API are deployed as separate Railway services.
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL.replace(/\/$/, '');

    // Fallback based on the browser URL for deployments without a variable.
    if (typeof window !== "undefined") {
        const hostname = window.location.hostname;
        if (hostname.includes("odontoeharmonizacao.com.br") || hostname.includes("railway.app")) {
            return "https://backend-production-e175.up.railway.app";
        }
    }

    // Production fallback kept for the current hosted site.
    return "https://backend-production-e175.up.railway.app";
};

export const API_URL = getApiUrl();

export const fetchClient = async (endpoint: string, options: RequestInit = {}) => {
    // Determine if endpoint is full URL or relative path
    const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

    const isFormData = options.body instanceof FormData;
    const defaultHeaders: HeadersInit = isFormData
        ? {}
        : { 'Content-Type': 'application/json' };

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
        credentials: 'include' as RequestCredentials, // Enable HttpOnly cookies
    };

    const response = await fetch(url, config);

    if (response.status === 401) {
        // Clear local auth state and redirect to login
        if (typeof window !== 'undefined') {
            localStorage.removeItem('admin_auth');
            localStorage.removeItem('admin_user');
            window.location.href = '/admin';
        }
    }

    return response;
};
