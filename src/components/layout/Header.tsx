import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  const navItems = [
    { label: "Início", href: "/" },
    { label: "Tratamentos", href: "/tratamentos" },
    { label: "Equipe", href: isHome ? "#equipe" : "/#equipe" },
    { label: "Blog", href: "/blog" },
    { label: "Contato", href: isHome ? "#contato" : "/#contato" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-24 transition-all duration-300">
          {/* Logo with Image */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center overflow-hidden">
              <img
                src="/images/logo oficial.png"
                alt="Logo Núcleo Odontológico"
                className="w-full h-full object-contain transition-transform group-hover:scale-105 rounded-full shadow-sm border border-border/50"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg md:text-xl font-serif font-bold text-foreground leading-tight">
                Núcleo Odontológico
              </h1>
              <p className="text-xs md:text-sm text-foreground font-medium tracking-wider uppercase opacity-80">
                Especializado & Harmonização
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              item.href.startsWith('/') ? (
                <Link
                  key={item.label}
                  to={item.href}
                  className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
                >
                  {item.label}
                </a>
              )
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden md:flex items-center gap-4">
            <Button
              variant="default"
              size="lg"
              className="gap-2 shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all font-bold"
              onClick={() => {
                if (isHome) {
                  document.getElementById('agendamento')?.scrollIntoView({ behavior: 'smooth' });
                } else {
                  window.location.href = '/#agendamento';
                }
              }}
            >
              <Phone className="w-4 h-4" />
              Agendar
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-6 border-t border-border bg-background animate-in slide-in-from-top-4 duration-300">
            <nav className="flex flex-col gap-6 ">
              {navItems.map((item) => (
                item.href.startsWith('/') ? (
                  <Link
                    key={item.label}
                    to={item.href}
                    className="text-lg font-bold text-foreground hover:text-primary transition-colors uppercase tracking-widest px-4"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.label}
                    href={item.href}
                    className="text-lg font-bold text-foreground hover:text-primary transition-colors uppercase tracking-widest px-4"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                )
              ))}
              <div className="px-4">
                <Button
                  variant="default"
                  className="w-full gap-2 h-12 text-lg font-bold"
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (isHome) {
                      document.getElementById('agendamento')?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      window.location.href = '/#agendamento';
                    }
                  }}
                >
                  <Phone className="w-5 h-5" />
                  Agendar Consulta
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
