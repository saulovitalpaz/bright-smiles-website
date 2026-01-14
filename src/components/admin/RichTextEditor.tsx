import React, { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Bold,
    Italic,
    List,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Type,
    Heading1,
    Heading2,
    Quote
} from "lucide-react";

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
    className?: string;
}

const RichTextEditor = ({ content, onChange, placeholder, className }: RichTextEditorProps) => {
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== content) {
            editorRef.current.innerHTML = content;
        }
    }, [content]);

    const handleFormat = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    return (
        <div className={`border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col ${className}`}>
            <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center gap-1 overflow-x-auto no-scrollbar">
                <Button variant="ghost" size="sm" onClick={() => handleFormat('bold')} title="Negrito" type="button"><Bold size={16} /></Button>
                <Button variant="ghost" size="sm" onClick={() => handleFormat('italic')} title="Itálico" type="button"><Italic size={16} /></Button>
                <Separator orientation="vertical" className="mx-1 h-6" />
                <Button variant="ghost" size="sm" onClick={() => handleFormat('formatBlock', 'h1')} title="Título 1" type="button"><Heading1 size={16} /></Button>
                <Button variant="ghost" size="sm" onClick={() => handleFormat('formatBlock', 'h2')} title="Título 2" type="button"><Heading2 size={16} /></Button>
                <Button variant="ghost" size="sm" onClick={() => handleFormat('formatBlock', 'blockquote')} title="Citação" type="button"><Quote size={16} /></Button>
                <Separator orientation="vertical" className="mx-1 h-6" />
                <Button variant="ghost" size="sm" onClick={() => handleFormat('justifyLeft')} title="Alinhar Esquerda" type="button"><AlignLeft size={16} /></Button>
                <Button variant="ghost" size="sm" onClick={() => handleFormat('justifyCenter')} title="Centralizar" type="button"><AlignCenter size={16} /></Button>
                <Button variant="ghost" size="sm" onClick={() => handleFormat('justifyRight')} title="Alinhar Direita" type="button"><AlignRight size={16} /></Button>
                <Separator orientation="vertical" className="mx-1 h-6" />
                <Button variant="ghost" size="sm" onClick={() => handleFormat('insertUnorderedList')} title="Lista" type="button"><List size={16} /></Button>
                <Separator orientation="vertical" className="mx-1 h-6" />
                <Button variant="ghost" size="sm" onClick={() => handleFormat('fontSize', '4')} title="Aumentar Fonte" type="button"><Type size={16} /></Button>
            </div>
            <div className="p-6 flex-1 bg-white overflow-y-auto">
                <div
                    ref={editorRef}
                    contentEditable
                    className="w-full h-full min-h-[300px] outline-none prose prose-slate max-w-none text-slate-800"
                    onInput={(e) => onChange(e.currentTarget.innerHTML)}
                    data-placeholder={placeholder}
                >
                </div>
            </div>
            <style>{`
                [contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: #94a3b8;
                    cursor: text;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};

export default RichTextEditor;
