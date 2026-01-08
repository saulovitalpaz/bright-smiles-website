import { Smile, Syringe, Shield, Sparkles, Heart, Sun } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const services = [
  {
    icon: Shield,
    title: "Bruxismo",
    description: "Tratamento especializado para ranger de dentes com placas personalizadas e acompanhamento.",
    category: "Odontologia"
  },
  {
    icon: Smile,
    title: "Implantes Dentários",
    description: "Reposição de dentes perdidos com técnicas modernas e resultados naturais.",
    category: "Odontologia"
  },
  {
    icon: Heart,
    title: "Próteses",
    description: "Soluções em próteses fixas e removíveis para recuperar sua autoestima.",
    category: "Odontologia"
  },
  {
    icon: Syringe,
    title: "Toxina Botulínica",
    description: "Harmonização facial com aplicação precisa para resultados naturais e sutis.",
    category: "Harmonização"
  },
  {
    icon: Sparkles,
    title: "Preenchimento Labial",
    description: "Volume e contorno labial com ácido hialurônico de alta qualidade.",
    category: "Harmonização"
  },
  {
    icon: Sun,
    title: "Bioestimuladores",
    description: "Rejuvenescimento natural através da estimulação de colágeno.",
    category: "Harmonização"
  },
];

const Services = () => {
  return (
    <section id="tratamentos" className="section-padding bg-card">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-medium text-primary uppercase tracking-wider">
            Nossos Tratamentos
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mt-2 mb-4">
            Especialidades que transformam
          </h2>
          <p className="text-muted-foreground">
            Oferecemos tratamentos odontológicos completos e procedimentos de 
            harmonização facial realizados por profissionais experientes.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <Card 
              key={index}
              className="group hover:border-primary/30 transition-all duration-300 hover:shadow-lg"
            >
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <service.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                    {service.category}
                  </span>
                </div>
                <CardTitle className="font-serif text-xl">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {service.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
