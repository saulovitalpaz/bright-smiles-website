import { cn } from "@/lib/utils";

interface LudicCardProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    accentColor?: string; // e.g., "bg-amber-100"
}

export const LudicCard = ({
    title,
    icon,
    children,
    className,
    accentColor = "bg-primary/10",
}: LudicCardProps) => (
    <div
        className={cn(
            "rounded-2xl shadow-sm border border-border overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md",
            accentColor,
            className
        )}
    >
        <div className="flex items-center gap-3 p-4 bg-white/40 backdrop-blur-sm border-b border-white/20">
            <div className="p-2 bg-white rounded-xl shadow-sm text-primary">
                {icon}
            </div>
            <h3 className="font-bold text-lg text-foreground drop-shadow-sm">{title}</h3>
        </div>
        <div className="p-4 bg-white/60 backdrop-blur-md">
            {children}
        </div>
    </div>
);
