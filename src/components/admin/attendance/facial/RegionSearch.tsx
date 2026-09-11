import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FACIAL_REGIONS, regionLabel, type FacialRegion } from "./facialModel";

type RegionSearchProps = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (regionId: string) => void;
};

export function RegionSearch({ value, onChange, onSelect }: RegionSearchProps) {
  const query = value.trim().toLocaleLowerCase("pt-BR");
  const results: FacialRegion[] = query
    ? FACIAL_REGIONS.filter((region) => regionLabel(region).toLocaleLowerCase("pt-BR").includes(query))
    : [];

  return (
    <div className="relative">
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar região..."
        aria-label="Buscar região"
        className="min-h-11 pl-9"
      />
      {results.length > 0 && (
        <div className="absolute inset-x-0 top-full z-20 mt-1 rounded-md border border-border bg-popover p-1 shadow-md" role="listbox" aria-label="Resultados de regiões">
          {results.map((region) => (
            <button
              type="button"
              key={region.id}
              role="option"
              aria-label={`Selecionar ${regionLabel(region).toLowerCase()}`}
              className="flex min-h-11 w-full items-center rounded px-3 text-left text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onSelect(region.id)}
            >
              {regionLabel(region)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default RegionSearch;
