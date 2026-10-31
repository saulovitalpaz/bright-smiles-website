import { useCallback, useEffect, useRef, useState } from "react";

type MenuState = "closed" | "open" | "closing";

export function useAdminNavigation(pathname: string) {
    const [menuState, setMenuState] = useState<MenuState>("closed");
    const sidebarRef = useRef<HTMLElement>(null);
    const closeMenuRef = useRef<HTMLButtonElement>(null);
    const menuTriggerRef = useRef<HTMLButtonElement>(null);
    const collapseRef = useRef<HTMLButtonElement>(null);
    const openerRef = useRef<HTMLElement | null>(null);
    const wasPresent = useRef(false);
    const isMenuPresent = menuState !== "closed";

    const closeMenu = useCallback(() => {
        setMenuState(current => current === "closed" ? current
            : window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "closed" : "closing");
    }, []);
    const finishClose = useCallback(() => setMenuState(current => current === "closing" ? "closed" : current), []);
    const openMenu = (trigger: HTMLElement) => {
        openerRef.current = trigger;
        setMenuState("open");
    };

    useEffect(() => { closeMenu(); }, [pathname, closeMenu]);

    useEffect(() => {
        if (menuState !== "closing") return;
        // transitionend can be skipped when the browser hides a tab or a user interrupts motion.
        const timer = window.setTimeout(finishClose, 350);
        const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)");
        const finishIfReduced = () => { if (reduced?.matches) finishClose(); };
        reduced?.addEventListener("change", finishIfReduced);
        finishIfReduced();
        return () => {
            window.clearTimeout(timer);
            reduced?.removeEventListener("change", finishIfReduced);
        };
    }, [menuState, finishClose]);

    useEffect(() => {
        if (!isMenuPresent) {
            if (wasPresent.current) {
                const desktop = window.matchMedia?.("(min-width: 1024px)").matches;
                const target = desktop ? collapseRef.current : openerRef.current;
                if (target && getComputedStyle(target).display !== "none" && !target.closest("[inert]")) target.focus();
                else menuTriggerRef.current?.focus();
            }
            wasPresent.current = false;
            return;
        }
        wasPresent.current = true;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        closeMenuRef.current?.focus();
        const focusableElements = () => Array.from(sidebarRef.current?.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex="0"]',
        ) ?? []).filter(element => element.getClientRects().length > 0);
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") { event.preventDefault(); closeMenu(); }
            if (event.key !== "Tab") return;
            const elements = focusableElements();
            const first = elements[0];
            const last = elements[elements.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        };
        const containFocus = (event: FocusEvent) => {
            if (!sidebarRef.current?.contains(event.target as Node)) closeMenuRef.current?.focus();
        };
        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("focusin", containFocus);
        const desktop = window.matchMedia?.("(min-width: 1024px)");
        const closeOnDesktop = () => { if (desktop?.matches) setMenuState("closed"); };
        desktop?.addEventListener("change", closeOnDesktop);
        closeOnDesktop();
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("focusin", containFocus);
            desktop?.removeEventListener("change", closeOnDesktop);
        };
    }, [isMenuPresent, closeMenu]);

    return { menuState, isMenuPresent, isMobileMenuOpen: menuState === "open", openMenu, closeMenu,
        finishClose, sidebarRef, closeMenuRef, menuTriggerRef, collapseRef };
}
