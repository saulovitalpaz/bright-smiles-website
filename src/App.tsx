import { Toaster } from "@/components/ui/toaster";
import { Toaster as ToasterSonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import TreatmentList from "./pages/TreatmentList";
import TreatmentDetail from "./pages/TreatmentDetail";
import BlogList from "./pages/BlogList";
import BlogPost from "./pages/BlogPost";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminBlog from "./pages/AdminBlog";
import AdminLeads from "./pages/AdminLeads";
import AdminComments from "./pages/AdminComments";
import AdminTreatments from "./pages/AdminTreatments";
import AdminAppointments from "./pages/AdminAppointments";
import AdminAttendanceDetail from "./pages/AdminAttendanceDetail";
import AdminStories from "./pages/AdminStories";
import AdminFinance from "./pages/AdminFinance";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminPrescription from "./pages/AdminPrescription";
import AdminDigitalGuide from "./pages/AdminDigitalGuide";
import AdminDocuments from "./pages/AdminDocuments";
import AdminSettings from "./pages/AdminSettings";
import AdminPersonalFinance from "./pages/AdminPersonalFinance";
import AdminUsers from "./pages/AdminUsers";
import PageTracker from "./components/PageTracker";

import { AuthProvider, ProtectedRoute, RoleProtectedRoute } from "./hooks/useAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <ToasterSonner />
      <BrowserRouter>
        <PageTracker />
        <AuthProvider>
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
            <Route path="/admin/consultas/:id" element={<RoleProtectedRoute><AdminAttendanceDetail /></RoleProtectedRoute>} />
            <Route path="/admin/prescricao" element={<RoleProtectedRoute><AdminPrescription /></RoleProtectedRoute>} />
            <Route path="/admin/digital-guide" element={<RoleProtectedRoute><AdminDigitalGuide /></RoleProtectedRoute>} />
            <Route path="/admin/settings" element={<RoleProtectedRoute><AdminSettings /></RoleProtectedRoute>} />
            <Route path="/admin/users" element={<RoleProtectedRoute><AdminUsers /></RoleProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
