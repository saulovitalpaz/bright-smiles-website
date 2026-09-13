import { useRef, useEffect, useState } from "react";
import { Star, ChevronLeft, ChevronRight, Quote, Smile, Frown, Meh, Heart, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { API_URL } from "@/lib/api";
import { useReducedMotion } from "framer-motion";

interface Testimonial {
    id: number;
    approved?: boolean;
    feeling?: string;
    comment: string;
    name?: string;
    rating?: number;
}

const TestimonialsCarousel = () => {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        fetch(`${API_URL}/testimonials`)
            .then(res => res.json())
            .then(data => {
                const approved = (data as Testimonial[]).filter((t) => t.approved);
                setTestimonials(approved);
            })
            .catch(err => console.error("Failed to fetch testimonials", err));
    }, []);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const firstCard = current.firstElementChild as HTMLElement | null;
            const scrollAmount = (firstCard?.offsetWidth || current.clientWidth) + parseFloat(getComputedStyle(current).gap || "0");
            if (direction === 'left') {
                current.scrollBy({ left: -scrollAmount, behavior: reduceMotion ? 'auto' : 'smooth' });
            } else {
                current.scrollBy({ left: scrollAmount, behavior: reduceMotion ? 'auto' : 'smooth' });
            }
        }
    };

    if (testimonials.length === 0) return null;

    return (
        <section className="section-padding bg-secondary/20">
            <div className="container mx-auto px-4">
                <div className="text-center mb-8 sm:mb-10 md:mb-12">
                    <span className="text-xs sm:text-sm font-medium text-primary uppercase tracking-wider">
                        Depoimentos
                    </span>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold mt-2 text-foreground">
                        O que nossos pacientes dizem
                    </h2>
                </div>

                <div className="relative max-w-6xl mx-auto px-2 sm:px-0">
                    <div
                        ref={scrollRef}
                        className="flex gap-4 md:gap-6 overflow-x-auto p-1 pb-4 snap-x snap-mandatory"
                        role="region" aria-label="Depoimentos dos pacientes" tabIndex={0}
                    >
                        {testimonials.map((t) => {
                            const FeelingIcon = {
                                sad: Frown,
                                neutral: Meh,
                                happy: Smile,
                                love: Heart,
                                wow: Award
                            }[t.feeling as string] || Quote;

                            const feelingColor = {
                                sad: "text-red-400",
                                neutral: "text-yellow-400",
                                happy: "text-green-400",
                                love: "text-pink-400",
                                wow: "text-primary"
                            }[t.feeling as string] || "text-primary";

                            return (
                                <Card key={t.id} className="w-full max-w-[22rem] shrink-0 snap-start border-border/60 shadow-sm">
                                    <CardContent className="h-full p-5 sm:p-6 flex flex-col items-center text-center">
                                        <div className={`p-2 sm:p-3 rounded-full mb-4 sm:mb-5 md:mb-6 ${t.feeling ? 'bg-slate-50' : 'bg-primary/10 text-primary'}`}>
                                            <FeelingIcon size={24} className={`sm:hidden ${t.feeling ? feelingColor : "opacity-50"}`} fill={t.feeling ? "none" : "currentColor"} />
                                            <FeelingIcon size={32} className={`hidden sm:block ${t.feeling ? feelingColor : "opacity-50"}`} fill={t.feeling ? "none" : "currentColor"} />
                                        </div>
                                        <p className="text-muted-foreground mb-6 leading-relaxed text-sm sm:text-base break-words">"{t.comment}"</p>
                                        <div className="mt-auto">
                                            <h4 className="font-semibold text-foreground text-sm sm:text-base">{t.name || "Paciente"}</h4>
                                            <div className="flex gap-0.5 sm:gap-1 justify-center mt-1.5 sm:mt-2 text-yellow-400">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={12} className={`sm:hidden ${i < t.rating ? "" : "text-slate-200"}`} fill={i < t.rating ? "currentColor" : "none"} />
                                                ))}
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={`lg-${i}`} size={14} className={`hidden sm:block ${i < t.rating ? "" : "text-slate-200"}`} fill={i < t.rating ? "currentColor" : "none"} />
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>

                    <div className="mt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => scroll('left')} aria-label="Depoimentos anteriores" className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground"><ChevronLeft size={20} aria-hidden="true" /></button>
                    <button type="button"
                        onClick={() => scroll('right')}
                        aria-label="Próximos depoimentos"
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground"
                    >
                        <ChevronRight size={20} aria-hidden="true" />
                    </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default TestimonialsCarousel;
