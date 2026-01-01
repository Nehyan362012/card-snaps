import React, { useState, useRef } from 'react';
import { Upload, FileText, Image, ArrowRight, Loader2, Check, Sparkles, X, Video, Music, File } from 'lucide-react';
import { generateDeckFromContent } from '../services/geminiService';
import { soundService } from '../services/soundService';
import { Deck, Card, CARD_COLORS } from '../types';

interface AIStudioProps {
    onSaveDeck: (deck: Deck, fromAI?: boolean) => void;
    onCancel: () => void;
}

type Step = 1 | 2 | 3 | 4;

export const AIStudio: React.FC<AIStudioProps> = ({ onSaveDeck, onCancel }) => {
    const [step, setStep] = useState<Step>(1);
    const [isLoading, setIsLoading] = useState(false);
    
    // Upload Data
    const [fileData, setFileData] = useState<string | null>(null); // Base64
    const [mimeType, setMimeType] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [textContent, setTextContent] = useState<string>('');
    
    // Configuration
    const [cardCount, setCardCount] = useState(10);
    const [focus, setFocus] = useState('General Overview');
    const [deckTitle, setDeckTitle] = useState('');
    
    // Result
    const [generatedDeck, setGeneratedDeck] = useState<{title: string, description: string, cards: Omit<Card, 'id'|'color'>[]} | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        soundService.playPop();
        setFileName(file.name);
        
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            // Extract base64 and mime type
            if (file.type === 'text/plain') {
                setTextContent(atob(result.split(',')[1])); 
            } else {
                // For Images, Videos, Audio, PDF
                const base64Content = result.split(',')[1];
                setFileData(base64Content);
                setMimeType(file.type);
            }
        };
        reader.readAsDataURL(file);
    };

    const getFileIcon = () => {
        if (!mimeType) return <FileText className="w-10 h-10 text-sky-400" />;
        if (mimeType.startsWith('image/')) return <Image className="w-10 h-10 text-sky-400" />;
        if (mimeType.startsWith('video/')) return <Video className="w-10 h-10 text-sky-400" />;
        if (mimeType.startsWith('audio/')) return <Music className="w-10 h-10 text-sky-400" />;
        return <File className="w-10 h-10 text-sky-400" />;
    };

    const handleGenerate = async () => {
        setIsLoading(true);
        soundService.playClick();
        
        try {
            const instructions = `Generate ${cardCount} cards. Focus on: ${focus}. Create a Title for the deck if one isn't implied.`;
            const result = await generateDeckFromContent(fileData, mimeType, textContent || null, instructions);
            setGeneratedDeck(result);
            setDeckTitle(result.title);
            setStep(3);
            soundService.playSuccess();
        } catch (e: any) {
            alert(e.message || "Failed to generate deck.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinalize = () => {
        if (!generatedDeck) return;
        
        // Show saving feedback
        setIsLoading(true); // Reuse loading for button state
        soundService.playSuccess();
        
        setTimeout(() => {
             const newDeck: Deck = {
                id: crypto.randomUUID(),
                title: deckTitle,
                description: generatedDeck.description,
                createdAt: Date.now(),
                cards: generatedDeck.cards.map(c => ({
                    id: crypto.randomUUID(),
                    front: c.front,
                    back: c.back,
                    color: CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)]
                }))
            };
            
            onSaveDeck(newDeck, true);
        }, 500);
    };

    const StepIndicator = () => (
        <div className="flex items-center justify-center gap-4 mb-12">
            {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 ${step >= s ? 'bg-sky-500 text-white shadow-[0_0_15px_rgba(14,165,233,0.5)]' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                        {step > s ? <Check className="w-5 h-5" /> : s === 1 ? 'ADD' : s === 2 ? 'CFG' : s === 3 ? 'REV' : 'SAV'}
                    </div>
                    {s !== 4 && (
                        <div className={`w-12 h-1 rounded-full mx-2 transition-all duration-500 ${step > s ? 'bg-sky-500' : 'bg-slate-800'}`}></div>
                    )}
                </div>
            ))}
        </div>
    );

    return (
        <div className="min-h-full flex flex-col items-center justify-center p-4 animate-fade-in-up max-w-5xl mx-auto py-10">
            <div className="text-center mb-10">
                <h1 className="text-5xl font-extrabold text-[var(--text-primary)] mb-2 tracking-tight">AI Studio</h1>
                <p className="text-[var(--text-secondary)] font-medium tracking-widest text-xs uppercase">Create Study Tools With One Tap</p>
            </div>

            <StepIndicator />

            <div className="w-full glass-panel rounded-[3rem] p-8 md:p-12 relative overflow-hidden shadow-2xl border border-[var(--glass-border)]">
                {/* Cancel Button */}
                <button onClick={onCancel} className="absolute top-8 right-8 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                    <X className="w-6 h-6" />
                </button>

                {step === 1 && (
                    <div className="animate-pop-in">
                        <div 
                            className="border-2 border-dashed border-[var(--glass-border)] rounded-[2rem] h-80 flex flex-col items-center justify-center group hover:border-sky-500/50 hover:bg-sky-500/5 transition-all cursor-pointer relative bg-[var(--input-bg)]"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                onChange={handleFileUpload}
                                accept="image/*,video/*,audio/*,.txt,.pdf" 
                            />
                            
                            {fileName ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-20 h-20 rounded-2xl bg-sky-500/20 flex items-center justify-center animate-float">
                                        {getFileIcon()}
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[var(--text-primary)] font-bold text-lg">{fileName}</p>
                                        <p className="text-sky-400 text-sm mt-1">Ready to process</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="w-20 h-20 rounded-full bg-[var(--glass-bg)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg border border-[var(--glass-border)]">
                                        <Upload className="w-8 h-8 text-[var(--text-secondary)] group-hover:text-sky-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Upload Content</h3>
                                    <p className="text-[var(--text-secondary)]">Videos, Audio, Images, or Notes</p>
                                </>
                            )}
                        </div>
                        
                        <div className="mt-8 flex justify-center">
                             <button 
                                disabled={!fileName && !textContent}
                                onClick={() => { soundService.playClick(); setStep(2); }}
                                className="w-full md:w-auto px-12 py-4 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(14,165,233,0.3)] hover:shadow-[0_0_50px_rgba(14,165,233,0.5)] flex items-center justify-center gap-2"
                             >
                                Go To Next Step <ArrowRight className="w-5 h-5" />
                             </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-slide-in-right max-w-2xl mx-auto">
                        <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-8 text-center">Refine Your Request</h3>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Card Count</label>
                                <div className="grid grid-cols-4 gap-4">
                                    {[5, 10, 25, 50].map(num => (
                                        <button 
                                            key={num}
                                            onClick={() => setCardCount(num)}
                                            className={`py-3 rounded-xl border font-bold transition-all ${cardCount === num ? 'bg-sky-500 border-sky-500 text-white' : 'bg-[var(--input-bg)] border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-slate-500'}`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Focus Area</label>
                                <input 
                                    type="text" 
                                    value={focus}
                                    onChange={(e) => setFocus(e.target.value)}
                                    className="w-full bg-[var(--input-bg)] glass-input border border-[var(--glass-border)] rounded-xl px-4 py-4 text-[var(--text-primary)] outline-none focus:border-sky-500 transition-colors"
                                    placeholder="e.g. Dates, Definitions, Key Concepts"
                                />
                            </div>
                        </div>

                        <div className="mt-10 flex justify-center">
                             <button 
                                onClick={handleGenerate}
                                disabled={isLoading}
                                className="w-full py-4 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-3"
                             >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                {isLoading ? 'Magic in progress...' : 'Generate Deck'}
                             </button>
                        </div>
                    </div>
                )}

                {step === 3 && generatedDeck && (
                     <div className="animate-fade-in-up h-[500px] flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-[var(--text-primary)]">Preview</h3>
                            <div className="bg-sky-500/20 text-sky-400 px-3 py-1 rounded-lg text-sm font-bold border border-sky-500/30">
                                {generatedDeck.cards.length} Cards Generated
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Deck Title</label>
                            <input 
                                type="text" 
                                value={deckTitle}
                                onChange={(e) => setDeckTitle(e.target.value)}
                                className="w-full bg-[var(--input-bg)] glass-input border border-[var(--glass-border)] rounded-xl px-4 py-3 text-[var(--text-primary)] font-bold text-lg outline-none focus:border-sky-500 transition-colors"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                            {generatedDeck.cards.map((card, idx) => (
                                <div key={idx} className="p-4 bg-[var(--input-bg)] rounded-xl border border-[var(--glass-border)] flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-[var(--text-tertiary)] uppercase font-bold mb-1">Front</p>
                                            <p className="text-[var(--text-primary)] text-sm">{card.front}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-[var(--text-tertiary)] uppercase font-bold mb-1">Back</p>
                                            <p className="text-[var(--text-primary)] text-sm">{card.back}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button 
                                onClick={handleFinalize}
                                disabled={isLoading}
                                className="px-10 py-4 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-2xl transition-all shadow-lg hover:scale-105 flex items-center gap-2 disabled:opacity-70"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                {isLoading ? 'Saving...' : 'Save to Library'}
                            </button>
                        </div>
                     </div>
                )}
            </div>
        </div>
    );
};