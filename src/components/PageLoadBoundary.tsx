import { Component, type ReactNode } from "react";

export default class PageLoadBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    render() {
        if (this.state.failed) {
            return (
                <main className="flex min-h-dvh items-center justify-center bg-background p-6">
                    <div role="alert" className="max-w-sm space-y-4 text-center">
                        <h1 className="font-serif text-xl font-bold text-slate-900">Não foi possível abrir esta página</h1>
                        <p className="text-sm leading-relaxed text-slate-600">Verifique sua conexão e recarregue para tentar novamente.</p>
                        <button type="button" className="min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" onClick={() => window.location.reload()}>Recarregar página</button>
                    </div>
                </main>
            );
        }
        return this.props.children;
    }
}
