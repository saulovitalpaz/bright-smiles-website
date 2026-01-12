import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/lib/api";

const treatments = [
  "Harmonização Facial",
  "Preenchimento Labial",
  "Rinomodelação",
  "Tratamento de Bruxismo",
  "Implantes Dentários",
  "Clareamento Dental",
  "Outro",
  "Restauração" // Added requested item
];

const AppointmentForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    treatment: "",
    message: "",
    ageRange: "",
    gender: "",
    location: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha nome e telefone.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Save to Backend (Lead)
      await fetch(`${API_URL}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      // 2. Open WhatsApp
      const whatsappMessage = encodeURIComponent(
        `Olá! Gostaria de agendar uma consulta.\n\n` +
        `*Nome:* ${formData.name.trim()}\n` +
        `*Telefone:* ${formData.phone.trim()}\n` +
        `*E-mail:* ${formData.email.trim() || "Não informado"}\n` +
        `*Tratamento:* ${formData.treatment || "Não especificado"}\n` +
        `*Mensagem:* ${formData.message.trim() || "Sem mensagem adicional"}`
      );

      window.open(`https://wa.me/5533991219695?text=${whatsappMessage}`, "_blank");

      toast({
        title: "Solicitação Recebida!",
        description: "Seus dados foram salvos e você será redirecionado para o WhatsApp.",
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        treatment: "",
        message: "",
        ageRange: "",
        gender: "",
        location: ""
      });

    } catch (error) {
      console.error("Erro ao salvar lead", error);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível salvar seu pedido, mas tente pelo WhatsApp direto.",
        variant: "destructive"
      });
      // Still open WhatsApp as fallback
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="agendamento" className="section-padding">
      <div className="container mx-auto">
        <div className="max-w-2xl mx-auto">
          <Card className="border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl md:text-3xl font-serif">
                Agende sua consulta
              </CardTitle>
              <CardDescription className="text-base">
                Preencha o formulário abaixo e entraremos em contato para confirmar seu agendamento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Seu nome"
                      value={formData.name}
                      onChange={handleChange}
                      maxLength={100}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone / WhatsApp *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={formData.phone}
                      onChange={handleChange}
                      maxLength={20}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    maxLength={255}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ageRange">Faixa Etária</Label>
                    <Select
                      value={formData.ageRange}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, ageRange: value }))
                      }
                    >
                      <SelectTrigger id="ageRange">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="18-24">18-24 anos</SelectItem>
                        <SelectItem value="25-34">25-34 anos</SelectItem>
                        <SelectItem value="35-44">35-44 anos</SelectItem>
                        <SelectItem value="45-54">45-54 anos</SelectItem>
                        <SelectItem value="55+">55+ anos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gênero</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, gender: value }))
                      }
                    >
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="feminino">Feminino</SelectItem>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="outro">Outro / Prefer não informar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="treatment">Tratamento de interesse</Label>
                  <Select
                    value={formData.treatment}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, treatment: value }))
                    }
                  >
                    <SelectTrigger id="treatment">
                      <SelectValue placeholder="Selecione um tratamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {treatments.map((treatment) => (
                        <SelectItem key={treatment} value={treatment}>
                          {treatment}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem (opcional)</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Conte-nos mais sobre o que você precisa..."
                    value={formData.message}
                    onChange={handleChange}
                    maxLength={500}
                    rows={4}
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Enviar e Agendar
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Ao enviar, você será redirecionado para o WhatsApp para confirmar o agendamento.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default AppointmentForm;
