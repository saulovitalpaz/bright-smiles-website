import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Phone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { API_URL } from "@/lib/api";

const Header = () => {
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  const navItems = [
    { label: "Início", href: "/" },
    { label: "Stories", href: isHome ? "#stories" : "/#stories" },
    { label: "Tratamentos", href: "/tratamentos" },
    { label: "Equipe", href: isHome ? "#equipe" : "/#equipe" },
    { label: "Blog", href: "/blog" },
    { label: "Contato", href: isHome ? "#contato" : "/#contato" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-20 lg:h-24 transition-all duration-300">
          {/* Logo with Image */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 flex items-center justify-center overflow-hidden">
              <img
                src={logoUrl}
                alt={`Logo ${clinicName}`}
                className="w-full h-full object-contain transition-transform group-hover:scale-105 drop-shadow-md"
                onError={(e) => (e.target as HTMLImageElement).src = "/images/logo-oficial.png"}
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-serif font-bold text-foreground leading-tight">
                {clinicName}
              </h1>
              <p className="text-[10px] sm:text-xs md:text-sm text-foreground font-medium tracking-wider uppercase opacity-80">
                {clinicSlogan}
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
          <div className="lg:hidden py-4 sm:py-6 border-t border-border bg-background animate-in slide-in-from-top-4 duration-300">
            <nav className="flex flex-col gap-4 sm:gap-5">
              {navItems.map((item) => (
                item.href.startsWith('/') ? (
                  <Link
                    key={item.label}
                    to={item.href}
                    className="text-base sm:text-lg font-bold text-foreground hover:text-primary transition-colors uppercase tracking-widest px-4"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.label}
                    href={item.href}
                    className="text-base sm:text-lg font-bold text-foreground hover:text-primary transition-colors uppercase tracking-widest px-4"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                )
              ))}
              <div className="px-4">
                <Button
                  variant="default"
                  className="w-full gap-2 h-10 sm:h-12 text-base sm:text-lg font-bold"
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (isHome) {
                      document.getElementById('agendamento')?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      window.location.href = '/#agendamento';
                    }
                  }}
                >
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
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
