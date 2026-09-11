import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import PageLoadBoundary from "./PageLoadBoundary";

it("provides recovery when a lazy page fails without exposing technical details", () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    const BrokenPage = () => { throw new Error("Failed to fetch dynamically imported module: private-detail"); };
    try {
        render(<PageLoadBoundary><BrokenPage /></PageLoadBoundary>);
        expect(screen.getByRole("alert")).toHaveTextContent("Verifique sua conexão");
        expect(screen.getByRole("button", { name: "Recarregar página" })).toBeInTheDocument();
        expect(screen.queryByText(/private-detail/)).not.toBeInTheDocument();
    } finally { errorLog.mockRestore(); }
});
