import { Link } from "react-router-dom";
import { ArrowRight, Calendar } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { blogPosts } from "@/data/posts";

const Blog = () => {
  return (
    <section id="blog" className="section-padding bg-secondary/30">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-medium text-primary uppercase tracking-wider">
            Blog
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mt-2 mb-4">
            Conteúdo educativo
          </h2>
          <p className="text-muted-foreground">
            Artigos sobre saúde bucal, harmonização facial e dicas para manter
            seu sorriso sempre saudável e bonito.
          </p>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 flex flex-col">
              {/* Blog Image */}
              <Link to={`/blog/${post.slug}`} className="block overflow-hidden">
                <div className="aspect-video relative overflow-hidden bg-secondary/10 p-2">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
              </Link>

              <CardContent className="pt-6 flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary" className="text-xs">
                    {post.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{post.readTime} de leitura</span>
                </div>
                <Link to={`/blog/${post.slug}`}>
                  <h3 className="font-serif text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                </Link>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {post.excerpt}
                </p>
              </CardContent>

              <CardFooter className="pt-0 flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {post.date}
                </div>
                <Link to={`/blog/${post.slug}`}>
                  <Button variant="ghost" size="sm" className="gap-1 text-primary">
                    Ler mais
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link to="/blog">
            <Button variant="outline" className="gap-2">
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
