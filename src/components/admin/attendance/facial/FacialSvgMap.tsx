import React, { useCallback, useId, useRef } from "react";
import { ApplicationMarker } from "./ApplicationMarker";
import {
  FACIAL_REGIONS,
  FACIAL_VIEWBOX,
  regionLabel,
  type FacialApplication,
} from "./facialModel";
import "./facial-workspace.css";

export type FacialSvgMapProps = {
  selectedRegionId: string | null;
  treatedRegionIds: Set<string>;
  applications: FacialApplication[];
  markingMode: boolean;
  onRegionSelect: (regionId: string) => void;
  onApplicationSelect: (applicationId: string) => void;
  onMapMark: (coordinates: { x: number; y: number }) => void;
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function normalizeSvgClick(
  event: Pick<React.MouseEvent<SVGSVGElement>, "clientX" | "clientY">,
  svg: SVGSVGElement,
) {
  const rect = svg.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  const point = svg.createSVGPoint?.();
  const matrix = svg.getScreenCTM?.();
  if (point && matrix?.inverse) {
    point.x = event.clientX;
    point.y = event.clientY;
    const local = point.matrixTransform(matrix.inverse());
    return {
      x: clamp((local.x - FACIAL_VIEWBOX.x) / FACIAL_VIEWBOX.width),
      y: clamp((local.y - FACIAL_VIEWBOX.y) / FACIAL_VIEWBOX.height),
    };
  }
  return {
    x: clamp((event.clientX - rect.left) / rect.width),
    y: clamp((event.clientY - rect.top) / rect.height),
  };
}

const procedureClass = (procedureType: FacialApplication["procedureType"]) =>
  `facial-marker facial-marker--${procedureType}`;

export default function FacialSvgMap({
  selectedRegionId,
  treatedRegionIds,
  applications,
  markingMode,
  onRegionSelect,
  onApplicationSelect,
  onMapMark,
}: FacialSvgMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const titleId = useId().replace(/:/g, "");

  const markFromEvent = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!markingMode || !svgRef.current) return;
    const coordinates = normalizeSvgClick(event, svgRef.current);
    if (coordinates) onMapMark(coordinates);
  }, [markingMode, onMapMark]);

  const handleRegionClick = (event: React.MouseEvent<SVGGElement>, regionId: string) => {
    onRegionSelect(regionId);
    if (markingMode && svgRef.current) {
      const coordinates = normalizeSvgClick(event, svgRef.current);
      if (coordinates) onMapMark(coordinates);
    }
  };

  const handleRegionKeyDown = (event: React.KeyboardEvent<SVGGElement>, regionId: string) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onRegionSelect(regionId);
  };

  return (
    <div className={`facial-map-canvas ${markingMode ? "facial-map-canvas--marking" : ""}`}>
      <svg
        ref={svgRef}
        viewBox="0 0 320 420"
        role="img"
        aria-labelledby={`${titleId}-title`}
        aria-label="Mapa facial interativo"
        className="h-auto w-full max-w-full"
        onClick={(event) => {
          if (event.target === event.currentTarget) markFromEvent(event);
        }}
      >
        <title id={`${titleId}-title`}>Mapa facial anatômico frontal</title>
        <defs>
          <linearGradient id={`${titleId}-skin`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fffaf2" />
            <stop offset="0.52" stopColor="#f5e9dc" />
            <stop offset="1" stopColor="#ead7c8" />
          </linearGradient>
          <linearGradient id={`${titleId}-neck`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ead8ca" />
            <stop offset="1" stopColor="#f8eee4" />
          </linearGradient>
          <radialGradient id={`${titleId}-cheek`}>
            <stop offset="0" stopColor="#d7a89b" stopOpacity="0.2" />
            <stop offset="1" stopColor="#d7a89b" stopOpacity="0" />
          </radialGradient>
          <filter id={`${titleId}-shadow`} x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy="7" stdDeviation="9" floodColor="#7c6658" floodOpacity="0.13" />
          </filter>
        </defs>

        <g aria-hidden="true" pointerEvents="none">
          <path d="M116 319 C126 342 125 368 112 390 L86 420 H234 L208 390 C195 368 194 342 204 319 Z" fill={`url(#${titleId}-neck)`} stroke="#d9c5b6" strokeWidth="1.4" />
          <path d="M73 144 C50 140 43 164 50 195 C55 217 65 231 78 226 C85 209 84 164 73 144 Z" fill={`url(#${titleId}-skin)`} stroke="#d9c5b6" strokeWidth="1.4" />
          <path d="M247 144 C270 140 277 164 270 195 C265 217 255 231 242 226 C235 209 236 164 247 144 Z" fill={`url(#${titleId}-skin)`} stroke="#d9c5b6" strokeWidth="1.4" />
          <path d="M160 30 C105 30 75 72 70 137 C66 190 77 258 104 306 C120 334 143 352 160 354 C177 352 200 334 216 306 C243 258 254 190 250 137 C245 72 215 30 160 30 Z" fill={`url(#${titleId}-skin)`} stroke="#d6c0b1" strokeWidth="1.8" filter={`url(#${titleId}-shadow)`} />
          <ellipse cx="111" cy="205" rx="43" ry="38" fill={`url(#${titleId}-cheek)`} />
          <ellipse cx="209" cy="205" rx="43" ry="38" fill={`url(#${titleId}-cheek)`} />
          <path d="M92 126 C108 116 128 117 142 126" fill="none" stroke="#806f65" strokeWidth="3.4" strokeLinecap="round" />
          <path d="M178 126 C192 117 212 116 228 126" fill="none" stroke="#806f65" strokeWidth="3.4" strokeLinecap="round" />
          <path d="M91 143 C106 132 132 133 146 145 C132 155 106 156 91 143 Z" fill="#fffdf9" stroke="#9b887c" strokeWidth="1.2" />
          <path d="M174 145 C188 133 214 132 229 143 C214 156 188 155 174 145 Z" fill="#fffdf9" stroke="#9b887c" strokeWidth="1.2" />
          <ellipse cx="119" cy="144" rx="5" ry="6" fill="#77685f" />
          <ellipse cx="201" cy="144" rx="5" ry="6" fill="#77685f" />
          <path d="M155 151 C151 181 146 208 151 223 C155 228 165 228 169 223" fill="none" stroke="#b49a8c" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M145 226 C151 231 169 231 175 226" fill="none" stroke="#a98f82" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M157 237 L157 251 M163 237 L163 251" fill="none" stroke="#bda497" strokeWidth="1.1" strokeLinecap="round" />
        </g>

        {FACIAL_REGIONS.map((region) => {
          const state = selectedRegionId === region.id ? "selected" : treatedRegionIds.has(region.id) ? "treated" : "idle";
          const paths = region.hitPaths ?? region.paths;
          return (
            <g
              key={region.id}
              role="button"
              tabIndex={0}
              data-facial-region={region.id}
              data-state={state}
              aria-label={`Selecionar ${regionLabel(region).toLowerCase()}`}
              className="facial-region"
              onClick={(event) => handleRegionClick(event, region.id)}
              onKeyDown={(event) => handleRegionKeyDown(event, region.id)}
            >
              {paths.map((path, index) => (
                <path key={`${region.id}-${index}`} d={path} />
              ))}
              {state === "treated" && <title>{`${regionLabel(region)} possui aplicações registradas`}</title>}
            </g>
          );
        })}

        {applications.filter((application) => application.coordinates).map((application) => (
          <ApplicationMarker
            key={application.id}
            application={application}
            className={procedureClass(application.procedureType)}
            onSelect={onApplicationSelect}
          />
        ))}
      </svg>
      {markingMode && <p className="facial-map-hint" role="status">Clique no mapa para posicionar a aplicação</p>}
    </div>
  );
}
