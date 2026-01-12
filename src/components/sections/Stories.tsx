import { useState, useEffect } from "react";
import { X, Play, Pause } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "@/lib/api";

interface Story {
    id: number;
    title?: string;
    url: string;
    type: "image" | "video";
    status: string;
    createdAt: string;
}

const Stories = () => {
    const [stories, setStories] = useState<Story[]>([]);
    const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        fetchStories();
    }, []);

    const fetchStories = async () => {
        try {
            const res = await fetch(`${API_URL}/stories`);
            if (res.ok) {
                const data = await res.json();
                // Filter only active stories
                const active = data.filter((s: any) => s.status === 'active');
                setStories(active);
            }
        } catch (error) {
            console.error("Failed to fetch stories", error);
        }
    };

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (selectedStoryIndex !== null && !isPaused && stories.length > 0) {
            timer = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 100) {
                        handleNext();
                        return 0;
                    }
                    return prev + 1;
                });
            }, 50); // 5 seconds per story
        }
        return () => clearInterval(timer);
    }, [selectedStoryIndex, isPaused, stories]);

    const handleNext = () => {
        if (selectedStoryIndex !== null) {
            if (selectedStoryIndex < stories.length - 1) {
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

    if (stories.length === 0) return null;

    return (
        <section className="py-12 bg-white border-b border-slate-100 overflow-hidden">
            <div className="container mx-auto">
                <div className="flex items-center gap-4 px-4 overflow-x-auto no-scrollbar">
                    {stories.map((story, index) => (
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
                                    {story.type === 'video' ? (
                                        <video src={story.url} className="w-16 h-16 rounded-full object-cover border border-slate-100" />
                                    ) : (
                                        <img
                                            src={story.url}
                                            alt={story.title}
                                            className="w-16 h-16 rounded-full object-cover border border-slate-100"
                                        />
                                    )}
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-full border-2 border-white">
                                    <Play size={10} fill="currentColor" />
                                </div>
                            </div>
                            <span className="text-xs font-semibold text-slate-700 truncate w-20 text-center">
                                {story.title || "Story"}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <Dialog
                open={selectedStoryIndex !== null}
                onOpenChange={(open) => !open && setSelectedStoryIndex(null)}
            >
                <DialogContent className="max-w-[400px] h-[80vh] p-0 overflow-hidden bg-black border-none rounded-3xl sm:rounded-3xl">
                    {selectedStoryIndex !== null && stories[selectedStoryIndex] && (
                        <div className="relative h-full flex flex-col">
                            {/* Progress Bars */}
                            <div className="absolute top-4 left-4 right-4 z-50 flex gap-1">
                                {stories.map((_, i) => (
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
                                    <div className="w-8 h-8 rounded-full bg-white/20 border border-white/40 overflow-hidden">
                                        <img src="/images/logo-oficial.png" className="w-full h-full object-cover opacity-90" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">NOEH</p>
                                        <p className="text-[10px] opacity-70">
                                            {new Date(stories[selectedStoryIndex].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
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
                                    {stories[selectedStoryIndex].type === 'video' ? (
                                        <motion.video
                                            key={stories[selectedStoryIndex].id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            src={stories[selectedStoryIndex].url}
                                            className="w-full h-full object-cover"
                                            autoPlay
                                            playsInline
                                            onEnded={handleNext}
                                        />
                                    ) : (
                                        <motion.img
                                            key={stories[selectedStoryIndex].id}
                                            initial={{ opacity: 0, scale: 1.1 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.3 }}
                                            src={stories[selectedStoryIndex].url}
                                            className="w-full h-full object-cover"
                                        />
                                    )}
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
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </section>
    );
};

export default Stories;
