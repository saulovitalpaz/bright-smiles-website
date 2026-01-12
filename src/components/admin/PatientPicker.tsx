import React, { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Search, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { API_URL } from "@/lib/api";

interface Patient {
    id: number;
    name: string;
    cpf: string;
    phone?: string;
    address?: string;
}

interface PatientPickerProps {
    onSelect: (patient: Patient) => void;
    className?: string;
}

export function PatientPicker({ onSelect, className }: PatientPickerProps) {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState("");
    const [query, setQuery] = useState("");
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchPatients = async () => {
            if (query.length < 2) {
                setPatients([]);
                return;
            }
            setLoading(true);
            try {
                const res = await fetch(`${API_URL}/patients?search=${query}`);
                if (res.ok) {
                    const data = await res.json();
                    setPatients(data);
                }
            } catch (error) {
                console.error("Error fetching patients:", error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchPatients, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between", className)}
                >
                    {value
                        ? patients.find((patient) => patient.cpf === value)?.name || value
                        : "Buscar paciente (Nome ou CPF)..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command shouldFilter={false}>
                    <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Digite nome ou CPF..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    <CommandList>
                        {loading && <div className="p-4 text-center text-sm text-slate-500 flex items-center justify-center gap-2"><Loader2 className="animate-spin h-4 w-4" /> Buscando...</div>}
                        {!loading && patients.length === 0 && query.length >= 2 && (
                            <CommandEmpty>Nenhum paciente encontrado.</CommandEmpty>
                        )}
                        <CommandGroup>
                            {patients.map((patient) => (
                                <CommandItem
                                    key={patient.id}
                                    value={patient.cpf}
                                    onSelect={(currentValue) => {
                                        setValue(patient.name);
                                        setOpen(false);
                                        onSelect(patient);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === patient.cpf ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span className="font-bold">{patient.name}</span>
                                        <span className="text-xs text-slate-500">CPF: {patient.cpf}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
