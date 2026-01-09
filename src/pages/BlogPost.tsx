import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Clock, Share2, ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { blogPosts } from "@/data/posts";
import { useState } from "react";

const BlogPost = () => {
    const { slug } = useParams();
    const post = blogPosts.find(p => p.slug === slug);
    const [activeImage, setActiveImage] = useState(0);
    const [isZoomOpen, setIsZoomOpen] = useState(false);

    if (!post) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold mb-4">Artigo não encontrado</h1>
                <Link to="/blog"><Button>Voltar ao Blog</Button></Link>
            </div>
        );
    }

    const nextImage = () => {
        setActiveImage((prev) => (prev + 1) % post.images.length);
    };

    const prevImage = () => {
        setActiveImage((prev) => (prev - 1 + post.images.length) % post.images.length);
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />
            <main className="pt-32 pb-16">
                <div className="container mx-auto px-4">
                    <Link to="/blog">
                        <Button variant="ghost" className="gap-2 mb-8 group">
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            Voltar ao Portal de Notícias
                        </Button>
                    </Link>

                    <article className="max-w-4xl mx-auto">
                        <header className="mb-12">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                                <span className="bg-primary/20 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
                                    {post.category}
                                </span>
                                <span className="flex items-center gap-1.5 font-medium">
                                    <Clock className="w-4 h-4" />
                                    {post.readTime} de leitura
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-tight mb-8">
                                {post.title}
                            </h1>
                            <div className="flex items-center justify-between border-y border-border/50 py-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                        <User className="w-7 h-7 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">{post.author}</p>
                                        <p className="text-xs text-muted-foreground font-medium">{post.date}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors border-border/50 shadow-sm"
                                        title="Compartilhar"
                                        onClick={() => {
                                            if (navigator.share) {
                                                navigator.share({ title: post.title, url: window.location.href });
                                            }
                                        }}
                                    >
                                        <Share2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </header>

                        {/* Gallery / Featured Image - Improved for educational graphics */}
                        <section className="mb-16 relative group">
                            <div
                                className="aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl border border-border/50 bg-card cursor-zoom-in relative"
                                onClick={() => setIsZoomOpen(true)}
                            >
                                <img
                                    src={post.images[activeImage]}
                                    alt={post.title}
                                    className="w-full h-full object-contain p-4 md:p-10 transition-all duration-500 bg-white/5" // Changed to contain to avoid cropping
                                />

                                {/* Zoom Icon */}
                                <div className="absolute top-6 right-6 bg-black/50 backdrop-blur-md p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Maximize2 className="w-6 h-6 text-white" />
                                </div>
                            </div>

                            {post.images.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        className="absolute left-6 top-1/2 -translate-y-1/2 bg-card/90 backdrop-blur-md p-3 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10 border border-border/50"
                                    >
                                        <ChevronLeft className="w-6 h-6 text-foreground" />
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className="absolute right-6 top-1/2 -translate-y-1/2 bg-card/90 backdrop-blur-md p-3 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10 border border-border/50"
                                    >
                                        <ChevronRight className="w-6 h-6 text-foreground" />
                                    </button>

                                    <div className="flex flex-wrap justify-center gap-3 mt-8">
                                        {post.images.map((img, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setActiveImage(i)}
                                                className={`w-20 md:w-24 aspect-video rounded-xl overflow-hidden border-2 transition-all bg-card ${i === activeImage ? 'border-primary ring-2 ring-primary/20' : 'border-transparent opacity-40 hover:opacity-100'}`}
                                            >
                                                <img src={img} alt={`Thumb ${i}`} className="w-full h-full object-contain p-1" />
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </section>

                        <div className="prose prose-lg prose-primary max-w-none text-muted-foreground leading-relaxed">
                            <p className="text-xl md:text-2xl text-foreground font-serif italic mb-12 border-l-4 border-primary pl-6">
                                {post.excerpt}
                            </p>
                            <div className="whitespace-pre-line text-lg font-medium">
                                {post.content}
                            </div>
                        </div>

                        <div className="mt-20 p-10 bg-gradient-to-br from-primary/10 to-transparent rounded-[3rem] border border-primary/20 shadow-inner">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="text-center md:text-left">
                                    <h3 className="text-3xl font-serif font-bold mb-3 text-foreground">Gostou deste conteúdo?</h3>
                                    <p className="text-muted-foreground text-lg mb-0 font-medium">Compartilhe conhecimento com quem você ama!</p>
                                </div>
                                <Button className="gap-3 h-14 px-8 text-lg font-bold shadow-gold" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('Veja este artigo interessante: ' + window.location.href)}`, '_blank')}>
                                    <Share2 className="w-5 h-5" />
                                    Compartilhar agora
                                </Button>
                            </div>
                        </div>
                    </article>
                </div>
            </main>

            {/* Zoom Modal */}
            {isZoomOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 animate-in fade-in zoom-in-95 duration-300"
                    onClick={() => setIsZoomOpen(false)}
                >
                    <button
                        className="absolute top-8 right-8 text-white hover:text-primary transition-colors p-2 bg-white/10 rounded-full"
                        onClick={() => setIsZoomOpen(false)}
                    >
                        <X className="w-8 h-8" />
                    </button>

                    <img
                        src={post.images[activeImage]}
                        alt="Zoomed educational content"
                        className="max-h-[85vh] max-w-full object-contain rounded-lg"
                    />

                    <div className="absolute bottom-8 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                        <p className="text-white text-sm font-medium tracking-wide italic">
                            Visualizando slide lúdico de {post.category}
                        </p>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default BlogPost;
