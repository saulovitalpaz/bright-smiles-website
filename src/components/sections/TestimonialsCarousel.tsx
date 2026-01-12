import { useRef, useEffect, useState } from "react";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
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
            <div className="container mx-auto">
                <div className="text-center mb-12">
                    <span className="text-sm font-medium text-primary uppercase tracking-wider">
                        Depoimentos
                    </span>
                    <h2 className="text-3xl md:text-4xl font-serif font-bold mt-2 text-slate-900">
                        O que nossos pacientes dizem
                    </h2>
                </div>

                <div className="relative max-w-6xl mx-auto">
                    <button
                        onClick={() => scroll('left')}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 z-10 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-slate-600 hover:text-primary transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <div
                        ref={scrollRef}
                        className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory no-scrollbar"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {testimonials.map((t: any) => (
                            <Card key={t.id} className="min-w-[300px] md:min-w-[350px] snap-center border-none shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-8 flex flex-col items-center text-center">
                                    <div className="bg-primary/10 p-3 rounded-full mb-6 text-primary">
                                        <Quote size={24} fill="currentColor" className="opacity-50" />
                                    </div>
                                    <p className="text-slate-600 italic mb-6 leading-relaxed">"{t.comment}"</p>
                                    <div className="mt-auto">
                                        <h4 className="font-bold text-slate-900">{t.name || "Paciente"}</h4>
                                        <div className="flex gap-1 justify-center mt-2 text-yellow-400">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={14} fill={i < t.rating ? "currentColor" : "none"} className={i < t.rating ? "" : "text-slate-200"} />
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <button
                        onClick={() => scroll('right')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 z-10 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-slate-600 hover:text-primary transition-colors"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>
        </section>
    );
}

export default TestimonialsCarousel;
