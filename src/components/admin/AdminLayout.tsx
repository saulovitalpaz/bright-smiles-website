import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
    LayoutDashboard,
    FileText,
    Calendar,
    LogOut,
    ChevronRight,
    Stethoscope,
    DollarSign,
    BarChart3,
    ChevronLeft,
    Menu,
    Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { API_URL } from "@/lib/api";
import { mediaUrl } from "@/lib/media";
import { AdminPwaInstallAction } from "@/components/admin/AdminPwaProvider";

interface AdminLayoutProps {
    children: React.ReactNode;
    title: string;
}

const AdminLayout = ({ children, title }: AdminLayoutProps) => {
    const { logout } = useAuth();
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = React.useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const menuTriggerRef = React.useRef<HTMLButtonElement>(null);
    const sidebarRef = React.useRef<HTMLElement>(null);
    const closeMenuRef = React.useRef<HTMLButtonElement>(null);

    // Close mobile menu on route change
    React.useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    React.useEffect(() => {
        if (!isMobileMenuOpen) return;
        const menuTrigger = menuTriggerRef.current;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        closeMenuRef.current?.focus();
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                setIsMobileMenuOpen(false);
            }
            if (event.key === "Tab") {
                const focusable = Array.from(sidebarRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex="0"]') ?? [])
                    .filter(element => element.getClientRects().length > 0);
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        const desktop = window.matchMedia?.("(min-width: 1024px)");
        const closeOnDesktop = () => { if (desktop?.matches) setIsMobileMenuOpen(false); };
        desktop?.addEventListener("change", closeOnDesktop);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", handleKeyDown);
            desktop?.removeEventListener("change", closeOnDesktop);
            menuTrigger?.focus();
        };
    }, [isMobileMenuOpen]);

    const { data: settings } = useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/settings`, { withCredentials: true });
            return res.data;
        }
    });

    const logoUrl = mediaUrl(settings?.site_logo) || "/images/logo-oficial.png";
    const clinicName = settings?.clinic_name || "Núcleo Odontológico";

    // Get user from localStorage
    const userStr = localStorage.getItem("admin_user");
    const currentUser = userStr ? JSON.parse(userStr) : { name: "Profissional", cro: "CRO/MG 00.000", username: "admin" };

    // Get initials for avatar
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const isManager = currentUser.role === 'manager';
    const quickLinks = isManager
        ? [
            { label: "Início", href: "/admin/dashboard", icon: LayoutDashboard },
            { label: "Financeiro", href: "/admin/finance", icon: DollarSign },
            { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
        ]
        : [
            { label: "Início", href: "/admin/dashboard", icon: LayoutDashboard },
            { label: "Agenda", href: "/admin/calendario", icon: Calendar },
            { label: "Consultas", href: "/admin/consultas", icon: Stethoscope },
            { label: "Financeiro", href: "/admin/finance", icon: DollarSign },
        ];

    const menuItems = React.useMemo(() => {
        const contentSubItems = isManager
            ? [
                { label: "Comentários", href: "/admin/comentarios" },
                { label: "Stories", href: "/admin/stories" }
            ]
            : [
                { label: "Comentários", href: "/admin/comentarios" },
                { label: "Tratamentos", href: "/admin/tratamentos" },
                { label: "Blog", href: "/admin/blog" },
                { label: "Stories", href: "/admin/stories" }
            ];

        const allMenuItems = [
            { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
            { label: "Solicitações", href: "/admin/solicitacoes", icon: Calendar, adminOnly: true },
            {
                label: "Conteúdo",
                href: isManager ? "/admin/comentarios" : "/admin/blog",
                icon: FileText,
                subItems: contentSubItems
            },
            {
                label: "Atendimentos",
                href: "/admin/consultas",
                icon: Stethoscope,
                adminOnly: true,
                subItems: [
                    { label: "Consultas", href: "/admin/consultas" },
                    { label: "Pacientes", href: "/admin/pacientes" },
                    { label: "Prescrição", href: "/admin/prescricao" },
                    { label: "Termos e Documentos", href: "/admin/documentos" },
                ]
            },
            { label: "Agenda", href: "/admin/calendario", icon: Calendar, adminOnly: true },
            { label: "Financeiro", href: "/admin/finance", icon: DollarSign },
            ...(isManager || currentUser.username === 'Neli Vital' ? [{ label: "Minhas Finanças", href: "/admin/personal-finance", icon: DollarSign }] : []),
            { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
            {
                label: "Configurações",
                href: "/admin/settings",
                icon: Settings,
                adminOnly: true,
                subItems: [
                    { label: "Geral", href: "/admin/settings" },
                    { label: "Equipe", href: "/admin/users" },
                ]
            },
        ];

        return isManager
            ? allMenuItems.filter(item => !item.adminOnly)
            : allMenuItems;
    }, [currentUser.username, isManager]);

    const [openGroup, setOpenGroup] = React.useState<string | null>(null);

    const activeGroupLabel = React.useMemo(() => menuItems.find((item) =>
        item.subItems?.some((sub) => location.pathname.startsWith(sub.href)),
    )?.label ?? null, [location.pathname, menuItems]);

    React.useEffect(() => {
        if (activeGroupLabel) setOpenGroup(activeGroupLabel);
    }, [activeGroupLabel]);

    const activeNavClass = "bg-primary text-primary-foreground shadow-lg shadow-primary/20";
    const inactiveNavClass = "text-slate-500 hover:bg-slate-800/50 hover:text-white";
    const isItemActive = (item: (typeof menuItems)[number]) =>
        location.pathname === item.href || item.subItems?.some((sub) => location.pathname.startsWith(sub.href));

    const getSubmenuId = (label: string) => `admin-submenu-${label.toLowerCase().replace(/\s+/g, "-")}`;

    const renderNestedItems = (item: (typeof menuItems)[number], isGroupOpen: boolean, submenuId: string) => item.subItems && isGroupOpen && (
        <div id={submenuId} className="ml-11 mt-1 space-y-1 border-l border-slate-800 pl-1">
            {item.subItems.map(sub => (
                <Link
                    key={sub.label}
                    to={sub.href}
                    className={`flex min-h-9 items-center rounded-md px-3 text-[11px] font-bold uppercase tracking-wider transition-colors ${location.pathname === sub.href
                        ? "text-primary"
                        : "text-slate-500 hover:text-white"}`}
                >
                    {sub.label}
                </Link>
            ))}
        </div>
    );

    const toggleGroup = (label: string) => {
        setOpenGroup((current) => current === label ? null : label);
    };

    const renderMenuItem = (item: (typeof menuItems)[number], compact = false) => {
        const Icon = item.icon;
        const isActive = isItemActive(item);
        const isGroup = Boolean(item.subItems?.length);
        const isGroupOpen = openGroup === item.label;
        const submenuId = getSubmenuId(item.label);
        const isHighlighted = isActive || isGroupOpen;
        const itemClass = compact
            ? `hidden lg:flex min-h-11 items-center justify-center rounded-xl px-3.5 transition-all ${isActive ? activeNavClass : "text-slate-400 hover:bg-slate-800 hover:text-white"}`
            : `flex min-h-11 items-center gap-3 rounded-xl px-3.5 transition-all ${isHighlighted ? activeNavClass : inactiveNavClass}`;
        const iconClass = isHighlighted
            ? "text-primary-foreground"
            : "text-slate-400 group-hover:text-primary transition-colors";

        if (isGroup) {
            return (
                <>
                    <button
                        type="button"
                        onClick={() => {
                            if (compact) setIsCollapsed(false);
                            toggleGroup(item.label);
                        }}
                        className={`${itemClass} w-full text-left`}
                        aria-expanded={isGroupOpen}
                        aria-controls={submenuId}
                        aria-label={compact ? item.label : undefined}
                        title={compact ? item.label : undefined}
                    >
                        <Icon size={compact ? 22 : 20} className={iconClass} />
                        {!compact && <span className="font-bold text-sm tracking-tight">{item.label}</span>}
                        <ChevronRight size={14} className={`${compact ? "hidden" : "ml-auto"} opacity-50 transition-transform ${isGroupOpen ? "rotate-90" : ""}`} />
                    </button>
                    {!compact && renderNestedItems(item, isGroupOpen, submenuId)}
                </>
            );
        }

        return (
            <Link
                to={item.href}
                className={itemClass}
                title={compact ? item.label : undefined}
            >
                <Icon size={compact ? 22 : 20} className={iconClass} />
                {!compact && <span className="font-bold text-sm tracking-tight">{item.label}</span>}
            </Link>
        );
    };

    return (
        <div className="admin-shell min-h-screen bg-background">
            <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3">Ir para o conteúdo</a>
            {/* Mobile Header Toggle (Visible only on mobile) */}
            <div aria-hidden={isMobileMenuOpen || undefined} {...(isMobileMenuOpen ? { inert: "" } : {})} className="admin-mobile-bar no-print sticky top-0 z-20 flex min-h-[calc(var(--admin-topbar-mobile)+env(safe-area-inset-top))] items-center gap-3 border-b border-slate-200 bg-background px-3 pt-[env(safe-area-inset-top)] lg:hidden">
                <Button
                    ref={menuTriggerRef}
                    size="icon"
                    variant="outline"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="h-11 w-11 bg-white shadow-md border-slate-200 text-slate-700"
                    aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
                    aria-expanded={isMobileMenuOpen}
                    aria-controls="admin-navigation"
                >
                    <Menu size={20} />
                </Button>
                <h1 className="min-w-0 flex-1 break-words py-2 font-serif text-lg font-bold leading-tight text-slate-900">{title}</h1>
                <AdminPwaInstallAction compact />
                <span title={currentUser.name} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-slate-700">{getInitials(currentUser.name || "Profissional")}</span>
            </div>

            {/* Mobile Backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="no-print fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden animate-in fade-in duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar - Always fixed position */}
            <aside
                ref={sidebarRef}
                id="admin-navigation"
                aria-label="Navegação administrativa"
                role={isMobileMenuOpen ? "dialog" : undefined}
                aria-modal={isMobileMenuOpen ? true : undefined}
                className={`admin-sidebar
                fixed inset-y-0 left-0 z-40 bg-[hsl(30,15%,10%)] text-white shadow-xl transition-transform duration-200 ease-out border-r border-[hsl(30,10%,15%)] no-print
                ${isMobileMenuOpen ? "visible translate-x-0" : "invisible -translate-x-full lg:visible"}
                lg:translate-x-0 h-dvh max-h-dvh min-h-0 flex flex-col
                ${isCollapsed ? "lg:w-[var(--admin-sidebar-collapsed)]" : "lg:w-[var(--admin-sidebar-expanded)]"}
                w-[min(86vw,320px)]
            `}>
                {/* Branding & Logo */}
                <div className={`relative flex shrink-0 items-center gap-3 border-b border-[hsl(30,10%,15%)] p-4 pr-16 lg:flex-col lg:justify-center lg:pr-4 ${isCollapsed ? "lg:h-24" : "lg:h-40"}`}>
                    <div className={`${isCollapsed ? "lg:w-12 lg:h-12" : "lg:w-20 lg:h-20"} relative z-10 h-12 w-12 shrink-0`}>
                        <img
                            width={80}
                            height={80}
                            src={logoUrl}
                            alt="Logo"
                            className="w-full h-full object-contain filter drop-shadow-xl"
                            onError={(e) => (e.target as HTMLImageElement).src = "/images/logo-oficial.png"}
                        />
                    </div>
                    <div className={`relative z-10 min-w-0 lg:text-center ${isCollapsed ? "lg:hidden" : ""}`}>
                        <h2 className="font-serif font-bold text-sm text-white leading-tight mb-1">{clinicName}</h2>
                        <div className="hidden text-[9px] text-[hsl(43,74%,49%)] font-bold uppercase tracking-[0.15em] leading-relaxed lg:block">
                            <p>{settings?.clinic_slogan || "Especializado & Harmonização"}</p>
                        </div>
                    </div>

                    {/* Floating Collapse Toggle (Desktop Only) */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[hsl(43,74%,49%)] text-[hsl(30,15%,10%)] rounded-full items-center justify-center shadow-lg shadow-black/20 hover:scale-110 transition-transform z-50 border-2 border-[hsl(30,15%,10%)]"
                        title={isCollapsed ? "Expandir" : "Recolher"}
                        aria-label={isCollapsed ? "Expandir navegação" : "Recolher navegação"}
                    >
                        {isCollapsed ? <ChevronRight size={14} fill="currentColor" /> : <ChevronLeft size={14} fill="currentColor" />}
                    </button>

                    {/* Mobile Close Button */}
                    <button
                        ref={closeMenuRef}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="lg:hidden absolute top-4 right-4 h-11 w-11 inline-flex items-center justify-center rounded-md text-white/50 hover:text-white"
                        aria-label="Fechar menu"
                    >
                        <ChevronLeft size={24} />
                    </button>
                </div>

                <nav className="flex-1 min-h-0 p-3 space-y-1 overflow-y-auto overscroll-contain custom-scrollbar">
                    {menuItems.map((item) => {
                        return (
                            <div key={item.label} className="group">
                                {isCollapsed ? (
                                    <>
                                        {/* Collapsed Icon Mode (Desktop) */}
                                        <div className="hidden lg:block">
                                            {renderMenuItem(item, true)}
                                        </div>
                                        {/* Full Menu Mode (Mobile) */}
                                        <div className="lg:hidden">
                                            {renderMenuItem(item)}
                                        </div>
                                    </>
                                ) : (
                                    renderMenuItem(item)
                                )}
                            </div>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800/50 space-y-2">
                    <Button
                        variant="ghost"
                        className={`w-full text-slate-500 hover:text-red-400 hover:bg-red-500/10 gap-3 rounded-xl ${isCollapsed ? "lg:justify-center justify-start" : "justify-start"}`}
                        onClick={logout}
                    >
                        <LogOut size={20} />
                        <span className={`text-xs font-bold uppercase tracking-widest ${isCollapsed ? "lg:hidden" : ""}`}>Sair</span>
                    </Button>
                </div>
            </aside>

            {/* Main Content - offset by sidebar width on desktop */}
            <main id="admin-main" tabIndex={-1} aria-hidden={isMobileMenuOpen || undefined} {...(isMobileMenuOpen ? { inert: "" } : {})} className={`admin-main min-h-screen min-w-0 bg-background flex flex-col overflow-x-hidden
                ${isCollapsed ? "lg:ml-[var(--admin-sidebar-collapsed)]" : "lg:ml-[var(--admin-sidebar-expanded)]"}
                ml-0
            `}>
                <header className="admin-desktop-header no-print hidden border-b border-slate-200 bg-background py-4 lg:sticky lg:top-0 lg:z-10 lg:block">
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <h1 className="break-words text-xl md:text-3xl font-serif font-black text-slate-900 tracking-tight leading-tight uppercase">{title}</h1>
                        <div className="hidden md:flex items-center gap-2 mt-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
                                {currentUser.username === 'admin' ? 'Acesso Global Developer' : `Logado como: ${currentUser.name}`}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-3">
                        <AdminPwaInstallAction className="max-sm:w-full max-sm:justify-end" />
                        <div className="flex items-center gap-4 bg-white p-1.5 pr-4 rounded-full shadow-sm border border-slate-100">
                        <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs ring-2 ring-primary/20">
                            {getInitials(currentUser.name || "Profissional")}
                        </div>
                        <div className="text-left hidden md:block">
                            <p className="text-xs font-black text-slate-900 leading-none">{currentUser.name}</p>
                            <p className="text-[8px] text-primary font-bold uppercase tracking-widest mt-0.5">{currentUser.cro}</p>
                        </div>
                        </div>
                    </div>
                    </div>
                </header>

                <div className="admin-content flex-1 pt-3 md:pt-6">
                    {children}
                </div>
            </main>
            <nav aria-label="Navegação rápida" aria-hidden={isMobileMenuOpen || undefined} {...(isMobileMenuOpen ? { inert: "" } : {})} className="admin-quick-nav no-print fixed inset-x-0 bottom-0 z-20 flex items-stretch border-t border-slate-200 bg-background lg:hidden">
                {quickLinks.map(item => {
                    const active = location.pathname === item.href || (item.href === "/admin/consultas" && location.pathname.startsWith(item.href + "/"));
                    return <Link key={item.href} to={item.href} aria-current={active ? "page" : undefined} className={`flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-semibold transition-colors ${active ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-100"}`}><item.icon size={19} aria-hidden="true" /><span>{item.label}</span></Link>;
                })}
            </nav>

            <style>{`
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
