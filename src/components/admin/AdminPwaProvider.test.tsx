import fs from "node:fs";
import path from "node:path";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AdminPwaProvider, { AdminPwaInstallAction } from "./AdminPwaProvider";

const repoRoot = path.resolve(process.cwd());
const originalUserAgent = navigator.userAgent;
const originalPlatform = navigator.platform;

const setMatchMedia = (standalone = false) => {
    Object.defineProperty(window, "matchMedia", {
        configurable: true,
        value: vi.fn().mockImplementation(() => ({
            matches: standalone,
            media: "(display-mode: standalone)",
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        })),
    });
};

describe("admin PWA boundary", () => {
    beforeEach(() => {
        document.title = "Site público";
        document.head.querySelectorAll("[data-admin-pwa]").forEach((element) => element.remove());
        Object.defineProperty(navigator, "userAgent", { configurable: true, value: originalUserAgent });
        Object.defineProperty(navigator, "platform", { configurable: true, value: originalPlatform });
        setMatchMedia();
    });

    afterEach(() => {
        document.head.querySelectorAll("[data-admin-pwa]").forEach((element) => element.remove());
        document.title = "";
        vi.restoreAllMocks();
    });

    it("adds admin metadata only while the provider is mounted and restores existing metadata", async () => {
        const existingTheme = document.createElement("meta");
        existingTheme.name = "theme-color";
        existingTheme.content = "#public";
        document.head.appendChild(existingTheme);

        const { unmount } = render(
            <AdminPwaProvider>
                <div>Admin</div>
            </AdminPwaProvider>,
        );

        await waitFor(() => expect(document.querySelector('link[rel="manifest"]')).toHaveAttribute(
            "href",
            "/admin/manifest.webmanifest",
        ));
        expect(document.title).toBe("Núcleo Odontológico | Painel Admin");
        expect(document.querySelector('link[rel="apple-touch-icon"]')).toHaveAttribute(
            "href",
            "/admin/icons/apple-touch-icon.png",
        );
        expect(document.querySelector('link[rel="icon"][sizes="32x32"]')).toHaveAttribute(
            "href",
            "/admin/icons/favicon-32x32.png",
        );
        expect(document.querySelector('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute(
            "content",
            "Núcleo Odontológico",
        );

        unmount();

        expect(document.querySelector('link[rel="manifest"]')).not.toBeInTheDocument();
        expect(document.querySelector('link[rel="apple-touch-icon"]')).not.toBeInTheDocument();
        expect(document.querySelector('meta[name="apple-mobile-web-app-title"]')).not.toBeInTheDocument();
        expect(existingTheme).toHaveAttribute("content", "#public");
        expect(document.title).toBe("Site público");
    });

    it("shows the native install action only after beforeinstallprompt", async () => {
        const user = userEvent.setup();
        const prompt = vi.fn().mockResolvedValue(undefined);
        const installEvent = new Event("beforeinstallprompt", { cancelable: true });
        Object.defineProperty(installEvent, "prompt", { value: prompt });
        Object.defineProperty(installEvent, "userChoice", {
            value: Promise.resolve({ outcome: "accepted", platform: "web" }),
        });

        render(
            <AdminPwaProvider>
                <AdminPwaInstallAction />
            </AdminPwaProvider>,
        );

        expect(screen.queryByRole("button", { name: "Instalar aplicativo" })).not.toBeInTheDocument();
        fireEvent(window, installEvent);

        const installButton = await screen.findByRole("button", { name: "Instalar aplicativo" });
        expect(installEvent.defaultPrevented).toBe(true);
        await user.click(installButton);
        expect(prompt).toHaveBeenCalledOnce();

        fireEvent(window, new Event("appinstalled"));
        await waitFor(() => expect(screen.queryByRole("button", { name: "Instalar aplicativo" })).not.toBeInTheDocument());
    });

    it("hides the CTA in standalone mode", async () => {
        setMatchMedia(true);

        render(
            <AdminPwaProvider>
                <AdminPwaInstallAction />
            </AdminPwaProvider>,
        );

        await waitFor(() => expect(screen.queryByRole("button", { name: "Instalar aplicativo" })).not.toBeInTheDocument());
    });

    it("offers short manual installation instructions on iOS", async () => {
        const user = userEvent.setup();
        Object.defineProperty(navigator, "userAgent", {
            configurable: true,
            value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
        });

        render(
            <AdminPwaProvider>
                <AdminPwaInstallAction />
            </AdminPwaProvider>,
        );

        const iosButton = await screen.findByRole("button", { name: "Instalar no iPhone/iPad" });
        await user.click(iosButton);
        expect(await screen.findByRole("dialog", { name: "Instalar no iPhone/iPad" })).toHaveTextContent(
            "Compartilhar",
        );
        expect(screen.getByRole("dialog")).toHaveTextContent("Adicionar à Tela de Início");
    });
});

describe("admin PWA static contract", () => {
    it("keeps the manifest scoped to /admin and out of the shared HTML shell", () => {
        const manifest = JSON.parse(fs.readFileSync(path.join(repoRoot, "public/admin/manifest.webmanifest"), "utf8"));
        const indexHtml = fs.readFileSync(path.join(repoRoot, "index.html"), "utf8");
        const appSource = fs.readFileSync(path.join(repoRoot, "src/App.tsx"), "utf8");

        expect(manifest).toMatchObject({
            id: "/admin/",
            start_url: "/admin/",
            scope: "/admin/",
            display: "standalone",
        });
        expect(indexHtml).not.toContain("manifest.webmanifest");
        expect(appSource).toMatch(/AdminPwaRouteBoundary/);
        expect(appSource).toMatch(/pathname === ["']\/admin["'] \|\| pathname\.startsWith\(["']\/admin\/["']\)/);
        expect(manifest.icons).toEqual(expect.arrayContaining([
            expect.objectContaining({ sizes: "192x192", type: "image/png" }),
            expect.objectContaining({ sizes: "512x512", purpose: "any" }),
            expect.objectContaining({ sizes: "512x512", purpose: "maskable" }),
        ]));

        for (const [file, size] of [
            ["pwa-192x192.png", 192],
            ["pwa-512x512.png", 512],
            ["pwa-maskable-512x512.png", 512],
            ["apple-touch-icon.png", 180],
            ["favicon-32x32.png", 32],
            ["favicon-16x16.png", 16],
        ] as const) {
            const png = fs.readFileSync(path.join(repoRoot, "public/admin/icons", file));
            expect(png.readUInt32BE(16)).toBe(size);
            expect(png.readUInt32BE(20)).toBe(size);
            expect(png[25]).toBe(6);
        }
    });
});
