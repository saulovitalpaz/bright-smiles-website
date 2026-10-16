export function SigningProviderChoice() {
  return <div className="no-print space-y-1">
    <label htmlFor="signing-provider" className="text-xs font-medium">Certificado digital</label>
    <select id="signing-provider" value="A1" onChange={() => {}} aria-describedby="bird-id-availability" className="min-h-11 w-full rounded-md border bg-background px-3 text-sm">
      <option value="A1">Certificado A1</option>
      <option value="BIRD_ID" disabled>Bird ID em nuvem — aguardando homologação</option>
    </select>
    <p id="bird-id-availability" className="text-xs text-muted-foreground">Bird ID ficará disponível após configuração e homologação com a Soluti.</p>
  </div>;
}
