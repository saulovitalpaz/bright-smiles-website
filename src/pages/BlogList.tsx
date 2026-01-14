import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { API_URL } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const BlogList = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [posts, setPosts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/posts`)
            .then(res => res.json())
            .then(data => {
                setPosts(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
    }, []);

    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />

            {/* Blog Hero Section */}
            <section className="pt-32 pb-16 bg-gradient-to-b from-primary/5 to-transparent">
                <div className="container mx-auto px-4 text-center">
                    <Link to="/" className="inline-block mb-8">
                        <Button variant="ghost" className="gap-2 group text-primary hover:text-primary/80">
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            Voltar ao Início
                        </Button>
                    </Link>
                    <div className="max-w-3xl mx-auto">
                        <div className="flex item-center justify-center mb-4">
                            <div className="bg-primary/10 p-3 rounded-2xl">
                                <BookOpen className="w-8 h-8 text-primary" />
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6">
                            Portal de Bem-estar & Saúde
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed italic">
                            Informações técnicas e dicas lúdicas preparadas por nossas especialistas para cuidar do seu sorriso e harmonia facial.
                        </p>

                        {/* Search Bar */}
                        <div className="mt-10 max-w-xl mx-auto relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Buscar artigos por tema ou título..."
                                className="pl-12 h-14 bg-card/50 backdrop-blur-md border-primary/20 focus-visible:ring-primary rounded-2xl shadow-lg"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </section>

            <main className="pb-24">
                <div className="container mx-auto px-4">
                    {filteredPosts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                            {filteredPosts.map((post) => (
                                <Link key={post.slug} to={`/blog/${post.slug}`} className="group h-full">
                                    <Card className="overflow-hidden h-full border-border/50 hover:border-primary/30 hover:shadow-2xl transition-all duration-500 bg-card/50 backdrop-blur-sm flex flex-col">
                                        <div className="aspect-video relative overflow-hidden">
                                            <img
                                                src={post.image}
                                                alt={post.title}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                            <div className="absolute top-4 left-4">
                                                <span className="bg-primary px-3 py-1 rounded-full text-[10px] font-bold text-primary-foreground uppercase tracking-widest">
                                                    {post.category}
                                                </span>
                                            </div>
                                        </div>
                                        <CardContent className="p-6 flex flex-col flex-grow">
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4 font-medium uppercase tracking-tighter">
                                                <span>{post.date}</span>
                                                <span className="w-1 h-1 rounded-full bg-border" />
                                                <span>{post.readTime}</span>
                                            </div>
                                            <h3 className="text-xl font-serif font-bold text-foreground mb-3 group-hover:text-primary transition-colors leading-snug">
                                                {post.title}
                                            </h3>
                                            <p className="text-muted-foreground text-sm line-clamp-3 mb-6 flex-grow leading-relaxed">
                                                {post.excerpt}
                                            </p>
                                            <div className="flex items-center text-primary font-bold text-xs uppercase tracking-widest gap-2">
                                                Ler artigo completo
                                                <div className="w-8 h-px bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <p className="text-xl text-muted-foreground">Nenhum artigo encontrado com este termo.</p>
                            <Button variant="link" onClick={() => setSearchQuery("")} className="text-primary mt-2">
                                Ver todos os posts
                            </Button>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default BlogList;
