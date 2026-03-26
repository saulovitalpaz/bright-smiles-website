import { useState } from "react";
import { Search, Plus, Dog, Cat, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Patient } from "@/lib/mock-data";

interface PatientSidebarProps {
  patients: Patient[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onAddNew: () => void;
  onDelete: (id: number) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const PatientSidebar = ({ patients, selectedId, onSelect, onAddNew, onDelete, isOpen = true, onClose }: PatientSidebarProps) => {
  const [search, setSearch] = useState("");

  const filtered = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (id: number) => {
    onSelect(id);
    if (onClose) onClose(); // fecha o drawer no mobile após selecionar
  };

  return (
    <>
      {/* Overlay escuro no mobile */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          // Mobile: drawer deslizante por cima
          "fixed inset-y-0 left-0 z-50 w-[280px] bg-card border-r border-border flex flex-col h-full transition-transform duration-300 ease-in-out",
          // Desktop: posição estática
          "md:static md:z-auto md:translate-x-0 md:flex",
          // Controle de visibilidade no mobile
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 space-y-4">
          {/* Header com logo e botão fechar (mobile only) */}
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-center">
              <div className="bg-white/60 backdrop-blur-md px-4 py-3 rounded-[2rem] shadow-sm border border-white/50 flex flex-col items-center justify-center transition-all hover:shadow-md hover:bg-white/80">
                <img
                  src="/images/logo.webp"
                  alt="ReviverPet Logo"
                  className="h-20 w-auto object-contain drop-shadow-md"
                />
              </div>
            </div>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="md:hidden shrink-0 ml-2 rounded-xl text-muted-foreground hover:text-foreground"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar paciente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl bg-muted/50"
            />
          </div>
          <Button onClick={onAddNew} className="w-full rounded-xl gap-2 bg-primary hover:bg-primary-light">
            <Plus className="h-4 w-4" /> Novo Paciente
          </Button>
        </div>

        <ScrollArea className="flex-1 px-3 pb-3">
          <div className="space-y-1.5">
            {filtered.map((p) => (
              <div key={p.id} className="relative group">
                <button
                  onClick={() => handleSelect(p.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left",
                    selectedId === p.id
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "hover:bg-accent text-foreground"
                  )}
                >
                  <span className="text-xl shrink-0">
                    {p.species === "Cão" ? <Dog className="h-5 w-5" /> : <Cat className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0 pr-6">
                    <div className="font-semibold text-sm truncate">{p.name}</div>
                    <div className={cn("text-xs truncate", selectedId === p.id ? "text-primary-foreground/80" : "text-muted-foreground")}>
                      {p.species} - {p.breed}
                    </div>
                  </div>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg",
                    selectedId === p.id
                      ? "text-primary-foreground/60 hover:text-primary-foreground hover:bg-white/10"
                      : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(p.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </aside>
    </>
  );
};

export default PatientSidebar;
