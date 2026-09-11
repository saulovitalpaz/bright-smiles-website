import React from "react";
import { procedureLabel, type FacialApplication } from "./facialModel";

type ApplicationMarkerProps = {
  application: FacialApplication;
  className?: string;
  onSelect: (applicationId: string) => void;
};

const formatAmount = (application: FacialApplication) => {
  if (application.amount === undefined) return "";
  const amount = application.amount.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  return `${amount}${application.unit ? ` ${application.unit}` : ""}`;
};

export function ApplicationMarker({ application, className = "", onSelect }: ApplicationMarkerProps) {
  if (!application.coordinates) return null;
  const amount = formatAmount(application);
  const label = ["Editar aplicação", procedureLabel(application.procedureType), amount].filter(Boolean).join(" — ");
  const x = application.coordinates.x * 320;
  const y = application.coordinates.y * 420;

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={label}
      data-application-id={application.id}
      className={`facial-application-marker ${className}`}
      transform={`translate(${x} ${y})`}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(application.id);
      }}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onSelect(application.id);
      }}
    >
      <circle className="facial-marker-dot" r="7" />
      <circle className="facial-marker-ring" r="11" />
      {amount && <text className="facial-marker-label" x="12" y="4">{amount}</text>}
      <title>{label}</title>
    </g>
  );
}

export default ApplicationMarker;
