import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { treatments } from "@/data/treatments";
import * as LucideIcons from "lucide-react";

const Services = () => {
  const navigate = useNavigate();

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
          {treatments.map((service, index) => {
            return (
              <Card
                key={index}
                className="group hover:border-primary/30 transition-all duration-300 hover:shadow-lg overflow-hidden cursor-pointer flex flex-col"
                onClick={() => navigate(`/tratamentos/${service.slug}`)}
              >
                <div className="aspect-[16/9] overflow-hidden bg-secondary/10 p-4">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <CardHeader className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-widest text-primary font-bold">
                      {service.category}
                    </span>
                  </div>
                  <CardTitle className="font-serif group-hover:text-primary transition-colors">
                    {service.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-3">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <span className="text-sm font-medium text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Saiba mais <LucideIcons.ArrowRight className="w-4 h-4" />
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services;
