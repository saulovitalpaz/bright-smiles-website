import { Instagram, Phone, Maximize2 } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { fetchClient } from "@/lib/api";
import { mediaUrl } from "@/lib/media";
import { team } from "@/lib/team";

const Team = () => {
  const [selected, setSelected] = useState<{ src: string; name: string } | null>(null);
  const { data: photos } = useQuery<Record<string, string>>({
    queryKey: ['team-photos'],
    queryFn: async () => {
      const response = await fetchClient('/team/photos');
      if (!response.ok) throw new Error('Não foi possível carregar as fotos da equipe.');
      return response.json();
    },
    refetchOnMount: 'always',
    refetchInterval: 60000,
  });
  return (
    <section id="equipe" aria-labelledby="team-heading" className="section-padding bg-background">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-foreground/70">Nossa equipe</p>
          <h2 id="team-heading" className="mt-3 mb-4 text-balance font-serif text-3xl font-bold text-foreground md:text-4xl">Especialistas dedicadas ao seu sorriso</h2>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">Conheça as profissionais do Núcleo Odontológico Especializado, comprometidas com a excelência técnica e o cuidado personalizado.</p>
        </div>
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-8 lg:gap-14">
          {team.map(member => {
            const src = mediaUrl(photos?.[member.key]) || member.image;
            return <article key={member.key} className="min-w-0">
              <button type="button" className="group relative block aspect-[4/5] w-full overflow-hidden rounded-[2rem] bg-muted/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary" aria-label={'Ampliar foto de ' + member.name} onClick={() => setSelected({ src, name: member.name })}>
                <img src={src} alt={member.name} width={400} height={500} loading="lazy" decoding="async" className="h-full w-full object-contain object-bottom" onError={event => { if (event.currentTarget.getAttribute('src') !== member.image) event.currentTarget.src = member.image; }} />
                <span className="absolute bottom-3 right-3 rounded-full bg-background/90 p-3 text-foreground shadow-sm transition-colors group-hover:bg-background"><Maximize2 size={18} aria-hidden="true" /></span>
              </button>
              <div className="pt-5">
                <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground">{member.cro}</p>
                <h3 className="text-balance font-serif text-xl font-semibold text-foreground lg:text-2xl">{member.name}</h3>
                <p className="mt-2 text-sm font-semibold text-foreground/80">{member.specialty}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{member.description}</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {member.phone && <Button asChild className="min-h-11 gap-2"><a href={'https://wa.me/' + member.phone} target="_blank" rel="noopener noreferrer" aria-label={'WhatsApp de ' + member.name}><Phone size={16} aria-hidden="true" />WhatsApp</a></Button>}
                  <Button asChild variant="outline" className="min-h-11 gap-2"><a href={member.instagram} target="_blank" rel="noopener noreferrer" aria-label={'Instagram de ' + member.name}><Instagram size={16} aria-hidden="true" />Instagram</a></Button>
                </div>
              </div>
            </article>;
          })}
        </div>
      </div>
      <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) setSelected(null); }}>
        <DialogContent className="max-w-3xl rounded-3xl p-5 sm:rounded-3xl">
          <DialogTitle>{selected?.name}</DialogTitle>
          <DialogDescription>Foto da profissional</DialogDescription>
          {selected && <img src={selected.src} alt={selected.name} width={600} height={750} className="max-h-[70dvh] w-full rounded-2xl object-contain" />}
        </DialogContent>
      </Dialog>
    </section>
  );
};
export default Team;
