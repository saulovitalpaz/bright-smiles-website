import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchClient } from '@/lib/api';

interface AuthUser {
    role?: string;
    name?: string;
    username?: string;
    cro?: string;
    [key: string]: unknown;
}

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (userData: AuthUser) => Promise<boolean>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const clearLocalUser = () => {
        localStorage.removeItem('admin_auth');
        localStorage.removeItem('admin_user');
    };

    useEffect(() => {
        let active = true;
        const loadSession = async () => {
            try {
                const response = await fetchClient('/auth/session');
                if (!response.ok) throw new Error('No session');
                const user = await response.json();
                if (!active) return;
                localStorage.setItem('admin_user', JSON.stringify(user));
                setIsAuthenticated(true);
            } catch {
                if (active) clearLocalUser();
            } finally {
                if (active) setIsLoading(false);
            }
        };
        loadSession();
        return () => { active = false; };
    }, []);

    const login = async (userData: AuthUser) => {
        localStorage.setItem('admin_user', JSON.stringify(userData));
        setIsAuthenticated(true);
        return true;
    };

    const logout = async () => {
        try {
            await fetchClient('/logout', { method: 'POST' });
        } finally {
            clearLocalUser();
        }
        setIsAuthenticated(false);
        navigate('/admin');
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};

import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) return null;

    if (!isAuthenticated) {
        return <Navigate to="/admin" replace />;
    }

    return <>{children}</>;
};

// Routes the 'manager' role is allowed to access
const MANAGER_ALLOWED_ROUTES = [
    '/admin/dashboard',
    '/admin/comentarios',
    '/admin/stories',
    '/admin/finance',
    '/admin/personal-finance',
    '/admin/analytics',
];

export const RoleProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) return null;

    if (!isAuthenticated) {
        return <Navigate to="/admin" replace />;
    }

    const userStr = localStorage.getItem('admin_user');
    const currentUser = userStr ? JSON.parse(userStr) : null;

    if (currentUser?.role === 'manager') {
        const isAllowed = MANAGER_ALLOWED_ROUTES.some(route => location.pathname.startsWith(route));
        if (!isAllowed) {
            return <Navigate to="/admin/dashboard" replace />;
        }
    }

    return <>{children}</>;
};
