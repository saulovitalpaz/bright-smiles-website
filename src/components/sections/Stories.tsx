import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

interface Story {
    id: number;
    userName: string;
    userImage: string;
    mediaUrl: string;
    type: "image" | "video";
    timestamp: string;
}

const mockStories: Story[] = [
    {
        id: 1,
        userName: "Dra. Ana Karolina",
        userImage: "/images/logo oficial.png",
        mediaUrl: "https://images.unsplash.com/photo-1588776814546-1ffce47267a5?auto=format&fit=crop&q=80&w=800",
        type: "image",
        timestamp: "2h atrás"
    },
    {
        id: 2,
        userName: "Dra. Clara Lima",
        userImage: "/images/logo oficial.png",
        mediaUrl: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&q=80&w=800",
        type: "image",
        timestamp: "5h atrás"
    },
    {
        id: 3,
        userName: "Clínica NOEH",
        userImage: "/images/logo oficial.png",
        mediaUrl: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800",
        type: "image",
        timestamp: "8h atrás"
    }
];

const Stories = () => {
    const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (selectedStoryIndex !== null && !isPaused) {
            timer = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 100) {
                        handleNext();
                        return 0;
                    }
                    return prev + 1;
                });
            }, 50); // 5 seconds total (100 * 50ms)
        }
        return () => clearInterval(timer);
    }, [selectedStoryIndex, isPaused]);

    const handleNext = () => {
        if (selectedStoryIndex !== null) {
            if (selectedStoryIndex < mockStories.length - 1) {
                setSelectedStoryIndex(selectedStoryIndex + 1);
                setProgress(0);
            } else {
                setSelectedStoryIndex(null);
            }
        }
    };

    const handlePrev = () => {
        if (selectedStoryIndex !== null) {
            if (selectedStoryIndex > 0) {
                setSelectedStoryIndex(selectedStoryIndex - 1);
                setProgress(0);
            } else {
                setProgress(0);
            }
        }
    };

    return (
        <section className="py-12 bg-white border-b border-slate-100 overflow-hidden">
            <div className="container mx-auto">
                <div className="flex items-center gap-4 px-4 overflow-x-auto no-scrollbar">
                    {mockStories.map((story, index) => (
                        <button
                            key={story.id}
                            onClick={() => {
                                setSelectedStoryIndex(index);
                                setProgress(0);
                            }}
                            className="flex flex-col items-center gap-2 group shrink-0"
                        >
                            <div className="relative p-[3px] rounded-full bg-gradient-to-tr from-gold to-yellow-400 group-hover:scale-105 transition-transform duration-300">
                                <div className="p-1 bg-white rounded-full">
                                    <img
                                        src={story.userImage}
                                        alt={story.userName}
                                        className="w-16 h-16 rounded-full object-cover border border-slate-100"
                                    />
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-full border-2 border-white">
                                    <Play size={10} fill="currentColor" />
                                </div>
                            </div>
                            <span className="text-xs font-semibold text-slate-700 truncate w-20 text-center">
                                {story.userName.split(' ')[1] || story.userName}
                            </span>
                        </button>
                    ))}

                    <div className="flex flex-col items-center gap-2 opacity-40 shrink-0">
                        <div className="w-[74px] h-[74px] rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center">
                            <span className="text-2xl text-slate-400">+</span>
                        </div>
                        <span className="text-xs font-medium text-slate-400">Novo</span>
                    </div>
                </div>
            </div>

            <Dialog
                open={selectedStoryIndex !== null}
                onOpenChange={(open) => !open && setSelectedStoryIndex(null)}
            >
                <DialogContent className="max-w-[400px] h-[80vh] p-0 overflow-hidden bg-black border-none rounded-3xl sm:rounded-3xl">
                    {selectedStoryIndex !== null && (
                        <div className="relative h-full flex flex-col">
                            {/* Progress Bars */}
                            <div className="absolute top-4 left-4 right-4 z-50 flex gap-1">
                                {mockStories.map((_, i) => (
                                    <div key={i} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-white transition-all duration-50"
                                            style={{
                                                width: i < selectedStoryIndex ? '100%' : i === selectedStoryIndex ? `${progress}%` : '0%'
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Header */}
                            <div className="absolute top-8 left-4 right-4 z-50 flex items-center justify-between text-white">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={mockStories[selectedStoryIndex].userImage}
                                        alt=""
                                        className="w-8 h-8 rounded-full border border-white/20"
                                    />
                                    <div>
                                        <p className="text-sm font-bold">{mockStories[selectedStoryIndex].userName}</p>
                                        <p className="text-[10px] opacity-70">{mockStories[selectedStoryIndex].timestamp}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setIsPaused(!isPaused)}>
                                        {isPaused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
                                    </button>
                                    <button onClick={() => setSelectedStoryIndex(null)}>
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>

                            {/* Media */}
                            <div className="flex-1 bg-slate-900 flex items-center justify-center overflow-hidden">
                                <AnimatePresence mode="wait">
                                    <motion.img
                                        key={selectedStoryIndex}
                                        initial={{ opacity: 0, scale: 1.1 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.3 }}
                                        src={mockStories[selectedStoryIndex].mediaUrl}
                                        className="w-full h-full object-cover"
                                    />
                                </AnimatePresence>
                            </div>

                            {/* Controls */}
                            <button
                                className="absolute inset-y-0 left-0 w-1/4 z-40"
                                onClick={handlePrev}
                            />
                            <button
                                className="absolute inset-y-0 right-0 w-3/4 z-40"
                                onClick={handleNext}
                            />

                            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
                                <p className="text-white text-sm font-medium leading-relaxed">
                                    Acompanhe nossa rotina e dicas de saúde bucal diariamente no @noeh_odontologia
                                </p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </section>
    );
};

export default Stories;
