import React, { useState, useEffect } from 'react';
import { SNAP_CARDS_DATA, CRACK_CARDS_DATA, SnapCard, UserStats } from '../types';
import { Lock, Eye, Sparkles, Shield, Zap, Flame, Check, RotateCcw, Ghost, Star, Feather, EyeOff } from 'lucide-react';
import { soundService } from '../services/soundService';
import confetti from 'canvas-confetti';

interface SnapCardsPageProps {
    stats: UserStats;
    onClaimCard: (cardId: string) => void;
}

export const SnapCardsPage: React.FC<SnapCardsPageProps> = ({ stats, onClaimCard }) => {
    const [claimingId, setClaimingId] = useState<string | null>(null);
    const [claimStep, setClaimStep] = useState(0); // 0: None, 1: Slide In, 2: Center, 3: Flip

    const handleClaim = (card: SnapCard) => {
        setClaimingId(card.id);
        
        if (card.type === 'crack') {
            // Simple animation for Crack Cards
            soundService.playSuccess();
            confetti({
                particleCount: 30,
                spread: 50,
                origin: { y: 0.6 },
                colors: ['#94a3b8', '#cbd5e1']
            });
            setTimeout(() => {
                onClaimCard(card.id);
                setClaimingId(null);
            }, 1000);
        } else {
            // SPECTACULAR ANIMATION for Snap Cards
            // Step 1: Init (Hidden off screen)
            setClaimStep(1);
            
            // Step 2: Slide to Center
            setTimeout(() => {
                soundService.playPop();
                setClaimStep(2);
            }, 100);

            // Step 3: Flip & Confetti
            setTimeout(() => {
                soundService.playFlip();
                setClaimStep(3);
                soundService.playSuccess();
                confetti({
                    particleCount: 150,
                    spread: 120,
                    origin: { y: 0.6 },
                    colors: ['#6366f1', '#ec4899', '#10b981', '#f59e0b'],
                    shapes: card.icon === 'Star' ? ['star'] : ['circle']
                });
            }, 800);

            // Step 4: Finish
            setTimeout(() => {
                onClaimCard(card.id);
                setClaimingId(null);
                setClaimStep(0);
            }, 2500);
        }
    };

    const getIcon = (iconName: string) => {
        switch(iconName) {
            case 'Eye': return <Eye className="w-8 h-8" />;
            case 'Sparkles': return <Sparkles className="w-8 h-8" />;
            case 'Shield': return <Shield className="w-8 h-8" />;
            case 'Zap': return <Zap className="w-8 h-8" />;
            case 'Flame': return <Flame className="w-8 h-8" />;
            case 'RotateCcw': return <RotateCcw className="w-8 h-8" />;
            case 'Ghost': return <Ghost className="w-8 h-8" />;
            case 'Star': return <Star className="w-8 h-8" />;
            case 'Feather': return <Feather className="w-8 h-8" />;
            case 'EyeOff': return <EyeOff className="w-8 h-8" />;
            default: return <Sparkles className="w-8 h-8" />;
        }
    };

    const CardGrid = ({ cards, title, subtitle }: { cards: SnapCard[], title: string, subtitle: string }) => (
        <section className="mb-16">
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2 flex items-center gap-3">
                {title}
            </h2>
            <p className="text-[var(--text-secondary)] mb-8">{subtitle}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 perspective-1000">
                {cards.map((card, index) => {
                    const status = stats.inventory?.[card.id] || 'locked';
                    const isReady = status === 'ready';
                    const isUnlocked = status === 'unlocked';
                    const isLocked = status === 'locked';
                    const isCrack = card.type === 'crack';

                    return (
                        <div 
                            key={card.id}
                            style={{ animationDelay: `${index * 50}ms` }}
                            className={`relative h-80 rounded-[2rem] transition-all duration-500 transform-style-3d group ${isLocked ? 'opacity-60 grayscale' : ''} ${!isLocked ? 'hover:-translate-y-2' : ''}`}
                        >
                            <div className={`absolute inset-0 rounded-[2rem] border-2 flex flex-col items-center justify-between p-6 shadow-xl bg-[var(--input-bg)] backdrop-blur-xl transition-all ${
                                isLocked 
                                ? 'border-slate-700' 
                                : isUnlocked || isReady
                                    ? `border-${card.color}-500 shadow-[0_0_20px_rgba(var(--${card.color}-500-rgb),0.2)]` 
                                    : `border-${card.color}-500/30`
                            } ${isCrack ? 'border-dashed' : ''}`}>
                                
                                {/* Status Badge */}
                                <div className="absolute top-4 right-4">
                                    {isReady ? (
                                        <div className="bg-emerald-500 text-white p-1 rounded-full shadow-lg"><Check className="w-3 h-3"/></div>
                                    ) : isLocked ? (
                                        <div className="bg-slate-700 text-slate-400 p-1 rounded-full"><Lock className="w-3 h-3"/></div>
                                    ) : (
                                        <div className="bg-amber-400 text-white p-1 rounded-full animate-bounce"><Sparkles className="w-3 h-3"/></div>
                                    )}
                                </div>

                                {/* Icon Area */}
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-2 mt-4 transition-all duration-500 ${isLocked ? 'bg-slate-800 text-slate-500' : `bg-gradient-to-br from-${card.color}-400 to-${card.color}-600 text-white shadow-lg shadow-${card.color}-500/40 group-hover:scale-110`}`}>
                                    {getIcon(card.icon)}
                                </div>

                                {/* Content */}
                                <div className="text-center w-full">
                                    <h3 className={`text-xl font-black mb-1 ${isLocked ? 'text-slate-500' : 'text-[var(--text-primary)]'}`}>{card.name}</h3>
                                    <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-2">{card.perk.replace(/_/g, ' ')}</p>
                                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4 font-medium min-h-[3em]">{card.description}</p>
                                </div>

                                {/* Action / Condition */}
                                <div className="w-full mt-auto">
                                    {isReady ? (
                                        <div className="w-full py-2 bg-[var(--glass-bg)] border border-emerald-500/30 text-emerald-500 font-bold rounded-xl text-center uppercase text-xs tracking-wide">
                                            Ready
                                        </div>
                                    ) : isUnlocked ? (
                                        <button 
                                            onClick={() => handleClaim(card)}
                                            className={`w-full py-2 bg-gradient-to-r from-${card.color}-500 to-${card.color}-600 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-transform animate-pulse text-xs uppercase`}
                                        >
                                            CLAIM
                                        </button>
                                    ) : (
                                        <div className="bg-slate-900/30 p-2 rounded-xl border border-white/5">
                                            <p className="text-[9px] text-slate-400 uppercase font-bold text-center mb-0.5">To Unlock:</p>
                                            <p className="text-[10px] text-slate-300 text-center font-medium leading-tight">{card.condition}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );

    const activeCard = claimingId ? [...SNAP_CARDS_DATA, ...CRACK_CARDS_DATA].find(c => c.id === claimingId) : null;

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-12 animate-fade-in-up pb-32">
            <div className="text-center mb-10 md:mb-16">
                <h1 className="text-4xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 mb-6 tracking-tighter">
                    Inventory
                </h1>
                <p className="text-[var(--text-secondary)] text-lg md:text-2xl font-medium max-w-2xl mx-auto">
                    Manage your collection of power-ups.
                </p>
            </div>

            <CardGrid cards={SNAP_CARDS_DATA} title="Snap Cards" subtitle="Premium perks with powerful effects." />
            <div className="border-t border-[var(--glass-border)] my-12"></div>
            <CardGrid cards={CRACK_CARDS_DATA} title="Crack Cards" subtitle="Standard perks. Easy to find, reliable to use." />
            
            {/* FULL SCREEN ANIMATION FOR SNAP CARDS */}
            {claimingId && activeCard && activeCard.type === 'snap' && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center overflow-hidden">
                    <div 
                        className={`w-[85vw] max-w-xs md:w-80 h-[55vh] md:h-[28rem] perspective-1000 transition-all duration-700 ease-out absolute ${
                            claimStep === 1 
                                ? 'translate-x-[120vw] -translate-y-[120vh] rotate-45 scale-50' 
                                : 'translate-x-0 translate-y-0 rotate-0 scale-100'
                        }`}
                    >
                        <div className={`w-full h-full duration-700 transform-style-3d transition-transform relative ${claimStep === 3 ? 'rotate-y-180' : ''}`}>
                            
                            {/* Front (Cover/Back of card visual) */}
                            <div className="absolute w-full h-full backface-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-800 shadow-[0_0_50px_rgba(99,102,241,0.6)] border-4 border-white/20 flex flex-col items-center justify-center p-8">
                                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                    <Sparkles className="w-12 h-12 text-white" />
                                </div>
                                <div className="text-white/80 font-black uppercase tracking-[0.2em] text-lg">Snap Card</div>
                            </div>

                            {/* Back (Reveal Content - Actual Front) */}
                            <div className="absolute w-full h-full backface-hidden rounded-3xl bg-white rotate-y-180 flex flex-col items-center justify-center p-8 text-center shadow-[0_0_100px_rgba(255,255,255,0.8)] border-4 border-indigo-500 relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-${activeCard.color}-400 to-${activeCard.color}-600`}></div>
                                
                                <div className={`w-28 h-28 rounded-full bg-gradient-to-br from-${activeCard.color}-400 to-${activeCard.color}-600 flex items-center justify-center mb-6 shadow-xl text-white animate-float`}>
                                    {getIcon(activeCard.icon)}
                                </div>
                                
                                <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 leading-tight tracking-tight">
                                    {activeCard.name}
                                </h2>
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-6">{activeCard.perk.replace(/_/g, ' ')}</p>
                                
                                <div className="bg-slate-100 p-4 rounded-xl w-full">
                                    <p className="text-slate-600 font-medium leading-relaxed text-xs md:text-sm">{activeCard.description}</p>
                                </div>
                                
                                <div className="mt-6 text-emerald-500 font-black text-xl animate-pulse">UNLOCKED!</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Simple Overlay for Crack Cards */}
            {claimingId && activeCard && activeCard.type === 'crack' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="animate-pop-in flex flex-col items-center">
                        <div className="text-6xl mb-4 animate-bounce">🔓</div>
                        <h2 className="text-3xl font-bold text-white mb-2">Crack Card Ready</h2>
                    </div>
                </div>
            )}
        </div>
    );
};