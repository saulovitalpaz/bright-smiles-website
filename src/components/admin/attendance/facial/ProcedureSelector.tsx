import React from "react";
import { Button } from "@/components/ui/button";
import { PROCEDURE_OPTIONS, type FacialProcedureType } from "./facialModel";

type ProcedureSelectorProps = {
  value: FacialProcedureType;
  onChange: (value: FacialProcedureType) => void;
};

export function ProcedureSelector({ value, onChange }: ProcedureSelectorProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-foreground">Procedimento</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {PROCEDURE_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={value === option.value ? "default" : "outline"}
            className="min-h-11 text-xs sm:text-sm"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </fieldset>
  );
}

export default ProcedureSelector;
