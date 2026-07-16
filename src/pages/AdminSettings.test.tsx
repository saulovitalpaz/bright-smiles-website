import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios, { AxiosHeaders, type AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { API_URL } from "@/lib/api";
import AdminSettings from "./AdminSettings";

vi.mock("@/components/admin/AdminLayout", () => ({
    default: ({ children, title }: { children: ReactNode; title: string }) => (
        <main aria-label={title}>{children}</main>
    ),
}));

vi.mock("sonner", () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
    },
}));

vi.mock("axios", async (importOriginal) => {
    const actual = await importOriginal<typeof import("axios")>();

    return {
        ...actual,
        default: {
            ...actual.default,
            get: vi.fn(),
            isAxiosError: vi.fn(() => false),
            patch: vi.fn(),
            post: vi.fn(),
        },
    };
});

const axiosGetMock = vi.mocked(axios.get);
const axiosPatchMock = vi.mocked(axios.patch);
const axiosPostMock = vi.mocked(axios.post);

const globalSettings = {
    clinic_name: "Núcleo Odontológico",
    clinic_slogan: "Especializado & Harmonização",
    contact_instagram: "clinica.nucleo",
    contact_whatsapp: "5531999999999",
    site_logo: "bucket://public/logo.png",
    system_only_setting: "preservar sem editar",
};

function response<T>(data: T): AxiosResponse<T> {
    return {
        config: { headers: new AxiosHeaders() },
        data,
        headers: {},
        status: 200,
        statusText: "OK",
    };
}

function cacheAdminUser(user: Record<string, unknown>) {
    localStorage.setItem("admin_user", JSON.stringify(user));
}

async function renderLoadedSettings() {
    render(<AdminSettings />);
    await screen.findByRole("heading", {
        name: "Identidade e Assinatura Profissional",
    });
}

