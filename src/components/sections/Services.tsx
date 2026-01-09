import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { treatments } from "@/data/treatments";
import { ArrowRight } from "lucide-react";

const Services = () => {
  // Show only first 6 treatments on homepage
  const displayedTreatments = treatments.slice(0, 6);

  return (
    <section id="tratamentos" className="section-padding bg-card">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {displayedTreatments.map((service) => (
            <Link key={service.slug} to={`/tratamentos/${service.slug}`} className="group h-full">
              <Card className="overflow-hidden h-full border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300 flex flex-col">
                <div className="aspect-[4/3] overflow-hidden bg-secondary/5">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <CardContent className="p-5 flex flex-col flex-grow">
                  <span className="text-[10px] uppercase tracking-widest text-primary font-bold mb-2">
                    {service.category}
                  </span>
                  <h3 className="font-serif text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-grow">
                    {service.description}
                  </p>
                  <span className="text-sm font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                    Saiba mais <ArrowRight className="w-4 h-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link to="/tratamentos">
            <Button variant="outline" size="lg" className="gap-2">
              Ver todos os tratamentos
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Services;
