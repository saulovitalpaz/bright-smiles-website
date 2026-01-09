import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    FileText,
    MessageSquare,
    Calendar,
    LogOut,
    ChevronRight,
    Stethoscope,
    Play
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
    children: React.ReactNode;
    title: string;
}

const AdminLayout = ({ children, title }: AdminLayoutProps) => {
    const location = useLocation();
    const navigate = useNavigate();

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
        { label: "Blog", href: "/admin/blog", icon: FileText },
        { label: "Consultas", href: "/admin/consultas", icon: Stethoscope },
        { label: "Stories", href: "/admin/stories", icon: Play },
    ];

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col fixed inset-y-0 shadow-xl z-20">
                <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 shrink-0">
                        <img
                            src="/images/logo oficial.png"
                            alt="Logo"
                            className="w-full h-full object-contain rounded-full border border-slate-700 shadow-sm"
                        />
                    </div>
                    <Link to="/" className="flex flex-col">
                        <span className="font-serif font-bold text-lg text-white leading-tight">Núcleo</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest">Painel Admin</span>
                    </Link>
                </div>
                <nav className="flex-1 p-4 space-y-2 mt-4">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.label}
                                to={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? "bg-primary text-white"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                    }`}
                            >
                                <Icon size={20} />
                                <span className="font-medium">{item.label}</span>
                                {isActive && <ChevronRight size={16} className="ml-auto" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800 gap-3"
                        onClick={() => navigate("/")}
                    >
                        <LogOut size={20} />
                        <span>Sair</span>
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8 min-h-screen bg-[#f8fafc]">
                <header className="mb-10 flex justify-between items-end border-b border-slate-200 pb-6">
                    <div>
                        <h1 className="text-4xl font-serif font-bold text-slate-900 tracking-tight">{title}</h1>
                        <p className="text-slate-500 mt-2 font-medium">
                            {currentUser.username === 'admin' ? 'Painel de Desenvolvedor' : `Bem-vinda de volta, Dra. ${currentUser.name}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-4 bg-white p-2 pr-4 rounded-2xl shadow-sm border border-slate-100">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                            {getInitials(currentUser.name)}
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-bold text-slate-900 leading-none">{currentUser.name}</p>
                            <p className="text-[10px] text-primary font-bold uppercase tracking-wider mt-1">{currentUser.cro}</p>
                        </div>
                    </div>
                </header>

                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
