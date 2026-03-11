import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_URL } from '@/lib/api';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Users, UserPlus, Shield, Activity, Key, Trash2 } from 'lucide-react';

const AdminUsers = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        password: '',
        cro: '',
        role: 'dentist'
    });

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/users`, { withCredentials: true });
            return res.data;
        }
    });

    const createMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const res = await axios.post(`${API_URL}/users`, data, { withCredentials: true });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast({ title: 'Sucesso', description: 'Usuário criado com sucesso!' });
            setIsCreating(false);
            setFormData({ name: '', username: '', password: '', cro: '', role: 'dentist' });
        },
        onError: (err: any) => {
            toast({
                title: 'Erro',
                description: err.response?.data?.error || 'Erro ao criar usuário',
                variant: 'destructive'
            });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.username || !formData.password) {
            toast({ title: 'Aviso', description: 'Preencha os campos obrigatórios.', variant: 'warning' });
            return;
        }
        createMutation.mutate(formData);
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">Administrador</span>;
            case 'manager': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">Recepção / Gerência</span>;
            case 'dentist': return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">Dentista / Doutor(a)</span>;
            default: return <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">{role}</span>;
        }
    };

    return (
        <AdminLayout title="Gerenciar Equipe">
            <div className="space-y-6 max-w-6xl mx-auto">
                
                <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-lg text-primary">
                            <Users size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Membros da Equipe</h2>
                            <p className="text-sm text-slate-500">Gerencie acessos ao sistema e cadastre profissionais.</p>
                        </div>
                    </div>
                    <Button onClick={() => setIsCreating(!isCreating)} className="gap-2 bg-primary hover:bg-primary/90">
                        {isCreating ? 'Cancelar' : <><UserPlus size={18} /> Novo Usuário</>}
                    </Button>
                </div>

                {isCreating && (
                    <Card className="border-primary/20 shadow-md animate-in fade-in slide-in-from-top-4">
                        <CardHeader className="bg-primary/5 border-b border-primary/10">
                            <CardTitle className="text-lg text-primary">Cadastrar Novo Usuário</CardTitle>
                            <CardDescription>Crie um acesso para um novo dentista, dentista parceiro ou recepcionista.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Nome Completo *</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                            placeholder="Ex: Dra. Ana C."
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>CRO / Registro (Opcional)</Label>
                                        <Input
                                            value={formData.cro}
                                            onChange={(e) => setFormData(p => ({ ...p, cro: e.target.value }))}
                                            placeholder="Ex: CRO/SP 12345"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Nível de Acesso *</Label>
                                        <Select
                                            value={formData.role}
                                            onValueChange={(v) => setFormData(p => ({ ...p, role: v }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="dentist">Dentista (Consultas e Evoluções)</SelectItem>
                                                <SelectItem value="manager">Recepção (Financeiro, Pacientes, Sem acesso Admin Root)</SelectItem>
                                                <SelectItem value="admin">Administrador (Acesso Total)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 mt-4">
                                    <div className="space-y-2">
                                        <Label>Login / Usuário (Username) *</Label>
                                        <Input
                                            value={formData.username}
                                            onChange={(e) => setFormData(p => ({ ...p, username: e.target.value.toLowerCase().trim() }))}
                                            placeholder="Ex: ana.dentista"
                                            required
                                        />
                                        <p className="text-[10px] text-slate-500">O usuário usará este nome para fazer login.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Senha Temporária *</Label>
                                        <Input
                                            type="text"
                                            value={formData.password}
                                            onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                                            placeholder="Crie uma senha inicial"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="pt-4 flex justify-end">
                                    <Button type="submit" disabled={createMutation.isPending} className="bg-primary hover:bg-primary/90">
                                        {createMutation.isPending ? 'Salvando...' : 'Criar Conta de Acesso'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        <p className="text-slate-500">Carregando usuários...</p>
                    ) : (
                        users.map((u: any) => (
                            <Card key={u.id} className="relative overflow-hidden group hover:shadow-md transition-all border-slate-200">
                                <div className="absolute top-0 right-0 p-4">
                                    {getRoleBadge(u.role)}
                                </div>
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg border-2 border-white shadow-sm ring-1 ring-slate-200">
                                            {u.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 leading-tight">{u.name}</h3>
                                            <p className="text-xs text-primary font-bold mt-1 uppercase">{u.cro || 'Sem Registro'}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2 border-t border-slate-100 pt-4 mt-4">
                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                            <Key size={14} className="text-slate-400" />
                                            <span className="font-medium">Login: <span className="text-slate-900">{u.username}</span></span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                            <Activity size={14} className="text-slate-400" />
                                            <span className="font-medium">Criado em: {new Date(u.createdAt).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    </div>
                                    
                                    {u.username !== 'admin' && (
                                        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 hover:text-red-600 h-8 w-8" onClick={() => toast({ title: "Proteção", description: "O módulo de exclusão requer confirmação avançada. Entre em contato com o suporte." })}>
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminUsers;
