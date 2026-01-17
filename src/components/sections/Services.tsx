import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { API_URL } from "@/lib/api";

interface Treatment {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: string;
  image: string;
}

const Services = () => {
  const { data: treatments, isLoading, error } = useQuery({
    queryKey: ['recentTreatments'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/treatments`);
      // The API returns all treatments ordered by createdAt desc (if we set that up, otherwise we slice frontend)
      // Backend default order might be ID or creation. 
      // Let's assume we want the first 6 from the response which usually are the "default" list.
      // If we want specifically "newest", the API should support sorting or we sort here. 
      // Our API implementation: `orderBy: { createdAt: 'desc' }` was added in server/index.js line 156.
      return res.data;
    }
  });

  const displayedTreatments = treatments ? treatments.slice(0, 6) : [];

  return (
    <section id="tratamentos" className="section-padding bg-card">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10 md:mb-12">
          <span className="text-xs sm:text-sm font-medium text-primary uppercase tracking-wider">
            Nossos Tratamentos
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-foreground mt-2 mb-3 sm:mb-4">
            Especialidades que transformam
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Oferecemos tratamentos odontológicos completos e procedimentos de
            harmonização facial realizados por profissionais experientes.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          {isLoading && (
            <div className="col-span-full flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {!isLoading && displayedTreatments.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Nenhum tratamento cadastrado ainda.
            </div>
          )}

          {displayedTreatments.map((service: Treatment) => (
            <Link key={service.id} to={`/tratamentos/${service.slug}`} className="group h-full">
              <Card className="overflow-hidden h-full border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 flex flex-col">
                <div className="aspect-[4/3] sm:aspect-[16/10] overflow-hidden bg-secondary/5">
                  {service.image ? (
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => (e.target as HTMLImageElement).src = '/placeholder.png'}
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                      Img
                    </div>
                  )}
                </div>
                <CardContent className="p-2.5 sm:p-4 flex flex-col flex-grow">
                  <span className="text-[8px] sm:text-[10px] uppercase tracking-widest text-primary font-bold mb-1">
                    {service.category}
                  </span>
                  <h3 className="font-serif text-sm sm:text-base lg:text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-2">
                    {service.title}
                  </h3>
                  <p className="text-muted-foreground text-[10px] sm:text-xs line-clamp-2 mb-2 sm:mb-3 flex-grow hidden sm:block">
                    {service.description}
                  </p>
                  <span className="text-[10px] sm:text-xs font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                    Saiba mais <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-8 sm:mt-10 md:mt-12">
          <Link to="/tratamentos">
            <Button variant="outline" size="lg" className="gap-2 text-sm sm:text-base">
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

