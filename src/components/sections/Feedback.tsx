import { useState } from "react";
import { Star, Send, Smile, Frown, Meh, Heart, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { API_URL } from "@/lib/api";

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const nameInput = formData.get("subject") as string; // Reused input for 'subject' as name/topic??
        // Wait, input placeholder says "Assunto". Let's assume it is comment title/subject.
        // Actually the backend Testimonial model has 'name', 'rating', 'comment'.
        // The form has "Assunto" and "Comentario". I will map Assunto -> Name (or add a Name field).
        // The user likely wants to be anonymous or provide name.
        // Let's check the form fields:
        // Input placeholder="Assunto (ex: Atendimento, Limpeza)"
        // Textarea placeholder="Escreva seu comentário..."
        // I should probably add a Name field if I can, but to avoid UI churn, I'll send Assunto as 'name' (topic) or just modify the form to ask for Name.
        // BETTER: Change "Assunto" to "Nome (Opcional)" or just "Seu Nome".
        // BUT, keeping to minimal changes: I will treat the first input as "Subject/Context" and append to comment, and send "Anônimo" or ask user.
        // Actually, let's just use the Input for "Name/Subject".

        const subject = (form.elements.namedItem('subject') as HTMLInputElement).value;
        const comment = (form.elements.namedItem('comment') as HTMLTextAreaElement).value;

        try {
            const res = await fetch(`${API_URL}/testimonials`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: subject, // Using subject as Name/Title identifier
                    rating: rating || (emojiRating ? 5 : 0), // Fallback
                    comment: comment,
                    feeling: emojiRating,
                    approved: false
                })
            });

            if (res.ok) {
                toast.success("Obrigado pelo seu feedback! Sua opinião é muito importante para nós.");
                setRating(0);
                setEmojiRating(null);
                form.reset();
            } else {
                toast.error("Erro ao enviar feedback.");
            }
        } catch (error) {
            toast.error("Erro de conexão.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="section-padding bg-secondary/10">
            <div className="container mx-auto max-w-5xl px-4">
                <Card className="border-primary/10 shadow-xl overflow-hidden backdrop-blur-sm bg-card/50">
                    <CardHeader className="text-center bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pb-4 sm:pb-6 md:pb-8 px-4 sm:px-6">
                        <CardTitle className="font-serif text-xl sm:text-2xl md:text-3xl font-bold">Sua opinião importa</CardTitle>
                        <CardDescription className="text-sm sm:text-base">
                            Compartilhe sua experiência no Núcleo Odontológico.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 sm:pt-6 md:pt-8 px-4 sm:px-6">
                        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-12 items-start">
                                <div className="space-y-6 sm:space-y-8 md:space-y-10">
                                    {/* Star Rating */}
                                    <div className="flex flex-col items-center lg:items-start gap-3 sm:gap-4">
                                        <span className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                                            Avaliação Geral
                                        </span>
                                        <div className="flex gap-1.5 sm:gap-2">
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
                                                        className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors ${star <= (hoverRating || rating)
                                                            ? "fill-primary text-primary"
                                                            : "text-muted-foreground/30"
                                                            }`}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Emoji/Ludic Rating */}
                                    <div className="flex flex-col items-center lg:items-start gap-3 sm:gap-4 md:gap-5">
                                        <span className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                                            Como você se sentiu?
                                        </span>
                                        <div className="flex justify-between w-full max-w-xs sm:max-w-sm">
                                            {emojis.map((emoji) => {
                                                const Icon = emoji.icon;
                                                const isActive = emojiRating === emoji.value;
                                                return (
                                                    <button
                                                        key={emoji.value}
                                                        type="button"
                                                        onClick={() => setEmojiRating(emoji.value)}
                                                        className={`flex flex-col items-center gap-1 sm:gap-2 group transition-all ${isActive ? "scale-110" : "opacity-40 hover:opacity-100"
                                                            }`}
                                                        title={emoji.label}
                                                    >
                                                        <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-colors ${isActive ? "bg-primary/20" : "bg-card group-hover:bg-secondary"
                                                            }`}>
                                                            <Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${isActive ? emoji.color : "text-muted-foreground"}`} />
                                                        </div>
                                                        <span className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-tight transition-opacity ${isActive ? "opacity-100 text-primary" : "opacity-0"
                                                            }`}>
                                                            {emoji.label}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 sm:space-y-5 md:space-y-6">
                                    {/* Text Fields */}
                                    <div className="grid gap-3 sm:gap-4">
                                        <div className="grid gap-2">
                                            <Input
                                                name="subject"
                                                placeholder="Seu Nome (Opcional)"
                                                className="bg-background/50 border-primary/10 focus-visible:ring-primary h-10 sm:h-11 md:h-12 text-sm sm:text-base"
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Textarea
                                                name="comment"
                                                placeholder="Escreva seu comentário aqui..."
                                                className="min-h-[100px] sm:min-h-[120px] md:min-h-[140px] bg-background/50 border-primary/10 focus-visible:ring-primary resize-none text-sm sm:text-base"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-11 sm:h-12 md:h-14 text-sm sm:text-base md:text-lg font-serif transition-all hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] shadow-lg"
                                        disabled={isSubmitting || rating === 0}
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                                                Enviando...
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
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
