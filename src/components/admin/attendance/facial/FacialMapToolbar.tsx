import React from "react";
import { Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import RegionSearch from "./RegionSearch";

type FacialMapToolbarProps = {
  markingMode: boolean;
  onMarkingModeChange: (enabled: boolean) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onRegionSearchSelect: (regionId: string) => void;
  readOnly?: boolean;
};

export function FacialMapToolbar({ markingMode, onMarkingModeChange, search, onSearchChange, onRegionSearchSelect, readOnly = false }: FacialMapToolbarProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <RegionSearch value={search} onChange={onSearchChange} onSelect={onRegionSearchSelect} />
      </div>
      <Button
        type="button"
        variant={markingMode ? "default" : "outline"}
        className="min-h-11 shrink-0 gap-2"
        aria-pressed={markingMode}
        disabled={readOnly}
        onClick={() => onMarkingModeChange(!markingMode)}
      >
        <Crosshair aria-hidden="true" className="h-4 w-4" />
        {markingMode ? "Concluir marcação" : "Marcar aplicação"}
      </Button>
    </div>
  );
}

export default FacialMapToolbar;
