import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-clinic.jpg";

const Hero = () => {
  return (
    <section id="inicio" className="relative min-h-screen flex items-center pt-20">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Consultório Vitalité - Ambiente moderno e acolhedor"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Núcleo Especializado</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground leading-tight mb-6">
            Seu sorriso merece{" "}
            <span className="text-gold">excelência</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-xl">
            Odontologia de alta qualidade e harmonização facial com tecnologia avançada 
            e atendimento personalizado na Sala 206.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="gap-2 glow-gold">
              Agendar Consulta
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="lg">
              Conhecer Tratamentos
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-border">
            <div>
              <p className="text-2xl font-serif font-bold text-foreground">2+</p>
              <p className="text-sm text-muted-foreground">Especialistas</p>
            </div>
            <div>
              <p className="text-2xl font-serif font-bold text-foreground">CRO/MG</p>
              <p className="text-sm text-muted-foreground">Registradas</p>
            </div>
            <div>
              <p className="text-2xl font-serif font-bold text-foreground">100%</p>
              <p className="text-sm text-muted-foreground">Atendimento Humanizado</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
