import { useState } from "react";
import { MapPin, Phone, Clock, Instagram, MessageCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LeadCaptureDialog } from "@/components/LeadCaptureDialog";

const Contact = () => {
  const [open, setOpen] = useState(false);
  const mapUrl = "https://maps.app.goo.gl/chx7grgranKEyPhP8";

  return (
    <section id="contato" className="min-w-0 text-foreground">
      <div className="container mx-auto px-4">
        <div className="grid min-w-0 grid-cols-1 gap-8">
          {/* Left Content */}
          <div>
            <span className="text-xs sm:text-sm font-medium text-primary uppercase tracking-wider">
              Entre em Contato
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold mt-2 mb-3 sm:mb-4">
              Venha nos conhecer
            </h2>
            <p className="text-sm sm:text-base text-accent-foreground/80 mb-4 sm:mb-6 md:mb-8 max-w-md">
              Estamos prontos para cuidar do seu sorriso. Agende seu atendimento de forma rápida e personalizada.
            </p>

            {/* WhatsApp CTA */}
            <div>
              <Button onClick={() => setOpen(true)} size="lg" className="gap-2 mb-6 sm:mb-8 text-sm sm:text-base min-h-11">
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                Agendar
              </Button>
            </div>
            <LeadCaptureDialog open={open} onOpenChange={setOpen} />

            {/* Contact Info */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-medium text-accent-foreground">Localização</h4>
                  <p className="text-xs sm:text-sm text-accent-foreground/70">
                    Rua Barão do Rio Branco, 461 - Sala 206
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-primary gap-1 text-xs sm:text-sm"
                    onClick={() => window.open(mapUrl, '_blank')}
                  >
                    Ver no Google Maps
                    <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-medium text-accent-foreground">Horário de Atendimento</h4>
                  <p className="text-xs sm:text-sm text-accent-foreground/70">
                    Segunda a Sexta: 8h às 18h<br />
                    Sábado: 8h às 12h
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-medium text-accent-foreground">WhatsApp</h4>
                  <p className="text-xs sm:text-sm text-accent-foreground/70">
                    (33) 99121-9695
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Map & Social */}
          <div className="space-y-4 sm:space-y-6">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {/* Map Embed */}
                <div className="aspect-[16/10] sm:aspect-video relative">
                  <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
                    <div className="text-center p-8">
                      <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        Clique para ver a localização completa
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => window.open(mapUrl, '_blank')}
                        className="gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Abrir no Google Maps
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <Button
                variant="outline"
                className="gap-1.5 sm:gap-2 text-xs sm:text-sm h-9 sm:h-10"
                onClick={() => window.open('https://www.instagram.com/anav_paz', '_blank')}
              >
                <Instagram className="w-4 h-4 sm:w-5 sm:h-5" />
                @anav_paz
              </Button>
              <Button
                variant="outline"
                className="gap-1.5 sm:gap-2 text-xs sm:text-sm h-9 sm:h-10"
                onClick={() => window.open('https://www.instagram.com/claraslima', '_blank')}
              >
                <Instagram className="w-4 h-4 sm:w-5 sm:h-5" />
                @claraslima
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
