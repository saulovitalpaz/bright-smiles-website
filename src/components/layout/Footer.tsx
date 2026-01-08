import { Heart } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center">
                <span className="text-primary-foreground font-serif font-bold text-lg">V</span>
              </div>
              <div>
                <h3 className="font-serif font-semibold text-foreground">Vitalité</h3>
                <p className="text-xs text-muted-foreground">Odontologia & Harmonização</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Núcleo Especializado em Odontologia e Harmonização Facial. 
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
              <a href="#contato" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contato
              </a>
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
                <p className="text-xs text-muted-foreground">CRO/MG 60.938</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Vitalité Odontologia & Harmonização. Todos os direitos reservados.
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Feito com <Heart className="w-4 h-4 text-primary" /> para seu sorriso
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
