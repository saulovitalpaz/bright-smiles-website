export type ClinicPrintDetails = {
  name?: string;
  slogan?: string;
  address?: string;
  phone?: string;
  cnpj?: string;
};

export function ClinicPrintHeader({ clinic = {} }: { clinic?: ClinicPrintDetails }) {
  return <header className="print-section mb-4 grid grid-cols-[64px_minmax(0,1fr)_minmax(0,180px)] items-center gap-3 border-b border-slate-200 pb-3">
    <img src="/images/logo-oficial.png" alt="Logo" className="h-16 w-16 object-contain" />
    <div className="min-w-0 text-center">
      <h1 className="break-words font-serif text-base font-bold leading-tight text-slate-900">{clinic.name || 'Núcleo Odontológico'}</h1>
      <p className="mt-1 text-[9px] leading-snug">{clinic.slogan || 'Especializado & Harmonização'}</p>
    </div>
    <div className="min-w-0 break-words text-right text-[8px] leading-relaxed text-slate-600">
      <p>{clinic.address || 'Rua Barão do Rio Branco, 461 - Sala 206 - Centro, Governador Valadares - MG'}</p>
      <p>Telefone: {clinic.phone || 'Não informado'}</p>
      <p>CNPJ: {clinic.cnpj || 'Não informado'}</p>
    </div>
  </header>;
}
