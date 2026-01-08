import { Award, Instagram, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const team = [
  {
    name: "Dra. Ana Karolina Vital da Paz",
    cro: "CRO/MG 60.514",
    specialty: "Cirurgiã-Dentista",
    description: "Especialista em harmonização orofacial e procedimentos estéticos com foco em resultados naturais.",
    phone: "5533991219695",
    instagram: "https://www.instagram.com/anav_paz",
  },
  {
    name: "Dra. Clara Lima de Souza",
    cro: "CRO/MG 60.938",
    specialty: "Cirurgiã-Dentista",
    description: "Especialista em odontologia restauradora e tratamentos de bruxismo com abordagem humanizada.",
    phone: null,
    instagram: "https://www.instagram.com/claraslima",
  },
];

const Team = () => {
  return (
    <section id="equipe" className="section-padding">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-medium text-primary uppercase tracking-wider">
            Nossa Equipe
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mt-2 mb-4">
            Profissionais dedicadas ao seu sorriso
          </h2>
          <p className="text-muted-foreground">
            Conheça as especialistas que fazem parte do Núcleo Odontológico Especializado, 
            comprometidas com excelência e atendimento humanizado.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {team.map((member, index) => (
            <Card key={index} className="overflow-hidden group">
              {/* Placeholder for photo */}
              <div className="aspect-[4/3] bg-gradient-to-br from-muted to-secondary flex items-center justify-center relative overflow-hidden">
                <div className="w-24 h-24 rounded-full gradient-gold flex items-center justify-center">
                  <span className="text-4xl font-serif font-bold text-primary-foreground">
                    {member.name.split(' ')[1]?.charAt(0) || member.name.charAt(0)}
                  </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-foreground">
                      {member.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{member.specialty}</p>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10">
                    <Award className="w-3 h-3 text-primary" />
                    <span className="text-xs font-medium text-primary">{member.cro}</span>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  {member.description}
                </p>

                {/* Social Links */}
                <div className="flex gap-2">
                  {member.phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => window.open(`https://wa.me/${member.phone}`, '_blank')}
                    >
                      <Phone className="w-4 h-4" />
                      WhatsApp
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
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
    </section>
  );
};

export default Team;
