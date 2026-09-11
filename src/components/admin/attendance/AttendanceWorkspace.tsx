import { useId, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import "./attendance-workspace.css";

const destinations = [
    { key: "consultas", label: "Consultas", href: "/admin/consultas" },
    { key: "pacientes", label: "Pacientes", href: "/admin/pacientes" },
    { key: "prescricao", label: "Prescrição", href: "/admin/prescricao" },
    { key: "documentos", label: "Documentos", href: "/admin/documentos" },
] as const;

export function AttendanceWorkspace({ active, children }: {
    active: typeof destinations[number]["key"];
    children: ReactNode;
}) {
    const [isManager] = useState(() => {
        try { return JSON.parse(localStorage.getItem("admin_user") || "{}").role === "manager"; }
        catch { return false; }
    });
    return <div className="attendance-workspace">
        {!isManager && <nav aria-label="Atendimentos" className="attendance-navigation no-print">
            {destinations.map(item => <Link key={item.key} to={item.href} aria-current={active === item.key ? "page" : undefined}>{item.label}</Link>)}
        </nav>}
        {children}
    </div>;
}

export function AttendanceSection({ title, summary, children, defaultOpen = false, className = "" }: {
    title: string;
    summary?: ReactNode;
    children: ReactNode;
    defaultOpen?: boolean;
    className?: string;
}) {
    const id = useId();
    const [open, setOpen] = useState(defaultOpen);
    const [visited, setVisited] = useState(defaultOpen);
    return <section className={`attendance-section ${className}`}>
        <h3>
            <button type="button" id={`${id}-trigger`} aria-expanded={open} aria-controls={id}
                className="attendance-section-trigger" onClick={() => { setVisited(true); setOpen(value => !value); }}>
                <span className="min-w-0"><span className="block text-sm font-semibold">{title}</span>
                    {summary && <span className="mt-0.5 block text-xs font-normal text-slate-600">{summary}</span>}
                </span>
                <ChevronDown size={18} aria-hidden="true" className={open ? "shrink-0 rotate-180" : "shrink-0"} />
            </button>
        </h3>
        <div id={id} role="region" aria-labelledby={`${id}-trigger`} hidden={!open} className="attendance-section-content">
            {visited ? children : null}
        </div>
    </section>;
}
