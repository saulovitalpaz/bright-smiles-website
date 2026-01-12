import { useState, useEffect, useRef } from "react";
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
    const videoRef = useRef<HTMLVideoElement>(null);
    const STORY_DURATION = 5000; // 5 seconds for images

    useEffect(() => {
        fetchStories();
    }, []);

    const fetchStories = async () => {
        try {
            const res = await fetch(`${API_URL}/stories`);
            if (res.ok) {
                const data = await res.json();
                const active = data.filter((s: any) => s.status === 'active');
                setStories(active);
            }
        } catch (error) {
            console.error("Failed to fetch stories", error);
        }
    };

    // View Tracking
    useEffect(() => {
        if (selectedStoryIndex !== null && stories[selectedStoryIndex]) {
            const id = stories[selectedStoryIndex].id;
            // Fire and forget view increment
            fetch(`${API_URL}/stories/${id}/view`, { method: 'POST' }).catch(console.error);
        }
    }, [selectedStoryIndex]);

    // Progress Logic
    useEffect(() => {
        if (selectedStoryIndex === null || isPaused || !stories[selectedStoryIndex]) return;

        const currentStory = stories[selectedStoryIndex];
        let animationFrameId: number;
        let startTime: number;

        if (currentStory.type === 'image') {
            startTime = Date.now() - (progress / 100 * STORY_DURATION);

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const newProgress = (elapsed / STORY_DURATION) * 100;

                if (newProgress >= 100) {
                    handleNext();
                } else {
                    setProgress(newProgress);
                    animationFrameId = requestAnimationFrame(animate);
                }
            };
            animationFrameId = requestAnimationFrame(animate);
        }

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [selectedStoryIndex, isPaused, stories]);

    // Video Handling: Sync progress with video time
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !stories[selectedStoryIndex] || stories[selectedStoryIndex].type !== 'video') return;

        if (isPaused) {
            video.pause();
        } else {
            video.play().catch(() => { }); // catch play errors
        }

        const handleTimeUpdate = () => {
            if (video.duration) {
                setProgress((video.currentTime / video.duration) * 100);
            }
        };

        const handleEnded = () => {
            handleNext();
        };

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('ended', handleEnded);

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('ended', handleEnded);
        };
    }, [selectedStoryIndex, isPaused, stories]);

    const handleNext = () => {
        if (selectedStoryIndex !== null) {
            if (selectedStoryIndex < stories.length - 1) {
                setSelectedStoryIndex(selectedStoryIndex + 1);
                setProgress(0);
            } else {
                setSelectedStoryIndex(null);
                setProgress(0);
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
        <section className="py-8 bg-white border-b border-slate-100 overflow-hidden">
            <div className="container mx-auto">
                <div className="flex items-center gap-6 px-4 overflow-x-auto no-scrollbar py-2">
                    {stories.map((story, index) => (
                        <button
                            key={story.id}
                            onClick={() => {
                                setSelectedStoryIndex(index);
                                setProgress(0);
                                setIsPaused(false);
                            }}
                            className="flex flex-col items-center gap-2 group shrink-0 transition-transform hover:scale-105"
                        >
                            <div className="relative p-[3px] rounded-full bg-gradient-to-tr from-gold via-yellow-400 to-amber-500 shadow-sm">
                                <div className="p-[2px] bg-white rounded-full">
                                    {story.type === 'video' ? (
                                        <video src={story.url} className="w-20 h-20 rounded-full object-cover border border-slate-100" />
                                    ) : (
                                        <img
                                            src={story.url}
                                            alt={story.title}
                                            className="w-20 h-20 rounded-full object-cover border border-slate-100"
                                        />
                                    )}
                                </div>
                                {story.type === 'video' && (
                                    <div className="absolute bottom-0 right-0 bg-black/60 text-white p-1 rounded-full border-2 border-white backdrop-blur-sm">
                                        <Play size={10} fill="currentColor" />
                                    </div>
                                )}
                            </div>
                            {/* Label Removed as requested */}
                        </button>
                    ))}
                </div>
            </div>

            <Dialog
                open={selectedStoryIndex !== null}
                onOpenChange={(open) => !open && setSelectedStoryIndex(null)}
            >
                <DialogContent className="max-w-[420px] h-[85vh] p-0 overflow-hidden bg-black border-none rounded-[2rem] shadow-2xl">
                    {selectedStoryIndex !== null && stories[selectedStoryIndex] && (
                        <div className="relative h-full flex flex-col pointer-events-auto">
                            {/* Progress Bars */}
                            <div className="absolute top-4 left-4 right-4 z-50 flex gap-1.5 pointer-events-none">
                                {stories.map((_, i) => (
                                    <div key={i} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
                                        <div
                                            className="h-full bg-white transition-all duration-100 ease-linear"
                                            style={{
                                                width: i < selectedStoryIndex ? '100%' : i === selectedStoryIndex ? `${progress}%` : '0%'
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Header */}
                            <div className="absolute top-8 left-4 right-4 z-50 flex items-center justify-between text-white pointer-events-auto">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 overflow-hidden backdrop-blur-md">
                                        <img src="/images/logo-oficial.png" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="text-shadow-sm">
                                        <p className="text-sm font-bold leading-none">NOEH</p>
                                        <p className="text-[10px] opacity-80 mt-0.5">
                                            {new Date(stories[selectedStoryIndex].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsPaused(!isPaused); }}
                                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                    >
                                        {isPaused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedStoryIndex(null); }}
                                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>

                            {/* Media */}
                            <div
                                className="flex-1 bg-zinc-900 flex items-center justify-center overflow-hidden cursor-pointer"
                                onClick={() => setIsPaused(!isPaused)}
                            >
                                <AnimatePresence mode="wait">
                                    {stories[selectedStoryIndex].type === 'video' ? (
                                        <motion.video
                                            ref={videoRef}
                                            key={`video-${stories[selectedStoryIndex].id}`}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            src={stories[selectedStoryIndex].url}
                                            className="w-full h-full object-cover"
                                            playsInline
                                            onClick={(e) => e.stopPropagation()} // Let container handle pause toggle
                                        />
                                    ) : (
                                        <motion.img
                                            key={`img-${stories[selectedStoryIndex].id}`}
                                            initial={{ opacity: 0, scale: 1.05 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.4 }}
                                            src={stories[selectedStoryIndex].url}
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Tap Areas */}
                            <div className="absolute inset-y-0 w-full flex pointer-events-auto">
                                <button
                                    className="w-1/3 h-full z-40 outline-none"
                                    onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                                />
                                <div className="w-1/3 h-full z-30" onClick={() => setIsPaused(!isPaused)}></div>
                                <button
                                    className="w-1/3 h-full z-40 outline-none"
                                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                                />
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </section>
    );
};

export default Stories;
