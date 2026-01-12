import { useState } from "react";
import { MapPin, Phone, Clock, Instagram, MessageCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LeadCaptureDialog } from "@/components/LeadCaptureDialog";

const Contact = () => {
  const [open, setOpen] = useState(false);
  const whatsappNumber = "5533991219695";
  const whatsappMessage = encodeURIComponent("Olá! Gostaria de agendar uma consulta no Núcleo Odontológico Especializado.");
  const mapUrl = "https://maps.app.goo.gl/chx7grgranKEyPhP8";

  return (
    <section id="contato" className="section-padding bg-accent text-accent-foreground">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <span className="text-sm font-medium text-primary uppercase tracking-wider">
              Entre em Contato
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold mt-2 mb-4">
              Venha nos conhecer
            </h2>
            <p className="text-accent-foreground/80 mb-8 max-w-md">
              Estamos prontos para cuidar do seu sorriso. Entre em contato pelo
              WhatsApp para um atendimento rápido e personalizado.
            </p>

            {/* WhatsApp CTA */}
            <div onClick={() => setOpen(true)}>
              <Button size="lg" className="gap-2 mb-8">
                <MessageCircle className="w-5 h-5" />
                Agendar / Dúvidas
              </Button>
            </div>
            <LeadCaptureDialog open={open} onOpenChange={setOpen} />

            {/* Contact Info */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-accent-foreground">Localização</h4>
                  <p className="text-sm text-accent-foreground/70">
                    Rua Barão do Rio Branco, 461 - Sala 206
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-primary gap-1"
                    onClick={() => window.open(mapUrl, '_blank')}
                  >
                    Ver no Google Maps
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-accent-foreground">Horário de Atendimento</h4>
                  <p className="text-sm text-accent-foreground/70">
                    Segunda a Sexta: 8h às 18h<br />
                    Sábado: 8h às 12h
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-accent-foreground">WhatsApp</h4>
                  <p className="text-sm text-accent-foreground/70">
                    (33) 99121-9695
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Map & Social */}
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {/* Map Embed */}
                <div className="aspect-video relative">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3750.8!2d-41.5!3d-18.8!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTjCsDQ4JzAwLjAiUyA0McKwMzAnMDAuMCJX!5e0!3m2!1spt-BR!2sbr!4v1"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="absolute inset-0"
                    title="Localização do Consultório"
                  />
                  {/* Fallback overlay with button */}
                  <div className="absolute inset-0 bg-muted/90 flex items-center justify-center">
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
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => window.open('https://www.instagram.com/anav_paz', '_blank')}
              >
                <Instagram className="w-5 h-5" />
                @anav_paz
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => window.open('https://www.instagram.com/claraslima', '_blank')}
              >
                <Instagram className="w-5 h-5" />
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
