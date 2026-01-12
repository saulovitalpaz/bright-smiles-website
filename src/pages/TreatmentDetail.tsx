import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle, CheckCircle2, Clock, Sparkles, ShieldCheck, ChevronRight, ChevronLeft, Maximize2, X, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";

// Types matching API
interface TreatmentResult {
    id: number;
    image: string;
    description: string;
}

interface Treatment {
    id: number;
    slug: string;
    title: string;
    description: string;
    category: string;
    image: string;
    content: string;
    indications: string[];
    benefits: string[];
    duration: {
        procedure: string;
        recovery: string;
        longevity: string;
    };
    results: TreatmentResult[];
}

import { API_URL } from "@/lib/api";

const TreatmentDetail = () => {
    const { slug } = useParams();
    const [activeImage, setActiveImage] = useState(0);
    const [isZoomOpen, setIsZoomOpen] = useState(false);

    // Result Carousel State
    const [activeResultIndex, setActiveResultIndex] = useState(0);

    const { data: treatment, isLoading, error } = useQuery({
        queryKey: ['treatment', slug],
        queryFn: async () => {
            const response = await axios.get(`${API_URL}/treatments/${slug}`);
            return response.data as Treatment;
        },
        enabled: !!slug
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="animate-spin w-10 h-10 text-primary" />
            </div>
        );
    }

    if (error || !treatment) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold mb-4">Tratamento não encontrado</h1>
                <Link to="/"><Button>Voltar ao Início</Button></Link>
            </div>
        );
    }

    const whatsappNumber = "5533991219695";
    const whatsappMessage = encodeURIComponent(`Olá! Gostaria de saber mais sobre o tratamento de ${treatment.title}.`);

    // Only one main image per treatment in new schema, but we can treat it as a single item array for compatibility if needed,
    // or just display the single image. The design expects 'images' array. 
    // For now, let's wrap the single main image in an array to keep the zoom logic similar if we want,
    // BUT the new requirement is about "Results" having their own gallery.
    // The main image is just one cover.

    const nextResult = () => {
        if (!treatment.results?.length) return;
        setActiveResultIndex((prev) => (prev + 1) % treatment.results.length);
    };

    const prevResult = () => {
        if (!treatment.results?.length) return;
        setActiveResultIndex((prev) => (prev - 1 + treatment.results.length) % treatment.results.length);
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
                            <div className="prose prose-lg max-w-none text-muted-foreground mb-8 whitespace-pre-wrap">
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
                            {/* Main Image View */}
                            <div
                                className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-border bg-card cursor-zoom-in relative"
                                onClick={() => { setActiveImage(0); setIsZoomOpen(true); }}
                            >
                                <img
                                    src={treatment.image}
                                    alt={treatment.title}
                                    className="w-full h-full object-cover p-0 transition-opacity duration-500"
                                />

                                {/* Zoom Hint */}
                                <div className="absolute top-4 right-4 bg-black/50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Maximize2 className="w-5 h-5 text-white" />
                                </div>
                            </div>

                            <div className="absolute -bottom-6 -left-6 bg-card p-6 rounded-2xl shadow-xl border border-border hidden md:block max-w-[200px] z-20">
                                <ShieldCheck className="w-8 h-8 text-primary mb-2" />
                                <p className="text-sm font-medium">Procedimento seguro e especializado</p>
                            </div>
                        </div>
                    </div>

                    {/* Results Section - "Galeria de Resultados" */}
                    {treatment.results && treatment.results.length > 0 && (
                        <div className="mb-20 bg-secondary/10 rounded-3xl p-8 md:p-12">
                            <h2 className="text-3xl font-serif font-bold mb-8 text-center underline decoration-primary/30 underline-offset-8">Resultados Reais</h2>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                                {/* Result Image */}
                                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/10 shadow-lg border border-border">
                                    <img
                                        src={treatment.results[activeResultIndex].image}
                                        alt="Resultado"
                                        className="w-full h-full object-contain"
                                    />

                                    {treatment.results.length > 1 && (
                                        <>
                                            <button
                                                onClick={prevResult}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                                            >
                                                <ChevronLeft className="w-6 h-6" />
                                            </button>
                                            <button
                                                onClick={nextResult}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                                            >
                                                <ChevronRight className="w-6 h-6" />
                                            </button>
                                        </>
                                    )}
                                    <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                                        Caso {activeResultIndex + 1} / {treatment.results.length}
                                    </div>
                                </div>

                                {/* Result Description */}
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-bold flex items-center gap-3">
                                        <Sparkles className="text-primary w-6 h-6" />
                                        Detalhes do Caso
                                    </h3>
                                    <div className="p-6 bg-background rounded-2xl border border-border/50 shadow-sm relative">
                                        <span className="text-6xl text-primary/10 absolute -top-4 -left-2 serif">“</span>
                                        <p className="text-lg text-muted-foreground italic relative z-10 leading-relaxed">
                                            {treatment.results[activeResultIndex].description}
                                        </p>
                                    </div>
                                    <div className="flex gap-2 justify-center lg:justify-start pt-4">
                                        {treatment.results.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setActiveResultIndex(idx)}
                                                className={`h-2 rounded-full transition-all duration-300 ${idx === activeResultIndex ? 'w-8 bg-primary' : 'w-2 bg-primary/20 hover:bg-primary/40'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
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

            {/* Zoom Modal (Simplified for single main image) */}
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
                        src={treatment.image}
                        alt="Zoomed content"
                        className="max-h-[85vh] max-w-full object-contain rounded-lg"
                    />
                </div>
            )}

            <Footer />
        </div>
    );
};

export default TreatmentDetail;
