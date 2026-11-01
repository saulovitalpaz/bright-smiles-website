import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchClient } from '@/lib/api';
import type { ClinicalConditionGroup } from '@/lib/clinicalConditions';
import { toast } from 'sonner';

interface Props { groups: ClinicalConditionGroup[]; onChange: () => Promise<void>; canManage: boolean }
export default function ClinicalConditionsSettings({ groups, onChange, canManage }: Props) {
  const [kind, setKind] = useState<'group' | 'condition'>('condition');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [groupKey, setGroupKey] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const reset = () => { setEditingKey(null); setName(''); setActive(true); };
  const mutate = async (path: string, method: string, body?: unknown) => {
    setSaving(true);
    try {
      const response = await fetchClient(path, { method, ...(body ? { body: JSON.stringify(body) } : {}) });
      if (!response.ok) { const result = await response.json(); throw new Error(result.error); }
      await onChange();
      toast.success('Cadastro clínico atualizado.');
      return true;
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível atualizar.'); return false; }
    finally { setSaving(false); }
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    const base = kind === 'group' ? '/clinical-condition-groups' : '/clinical-conditions';
    if (await mutate(base + (editingKey ? `/${editingKey}` : ''), editingKey ? 'PUT' : 'POST', { name, active, ...(kind === 'condition' ? { groupKey } : {}) })) reset();
  };
  return <Card className="mb-5"><CardHeader><CardTitle>Grupos e condições do odontograma</CardTitle><p className="text-sm text-muted-foreground">Habilite somente as condições utilizadas pela clínica. Excluir retira das novas seleções e preserva o histórico.</p></CardHeader><CardContent className="space-y-5">
    {canManage ? <form onSubmit={save} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <div className="space-y-1"><Label htmlFor="clinical-kind">Cadastro</Label><select id="clinical-kind" className="flex h-11 w-full rounded-md border bg-background px-3 text-sm" value={kind} onChange={event => { setKind(event.target.value as typeof kind); reset(); }}><option value="condition">Condição</option><option value="group">Grupo</option></select></div>
      <div className="space-y-1"><Label htmlFor="clinical-name">Nome</Label><Input id="clinical-name" maxLength={160} value={name} onChange={event => setName(event.target.value)} required /></div>
      {kind === 'condition' ? <div className="space-y-1"><Label htmlFor="clinical-group">Grupo</Label><select id="clinical-group" className="flex h-11 w-full rounded-md border bg-background px-3 text-sm" value={groupKey} onChange={event => setGroupKey(event.target.value)} required><option value="">Selecione…</option>{groups.filter(group => group.active).map(group => <option key={group.key} value={group.key}>{group.name}</option>)}</select></div> : null}
      <div className="flex flex-wrap items-end gap-2"><label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={active} onChange={event => setActive(event.target.checked)} />Habilitado</label><Button className="min-h-11" disabled={saving}>{editingKey ? 'Salvar' : 'Criar'}</Button>{editingKey ? <Button type="button" variant="outline" onClick={reset}>Cancelar</Button> : null}</div>
    </form> : null}
    <div className="grid gap-3 lg:grid-cols-2">{groups.map(group => <details key={group.key} className="min-w-0 rounded-lg border p-3"><summary className="cursor-pointer py-2 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{group.name} <span className="text-sm font-normal text-muted-foreground">{group.active ? `${group.conditions.filter(condition => condition.active).length} habilitadas` : 'Excluído'}</span></summary>
      {canManage ? <div className="my-2 flex flex-wrap gap-2"><Button type="button" variant="outline" size="sm" onClick={() => { setKind('group'); setEditingKey(group.key); setName(group.name); setActive(group.active); }}>Editar grupo</Button>{group.active ? <Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => { if (window.confirm(`Excluir o grupo ${group.name} das novas seleções? O histórico será preservado.`)) void mutate(`/clinical-condition-groups/${group.key}`, 'DELETE'); }}>Excluir grupo</Button> : null}</div> : null}
      <ul className="divide-y">{group.conditions.map(condition => <li key={condition.key} className="flex flex-wrap items-center justify-between gap-2 py-2"><span className="min-w-0 break-words text-sm">{condition.name}<span className="ml-2 text-xs text-muted-foreground">{condition.active && group.active ? 'Habilitada' : 'Não disponível'}</span></span>{canManage ? <div className="flex gap-2"><Button type="button" size="sm" variant="outline" disabled={!group.active} onClick={() => { setKind('condition'); setEditingKey(condition.key); setName(condition.name); setGroupKey(group.key); setActive(condition.active); }}>Editar</Button><Button type="button" size="sm" variant="outline" disabled={saving || !group.active} onClick={() => {
        if (condition.active) { if (window.confirm(`Excluir ${condition.name} das novas seleções?`)) void mutate(`/clinical-conditions/${condition.key}`, 'DELETE'); }
        else void mutate(`/clinical-conditions/${condition.key}`, 'PUT', { name: condition.name, groupKey: group.key, active: true });
      }}>{condition.active ? 'Excluir' : 'Habilitar'}</Button></div> : null}</li>)}</ul>
    </details>)}</div>
  </CardContent></Card>;
}
