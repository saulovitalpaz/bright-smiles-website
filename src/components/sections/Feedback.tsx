import { useState } from "react";
import { Star, Send, Smile, Frown, Meh, Heart, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

const Feedback = () => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [emojiRating, setEmojiRating] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const emojis = [
        { icon: Frown, label: "Poderia melhorar", value: "sad", color: "text-red-400" },
        { icon: Meh, label: "Regular", value: "neutral", color: "text-yellow-400" },
        { icon: Smile, label: "Bom", value: "happy", color: "text-green-400" },
        { icon: Heart, label: "Excelente", value: "love", color: "text-pink-400" },
        { icon: Award, label: "Impecável", value: "wow", color: "text-primary" },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call
        setTimeout(() => {
            toast.success("Obrigado pelo seu feedback! Sua opinião é muito importante para nós.");
            setRating(0);
            setEmojiRating(null);
            setIsSubmitting(false);
            (e.target as HTMLFormElement).reset();
        }, 1500);
    };

    return (
        <section className="section-padding bg-secondary/10">
            <div className="container mx-auto max-w-5xl">
                <Card className="border-primary/10 shadow-xl overflow-hidden backdrop-blur-sm bg-card/50">
                    <CardHeader className="text-center bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pb-8">
                        <CardTitle className="font-serif text-3xl font-bold">Sua opinião importa</CardTitle>
                        <CardDescription className="text-base">
                            Compartilhe sua experiência no Núcleo Odontológico.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                                <div className="space-y-10">
                                    {/* Star Rating */}
                                    <div className="flex flex-col items-center lg:items-start gap-4">
                                        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                                            Avaliação Geral
                                        </span>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onMouseEnter={() => setHoverRating(star)}
                                                    onMouseLeave={() => setHoverRating(0)}
                                                    onClick={() => setRating(star)}
                                                    className="transition-transform hover:scale-125 focus:outline-none"
                                                >
                                                    <Star
                                                        className={`w-10 h-10 transition-colors ${star <= (hoverRating || rating)
                                                            ? "fill-primary text-primary"
                                                            : "text-muted-foreground/30"
                                                            }`}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Emoji/Ludic Rating */}
                                    <div className="flex flex-col items-center lg:items-start gap-5">
                                        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                                            Como você se sentiu?
                                        </span>
                                        <div className="flex justify-between w-full max-w-sm">
                                            {emojis.map((emoji) => {
                                                const Icon = emoji.icon;
                                                const isActive = emojiRating === emoji.value;
                                                return (
                                                    <button
                                                        key={emoji.value}
                                                        type="button"
                                                        onClick={() => setEmojiRating(emoji.value)}
                                                        className={`flex flex-col items-center gap-2 group transition-all ${isActive ? "scale-110" : "opacity-40 hover:opacity-100"
                                                            }`}
                                                        title={emoji.label}
                                                    >
                                                        <div className={`p-3 rounded-2xl transition-colors ${isActive ? "bg-primary/20" : "bg-card group-hover:bg-secondary"
                                                            }`}>
                                                            <Icon className={`w-8 h-8 ${isActive ? emoji.color : "text-muted-foreground"}`} />
                                                        </div>
                                                        <span className={`text-[10px] font-bold uppercase tracking-tight transition-opacity ${isActive ? "opacity-100 text-primary" : "opacity-0"
                                                            }`}>
                                                            {emoji.label}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Text Fields */}
                                    <div className="grid gap-4">
                                        <div className="grid gap-2">
                                            <Input
                                                placeholder="Assunto (ex: Atendimento, Limpeza)"
                                                className="bg-background/50 border-primary/10 focus-visible:ring-primary h-12"
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Textarea
                                                placeholder="Escreva seu comentário aqui..."
                                                className="min-h-[140px] bg-background/50 border-primary/10 focus-visible:ring-primary resize-none text-base"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-14 text-lg font-serif transition-all hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] shadow-lg"
                                        disabled={isSubmitting || rating === 0}
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                                                Enviando...
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Send className="w-5 h-5" />
                                                Enviar Avaliação
                                            </div>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </section>
    );
};

export default Feedback;
