import { useRef, useEffect, useState } from "react";
import { Star, ChevronLeft, ChevronRight, Quote, Smile, Frown, Meh, Heart, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { API_URL } from "@/lib/api";

const TestimonialsCarousel = () => {
    const [testimonials, setTestimonials] = useState([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch(`${API_URL}/testimonials`)
            .then(res => res.json())
            .then(data => {
                const approved = data.filter((t: any) => t.approved);
                setTestimonials(approved);
            })
            .catch(err => console.error("Failed to fetch testimonials", err));
    }, []);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = 350;
            if (direction === 'left') {
                current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };

    if (testimonials.length === 0) return null;

    return (
        <section className="section-padding bg-slate-50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-8 sm:mb-10 md:mb-12">
                    <span className="text-xs sm:text-sm font-medium text-primary uppercase tracking-wider">
                        Depoimentos
                    </span>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold mt-2 text-slate-900">
                        O que nossos pacientes dizem
                    </h2>
                </div>

                <div className="relative max-w-6xl mx-auto">
                    <button
                        onClick={() => scroll('left')}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-4 md:-translate-x-12 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-md flex items-center justify-center text-slate-600 hover:text-primary transition-colors"
                    >
                        <ChevronLeft size={20} className="sm:hidden" />
                        <ChevronLeft size={24} className="hidden sm:block" />
                    </button>

                    <div
                        ref={scrollRef}
                        className="flex gap-3 sm:gap-4 md:gap-6 overflow-x-auto pb-6 sm:pb-8 snap-x snap-mandatory no-scrollbar"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {testimonials.map((t: any) => {
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
                                <Card key={t.id} className="min-w-[260px] sm:min-w-[280px] md:min-w-[320px] lg:min-w-[350px] snap-center border-none shadow-sm hover:shadow-md transition-shadow">
                                    <CardContent className="p-5 sm:p-6 md:p-8 flex flex-col items-center text-center">
                                        <div className={`p-2 sm:p-3 rounded-full mb-4 sm:mb-5 md:mb-6 ${t.feeling ? 'bg-slate-50' : 'bg-primary/10 text-primary'}`}>
                                            <FeelingIcon size={24} className={`sm:hidden ${t.feeling ? feelingColor : "opacity-50"}`} fill={t.feeling ? "none" : "currentColor"} />
                                            <FeelingIcon size={32} className={`hidden sm:block ${t.feeling ? feelingColor : "opacity-50"}`} fill={t.feeling ? "none" : "currentColor"} />
                                        </div>
                                        <p className="text-slate-600 italic mb-4 sm:mb-5 md:mb-6 leading-relaxed text-sm sm:text-base">"{t.comment}"</p>
                                        <div className="mt-auto">
                                            <h4 className="font-bold text-slate-900 text-sm sm:text-base">{t.name || "Paciente"}</h4>
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

                    <button
                        onClick={() => scroll('right')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-4 md:translate-x-12 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-md flex items-center justify-center text-slate-600 hover:text-primary transition-colors"
                    >
                        <ChevronRight size={20} className="sm:hidden" />
                        <ChevronRight size={24} className="hidden sm:block" />
                    </button>
                </div>
            </div>
        </section>
    );
}

export default TestimonialsCarousel;
