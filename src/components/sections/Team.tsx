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
    cro: "CRO/MG 60.369",
    specialty: "Clínico e Cirúrgico Geral",
    description: "Foco integral em atendimento clínico e cirúrgico geral, priorizando a saúde bucal e o bem-estar dos pacientes com técnicas modernas e seguras.",
    phone: null,
    instagram: "https://www.instagram.com/claraslima",
    image: "/images/profissionais/Clara Lima.jpg",
    objectPosition: "top"
  },
];

const Team = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <section id="equipe" className="section-padding relative overflow-hidden bg-background">
      {/* Background Image with Transparency - Mobile-optimized */}
      <div
        className="absolute inset-0 z-0 pointer-events-none bg-cover bg-no-repeat opacity-15 bg-top md:bg-[center_20%] bg-scroll md:bg-fixed"
        style={{
          backgroundImage: 'url("/images/profissionais/Ana Karolina e Clara.jpg")',
        }}
        aria-hidden="true"
      />

      {/* Subtle Gradient Overlay for Mobile readability */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-background/50 via-transparent to-background/50 pointer-events-none md:hidden" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10 md:mb-12">
          <span className="text-xs sm:text-sm font-medium text-primary uppercase tracking-wider">
            Nossa Equipe
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-foreground mt-2 mb-3 sm:mb-4">
            Especialistas dedicadas ao seu sorriso
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Conheça as profissionais do Núcleo Odontológico Especializado,
            comprometidas com a excelência técnica e o cuidado personalizado.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-8 max-w-5xl mx-auto">
          {team.map((member, index) => (
            <Card key={index} className="overflow-hidden group hover:border-primary/20 transition-all bg-card/95 backdrop-blur-md shadow-lg border-border/50">
              <div
                className="aspect-[1/1] sm:aspect-[4/5] bg-muted relative overflow-hidden cursor-pointer"
                onClick={() => setSelectedImage(member.image)}
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-70" />

                {/* Zoom Icon Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/20">
                  <Maximize2 className="w-10 h-10 text-foreground drop-shadow-lg" />
                </div>
              </div>

              <CardContent className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="min-w-0">
                    <h3 className="font-serif text-base sm:text-lg lg:text-xl font-semibold text-foreground truncate">
                      {member.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-primary font-medium">{member.specialty}</p>
                  </div>
                  <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-primary/10 border border-primary/20 flex-shrink-0">
                    <Award className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
                    <span className="text-[9px] sm:text-[10px] font-bold text-primary whitespace-nowrap">{member.cro}</span>
                  </div>
                </div>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4 md:mb-5 line-clamp-3">
                  {member.description}
                </p>

                <div className="flex gap-2">
                  {member.phone && (
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-1 flex-1 font-semibold text-xs sm:text-sm h-8 sm:h-9"
                      onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${member.phone}`, '_blank'); }}
                    >
                      <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      WhatsApp
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 flex-1 font-semibold text-xs sm:text-sm h-8 sm:h-9"
                    onClick={(e) => { e.stopPropagation(); window.open(member.instagram, '_blank'); }}
                  >
                    <Instagram className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 p-4 animate-in fade-in duration-300"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-6 right-6 text-foreground hover:text-primary transition-colors p-2"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <div className="max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl border border-primary/20 shadow-2xl">
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
