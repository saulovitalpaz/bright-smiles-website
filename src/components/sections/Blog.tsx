import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/api";

const Blog = () => {
  const [displayedPosts, setDisplayedPosts] = useState([]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${API_URL}/posts`);
      if (res.ok) {
        const data = await res.json();
        // Sort by date desc and take 3
        const sorted = data.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setDisplayedPosts(sorted.slice(0, 3));
      }
    } catch (error) {
      console.error("Failed to fetch posts", error);
    }
  };

  if (displayedPosts.length === 0) return null; // Or return loading state, or existing static section with "No posts key"

  return (
    <section id="blog" className="section-padding bg-secondary/30">
      <div className="container mx-auto px-3 sm:px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10 md:mb-12">
          <span className="text-xs sm:text-sm font-medium text-primary uppercase tracking-wider">
            Blog
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-foreground mt-2 mb-3 sm:mb-4">
            Conteúdo educativo
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Artigos sobre saúde bucal, harmonização facial e dicas para manter
            seu sorriso sempre saudável e bonito.
          </p>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          {displayedPosts.map((post: any) => (
            <Link key={post.slug} to={`/blog/${post.slug}`} className="group h-full">
              <Card className="overflow-hidden h-full border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 flex flex-col">
                <div className="aspect-[4/3] sm:aspect-[16/10] overflow-hidden bg-secondary/5">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <CardContent className="p-2.5 sm:p-4 flex flex-col flex-grow">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[8px] sm:text-[10px] text-muted-foreground mb-1 sm:mb-2">
                    <span className="text-primary font-semibold uppercase tracking-wider">
                      {post.category}
                    </span>
                    <span className="hidden sm:inline w-1 h-1 rounded-full bg-border" />
                    <span className="hidden sm:inline">{post.readTime}</span>
                  </div>
                  <h3 className="font-serif text-sm sm:text-base lg:text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground text-[10px] sm:text-xs line-clamp-2 mb-2 sm:mb-3 flex-grow hidden sm:block">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(post.date).toLocaleDateString('pt-BR')}
                    </div>
                    <span className="text-[10px] sm:text-xs font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                      Ler <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-8 sm:mt-10 md:mt-12">
          <Link to="/blog">
            <Button variant="outline" size="lg" className="gap-2 text-sm sm:text-base">
              Ver todos os artigos
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Blog;
