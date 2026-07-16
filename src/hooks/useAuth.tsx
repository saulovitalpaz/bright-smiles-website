import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthUser {
    token?: string;
    role?: string;
    name?: string;
    username?: string;
    cro?: string;
    [key: string]: unknown;
}

interface AuthContextType {
    isAuthenticated: boolean;
    login: (userData: AuthUser) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        return localStorage.getItem('admin_auth') === 'true';
    });
    const navigate = useNavigate();

    const login = async (userData: AuthUser) => {
        localStorage.setItem('admin_auth', 'true');
        const { token, ...user } = userData;
        if (token) {
            localStorage.setItem('admin_token', token);
        }
        localStorage.setItem('admin_user', JSON.stringify(user));
        setIsAuthenticated(true);
        return true;
    };

    const logout = () => {
        localStorage.removeItem('admin_auth');
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_token');
        setIsAuthenticated(false);
        navigate('/admin');
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
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
    const { isAuthenticated } = useAuth();

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
    '/admin/documentos',
];

export const RoleProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

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
