import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchClient } from '@/lib/api';
import { mediaUrl } from '@/lib/media';
import { team } from '@/lib/team';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TeamPhotoEditor() {
    const client = useQueryClient();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState('');
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const ownPhoto = useQuery({ queryKey: ['my-team-photo'], queryFn: async () => {
        const response = await fetchClient('/team/photo/me');
        if (response.status === 403) return null;
        if (!response.ok) throw new Error('Não foi possível carregar sua foto.');
        return response.json() as Promise<{ member: string; photo: string | null }>;
    } });
    useEffect(() => {
        if (!file) { setPreview(''); return; }
        const url = URL.createObjectURL(file); setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);
    const save = useMutation({ mutationFn: async () => {
        const body = new FormData(); body.append('file', file!);
        const response = await fetchClient('/team/photo/me', { method: 'PUT', body });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Não foi possível salvar a foto.');
        return result;
    }, onSuccess: async result => {
        client.setQueryData(['my-team-photo'], result);
        await client.invalidateQueries({ queryKey: ['team-photos'] });
        setFile(null); setNotice('Foto publicada na homepage.');
    }, onError: (err: Error) => setError(err.message) });
    if (ownPhoto.isPending) return <p role="status">Carregando sua foto…</p>;
    if (ownPhoto.isError) return <div role="alert"><p>Não foi possível carregar sua foto.</p><Button variant="outline" onClick={() => void ownPhoto.refetch()}>Tentar novamente</Button></div>;
    if (!ownPhoto.data) return null;
    const member = team.find(item => item.key === ownPhoto.data.member);
    if (!member) return null;
    return <section className="admin-card p-4 sm:p-5" aria-labelledby="team-photo-title">
        <div className="grid items-start gap-5 sm:grid-cols-[160px_minmax(0,1fr)]">
            <div className="aspect-[4/5] overflow-hidden rounded-3xl bg-muted/40"><img src={preview || mediaUrl(ownPhoto.data.photo) || member.image} alt={`Foto de ${member.name}`} width={400} height={500} className="h-full w-full object-contain object-bottom" /></div>
            <form className="min-w-0 space-y-3" onSubmit={event => { event.preventDefault(); if (file && !save.isPending) { setError(''); setNotice(''); save.mutate(); } }}>
                <h2 id="team-photo-title" className="font-serif text-xl font-semibold">Sua foto na homepage</h2>
                <p className="text-sm text-muted-foreground">{member.name}. Você pode atualizar somente a sua foto.</p>
                <div className="space-y-2"><Label htmlFor="team-photo">Escolher nova foto</Label><Input key={notice} id="team-photo" type="file" accept="image/png,image/jpeg,image/webp" disabled={save.isPending} aria-describedby="team-photo-help" onChange={event => {
                    const selected = event.target.files?.[0]; setError(''); setNotice('');
                    if (!selected) { setFile(null); return; }
                    if (!['image/png', 'image/jpeg', 'image/webp'].includes(selected.type) || selected.size > 5 * 1024 * 1024) { setFile(null); setError('Escolha PNG, JPG ou WebP de até 5 MB.'); return; }
                    setFile(selected);
                }} /></div>
                <p id="team-photo-help" className="text-xs text-muted-foreground">PNG, JPG ou WebP, até 5 MB. Prefira um retrato vertical, com pouco espaço ao redor. PNG sem fundo mantém a transparência.</p>
                {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
                <Button type="submit" disabled={!file || save.isPending}>{save.isPending ? 'Publicando…' : 'Publicar minha foto'}</Button>
            </form>
        </div>
    </section>;
}
