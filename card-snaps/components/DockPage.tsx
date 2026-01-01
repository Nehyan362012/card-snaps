import React, { useState, useEffect } from 'react';
import { Anchor, Link as LinkIcon, Download, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { soundService } from '../services/soundService';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import { Deck, Note } from '../types';

interface DockPageProps {
    onDeckAdded?: (deck: Deck) => void;
    onNoteAdded?: (note: Note) => void;
}

export const DockPage: React.FC<DockPageProps> = ({ onDeckAdded, onNoteAdded }) => {
    const [inputValue, setInputValue] = useState('');
    const [status, setStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    
    // Animation States
    const [isAnimating, setIsAnimating] = useState(false);
    const [slideState, setSlideState] = useState<'hidden' | 'sliding' | 'center'>('hidden');
    const [cardFlipped, setCardFlipped] = useState(false);
    const [showContinue, setShowContinue] = useState(false);
    
    const [importedItem, setImportedItem] = useState<{ type: 'Deck' | 'Note', title: string } | null>(null);

    const handleImport = async () => {
        if (!inputValue.trim()) return;
        setStatus('importing');
        soundService.playClick();

        try {
            // Attempt to parse JSON
            const data = JSON.parse(inputValue);
            
            // Determine type and validate
            let type: 'Deck' | 'Note' | null = null;
            let title = '';

            if (data.cards && Array.isArray(data.cards)) {
                type = 'Deck';
                title = data.title || 'Untitled Deck';
                const newDeck: Deck = {
                    ...data,
                    id: crypto.randomUUID(), // Assign new ID to avoid conflicts
                    createdAt: Date.now()
                };
                const savedDeck = await api.createDeck(newDeck);
                if (onDeckAdded) onDeckAdded(savedDeck);
            } else if (data.content && typeof data.content === 'string') {
                type = 'Note';
                title = data.title || 'Untitled Note';
                const newNote: Note = {
                    ...data,
                    id: crypto.randomUUID(), // Assign new ID
                    createdAt: Date.now(),
                    lastModified: Date.now()
                };
                const savedNote = await api.saveNote(newNote);
                if (onNoteAdded) onNoteAdded(savedNote);
            } else {
                throw new Error("Invalid format: Not a Deck or Note.");
            }

            setImportedItem({ type, title });
            setStatus('success');
            setInputValue('');
            startAnimation();

        } catch (e) {
            setStatus('error');
            setErrorMsg("Invalid link code. Please check the text and try again.");
            soundService.playClick(); // Error sound
        }
    };

    const startAnimation = () => {
        setIsAnimating(true);
        // Stage 1: Slide In
        setTimeout(() => {
            soundService.playPop(); // Slide sound
            setSlideState('center');
        }, 100);
    };

    const handleCardClick = () => {
        if (slideState === 'center' && !cardFlipped) {
            soundService.playFlip();
            setCardFlipped(true);
            // Stage 2: Show Continue button after flip
            setTimeout(() => {
                setShowContinue(true);
            }, 600);
        }
    };

    const handleContinue = () => {
        soundService.playSuccess();
        confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 }
        });
        
        // Reset
        setTimeout(() => {
            setIsAnimating(false);
            setSlideState('hidden');
            setCardFlipped(false);
            setShowContinue(false);
            setImportedItem(null);
            setStatus('idle');
        }, 1000);
    };

    return (
        <div className="p-6 md:p-12 animate-fade-in-up min-h-screen relative">
            
            {/* Main Dock Content */}
            <div className="max-w-4xl mx-auto text-center mt-10">
                <div className="w-24 h-24 bg-gradient-to-tr from-sky-500 to-indigo-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-sky-500/30 animate-float">
                    <Anchor className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-5xl font-extrabold text-[var(--text-primary)] mb-4 tracking-tight">The Dock</h1>
                <p className="text-[var(--text-secondary)] text-xl mb-12">Import shared decks and notes instantly.</p>

                <div className="glass-panel p-8 md:p-12 rounded-[3rem] border border-[var(--glass-border)] shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-500"></div>
                    
                    <div className="relative z-10">
                        <label className="block text-left text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-3 pl-4">Paste Link Code</label>
                        <div className="relative mb-8">
                            <textarea 
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder='Paste JSON code here (e.g. {"title": "Math", "cards": [...]})'
                                className="w-full h-40 bg-[var(--input-bg)] glass-input border border-[var(--glass-border)] rounded-3xl p-6 text-[var(--text-primary)] outline-none resize-none font-mono text-sm transition-all focus:ring-2 focus:ring-sky-500/50 shadow-inner"
                            />
                            <div className="absolute bottom-4 right-4 p-2 bg-[var(--glass-bg)] rounded-xl border border-[var(--glass-border)]">
                                <LinkIcon className="w-5 h-5 text-[var(--text-tertiary)]" />
                            </div>
                        </div>

                        {status === 'error' && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 flex items-center gap-3 animate-shake">
                                <AlertCircle className="w-5 h-5" />
                                {errorMsg}
                            </div>
                        )}

                        <button 
                            onClick={handleImport}
                            disabled={!inputValue.trim() || status === 'importing'}
                            className="w-full py-5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100"
                        >
                            {status === 'importing' ? 'Docking...' : 'Import to Library'}
                            <Download className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* FULL SCREEN ANIMATION OVERLAY */}
            {isAnimating && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center overflow-hidden">
                    
                    {/* The Card */}
                    <div 
                        onClick={handleCardClick}
                        className={`w-80 h-[28rem] cursor-pointer perspective-1000 transition-all duration-1000 cubic-bezier(0.34, 1.56, 0.64, 1) absolute ${slideState === 'hidden' ? 'translate-x-[100vw] -translate-y-[100vh] rotate-12 scale-50' : 'translate-x-0 translate-y-0 rotate-0 scale-100'}`}
                    >
                        <div className={`w-full h-full duration-700 transform-style-3d transition-transform relative ${cardFlipped ? 'rotate-y-180' : ''}`}>
                            
                            {/* Front (Blank/Cover) */}
                            <div className="absolute w-full h-full backface-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 shadow-2xl border-4 border-white/20 flex flex-col items-center justify-center p-8">
                                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                    <Download className="w-10 h-10 text-white" />
                                </div>
                                <div className="text-white/50 font-bold uppercase tracking-widest text-sm animate-bounce">Click to Reveal</div>
                            </div>

                            {/* Back (Reveal Content) */}
                            <div className="absolute w-full h-full backface-hidden rounded-3xl bg-white rotate-y-180 flex flex-col items-center justify-center p-8 text-center shadow-2xl border-4 border-indigo-500">
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-sky-500 to-indigo-500"></div>
                                <div className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-4 bg-indigo-50 px-3 py-1 rounded-full">New {importedItem?.type} Saved</div>
                                <h2 className="text-3xl font-black text-slate-800 mb-6 leading-tight break-words w-full line-clamp-4">
                                    {importedItem?.title}
                                </h2>
                                <div className="w-12 h-1 bg-slate-200 rounded-full"></div>
                            </div>
                        </div>
                    </div>

                    {/* Continue Button */}
                    <div className={`absolute bottom-20 transition-all duration-700 ${showContinue ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        <button 
                            onClick={handleContinue}
                            className="px-10 py-4 bg-white text-indigo-600 font-extrabold rounded-full shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-110 transition-transform flex items-center gap-2"
                        >
                            Continue <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>

                </div>
            )}
        </div>
    );
};