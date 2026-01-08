import { MapPin, Phone, Clock, Instagram, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Contact = () => {
  const whatsappNumber = "5500000000000"; // Placeholder - será atualizado com número real
  const whatsappMessage = encodeURIComponent("Olá! Gostaria de agendar uma consulta na Vitalité.");

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
              Agende sua consulta
            </h2>
            <p className="text-accent-foreground/80 mb-8 max-w-md">
              Estamos prontos para cuidar do seu sorriso. Entre em contato pelo 
              WhatsApp para um atendimento rápido e personalizado.
            </p>

            {/* WhatsApp CTA */}
            <Button 
              size="lg" 
              className="gap-2 mb-8"
              onClick={() => window.open(`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`, '_blank')}
            >
              <MessageCircle className="w-5 h-5" />
              Chamar no WhatsApp
            </Button>

            {/* Contact Info */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-accent-foreground">Localização</h4>
                  <p className="text-sm text-accent-foreground/70">
                    Sala 206 - Endereço a definir<br />
                    <span className="text-xs">(Endereço completo será adicionado)</span>
                  </p>
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
                  <h4 className="font-medium text-accent-foreground">Telefone</h4>
                  <p className="text-sm text-accent-foreground/70">
                    (00) 0000-0000<br />
                    <span className="text-xs">(Número a definir)</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Social & Map Placeholder */}
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {/* Map Placeholder */}
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <div className="text-center p-8">
                    <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Mapa será adicionado após definição do endereço
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            <div className="flex gap-4">
              <Button variant="outline" className="flex-1 gap-2">
                <Instagram className="w-5 h-5" />
                Instagram
              </Button>
              <Button variant="outline" className="flex-1 gap-2">
                <MessageCircle className="w-5 h-5" />
                WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
