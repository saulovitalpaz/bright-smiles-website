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
import AdminStories from "./pages/AdminStories";
import AdminFinance from "./pages/AdminFinance";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminPrescription from "./pages/AdminPrescription";
import AdminDigitalGuide from "./pages/AdminDigitalGuide";
import AdminDocuments from "./pages/AdminDocuments";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <ToasterSonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/tratamentos" element={<TreatmentList />} />
          <Route path="/tratamentos/:slug" element={<TreatmentDetail />} />
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/blog" element={<AdminBlog />} />
          <Route path="/admin/solicitacoes" element={<AdminLeads />} />
          <Route path="/admin/comentarios" element={<AdminComments />} />
          <Route path="/admin/tratamentos" element={<AdminTreatments />} />
          <Route path="/admin/consultas" element={<AdminAppointments />} />
          <Route path="/admin/stories" element={<AdminStories />} />
          <Route path="/admin/finance" element={<AdminFinance />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/prescricao" element={<AdminPrescription />} />
          <Route path="/admin/digital-guide" element={<AdminDigitalGuide />} />
          <Route path="/admin/documentos" element={<AdminDocuments />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
