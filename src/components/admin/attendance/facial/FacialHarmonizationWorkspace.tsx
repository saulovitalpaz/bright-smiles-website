import React, { useEffect, useMemo, useRef, useState } from "react";
import FacialMapToolbar from "./FacialMapToolbar";
import FacialSvgMap from "./FacialSvgMap";
import RegionInspector from "./RegionInspector";
import SessionSummaryBar from "./SessionSummaryBar";
import WorkspaceHeader from "./WorkspaceHeader";
import {
  FACIAL_REGIONS,
  legacyRegionKeyForId,
  normalizeFacialNotes,
  summarizeFacialNotes,
  type FacialApplication,
  type FacialNotesDocument,
  type FacialProcedureType,
} from "./facialModel";
import type { FacialApplicationDraft } from "./ApplicationEditor";
import "./facial-workspace.css";

type FacialHarmonizationWorkspaceProps = {
  value: unknown;
  onChange: (value: FacialNotesDocument) => void;
  onSave?: () => void;
  onViewSummary?: () => void;
  readOnly?: boolean;
};

let applicationSequence = 0;
const newApplicationId = () => {
  applicationSequence += 1;
  return `facial-application-${Date.now()}-${applicationSequence}`;
};

export function FacialHarmonizationWorkspace({ value, onChange, onSave, onViewSummary, readOnly = false }: FacialHarmonizationWorkspaceProps) {
  const [document, setDocument] = useState<FacialNotesDocument>(() => normalizeFacialNotes(value));
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [procedureType, setProcedureType] = useState<FacialProcedureType>("filler");
  const [markingMode, setMarkingMode] = useState(false);
  const [search, setSearch] = useState("");
  const [editingApplicationId, setEditingApplicationId] = useState<string | null>(null);
  const [draft, setDraft] = useState<FacialApplicationDraft>({ regionId: "", procedureType: "filler" });
  const incomingValueKeyRef = useRef(JSON.stringify(normalizeFacialNotes(value)));

  useEffect(() => {
    const incoming = normalizeFacialNotes(value);
    const incomingKey = JSON.stringify(incoming);
    if (incomingKey === incomingValueKeyRef.current) return;
    incomingValueKeyRef.current = incomingKey;
    setDocument(incoming);
  }, [value]);

  const selectedRegion = useMemo(() => FACIAL_REGIONS.find((region) => region.id === selectedRegionId) ?? null, [selectedRegionId]);
  const selectedApplications = useMemo(() => document.applications.filter((application) => application.regionId === selectedRegionId), [document.applications, selectedRegionId]);
  const editingApplication = editingApplicationId ? document.applications.find((application) => application.id === editingApplicationId) ?? null : null;
  const summary = summarizeFacialNotes(document);
  const treatedRegionIds = useMemo(() => {
    const ids = new Set(document.applications.map((application) => application.regionId));
    Object.entries(document.legacyRegions ?? {}).forEach(([legacyKey, region]) => {
      if (![region.product, region.dose, region.notes].some((item) => item.trim())) return;
      FACIAL_REGIONS.forEach((candidate) => {
        if (legacyRegionKeyForId(candidate.id) === legacyKey) ids.add(candidate.id);
      });
    });
    return ids;
  }, [document.applications, document.legacyRegions]);

  const commit = (next: FacialNotesDocument) => {
    setDocument(next);
    onChange(next);
  };

  const selectRegion = (regionId: string) => {
    setSelectedRegionId(regionId);
    setEditingApplicationId(null);
    setDraft({ regionId, procedureType });
  };

  const registerApplication = (applicationDraft: FacialApplicationDraft) => {
    if (editingApplicationId) {
      const next = {
        ...document,
        applications: document.applications.map((application) => application.id === editingApplicationId
          ? { ...application, ...applicationDraft, id: application.id, coordinates: application.coordinates }
          : application),
      };
      commit(next);
      setEditingApplicationId(null);
      return;
    }
    commit({ ...document, applications: [...document.applications, { ...applicationDraft, id: newApplicationId() }] });
    setDraft({ regionId: selectedRegionId ?? "", procedureType });
  };

  const markApplication = (coordinates: { x: number; y: number }) => {
    if (readOnly || !selectedRegionId) return;
    const application: FacialApplication = {
      id: newApplicationId(),
      ...draft,
      regionId: selectedRegionId,
      procedureType,
      coordinates,
    };
    commit({ ...document, applications: [...document.applications, application] });
    setMarkingMode(false);
  };

  const editApplication = (application: FacialApplication) => {
    setSelectedRegionId(application.regionId);
    setEditingApplicationId(application.id);
    setProcedureType(application.procedureType);
    setMarkingMode(false);
  };

  const duplicateApplication = (application: FacialApplication) => {
    const copy = { ...application, id: newApplicationId() };
    commit({ ...document, applications: [...document.applications, copy] });
    setSelectedRegionId(copy.regionId);
    setEditingApplicationId(copy.id);
  };

  const deleteApplication = (applicationId: string) => {
    commit({ ...document, applications: document.applications.filter((application) => application.id !== applicationId) });
    if (editingApplicationId === applicationId) setEditingApplicationId(null);
  };

  const changeProcedure = (next: FacialProcedureType) => {
    setProcedureType(next);
    setDraft((current) => ({ ...current, procedureType: next }));
  };

  return (
    <section className="facial-harmonization-workspace flex min-h-0 flex-col gap-4" data-facial-workspace>
      <WorkspaceHeader readOnly={readOnly} />
      <div className="facial-workspace-grid min-h-0 flex-1">
        <div className="min-w-0 space-y-3">
          <FacialMapToolbar markingMode={markingMode} readOnly={readOnly} onMarkingModeChange={setMarkingMode} search={search} onSearchChange={setSearch} onRegionSearchSelect={(regionId) => { selectRegion(regionId); setSearch(""); }} />
          <FacialSvgMap selectedRegionId={selectedRegionId} treatedRegionIds={treatedRegionIds} applications={document.applications} markingMode={markingMode && !readOnly} onRegionSelect={selectRegion} onApplicationSelect={(applicationId) => { const application = document.applications.find((item) => item.id === applicationId); if (application) editApplication(application); }} onMapMark={markApplication} />
        </div>
        <div className="min-h-0">
          <RegionInspector region={selectedRegion} applications={selectedApplications} procedureType={procedureType} readOnly={readOnly} editingApplication={editingApplication} onProcedureChange={changeProcedure} onDraftChange={setDraft} onRegister={registerApplication} onEdit={editApplication} onDuplicate={duplicateApplication} onDelete={deleteApplication} onCancelEdit={() => setEditingApplicationId(null)} />
        </div>
      </div>
      <SessionSummaryBar summary={summary} onViewSummary={onViewSummary} onSave={onSave} readOnly={readOnly} />
    </section>
  );
}

export default FacialHarmonizationWorkspace;
