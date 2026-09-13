import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { API_URL } from "@/lib/api";
import { mediaUrl } from "@/lib/media";

interface Treatment {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: string;
  image: string;
}

const Services = () => {
  const { data: treatments, isLoading, error, refetch } = useQuery<Treatment[]>({
    queryKey: ['recentTreatments'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/treatments`);
      return res.data;
    }
  });

  const displayedTreatments = treatments ? treatments.slice(0, 6) : [];

  return (
    <section id="tratamentos" className="section-padding bg-card">
      <div className="container mx-auto px-3 sm:px-4">
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
        <div className="home-card-grid" aria-busy={isLoading}>
          {isLoading && (
            <><span role="status" className="sr-only">Carregando tratamentos</span>{[0, 1, 2].map(key => <div key={key} className="home-card-skeleton" aria-hidden="true" />)}</>
          )}

          {error && <div role="alert" className="col-span-full space-y-3 text-center"><p>Não foi possível carregar os tratamentos.</p><Button variant="outline" onClick={() => void refetch()}>Tentar novamente</Button></div>}
          {!isLoading && !error && displayedTreatments.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground w-full">
              Nenhum tratamento cadastrado ainda.
            </div>
          )}

          {displayedTreatments.map((service: Treatment) => (
            <Link key={service.id} to={`/tratamentos/${service.slug}`} className="home-content-link group">
              <Card className="home-content-card">
                <div className="aspect-[4/3] sm:aspect-[16/10] overflow-hidden bg-secondary/5">
                  {service.image ? (
                    <img
                      src={mediaUrl(service.image) || service.image}
                      alt={service.title}
                      width={640} height={400} loading="lazy" decoding="async"
                      onError={event => { if (event.currentTarget.getAttribute('src') !== '/placeholder.png') event.currentTarget.src = '/placeholder.png'; }}
                    />
                  ) : (
                    <img src="/placeholder.png" alt="" width={640} height={400} loading="lazy" />
                  )}
                </div>
                <CardContent className="home-card-content">
                  <span className="home-card-meta font-medium">
                    {service.category}
                  </span>
                  <h3 className="font-serif font-semibold text-foreground">
                    {service.title}
                  </h3>
                  <p className="home-card-copy">
                    {service.description}
                  </p>
                  <span className="home-card-action mt-auto">
                    Saiba mais <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-8 sm:mt-10 md:mt-12">
            <Button asChild variant="outline" size="lg" className="gap-2 text-sm sm:text-base"><Link to="/tratamentos">
              Ver todos os tratamentos
              <ArrowRight className="w-4 h-4" />
          </Link></Button>
        </div>
      </div>
    </section>
  );
};

export default Services;

