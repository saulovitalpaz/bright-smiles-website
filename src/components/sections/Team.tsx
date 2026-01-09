import { Award, Instagram, Phone, Maximize2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const team = [
  {
    name: "Dra. Ana Karolina Vital da Paz",
    cro: "CRO/MG 60.514",
    specialty: "Prótese, Implante & Harmonização",
    description: "Especialista em Prótese e Implantes pela São Leopoldo Mandic. Possui cursos de aperfeiçoamento em Harmonização Facial, Botox e Preenchimento Hialurônico. Atua também como Clínica Geral.",
    phone: "5533991219695",
    instagram: "https://www.instagram.com/anav_paz",
    image: "/images/profissionais/Ana Karolina.jpg"
  },
  {
    name: "Dra. Clara Lima de Souza",
    cro: "CRO/MG 60.938",
    specialty: "Clínico e Cirúrgico Geral",
    description: "Foco integral em atendimento clínico e cirúrgico geral, priorizando a saúde bucal e o bem-estar dos pacientes com técnicas modernas e seguras.",
    phone: null,
    instagram: "https://www.instagram.com/claraslima",
    image: "/images/profissionais/Clara Lima.jpg",
    objectPosition: "top" // Specific positioning for Dra. Clara
  },
];

const Team = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <section id="equipe" className="section-padding relative overflow-hidden bg-background">
      {/* Background Image with Transparency - Isolated in a separate div */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: 'url("/images/profissionais/Ana Karolina e Clara.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.15, // Low opacity as requested
          mixBlendMode: 'multiply'
        }}
      />

      <div className="container mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-medium text-primary uppercase tracking-wider">
            Nossa Equipe
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mt-2 mb-4">
            Especialistas dedicadas ao seu sorriso
          </h2>
          <p className="text-muted-foreground">
            Conheça as profissionais do Núcleo Odontológico Especializado,
            comprometidas com a excelência técnica e o cuidado personalizado.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {team.map((member, index) => (
            <Card key={index} className="overflow-hidden group hover:border-primary/20 transition-all bg-card/90 backdrop-blur-md shadow-xl border-border/50">
              <div
                className="aspect-[4/5] bg-muted relative overflow-hidden cursor-pointer"
                onClick={() => setSelectedImage(member.image)}
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  style={{ objectPosition: member.objectPosition || 'center' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent opacity-60" />

                {/* Zoom Icon Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                  <Maximize2 className="w-10 h-10 text-white drop-shadow-lg" />
                </div>
              </div>

              <CardContent className="pt-6 relative">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-foreground">
                      {member.name}
                    </h3>
                    <p className="text-sm text-primary font-medium tracking-wide">{member.specialty}</p>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 border border-primary/20 flex-shrink-0">
                    <Award className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-bold text-primary">{member.cro}</span>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6 font-medium">
                  {member.description}
                </p>

                <div className="flex gap-2">
                  {member.phone && (
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-1 flex-1 sm:flex-none font-bold"
                      onClick={() => window.open(`https://wa.me/${member.phone}`, '_blank')}
                    >
                      <Phone className="w-4 h-4" />
                      WhatsApp
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 flex-1 sm:flex-none font-bold"
                    onClick={() => window.open(member.instagram, '_blank')}
                  >
                    <Instagram className="w-4 h-4" />
                    Instagram
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Lightbox / Zoom Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-300"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-6 right-6 text-white hover:text-primary transition-colors p-2"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <div className="max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border-2 border-primary/20 shadow-2xl">
            <img
              src={selectedImage}
              alt="Professional Zoom"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default Team;
