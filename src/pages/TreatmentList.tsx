import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Search, Sparkles, Stethoscope, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Helper type matching the API response
interface Treatment {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: string;
  image: string;
  content: string;
}

const API_URL = "http://localhost:3001";

const TreatmentList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "Odontologia" | "Harmonização">("all");

  const { data: treatments, isLoading } = useQuery({
    queryKey: ['public-treatments'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/treatments`);
      return response.data;
    }
  });

  const filteredTreatments = treatments?.filter((treatment: Treatment) => {
    const matchesSearch = treatment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      treatment.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "all" || treatment.category === activeFilter;
    return matchesSearch && matchesFilter;
  }) || [];

  const categories = [
    { id: "all" as const, label: "Todos", icon: null },
    { id: "Odontologia" as const, label: "Odontologia", icon: Stethoscope },
    { id: "Harmonização" as const, label: "Harmonização", icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto px-4 text-center">
          <Link to="/" className="inline-block mb-8">
            <Button variant="ghost" className="gap-2 group text-primary hover:text-primary/80">
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Voltar ao Início
            </Button>
          </Link>
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-primary/10 p-3 rounded-2xl">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6">
              Nossos Tratamentos
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Conheça todos os procedimentos odontológicos e de harmonização facial
              realizados por nossas especialistas.
            </p>

            {/* Search Bar */}
            <div className="mt-10 max-w-xl mx-auto relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Buscar tratamento..."
                className="pl-12 h-14 bg-card/50 backdrop-blur-md border-primary/20 focus-visible:ring-primary rounded-2xl shadow-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Filters */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={activeFilter === category.id ? "default" : "outline"}
                  size="lg"
                  className="gap-2 rounded-full"
                  onClick={() => setActiveFilter(category.id)}
                >
                  {category.icon && <category.icon className="w-4 h-4" />}
                  {category.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Treatments Grid */}
      <main className="pb-24">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin w-10 h-10 text-primary" /></div>
          ) : filteredTreatments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {filteredTreatments.map((treatment) => (
                <Link key={treatment.slug} to={`/tratamentos/${treatment.slug}`} className="group h-full">
                  <Card className="overflow-hidden h-full border-border/50 hover:border-primary/30 hover:shadow-2xl transition-all duration-500 bg-card/50 backdrop-blur-sm flex flex-col">
                    <div className="aspect-[4/3] relative overflow-hidden bg-secondary/10">
                      <img
                        src={treatment.image}
                        alt={treatment.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="bg-primary px-3 py-1 rounded-full text-[10px] font-bold text-primary-foreground uppercase tracking-widest">
                          {treatment.category}
                        </span>
                      </div>
                    </div>
                    <CardContent className="p-6 flex flex-col flex-grow">
                      <h3 className="text-xl font-serif font-bold text-foreground mb-3 group-hover:text-primary transition-colors leading-snug">
                        {treatment.title}
                      </h3>
                      <p className="text-muted-foreground text-sm line-clamp-3 mb-6 flex-grow leading-relaxed">
                        {treatment.description}
                      </p>
                      <div className="flex items-center text-primary font-bold text-xs uppercase tracking-widest gap-2">
                        Saiba mais
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-xl text-muted-foreground">Nenhum tratamento encontrado.</p>
              <Button variant="link" onClick={() => { setSearchQuery(""); setActiveFilter("all"); }} className="text-primary mt-2">
                Ver todos os tratamentos
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TreatmentList;
