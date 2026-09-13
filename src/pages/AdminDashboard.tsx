import { Link } from "react-router-dom";
import { Calendar, Check, ChevronRight, MessageSquare, Users } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { fetchClient } from "@/lib/api";

interface RecentLead { id: number; status: string; }
interface RecentTestimonial { name: string; comment?: string; content?: string; }
interface RecentAppointment { id: number; patientName: string; procedure?: string; professional?: string; date: string; }

interface DashboardStats {
    recentStock?: Array<{ id: string; name: string; quantity: number; stockUnit: string; stockValue: number }>;
    users: number;
    posts: number;
    appointments: number;
    leads: number;
    pendingLeadCount?: number;
    testimonials: number;
    recentAppointments: RecentAppointment[];
    recentLeads: RecentLead[];
    recentTestimonials: RecentTestimonial[];
    upcomingSchedule: Array<{
        kind: 'lead' | 'appointment';
        id: number;
        patientName: string;
        treatment: string | null;
        procedure: string | null;
        appointmentType: string | null;
        scheduledAt: string;
        createdAt: string;
        patientId: number | null;
        leadId: number | null;
    }>;
}



const dayFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
const timeFormatter = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
const formatDate = (value: string, formatter = dayFormatter) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : formatter.format(date);
};

const AdminDashboard = () => {
    const queryClient = useQueryClient();
    const userStr = localStorage.getItem("admin_user");
    const currentUser = userStr ? JSON.parse(userStr) : {};
    const isManager = currentUser.role === "manager";
    const { data: stats, isPending, isError, isFetching, refetch } = useQuery({
        queryKey: ["dashboard-stats"],
        queryFn: async () => {
            const res = await fetchClient("/dashboard/stats");
            if (!res.ok) throw new Error("Não foi possível carregar o painel.");
            return await res.json() as DashboardStats;
        },
    });
    const attendance = useMutation({
        mutationFn: async (item: DashboardStats["upcomingSchedule"][number]) => {
            const endpoint = item.kind === "lead" ? "/leads/" + item.leadId : "/appointments/" + item.id;
            const payload = item.kind === "lead" ? { status: "completed" } : { status: "attended" };
            const res = await fetchClient(endpoint, { method: "PUT", body: JSON.stringify(payload) });
            if (!res.ok) throw new Error("Falha ao atualizar atendimento.");
        },
        onSuccess: async (_, item) => {
            toast.success("Paciente marcado como atendido.");
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] }),
                item.kind === "lead"
                    ? queryClient.invalidateQueries({ queryKey: ['leads'] })
                    : queryClient.invalidateQueries({ queryKey: ["appointments"] }),
            ]);
        },
        onError: () => toast.error("Não foi possível atualizar. Tente novamente."),
    });
    const schedule = stats?.upcomingSchedule ?? [];
    const recent = stats?.recentAppointments ?? [];
    const feedback = stats?.recentTestimonials?.[0];

    return (
        <AdminLayout title="Dashboard">
            <div className="space-y-4 md:space-y-6">
                {isPending && <p role="status" className="py-4 text-sm text-slate-600">Carregando painel…</p>}
                {isError && (
                    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                        <p>Não foi possível atualizar o painel.</p>
                        <Button variant="outline" disabled={isFetching} onClick={() => void refetch()}>Tentar novamente</Button>
                    </div>
                )}
                {stats && <>
                    {!isManager && <section aria-labelledby="stock-heading" className="admin-card overflow-hidden">
                        <div className="flex items-center justify-between gap-3 px-3 py-2 sm:px-5">
                            <h2 id="stock-heading" className="font-serif text-xl font-bold text-slate-900">Estoque</h2>
                            <Link to="/admin/settings/estoque" className="inline-flex min-h-11 items-center rounded-lg px-2 text-xs font-semibold text-primary hover:bg-primary/10">Ver estoque</Link>
                        </div>
                        {stats.recentStock?.length ? <ul className="divide-y divide-slate-200 border-t border-slate-200">{stats.recentStock.slice(0, 3).map(product => (
                            <li key={product.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-2 text-sm sm:px-5">
                                <span className="min-w-0 break-words font-medium text-slate-900">{product.name}</span>
                                <span className="text-slate-600 tabular-nums">{product.quantity.toLocaleString("pt-BR", { maximumFractionDigits: 6 })} {product.stockUnit === "ml" ? "ml" : "un."} restantes · {product.stockValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} em estoque</span>
                            </li>
                        ))}</ul> : <p className="px-3 pb-3 text-sm text-slate-600 sm:px-5">Nenhum produto registrado.</p>}
                    </section>}
                    <div className="grid items-start gap-4 md:gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                        <section aria-labelledby="upcoming-heading" className="admin-card overflow-hidden">
                            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-3 py-3 sm:px-5">
                                <div><h2 id="upcoming-heading" className="font-serif text-xl font-bold text-slate-900">Próxima agenda</h2><p className="mt-0.5 text-xs text-slate-600">Horários confirmados</p></div>
                                {!isManager && <Link to="/admin/calendario" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"><Calendar size={17} aria-hidden="true" /> Agenda</Link>}
                            </div>
                            {schedule.length ? (
                                <ul className="divide-y divide-slate-200">
                                    {schedule.map(item => {
                                        const destination = item.kind === "lead"
                                            ? "/admin/consultas/new?leadId=" + item.leadId
                                            : "/admin/consultas/" + item.id + "?patientId=" + (item.patientId ?? "");
                                        const updating = attendance.isPending && attendance.variables === item;
                                        return (
                                            <li key={item.kind + "-" + item.id} className="px-3 py-3 sm:px-5">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-14 shrink-0 border-r border-slate-200 pr-2 text-center">
                                                        <time dateTime={item.scheduledAt} className="text-base font-bold tabular-nums text-slate-900">{formatDate(item.scheduledAt, timeFormatter)}</time>
                                                        <p className="mt-1 text-[11px] text-slate-600">{formatDate(item.scheduledAt)}</p>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="break-words text-sm font-semibold text-slate-900">{item.patientName}</p>
                                                        <p className="mt-0.5 break-words text-xs text-slate-600">{item.treatment || item.procedure || "Procedimento geral"}</p>
                                                        <p className="mt-1 text-[11px] text-slate-500">{item.kind === "lead" ? "Solicitação confirmada" : item.appointmentType || "Consulta"}</p>
                                                    </div>
                                                </div>
                                                {!isManager && (
                                                    <div className="mt-2 flex flex-wrap justify-end gap-2">
                                                        <Button variant="outline" className="min-h-11 gap-1.5 px-3 text-xs" disabled={attendance.isPending} onClick={() => attendance.mutate(item)} aria-label={"Marcar " + item.patientName + " como atendido"}><Check size={15} aria-hidden="true" />{updating ? "Salvando…" : "Atendido"}</Button>
                                                        <Link to={destination} className="inline-flex min-h-11 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90">{item.kind === "lead" ? "Iniciar consulta" : "Abrir consulta"}<ChevronRight size={15} aria-hidden="true" /></Link>
                                                    </div>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : <p className="px-4 py-8 text-center text-sm text-slate-600">Nenhum horário agendado.</p>}
                        </section>
                        <div className="min-w-0 space-y-4">
                            <section aria-labelledby="recent-heading" className="admin-card overflow-hidden">
                                <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-3 py-2 sm:px-5"><Users size={18} aria-hidden="true" className="text-primary" /><h2 id="recent-heading" className="font-serif text-xl font-bold text-slate-900">Histórico recente</h2>{!isManager && <Link to="/admin/consultas" className="ml-auto inline-flex min-h-11 items-center rounded-lg px-2 text-xs font-semibold text-primary hover:bg-primary/10">Ver consultas</Link>}</div>
                                {recent.length ? <ul className="divide-y divide-slate-200">{recent.map(app => (
                                    <li key={app.id} className="px-3 py-3 sm:px-5">
                                        <div className="flex items-start justify-between gap-3"><p className="min-w-0 break-words text-sm font-semibold text-slate-900">{app.patientName}</p><time dateTime={app.date} className="shrink-0 text-xs tabular-nums text-slate-600">{formatDate(app.date)}</time></div>
                                        <p className="mt-1 break-words text-xs text-slate-600">{app.procedure || "Consulta"}{app.professional ? " · " + app.professional : ""}</p>
                                    </li>
                                ))}</ul> : <p className="px-4 py-8 text-center text-sm text-slate-600">Nenhum registro recente.</p>}
                            </section>
                            {!isManager && <Link to="/admin/solicitacoes" className="admin-card flex items-center justify-between gap-3 p-3 sm:px-5">
                                <span className="text-sm font-medium text-slate-600">Solicitações pendentes</span>
                                <span className="ml-auto text-xl font-semibold tabular-nums text-slate-900">{stats.pendingLeadCount ?? 0}</span>
                                <ChevronRight size={16} aria-hidden="true" className="text-slate-500" />
                            </Link>}
                            <section aria-labelledby="feedback-heading" className="admin-card p-3 sm:p-5">
                                <div className="flex flex-wrap items-center justify-between gap-2"><h2 id="feedback-heading" className="flex items-center gap-2 text-sm font-semibold text-slate-700"><MessageSquare size={16} aria-hidden="true" /> Último comentário</h2><Link to="/admin/comentarios" className="inline-flex min-h-11 items-center rounded-lg px-2 text-xs font-semibold text-primary hover:bg-primary/10">Ver comentários</Link></div>
                                {feedback ? <div className="mt-1"><p className="break-words text-sm font-semibold text-slate-900">{feedback.name}</p><p className="mt-1 line-clamp-3 break-words text-sm leading-relaxed text-slate-600">{feedback.comment || feedback.content}</p></div> : <p className="text-sm text-slate-600">Nenhum feedback recente.</p>}
                            </section>
                        </div>
                    </div>
                </>}
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
