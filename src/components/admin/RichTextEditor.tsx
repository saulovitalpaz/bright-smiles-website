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
    AlignJustify,
    Type,
    Heading1,
    Heading2,
    Heading3,
    Quote,
    Underline,
    Strikethrough,
    ListOrdered,
    Link,
    Unlink,
    RemoveFormatting,
    Undo2,
    Redo2,
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

    const handleLink = () => {
        const url = window.prompt("URL do link");
        if (url?.trim()) handleFormat("createLink", url.trim());
    };

    const ToolbarButton = ({
        label,
        children,
        onClick,
    }: {
        label: string;
        children: React.ReactNode;
        onClick: () => void;
    }) => (
        <Button
            variant="ghost"
            size="sm"
            aria-label={label}
            title={label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={onClick}
            type="button"
        >
            {children}
        </Button>
    );

    return (
        <div className={`border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col ${className}`}>
            <div className="min-h-14 p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-1 overflow-x-auto no-scrollbar">
                <ToolbarButton label="Negrito" onClick={() => handleFormat('bold')}><Bold size={16} /></ToolbarButton>
                <ToolbarButton label="Itálico" onClick={() => handleFormat('italic')}><Italic size={16} /></ToolbarButton>
                <ToolbarButton label="Sublinhado" onClick={() => handleFormat('underline')}><Underline size={16} /></ToolbarButton>
                <ToolbarButton label="Tachado" onClick={() => handleFormat('strikeThrough')}><Strikethrough size={16} /></ToolbarButton>
                <Separator orientation="vertical" className="mx-1 h-6" />
                <ToolbarButton label="Título 1" onClick={() => handleFormat('formatBlock', 'h1')}><Heading1 size={16} /></ToolbarButton>
                <ToolbarButton label="Título 2" onClick={() => handleFormat('formatBlock', 'h2')}><Heading2 size={16} /></ToolbarButton>
                <ToolbarButton label="Título 3" onClick={() => handleFormat('formatBlock', 'h3')}><Heading3 size={16} /></ToolbarButton>
                <ToolbarButton label="Citação" onClick={() => handleFormat('formatBlock', 'blockquote')}><Quote size={16} /></ToolbarButton>
                <Separator orientation="vertical" className="mx-1 h-6" />
                <ToolbarButton label="Alinhar à esquerda" onClick={() => handleFormat('justifyLeft')}><AlignLeft size={16} /></ToolbarButton>
                <ToolbarButton label="Centralizar" onClick={() => handleFormat('justifyCenter')}><AlignCenter size={16} /></ToolbarButton>
                <ToolbarButton label="Alinhar à direita" onClick={() => handleFormat('justifyRight')}><AlignRight size={16} /></ToolbarButton>
                <ToolbarButton label="Justificar" onClick={() => handleFormat('justifyFull')}><AlignJustify size={16} /></ToolbarButton>
                <Separator orientation="vertical" className="mx-1 h-6" />
                <ToolbarButton label="Lista com marcadores" onClick={() => handleFormat('insertUnorderedList')}><List size={16} /></ToolbarButton>
                <ToolbarButton label="Lista numerada" onClick={() => handleFormat('insertOrderedList')}><ListOrdered size={16} /></ToolbarButton>
                <Separator orientation="vertical" className="mx-1 h-6" />
                <label className="sr-only" htmlFor="rich-text-font-family">Fonte</label>
                <select id="rich-text-font-family" aria-label="Fonte" className="h-9 rounded-md border border-slate-200 bg-white px-2 text-xs" defaultValue="Arial" onChange={(event) => handleFormat("fontName", event.target.value)}>
                    <option>Arial</option>
                    <option>Georgia</option>
                    <option>Times New Roman</option>
                    <option>Verdana</option>
                </select>
                <label className="sr-only" htmlFor="rich-text-font-size">Tamanho da fonte</label>
                <select id="rich-text-font-size" aria-label="Tamanho da fonte" className="h-9 w-16 rounded-md border border-slate-200 bg-white px-2 text-xs" defaultValue="3" onChange={(event) => handleFormat("fontSize", event.target.value)}>
                    {[1, 2, 3, 4, 5, 6, 7].map((size) => <option key={size} value={size}>{size}</option>)}
                </select>
                <label className="flex h-9 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-500" title="Cor do texto">
                    <Type size={14} />
                    <input aria-label="Cor do texto" type="color" defaultValue="#1e293b" className="h-5 w-5 cursor-pointer border-0 p-0" onChange={(event) => handleFormat("foreColor", event.target.value)} />
                </label>
                <ToolbarButton label="Inserir link" onClick={handleLink}><Link size={16} /></ToolbarButton>
                <ToolbarButton label="Remover link" onClick={() => handleFormat('unlink')}><Unlink size={16} /></ToolbarButton>
                <ToolbarButton label="Remover formatação" onClick={() => handleFormat('removeFormat')}><RemoveFormatting size={16} /></ToolbarButton>
                <ToolbarButton label="Desfazer" onClick={() => handleFormat('undo')}><Undo2 size={16} /></ToolbarButton>
                <ToolbarButton label="Refazer" onClick={() => handleFormat('redo')}><Redo2 size={16} /></ToolbarButton>
            </div>
            <div className="min-h-0 flex-1 p-4 sm:p-6 bg-white overflow-y-auto">
                <div
                    ref={editorRef}
                    contentEditable
                    className="w-full h-full min-h-[280px] sm:min-h-[360px] lg:min-h-[500px] outline-none prose prose-slate max-w-none text-slate-800"
                    onInput={(e) => onChange(e.currentTarget.innerHTML)}
                    data-placeholder={placeholder}
                    suppressContentEditableWarning
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
