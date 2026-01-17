import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-clinic.jpg";
import { LeadCaptureDialog } from "@/components/LeadCaptureDialog";

const Hero = () => {
  const [open, setOpen] = useState(false);
  return (
    <section id="inicio" className="relative min-h-[60vh] sm:min-h-[70vh] md:min-h-[80vh] lg:min-h-[90vh] flex items-center">
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-12">
        <div className="max-w-xl lg:max-w-2xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 mb-4 sm:mb-6 md:mb-8">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            <span className="text-xs sm:text-sm font-medium text-primary">Governador Valadares - MG</span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-serif font-bold text-foreground leading-tight mb-3 sm:mb-4 md:mb-6">
            Núcleo Odontológico: Seu sorriso merece{" "}
            <span className="text-gold">excelência</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8 md:mb-10 leading-relaxed">
            Odontologia de alta qualidade e harmonização facial com tecnologia avançada
            e atendimento personalizado.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 md:gap-4">
            <div onClick={() => setOpen(true)}>
              <Button
                size="lg"
                className="w-full sm:w-auto gap-2 text-sm px-5 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 h-auto"
              >
                Agendar Consulta
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <LeadCaptureDialog open={open} onOpenChange={setOpen} />
            <Link to="/tratamentos">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-sm px-5 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 h-auto"
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
