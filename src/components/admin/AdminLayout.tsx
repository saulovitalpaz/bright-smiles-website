import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
    LayoutDashboard,
    FileText,
    Calendar,
    LogOut,
    ExternalLink,
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
import "@/styles/admin-typography.css";
import "@/styles/admin-navigation.css";
import { useAdminNavigation } from "./useAdminNavigation";

interface AdminLayoutProps {
    children: React.ReactNode;
    title: string;
}

const AdminLayout = ({ children, title }: AdminLayoutProps) => {
    const { logout } = useAuth();
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = React.useState(false);
    const { menuState, isMobileMenuOpen, isMenuPresent, openMenu, closeMenu, finishClose,
        sidebarRef, closeMenuRef, menuTriggerRef, collapseRef } = useAdminNavigation(location.pathname);

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
                { label: "Stories", href: "/admin/stories" }
            ];

        const allMenuItems = [
            { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
            { label: "Solicitações", href: "/admin/solicitacoes", icon: Calendar, adminOnly: true },
            {
                label: "Conteúdo",
                href: "/admin/comentarios",
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
                    { label: "Estoque", href: "/admin/settings/estoque" },
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

    const activeNavClass = "is-active";
    const inactiveNavClass = "";
    const isItemActive = (item: (typeof menuItems)[number]) =>
        location.pathname === item.href || item.subItems?.some((sub) => location.pathname.startsWith(sub.href));

    const getSubmenuId = (label: string) => `admin-submenu-${label.toLowerCase().replace(/\s+/g, "-")}`;

    const renderNestedItems = (item: (typeof menuItems)[number], isGroupOpen: boolean, submenuId: string) => item.subItems && isGroupOpen && (
        <div id={submenuId} className="admin-nav-submenu ml-8 mt-1 space-y-1 border-l pl-1">
            {item.subItems.map(sub => (
                <Link
                    key={sub.label}
                    to={sub.href}
                    aria-current={location.pathname === sub.href ? "page" : undefined}
                    className="admin-nav-subitem flex min-h-11 items-center rounded-lg px-3 text-sm"
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
            ? `admin-nav-item hidden lg:flex min-h-11 items-center justify-center rounded-xl px-3.5 ${isActive ? activeNavClass : inactiveNavClass}`
            : `admin-nav-item flex min-h-11 items-center gap-3 rounded-xl px-3.5 ${isHighlighted ? activeNavClass : inactiveNavClass}`;
        const iconClass = "shrink-0";

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
                        <Icon size={compact ? 22 : 20} className={iconClass} aria-hidden="true" />
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
                aria-label={compact ? item.label : undefined}
                aria-current={location.pathname === item.href ? "page" : undefined}
            >
                <Icon size={compact ? 22 : 20} className={iconClass} aria-hidden="true" />
                {!compact && <span className="font-bold text-sm tracking-tight">{item.label}</span>}
            </Link>
        );
    };

    return (
        <div className="admin-shell min-h-screen bg-background" data-menu-state={menuState}>
            <a aria-hidden={isMenuPresent || undefined} tabIndex={isMenuPresent ? -1 : undefined} href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3">Ir para o conteúdo</a>
            {/* Mobile Header Toggle (Visible only on mobile) */}
            <div aria-hidden={isMenuPresent || undefined} {...(isMenuPresent ? { inert: "" } : {})} className="admin-mobile-bar no-print sticky top-0 z-20 flex min-h-[calc(var(--admin-topbar-mobile)+env(safe-area-inset-top))] items-center gap-3 border-b border-slate-200 bg-background px-3 pt-[env(safe-area-inset-top)] lg:hidden">
                <Button
                    ref={menuTriggerRef}
                    size="icon"
                    variant="outline"
                    onClick={(event) => openMenu(event.currentTarget)}
                    className="h-11 w-11 bg-white shadow-md border-slate-200 text-slate-700"
                    aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
                    aria-expanded={isMobileMenuOpen}
                    aria-controls="admin-navigation"
                >
                    <Menu size={20} />
                </Button>
                <h1 className="min-w-0 flex-1 break-words py-2 font-serif text-lg font-bold leading-tight text-slate-900">{title}</h1>
                <Button asChild variant="outline" size="icon" className="h-11 w-11 shrink-0"><Link to="/" target="_blank" rel="noopener noreferrer" aria-label="Ver homepage (nova aba)" title="Ver homepage (nova aba)"><ExternalLink size={18} aria-hidden="true" /></Link></Button>
                <AdminPwaInstallAction compact />
                <span title={currentUser.name} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-slate-700">{getInitials(currentUser.name || "Profissional")}</span>
            </div>

            {/* Mobile Backdrop */}
            <div
                className="admin-navigation-backdrop no-print fixed inset-0 z-30 lg:hidden"
                aria-hidden="true"
                onClick={closeMenu}
            />

            {/* Sidebar - Always fixed position */}
            <aside
                ref={sidebarRef}
                id="admin-navigation"
                aria-label="Navegação administrativa"
                role={isMenuPresent ? "dialog" : undefined}
                aria-modal={isMenuPresent ? true : undefined}
                data-state={menuState}
                data-collapsed={isCollapsed}
                onTransitionEnd={(event) => {
                    if (event.target === event.currentTarget && event.propertyName === "transform") finishClose();
                }}
                className="admin-sidebar fixed inset-y-0 left-0 z-40 no-print h-dvh max-h-dvh min-h-0 flex flex-col"
            >
                {/* Branding & Logo */}
                <div className="admin-sidebar-branding relative flex shrink-0 items-center gap-3 lg:flex-col lg:justify-center">
                    <div className="admin-logo-frame shrink-0">
                        <img
                            key={logoUrl}
                            width={88}
                            height={88}
                            src={logoUrl}
                            alt={`Logo de ${clinicName}`}
                            className="w-full h-full object-contain"
                            onError={(event) => {
                                const image = event.currentTarget;
                                if (image.getAttribute("src") !== "/images/logo-oficial.png") {
                                    image.src = "/images/logo-oficial.png";
                                } else {
                                    image.hidden = true;
                                }
                            }}
                        />
                    </div>
                    <div className={`admin-brand min-w-0 lg:text-center ${isCollapsed ? "lg:hidden" : ""}`}>
                        <h2 title={clinicName}>{clinicName}</h2>
                        <p className="hidden lg:block">{settings?.clinic_slogan || "Especializado & Harmonização"}</p>
                    </div>

                    {/* Floating Collapse Toggle (Desktop Only) */}
                    <button
                        ref={collapseRef}
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="admin-collapse-toggle hidden lg:flex absolute -right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full items-center justify-center z-50"
                        title={isCollapsed ? "Expandir" : "Recolher"}
                        aria-label={isCollapsed ? "Expandir navegação" : "Recolher navegação"}
                    >
                        {isCollapsed ? <ChevronRight size={14} fill="currentColor" /> : <ChevronLeft size={14} fill="currentColor" />}
                    </button>

                    {/* Mobile Close Button */}
                    <button
                        ref={closeMenuRef}
                        onClick={closeMenu}
                        className="lg:hidden absolute top-4 right-4 h-11 w-11 inline-flex items-center justify-center rounded-xl text-sidebar-foreground hover:bg-sidebar-accent"
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

                <div className="admin-sidebar-footer p-4 space-y-2">
                    <Button
                        variant="ghost"
                        className={`w-full text-sidebar-foreground hover:text-red-700 hover:bg-red-500/10 gap-3 rounded-xl ${isCollapsed ? "lg:justify-center justify-start" : "justify-start"}`}
                        aria-label="Sair"
                        onClick={logout}
                    >
                        <LogOut size={20} />
                        <span className={`text-xs font-bold uppercase tracking-widest ${isCollapsed ? "lg:hidden" : ""}`}>Sair</span>
                    </Button>
                </div>
            </aside>

            {/* Main Content - offset by sidebar width on desktop */}
            <main id="admin-main" tabIndex={-1} aria-hidden={isMenuPresent || undefined} {...(isMenuPresent ? { inert: "" } : {})} className={`admin-main min-h-screen min-w-0 bg-background flex flex-col overflow-x-hidden
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
                        <Button asChild variant="outline" className="min-h-11 gap-2"><Link to="/" target="_blank" rel="noopener noreferrer"><ExternalLink size={16} aria-hidden="true" />Ver homepage<span className="sr-only"> (nova aba)</span></Link></Button>
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
            <nav aria-label="Navegação rápida" aria-hidden={isMenuPresent || undefined} {...(isMenuPresent ? { inert: "" } : {})} className="admin-quick-nav no-print fixed inset-x-0 bottom-0 z-20 flex items-stretch border-t border-slate-200 bg-background lg:hidden">
                {quickLinks.map(item => {
                    const active = location.pathname === item.href || (item.href === "/admin/consultas" && location.pathname.startsWith(item.href + "/"));
                    return <Link key={item.href} to={item.href} aria-current={active ? "page" : undefined} className={`flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-semibold transition-colors ${active ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-100"}`}><item.icon size={19} aria-hidden="true" /><span>{item.label}</span></Link>;
                })}
                <button type="button" aria-label="Abrir menu completo" aria-expanded={isMobileMenuOpen}
                    aria-controls="admin-navigation" onClick={(event) => openMenu(event.currentTarget)}
                    className="flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-slate-600 hover:bg-slate-100">
                    <Menu size={19} aria-hidden="true" /><span>Menu</span>
                </button>
            </nav>


        </div>
    );
};

export default AdminLayout;
