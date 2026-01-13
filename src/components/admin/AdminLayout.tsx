import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
    LayoutDashboard,
    FileText,
    MessageSquare,
    Calendar,
    LogOut,
    ChevronRight,
    Stethoscope,
    Play,
    DollarSign,
    BarChart3,
    ChevronLeft,
    Menu,
    FileSignature,
    Sparkles,
    Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { API_URL } from "@/lib/api";

interface AdminLayoutProps {
    children: React.ReactNode;
    title: string;
}

const AdminLayout = ({ children, title }: AdminLayoutProps) => {
    const { logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    const { data: settings } = useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/settings`);
            return res.data;
        }
    });

    const logoUrl = settings?.site_logo || "/images/logo-oficial.png";
    const clinicName = settings?.clinic_name || "Núcleo Odontológico";

    // Get user from localStorage
    const userStr = localStorage.getItem("admin_user");
    const currentUser = userStr ? JSON.parse(userStr) : { name: "Profissional", cro: "CRO/MG 00.000", username: "admin" };

    // Get initials for avatar
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const menuItems = [
        { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { label: "Solicitações", href: "/admin/solicitacoes", icon: Calendar },
        { label: "Comentários", href: "/admin/comentarios", icon: MessageSquare },
        { label: "Tratamentos", href: "/admin/tratamentos", icon: Sparkles },
        { label: "Blog", href: "/admin/blog", icon: FileText },
        {
            label: "Consultas", href: "/admin/consultas", icon: Stethoscope, subItems: [
                { label: "Atendimentos", href: "/admin/consultas" },
                { label: "Prescrição", href: "/admin/prescricao" },
                { label: "Termos & Doc", href: "/admin/documentos" },
                { label: "Guia Digital", href: "/admin/digital-guide" }
            ]
        },
        { label: "Stories", href: "/admin/stories", icon: Play },
        { label: "Financeiro", href: "/admin/finance", icon: DollarSign },
        { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
        { label: "Configurações", href: "/admin/settings", icon: Settings },
    ];

    return (
        <div className="flex min-h-screen bg-[#f1f5f9]">
            {/* Sidebar */}
            {/* Sidebar */}
            <aside className={`${isCollapsed ? "w-20" : "w-72"} bg-[hsl(30,15%,10%)] text-white flex flex-col fixed inset-y-0 shadow-2xl z-20 transition-all duration-300 no-print border-r border-[hsl(30,10%,15%)]`}>
                {/* Branding & Logo */}
                <div className={`relative p-6 border-b border-[hsl(30,10%,15%)] flex flex-col items-center justify-center transition-all ${isCollapsed ? "h-24" : "h-52"}`}>
                    <div className={`${isCollapsed ? "w-12 h-12" : "w-32 h-32"} transition-all duration-500 relative z-10`}>
                        <img
                            src={logoUrl}
                            alt="Logo"
                            className="w-full h-full object-contain filter drop-shadow-xl"
                            onError={(e) => (e.target as HTMLImageElement).src = "/images/logo-oficial.png"}
                        />
                    </div>
                    {!isCollapsed && (
                        <div className="mt-4 text-center relative z-10 animate-in fade-in zoom-in duration-500">
                            <h2 className="font-serif font-bold text-lg text-white tracking-widest leading-tight mb-1">{clinicName}</h2>
                            <div className="text-[9px] text-[hsl(43,74%,49%)] font-bold uppercase tracking-[0.15em] leading-relaxed">
                                <p>{settings?.clinic_slogan || "Especializado & Harmonização"}</p>
                            </div>
                        </div>
                    )}

                    {/* Floating Collapse Toggle */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[hsl(43,74%,49%)] text-[hsl(30,15%,10%)] rounded-full flex items-center justify-center shadow-lg shadow-black/20 hover:scale-110 transition-transform z-50 border-2 border-[hsl(30,15%,10%)]"
                        title={isCollapsed ? "Expandir" : "Recolher"}
                    >
                        {isCollapsed ? <ChevronRight size={14} fill="currentColor" /> : <ChevronLeft size={14} fill="currentColor" />}
                    </button>
                </div>

                <nav className="flex-1 p-3 space-y-1 mt-6 overflow-y-auto custom-scrollbar">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname.startsWith(item.href);
                        return (
                            <div key={item.label} className="group">
                                {isCollapsed ? (
                                    <Link
                                        to={item.href}
                                        className={`flex items-center justify-center p-3 rounded-xl transition-all ${isActive
                                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                            }`}
                                        title={item.label}
                                    >
                                        <Icon size={22} />
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            to={item.href}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                : "text-slate-500 hover:bg-slate-800/50 hover:text-white"
                                                }`}
                                        >
                                            <Icon size={20} className={isActive ? "text-white" : "text-slate-400 group-hover:text-primary transition-colors"} />
                                            <span className="font-bold text-sm tracking-tight">{item.label}</span>
                                            {item.subItems && <ChevronRight size={14} className={`ml-auto opacity-50 ${isActive ? "rotate-90" : ""}`} />}
                                        </Link>

                                        {item.subItems && (isActive || location.pathname.startsWith(item.href)) && (
                                            <div className="ml-11 mt-1 space-y-1 border-l border-slate-800 pl-4">
                                                {item.subItems.map(sub => (
                                                    <Link
                                                        key={sub.label}
                                                        to={sub.href}
                                                        className={`block py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition-colors ${location.pathname === sub.href
                                                            ? "text-primary"
                                                            : "text-slate-500 hover:text-white"}`}
                                                    >
                                                        {sub.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800/50 space-y-2">
                    <Button
                        variant="ghost"
                        className={`w-full text-slate-500 hover:text-red-400 hover:bg-red-500/10 gap-3 rounded-xl ${isCollapsed ? "justify-center" : "justify-start"}`}
                        onClick={logout}
                    >
                        <LogOut size={20} />
                        {!isCollapsed && <span className="text-xs font-bold uppercase tracking-widest">Sair</span>}
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 ${isCollapsed ? "ml-20" : "ml-72"} transition-all duration-300 min-h-screen bg-[#f8fafc] flex flex-col`}>
                <header className="no-print sticky top-0 bg-[#f8fafc]/80 backdrop-blur-md z-10 px-8 py-6 flex justify-between items-center border-b border-slate-200">
                    <div className="flex flex-col">
                        <h1 className="text-3xl font-serif font-black text-slate-900 tracking-tight leading-none uppercase">{title}</h1>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
                                {currentUser.username === 'admin' ? 'Acesso Global Developer' : `Logado como: Dra. ${currentUser.name}`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-white p-1.5 pr-4 rounded-full shadow-sm border border-slate-100">
                        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs ring-2 ring-primary/20">
                            {getInitials(currentUser.name)}
                        </div>
                        <div className="text-left">
                            <p className="text-xs font-black text-slate-900 leading-none">{currentUser.name}</p>
                            <p className="text-[8px] text-primary font-bold uppercase tracking-widest mt-0.5">{currentUser.cro}</p>
                        </div>
                    </div>
                </header>

                <div className="flex-1 p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {children}
                </div>
            </main>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    main { margin-left: 0 !important; padding: 0 !important; width: 100% !important; background: white !important; }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #1e293b;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
};

export default AdminLayout;
