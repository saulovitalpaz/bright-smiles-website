import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Download, Share2, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";

const ADMIN_PWA_MARKER = "data-admin-pwa";
const ADMIN_THEME_COLOR = "#d8ad20";

export interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{
        outcome: "accepted" | "dismissed";
        platform: string;
    }>;
}

export type AdminPwaPlatform = "chromium" | "ios" | "other";

interface AdminPwaContextValue {
    canInstall: boolean;
    isInstalled: boolean;
    install: () => Promise<void>;
    platform: AdminPwaPlatform;
    showIosInstructions: boolean;
}

const AdminPwaContext = createContext<AdminPwaContextValue | null>(null);

const isStandalone = () => {
    const standaloneNavigator = navigator as Navigator & { standalone?: boolean };
    return Boolean(
        window.matchMedia?.("(display-mode: standalone)").matches
        || standaloneNavigator.standalone,
    );
};

const detectPlatform = (): AdminPwaPlatform => {
    const userAgent = navigator.userAgent || "";
    const isAppleMobile = /iPad|iPhone|iPod/.test(userAgent)
        || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    if (isAppleMobile) return "ios";
    if (/Android|Chrome|CriOS|Edg|OPR/i.test(userAgent)) return "chromium";
    return "other";
};

type ManagedHeadElement = {
    element: HTMLElement;
    created: boolean;
    attributes: Record<string, string | null>;
};

const upsertHeadElement = <T extends HTMLElement>(
    selector: string,
    tagName: string,
    attributes: Record<string, string>,
    managed: ManagedHeadElement[],
) => {
    const existing = document.head.querySelector<T>(selector);
    const element = existing || document.createElement(tagName) as T;
    const previousAttributes: Record<string, string | null> = {};

    Object.entries(attributes).forEach(([name, value]) => {
        previousAttributes[name] = existing?.getAttribute(name) ?? null;
        element.setAttribute(name, value);
    });

    element.setAttribute(ADMIN_PWA_MARKER, "true");
    if (!existing) document.head.appendChild(element);
    managed.push({ element, created: !existing, attributes: previousAttributes });
    return element;
};

const restoreHeadElement = ({ element, created, attributes }: ManagedHeadElement) => {
    if (created) {
        element.remove();
        return;
    }

    Object.entries(attributes).forEach(([name, value]) => {
        if (value === null) element.removeAttribute(name);
        else element.setAttribute(name, value);
    });
    element.removeAttribute(ADMIN_PWA_MARKER);
};

const AdminPwaProvider = ({ children }: { children: React.ReactNode }) => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [platform, setPlatform] = useState<AdminPwaPlatform>("other");

    useEffect(() => {
        const previousTitle = document.title;
        const managed: ManagedHeadElement[] = [];

        upsertHeadElement(
            'link[rel="manifest"]',
            "link",
            { rel: "manifest", href: "/admin/manifest.webmanifest" },
            managed,
        );
        upsertHeadElement(
            'link[rel="apple-touch-icon"]',
            "link",
            {
                rel: "apple-touch-icon",
                sizes: "180x180",
                href: "/admin/icons/apple-touch-icon.png",
            },
            managed,
        );
        upsertHeadElement(
            'link[rel="icon"][sizes="32x32"]',
            "link",
            {
                rel: "icon",
                type: "image/png",
                sizes: "32x32",
                href: "/admin/icons/favicon-32x32.png",
            },
            managed,
        );
        upsertHeadElement(
            'link[rel="icon"][sizes="16x16"]',
            "link",
            {
                rel: "icon",
                type: "image/png",
                sizes: "16x16",
                href: "/admin/icons/favicon-16x16.png",
            },
            managed,
        );
        upsertHeadElement(
            'meta[name="theme-color"]',
            "meta",
            { name: "theme-color", content: ADMIN_THEME_COLOR },
            managed,
        );
        upsertHeadElement(
            'meta[name="apple-mobile-web-app-title"]',
            "meta",
            { name: "apple-mobile-web-app-title", content: "Núcleo Odontológico" },
            managed,
        );

        document.title = "Núcleo Odontológico | Painel Admin";

        return () => {
            managed.reverse().forEach(restoreHeadElement);
            document.title = previousTitle;
        };
    }, []);

    useEffect(() => {
        setIsInstalled(isStandalone());
        setPlatform(detectPlatform());

        const handleBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            setDeferredPrompt(event as BeforeInstallPromptEvent);
        };
        const handleInstalled = () => {
            setDeferredPrompt(null);
            setIsInstalled(true);
        };
        const mediaQuery = window.matchMedia?.("(display-mode: standalone)");
        const handleDisplayModeChange = () => setIsInstalled(isStandalone());

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.addEventListener("appinstalled", handleInstalled);
        mediaQuery?.addEventListener?.("change", handleDisplayModeChange);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
            window.removeEventListener("appinstalled", handleInstalled);
            mediaQuery?.removeEventListener?.("change", handleDisplayModeChange);
        };
    }, []);

    const install = useCallback(async () => {
        if (!deferredPrompt) return;

        try {
            await deferredPrompt.prompt();
            await deferredPrompt.userChoice;
        } finally {
            setDeferredPrompt(null);
        }
    }, [deferredPrompt]);

    const value = useMemo<AdminPwaContextValue>(() => ({
        canInstall: Boolean(deferredPrompt) && !isInstalled,
        isInstalled,
        install,
        platform,
        showIosInstructions: platform === "ios" && !isInstalled && !deferredPrompt,
    }), [deferredPrompt, install, isInstalled, platform]);

    return <AdminPwaContext.Provider value={value}>{children}</AdminPwaContext.Provider>;
};

export const useAdminPwa = () => {
    const context = useContext(AdminPwaContext);
    if (!context) throw new Error("useAdminPwa must be used within AdminPwaProvider");
    return context;
};

export const AdminPwaInstallAction = ({ className = "" }: { className?: string }) => {
    const { canInstall, install, showIosInstructions } = useAdminPwa();
    const [showInstructions, setShowInstructions] = useState(false);

    if (!canInstall && !showIosInstructions) return null;

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {canInstall && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-primary/40 bg-white text-slate-700 shadow-sm hover:bg-primary/10"
                    onClick={() => void install()}
                >
                    <Download size={16} />
                    Instalar aplicativo
                </Button>
            )}
            {showIosInstructions && (
                <>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-primary/40 bg-white text-slate-700 shadow-sm hover:bg-primary/10"
                        onClick={() => setShowInstructions(true)}
                    >
                        <Smartphone size={16} />
                        Instalar no iPhone/iPad
                    </Button>
                    {showInstructions && (
                        <div
                            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4"
                            role="presentation"
                            onClick={() => setShowInstructions(false)}
                        >
                            <div
                                className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="admin-pwa-ios-title"
                                onClick={(event) => event.stopPropagation()}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="rounded-xl bg-primary/15 p-2 text-primary">
                                        <Share2 size={20} />
                                    </div>
                                    <div>
                                        <h2 id="admin-pwa-ios-title" className="font-serif text-lg font-bold text-slate-900">
                                            Instalar no iPhone/iPad
                                        </h2>
                                        <p className="mt-2 text-sm leading-6 text-slate-600">
                                            No Safari, toque em <strong>Compartilhar</strong> e depois em <strong>Adicionar à Tela de Início</strong>.
                                        </p>
                                        <p className="mt-2 text-xs text-slate-500">
                                            Se estiver em outro navegador, abra esta mesma página no Safari.
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    className="mt-5 w-full"
                                    onClick={() => setShowInstructions(false)}
                                >
                                    Entendi
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AdminPwaProvider;
