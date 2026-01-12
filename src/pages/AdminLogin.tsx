import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, User } from "lucide-react";
import { toast } from "sonner";

import { API_URL } from "@/lib/api";

const AdminLogin = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const user = await response.json();
                localStorage.setItem("admin_user", JSON.stringify(user));
                toast.success(`Bem-vinda, ${user.name}!`);
                navigate("/admin/dashboard");
            } else {
                toast.error("Usuário ou senha inválidos.");
            }
        } catch (error) {
            toast.error("Erro ao conectar com o servidor.");
            console.error("Login error:", error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-40 h-40 mb-2 overflow-hidden">
                        <img
                            src="/images/logo-oficial.png"
                            alt="Logo oficial"
                            className="w-full h-full object-contain"
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
