import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-clinic.jpg";
import { LeadCaptureDialog } from "@/components/LeadCaptureDialog";

const Hero = () => {
  const [open, setOpen] = useState(false);
  return (
    <section id="inicio" className="relative min-h-[90vh] flex items-center">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Núcleo Odontológico Especializado - Ambiente moderno e acolhedor"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-24 pb-12">
        <div className="max-w-xl lg:max-w-2xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Governador Valadares - MG</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground leading-tight mb-6">
            Núcleo Odontológico: Seu sorriso merece{" "}
            <span className="text-gold">excelência</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
            Odontologia de alta qualidade e harmonização facial com tecnologia avançada
            e atendimento personalizado.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div onClick={() => setOpen(true)}>
              <Button
                size="lg"
                className="w-full sm:w-auto gap-2 text-sm sm:text-base px-6 sm:px-8 py-4 sm:py-6"
              >
                Agendar Consulta
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
            <LeadCaptureDialog open={open} onOpenChange={setOpen} />
            <Link to="/tratamentos">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-sm sm:text-base px-6 sm:px-8 py-4 sm:py-6"
              >
                Conhecer Tratamentos
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
