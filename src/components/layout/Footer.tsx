import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

const Footer = () => {
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
                  src="/images/logo oficial.png"
                  alt="Logo Núcleo Odontológico"
                  className="w-full h-full object-contain rounded-full shadow-sm border border-border/30"
                />
              </div>
              <div>
                <h3 className="font-serif font-semibold text-foreground text-lg">Núcleo Odontológico</h3>
                <p className="text-xs text-foreground font-medium uppercase tracking-wider opacity-80">Especializado & Harmonização</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Núcleo Odontológico Especializado & Harmonização.
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
            © {currentYear} Núcleo Odontológico Especializado & Harmonização. Todos os direitos reservados.
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Feito com <Heart className="w-4 h-4 text-primary" /> e 🦷 para seu sorriso
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
