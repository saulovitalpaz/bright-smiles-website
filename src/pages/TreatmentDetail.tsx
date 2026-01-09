import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle, CheckCircle2, Clock, Sparkles, ShieldCheck, ChevronRight, ChevronLeft, Maximize2, X } from "lucide-react";
import { treatments } from "@/data/treatments";
import { useState } from "react";

const TreatmentDetail = () => {
    const { slug } = useParams();
    const treatment = treatments.find((t) => t.slug === slug);
    const [activeImage, setActiveImage] = useState(0);
    const [isZoomOpen, setIsZoomOpen] = useState(false);

    if (!treatment) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold mb-4">Tratamento não encontrado</h1>
                <Link to="/"><Button>Voltar ao Início</Button></Link>
            </div>
        );
    }

    const whatsappNumber = "5533991219695";
    const whatsappMessage = encodeURIComponent(`Olá! Gostaria de saber mais sobre o tratamento de ${treatment.title}.`);

    const nextImage = () => {
        setActiveImage((prev) => (prev + 1) % treatment.images.length);
    };

    const prevImage = () => {
        setActiveImage((prev) => (prev - 1 + treatment.images.length) % treatment.images.length);
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />
            <main className="pt-32 pb-16">
                <div className="container mx-auto px-4">
                    <Link to="/#tratamentos">
                        <Button variant="ghost" className="gap-2 mb-8 group">
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            Ver todos os tratamentos
                        </Button>
                    </Link>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
                        <div>
                            <span className="text-sm font-medium text-primary uppercase tracking-wider mb-2 block">
                                {treatment.category}
                            </span>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-tight mb-6">
                                {treatment.title}
                            </h1>
                            <p className="text-xl text-muted-foreground mb-8 leading-relaxed italic">
                                {treatment.description}
                            </p>
                            <div className="prose prose-lg max-w-none text-muted-foreground mb-8">
                                <p>{treatment.content}</p>
                            </div>

                            <div className="flex flex-wrap gap-4 mb-8">
                                <Button
                                    size="lg"
                                    className="gap-2 glow-gold font-bold"
                                    onClick={() => window.open(`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`, '_blank')}
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    Solicitar Avaliação
                                </Button>
                            </div>
                        </div>

                        <div className="relative group">
                            {/* Main Image View - Improved for educational content */}
                            <div
                                className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-border bg-card cursor-zoom-in relative"
                                onClick={() => setIsZoomOpen(true)}
                            >
                                <img
                                    src={treatment.images[activeImage]}
                                    alt={treatment.title}
                                    className="w-full h-full object-contain p-4 md:p-8 transition-opacity duration-500 bg-white/5" // object-contain to avoid cropping educational text
                                />

                                {/* Zoom Hint */}
                                <div className="absolute top-4 right-4 bg-black/50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Maximize2 className="w-5 h-5 text-white" />
                                </div>
                            </div>

                            {treatment.images.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-card/80 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                    >
                                        <ChevronLeft className="w-6 h-6 text-foreground" />
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-card/80 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                    >
                                        <ChevronRight className="w-6 h-6 text-foreground" />
                                    </button>
                                    <div className="flex justify-center gap-2 mt-4">
                                        {treatment.images.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setActiveImage(i)}
                                                className={`w-2 h-2 rounded-full transition-all ${i === activeImage ? 'bg-primary w-4' : 'bg-muted-foreground/30'}`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}

                            <div className="absolute -bottom-6 -left-6 bg-card p-6 rounded-2xl shadow-xl border border-border hidden md:block max-w-[200px] z-20">
                                <ShieldCheck className="w-8 h-8 text-primary mb-2" />
                                <p className="text-sm font-medium">Procedimento seguro e especializado</p>
                            </div>
                        </div>
                    </div>

                    {/* Education Gallery Section */}
                    {treatment.images.length > 1 && (
                        <div className="mb-20">
                            <h2 className="text-3xl font-serif font-bold mb-8 text-center underline decoration-primary/30 underline-offset-8">Galeria Informativa</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {treatment.images.map((img, i) => (
                                    <div
                                        key={i}
                                        className={`aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all bg-card ${i === activeImage ? 'border-primary ring-2 ring-primary/20' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                        onClick={() => setActiveImage(i)}
                                    >
                                        <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-contain p-2" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                        <div className="bg-secondary/20 p-8 rounded-3xl border border-border/50">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-primary" />
                                Indicações
                            </h3>
                            <ul className="space-y-4">
                                {treatment.indications.map((item, i) => (
                                    <li key={i} className="text-muted-foreground flex items-start gap-2 font-medium">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-secondary/20 p-8 rounded-3xl border border-border/50">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-primary" />
                                Diferenciais
                            </h3>
                            <ul className="space-y-4">
                                {treatment.benefits.map((item, i) => (
                                    <li key={i} className="text-muted-foreground flex items-start gap-2 font-medium">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-primary/5 p-8 rounded-3xl border border-primary/20 shadow-inner">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-primary">
                                <Clock className="w-5 h-5" />
                                Detalhes Técnicos
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] items-center uppercase tracking-widest text-muted-foreground mb-1 font-bold">Duração</p>
                                    <p className="font-semibold text-sm">{treatment.duration.procedure}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-bold">Pós-procedimento</p>
                                    <p className="font-semibold text-sm">{treatment.duration.recovery}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-bold">Durabilidade Est.</p>
                                    <p className="font-semibold text-sm">{treatment.duration.longevity}</p>
                                </div>
                            </div>
                        </div>
                    </div>
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
                        src={treatment.images[activeImage]}
                        alt="Zoomed educational content"
                        className="max-h-[85vh] max-w-full object-contain rounded-lg"
                    />

                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                        <p className="text-white text-sm font-medium tracking-wide">
                            Imagem {activeImage + 1} de {treatment.images.length}
                        </p>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default TreatmentDetail;
