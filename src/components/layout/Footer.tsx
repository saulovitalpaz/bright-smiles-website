import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { API_URL } from "@/lib/api";

const Footer = () => {
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/settings`);
      return res.data;
    }
  });

  const logoUrl = settings?.site_logo || "/images/logo-oficial.png";
  const clinicName = settings?.clinic_name || "Núcleo Odontológico";
  const clinicSlogan = settings?.clinic_slogan || "Especializado & Harmonização";
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-16 h-16 flex items-center justify-center overflow-hidden">
                <img
                  src={logoUrl}
                  alt={`Logo ${clinicName}`}
                  className="w-full h-full object-contain drop-shadow-md"
                  onError={(e) => (e.target as HTMLImageElement).src = "/images/logo-oficial.png"}
                />
              </div>
              <div>
                <h3 className="font-serif font-semibold text-foreground text-lg">{clinicName}</h3>
                <p className="text-xs text-foreground font-medium uppercase tracking-wider opacity-80">{clinicSlogan}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              {clinicName} {clinicSlogan}.
              Excelência no cuidado do seu sorriso.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-medium text-foreground mb-4">Links Rápidos</h4>
            <nav className="space-y-2">
              <a href="#inicio" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Início
              </a>
              <a href="#tratamentos" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Tratamentos
              </a>
              <a href="#equipe" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Nossa Equipe
              </a>
              <a href="#blog" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Blog
              </a>
              <a href="#contato" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contato
              </a>
              <Link to="/admin" className="block text-xs text-muted-foreground/50 hover:text-primary transition-colors pt-4">
                Área Restrita
              </Link>
            </nav>
          </div>

          {/* Professionals */}
          <div>
            <h4 className="font-medium text-foreground mb-4">Profissionais</h4>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-foreground">Dra. Ana Karolina Vital da Paz</p>
                <p className="text-xs text-muted-foreground">CRO/MG 60.514</p>
              </div>
              <div>
                <p className="text-sm text-foreground">Dra. Clara Lima de Souza</p>
                <p className="text-xs text-muted-foreground">CRO/MG 60.369</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} {clinicName} {clinicSlogan}. Todos os direitos reservados.
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Feito com <Heart className="w-4 h-4 text-primary" /> para seu sorris🦷
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
