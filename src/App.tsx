import { Toaster } from "@/components/ui/toaster";
import { Toaster as ToasterSonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import TreatmentList from "./pages/TreatmentList";
import TreatmentDetail from "./pages/TreatmentDetail";
import BlogList from "./pages/BlogList";
import BlogPost from "./pages/BlogPost";
import PageTracker from "./components/PageTracker";
import AdminPwaProvider from "./components/admin/AdminPwaProvider";
import PageLoadBoundary from "./components/PageLoadBoundary";
import { AuthProvider, ProtectedRoute, RoleProtectedRoute } from "./hooks/useAuth";

const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminBlog = lazy(() => import("./pages/AdminBlog"));
const AdminLeads = lazy(() => import("./pages/AdminLeads"));
const AdminComments = lazy(() => import("./pages/AdminComments"));
const AdminTreatments = lazy(() => import("./pages/AdminTreatments"));
const AdminAppointments = lazy(() => import("./pages/AdminAppointments"));
const AdminAttendanceDetail = lazy(() => import("./pages/AdminAttendanceDetail"));
const AdminStories = lazy(() => import("./pages/AdminStories"));
const AdminFinance = lazy(() => import("./pages/AdminFinance"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const AdminPrescription = lazy(() => import("./pages/AdminPrescription"));
const AdminDocuments = lazy(() => import("./pages/AdminDocuments"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminStock = lazy(() => import("./pages/AdminStock"));
const AdminPersonalFinance = lazy(() => import("./pages/AdminPersonalFinance"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminPatients = lazy(() => import("./pages/AdminPatients"));
const AdminCalendar = lazy(() => import("./pages/AdminCalendar"));

const queryClient = new QueryClient();

const AdminPwaRouteBoundary = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  return isAdminRoute ? <AdminPwaProvider>{children}</AdminPwaProvider> : <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <ToasterSonner />
      <BrowserRouter>
        <PageTracker />
        <AdminPwaRouteBoundary>
          <AuthProvider>
            <PageLoadBoundary>
            <Suspense fallback={<div role="status" className="flex min-h-[50dvh] items-center justify-center p-6 text-sm text-slate-600">Carregando página…</div>}>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/tratamentos" element={<TreatmentList />} />
            <Route path="/tratamentos/:slug" element={<TreatmentDetail />} />
            <Route path="/blog" element={<BlogList />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/admin" element={<AdminLogin />} />

            {/* Protected Admin Routes */}
            {/* Open to all authenticated users */}
            <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/comentarios" element={<ProtectedRoute><AdminComments /></ProtectedRoute>} />
            <Route path="/admin/stories" element={<ProtectedRoute><AdminStories /></ProtectedRoute>} />
            <Route path="/admin/finance" element={<ProtectedRoute><AdminFinance /></ProtectedRoute>} />
            <Route path="/admin/personal-finance" element={<ProtectedRoute><AdminPersonalFinance /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute><AdminAnalytics /></ProtectedRoute>} />
            <Route path="/admin/documentos" element={<ProtectedRoute><AdminDocuments /></ProtectedRoute>} />

            {/* Restricted: admin-only (manager gets redirected to dashboard) */}
            <Route path="/admin/blog" element={<RoleProtectedRoute><AdminBlog /></RoleProtectedRoute>} />
            <Route path="/admin/solicitacoes" element={<RoleProtectedRoute><AdminLeads /></RoleProtectedRoute>} />
            <Route path="/admin/tratamentos" element={<RoleProtectedRoute><AdminTreatments /></RoleProtectedRoute>} />
            <Route path="/admin/consultas" element={<RoleProtectedRoute><AdminAppointments /></RoleProtectedRoute>} />
            <Route path="/admin/calendario" element={<RoleProtectedRoute><AdminCalendar /></RoleProtectedRoute>} />
            <Route path="/admin/consultas/:id" element={<RoleProtectedRoute><AdminAttendanceDetail /></RoleProtectedRoute>} />
            <Route path="/admin/prescricao" element={<RoleProtectedRoute><AdminPrescription /></RoleProtectedRoute>} />
            <Route path="/admin/settings" element={<RoleProtectedRoute><AdminSettings /></RoleProtectedRoute>} />
            <Route path="/admin/settings/estoque" element={<RoleProtectedRoute><AdminStock /></RoleProtectedRoute>} />
            <Route path="/admin/users" element={<RoleProtectedRoute><AdminUsers /></RoleProtectedRoute>} />
            <Route path="/admin/pacientes" element={<RoleProtectedRoute><AdminPatients /></RoleProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
            </PageLoadBoundary>
          </AuthProvider>
        </AdminPwaRouteBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
