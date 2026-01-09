import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Fingerprint,
    ShieldCheck,
    Smartphone,
    Send,
    CheckCircle2,
    ArrowRight,
    ExternalLink,
    AlertCircle,
    Info
} from "lucide-react";

const AdminDigitalGuide = () => {
    return (
        <AdminLayout title="Guia Internacional de Receita Digital">
            <div className="max-w-4xl mx-auto space-y-10 mb-20">
                <header className="text-center space-y-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary border border-primary/20 shadow-sm">
                        <Fingerprint size={32} />
                    </div>
                    <h2 className="text-3xl font-serif font-bold text-slate-900">Validando sua Assinatura Eletrônica</h2>
                    <p className="text-slate-500 max-w-xl mx-auto">
                        Para que seu PDF seja aceito em farmácias em todo o Brasil, ele precisa seguir as normas da ICP-Brasil.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                    {/* Visual Flowchart Connector (hidden on mobile) */}
                    <div className="hidden md:block absolute top-[60px] left-[20%] right-[20%] h-0.5 bg-slate-200 z-0"></div>

                    {[
                        {
                            step: 1,
                            title: "Certificado Digital",
                            icon: ShieldCheck,
                            desc: "Você precisa de um certificado e-CPF (A1 ou A3) para assinar o arquivo PDF Gerado.",
                            color: "bg-blue-500"
                        },
                        {
                            step: 2,
                            title: "Assinatura via Validar",
                            icon: Send,
                            desc: "Utilize o portal 'Validar' do ITI ou plataformas como Memed para anexar o certificado ao documento.",
                            color: "bg-primary"
                        },
                        {
                            step: 3,
                            title: "Envio ao Paciente",
                            icon: CheckCircle2,
                            desc: "O paciente recebe o link ou PDF e a farmácia valida o QR Code no balcão.",
                            color: "bg-emerald-500"
                        },
                    ].map((s) => (
                        <Card key={s.step} className="relative z-10 border-slate-200 hover:border-primary/30 transition-all shadow-sm">
                            <CardContent className="pt-8 text-center space-y-4">
                                <div className={`w-12 h-12 ${s.color} rounded-full flex items-center justify-center text-white mx-auto shadow-lg`}>
                                    <s.icon size={24} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-bold text-slate-900">Passo {s.step}: {s.title}</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium">{s.desc}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="border-none shadow-xl bg-slate-900 text-white overflow-hidden group">
                        <CardHeader className="relative z-10">
                            <CardTitle className="flex items-center gap-2">
                                <AlertCircle className="text-primary" /> Como Funciona?
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10 space-y-4">
                            <p className="text-sm text-slate-300 leading-relaxed">
                                A receita digital não é apenas um "scanner" da receita de papel. Ela é um arquivo nato-digital contendo códigos criptográficos que garantem que foi você quem escreveu e que nada foi alterado.
                            </p>
                            <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold gap-2" onClick={() => window.open('https://assinador.iti.br/', '_blank')}>
                                Assinar Documento Agora <ExternalLink size={16} />
                            </Button>
                        </CardContent>
                        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all"></div>
                    </Card>

                    <Card className="border-slate-200 shadow-sm border-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-slate-900">
                                <Info className="text-blue-500" /> Prescritores Integrados
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-slate-500">
                                Para evitar o trabalho manual, recomendamos o uso da <strong>Memed</strong>, que já integra com o banco de dados de todas as farmácias do Brasil.
                            </p>
                            <div className="flex flex-col gap-2">
                                <Button variant="outline" className="justify-between border-slate-200 hover:border-blue-500" onClick={() => window.open('https://memed.com.br/', '_blank')}>
                                    Conhecer a Memed <ArrowRight size={16} />
                                </Button>
                                <Button variant="outline" className="justify-between border-slate-200 hover:border-emerald-500" onClick={() => window.open('https://validador.iti.br/', '_blank')}>
                                    Validador Oficial ITI <ArrowRight size={16} />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1 space-y-4">
                        <h4 className="text-xl font-bold text-slate-900 font-serif">Ainda tem dúvidas sobre o CRO?</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            O Conselho Regional de Odontologia permite a teleodontologia e a prescrição digital desde que assinada com certificado padrão ICP-Brasil. Verifique sempre se sua assinatura está ativa.
                        </p>
                    </div>
                    <div className="w-full md:w-auto">
                        <img src="/images/logo oficial.png" className="w-24 opacity-20 grayscale" alt="Logo faint" />
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDigitalGuide;