describe("AdminSettings professional settings", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
        axiosGetMock.mockResolvedValue(response(globalSettings));
        axiosPostMock.mockResolvedValue(response({}));
    });

    it("anuncia o carregamento inicial das configurações", () => {
        axiosGetMock.mockImplementationOnce(() => new Promise(() => undefined));

        render(<AdminSettings />);

        expect(
            screen.getByRole("status", { name: "Carregando configurações" }),
        ).toBeInTheDocument();
    });

    it("preenche a identidade profissional a partir de admin_user", async () => {
        cacheAdminUser({
            cro: "CRO-MG 12345",
            id: 7,
            name: "Dra. Karol Souza",
            role: "admin",
            signatureUrl: "bucket://public/signature.png",
            username: "karol",
        });

        await renderLoadedSettings();

        expect(screen.getByLabelText("Nome profissional")).toHaveValue("Dra. Karol Souza");
        expect(screen.getByLabelText("CRO")).toHaveValue("CRO-MG 12345");
        expect(
            screen.getByRole("img", { name: "Prévia da assinatura profissional" }),
        ).toHaveAttribute("src", expect.stringContaining("/assets?reference="));
    });

    it("usa campos vazios quando admin_user contém JSON inválido", async () => {
        localStorage.setItem("admin_user", "{inválido");

        await renderLoadedSettings();

        expect(screen.getByLabelText("Nome profissional")).toHaveValue("");
        expect(screen.getByLabelText("CRO")).toHaveValue("");
        expect(screen.getByText("Nenhuma assinatura enviada.")).toBeInTheDocument();
    });

    it("prepara a assinatura pública sem persistir antes de salvar", async () => {
        const user = userEvent.setup();
        const cachedUser = {
            cro: "CRO-MG 12345",
            id: 7,
            name: "Dra. Karol Souza",
            role: "admin",
            signatureUrl: "",
            username: "karol",
        };
        cacheAdminUser(cachedUser);
        axiosPostMock.mockResolvedValueOnce(
            response({ reference: "bucket://public/new-signature.png" }),
        );

        await renderLoadedSettings();
        const file = new File(["assinatura"], "assinatura.png", { type: "image/png" });
        await user.upload(screen.getByLabelText("Assinatura profissional"), file);

        await waitFor(() => {
            expect(axiosPostMock).toHaveBeenCalledWith(
                `${API_URL}/upload/signature`,
                expect.any(FormData),
                expect.objectContaining({ withCredentials: true }),
            );
        });
        const formData = axiosPostMock.mock.calls[0][1] as FormData;
        expect(formData.get("file")).toBe(file);
        expect(formData.get("scope")).toBeNull();
        expect(
            screen.getByRole("img", { name: "Prévia da assinatura profissional" }),
        ).toHaveAttribute("src", expect.stringContaining("new-signature.png"));
        expect(axiosPatchMock).not.toHaveBeenCalled();
        expect(localStorage.getItem("admin_user")).toBe(JSON.stringify(cachedUser));
    });

    it("salva perfil e configurações globais e substitui admin_user pela resposta", async () => {
        const user = userEvent.setup();
        cacheAdminUser({
            cro: "CRO-MG antiga",
            id: 7,
            name: "Nome antigo",
            role: "admin",
            signatureUrl: "bucket://public/signature.png",
            username: "karol",
        });
        const updatedUser = {
            cro: "CRO-MG 98765",
            id: 7,
            name: "Dra. Karol Atualizada",
            role: "admin",
            signatureUrl: "bucket://public/signature.png",
            username: "karol",
        };
        let finishProfileSave: (value: AxiosResponse<typeof updatedUser>) => void = () => undefined;
        axiosPatchMock.mockImplementationOnce(
            () => new Promise((resolve) => {
                finishProfileSave = resolve;
            }),
        );

        await renderLoadedSettings();
        await user.clear(screen.getByLabelText("Nome profissional"));
        await user.type(screen.getByLabelText("Nome profissional"), updatedUser.name);
        await user.clear(screen.getByLabelText("CRO"));
        await user.type(screen.getByLabelText("CRO"), updatedUser.cro);
        await user.click(screen.getByRole("button", { name: "Salvar Todas as Configurações" }));

        expect(screen.getByRole("button", { name: "Salvando..." })).toBeDisabled();
        expect(axiosPatchMock).toHaveBeenCalledWith(
            `${API_URL}/users/me`,
            {
                cro: updatedUser.cro,
                name: updatedUser.name,
                signatureUrl: updatedUser.signatureUrl,
            },
            { withCredentials: true },
        );

        finishProfileSave(response(updatedUser));

        await waitFor(() => {
            expect(localStorage.getItem("admin_user")).toBe(JSON.stringify(updatedUser));
        });
        const savedGlobalSettings = axiosPostMock.mock.calls
            .filter(([url]) => url === `${API_URL}/settings`)
            .map(([, body]) => body);
        expect(savedGlobalSettings).toEqual(
            expect.arrayContaining([
                { key: "site_logo", value: globalSettings.site_logo },
                { key: "clinic_name", value: globalSettings.clinic_name },
                { key: "clinic_slogan", value: globalSettings.clinic_slogan },
                { key: "contact_whatsapp", value: globalSettings.contact_whatsapp },
                { key: "contact_instagram", value: globalSettings.contact_instagram },
            ]),
        );
        expect(savedGlobalSettings).toHaveLength(5);
        expect(screen.getByRole("button", { name: "Salvar Todas as Configurações" })).toBeEnabled();
    });

    it("exibe erro acessível e libera uma nova tentativa quando o PATCH falha", async () => {
        const user = userEvent.setup();
        cacheAdminUser({
            cro: "CRO-MG 12345",
            id: 7,
            name: "Dra. Karol Souza",
            role: "admin",
            signatureUrl: "",
            username: "karol",
        });
        axiosPatchMock.mockRejectedValueOnce(new Error("rede indisponível"));

        await renderLoadedSettings();
        await user.click(screen.getByRole("button", { name: "Salvar Todas as Configurações" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Não foi possível salvar as configurações. Tente novamente.",
        );
        expect(screen.getByRole("button", { name: "Salvar Todas as Configurações" })).toBeEnabled();
    });

    it("associa labels e mantém o card profissional seguro em telas estreitas", async () => {
        await renderLoadedSettings();

        expect(screen.getByLabelText("Nome profissional")).toHaveAttribute("id");
        expect(screen.getByLabelText("CRO")).toHaveAttribute("id");
        expect(screen.getByLabelText("Assinatura profissional")).toHaveAttribute(
            "accept",
            "image/png,image/jpeg,image/webp",
        );
        expect(screen.getByTestId("professional-settings-card")).toHaveClass(
            "min-w-0",
            "max-w-full",
        );
        expect(screen.getByTestId("professional-settings-fields")).toHaveClass(
            "grid-cols-1",
        );
        expect(screen.getByRole("button", { name: "Salvar Todas as Configurações" })).toHaveClass(
            "w-full",
            "sm:w-auto",
        );
    });
});
