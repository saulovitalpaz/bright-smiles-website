import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Simplified representation of teeth (FDI notation)
const TEETH = {
    upper: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
    lower: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]
};

const Tooth = ({ number, status, onClick }) => {
    // Basic SVG shape for a tooth (molar vs incisor simplified)
    const isMolar = [18, 17, 16, 26, 27, 28, 48, 47, 46, 36, 37, 38].includes(number);

    let color = "fill-white";
    if (status === 'cavity') color = "fill-red-400";
    if (status === 'treated') color = "fill-blue-400";
    if (status === 'extraction') color = "fill-gray-800";
    if (status === 'implant') color = "fill-green-400";

    return (
        <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={() => onClick(number)}>
            <div className={`w-8 h-10 border border-slate-300 rounded-md transition-colors ${color} hover:bg-slate-100 flex items-center justify-center relative`}>
                <span className="text-[10px] text-slate-500 absolute top-0.5">{number}</span>
                {/* SVG Icon could go here */}
                {isMolar ? (
                    <div className="w-5 h-5 border border-slate-200 rounded-sm opacity-50 bg-slate-50"></div>
                ) : (
                    <div className="w-3 h-5 border border-slate-200 rounded-sm opacity-50 bg-slate-50"></div>
                )}
            </div>
        </div>
    );
};

export const Odontogram = ({ initialData = {}, onUpdate }) => {
    const [teethStatus, setTeethStatus] = useState(initialData);
    const [selectedTool, setSelectedTool] = useState('cavity'); // cavity, treated, extraction, implant, clear

    const handleToothClick = (number) => {
        const current = teethStatus[number];
        let next = selectedTool;
        if (selectedTool === 'clear' || current === selectedTool) {
            next = null;
        }

        const newStatus = { ...teethStatus, [number]: next };
        setTeethStatus(newStatus);
        if (onUpdate) onUpdate(newStatus);
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm uppercase text-slate-500 font-bold">Odontograma</CardTitle>
                <div className="flex gap-2 mt-2">
                    <button onClick={() => setSelectedTool('cavity')} className={`px-2 py-1 text-xs rounded border ${selectedTool === 'cavity' ? 'bg-red-100 border-red-300 text-red-700' : 'bg-white'}`}>Cárie (Vermelho)</button>
                    <button onClick={() => setSelectedTool('treated')} className={`px-2 py-1 text-xs rounded border ${selectedTool === 'treated' ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white'}`}>Tratado (Azul)</button>
                    <button onClick={() => setSelectedTool('extraction')} className={`px-2 py-1 text-xs rounded border ${selectedTool === 'extraction' ? 'bg-gray-100 border-gray-300 text-gray-700' : 'bg-white'}`}>Extração (Cinza)</button>
                    <button onClick={() => setSelectedTool('implant')} className={`px-2 py-1 text-xs rounded border ${selectedTool === 'implant' ? 'bg-green-100 border-green-300 text-green-700' : 'bg-white'}`}>Implante (Verde)</button>
                    <button onClick={() => setSelectedTool('clear')} className={`px-2 py-1 text-xs rounded border ${selectedTool === 'clear' ? 'bg-slate-100 border-slate-300' : 'bg-white'}`}>Limpar</button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-6 items-center overflow-x-auto pb-4">
                    {/* Upper Arch */}
                    <div className="flex gap-1">
                        {TEETH.upper.map(t => (
                            <Tooth key={t} number={t} status={teethStatus[t]} onClick={handleToothClick} />
                        ))}
                    </div>
                    {/* Lower Arch */}
                    <div className="flex gap-1">
                        {TEETH.lower.map(t => (
                            <Tooth key={t} number={t} status={teethStatus[t]} onClick={handleToothClick} />
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
