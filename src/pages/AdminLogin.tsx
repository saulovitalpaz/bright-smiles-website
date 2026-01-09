import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, User } from "lucide-react";
import { toast } from "sonner";

const AdminLogin = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();

        const users = [
            {
                username: "admin",
                password: "admin",
                name: "Developer",
                cro: "DEV-001",
                role: "admin"
            },
            {
                username: "Dra.Ana_Karolina@noeh.com.br",
                password: "admin",
                name: "Ana Karolina",
                cro: "CRO/MG 60.514",
                role: "admin"
            },
            {
                username: "Dra.Clara_Lima@noeh.com.br",
                password: "admin",
                name: "Clara Lima de Souza",
                cro: "CRO/MG 60.369",
                role: "admin"
            }
        ];

        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            localStorage.setItem("admin_user", JSON.stringify({
                name: user.name,
                cro: user.cro,
                username: user.username
            }));
            toast.success(`Bem-vinda, ${user.name}!`);
            navigate("/admin/dashboard");
        } else {
            toast.error("Usuário ou senha inválidos.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white shadow-xl shadow-slate-200 border border-slate-50 mb-6 p-2 overflow-hidden">
                        <img
                            src="/images/logo oficial.png"
                            alt="Logo oficial"
                            className="w-full h-full object-contain rounded-full"
                        />
                    </div>
                    <h1 className="text-4xl font-serif font-bold text-slate-900 mb-2 tracking-tight">Painel Admin</h1>
                    <p className="text-slate-500 font-medium tracking-wide uppercase text-xs">Exclusivo para profissionais</p>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="username">Usuário</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-slate-400" size={18} />
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="Seu usuário"
                                    className="pl-10"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="password">Senha</Label>
                                <a href="#" className="text-xs text-primary hover:underline">Esqueceu a senha?</a>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Sua senha"
                                    className="pl-10"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full h-12 text-lg font-bold">
                            Entrar no Painel
                        </Button>
                    </form>
                </div>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => navigate("/")}
                        className="text-slate-400 hover:text-primary transition-colors text-sm font-medium"
                    >
                        ← Voltar para o site oficial
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
