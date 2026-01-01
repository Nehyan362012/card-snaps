import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Deck, Card as CardType } from '../types';
import { Card } from './Card';
import { soundService } from '../services/soundService';
import { calculateReview, SRSRating } from '../services/srsService';
import { ArrowLeft, RotateCcw, Check, X, Clock, Ghost, Send } from 'lucide-react';
import confetti from 'canvas-confetti';

interface StudyModeProps {
  deck: Deck;
  onExit: () => void;
  onUpdateDeck: (updatedDeck: Deck) => void;
  mode: 'standard' | 'srs';
}

export const StudyMode: React.FC<StudyModeProps> = ({ deck, onExit, onUpdateDeck, mode }) => {
  // If SRS mode, filter for due cards first
  const [studyCards, setStudyCards] = useState<CardType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [finished, setFinished] = useState(false);
  
  // Ghost Mode State
  const [ghostMode, setGhostMode] = useState(false);
  const [ghostInput, setGhostInput] = useState('');
  const [ghostFeedback, setGhostFeedback] = useState<'correct' | 'wrong' | null>(null);
  const ghostCardRef = useRef<CardType | null>(null);

  useEffect(() => {
    if (mode === 'srs') {
      const now = Date.now();
      const due = deck.cards.filter(c => !c.srs || c.srs.dueDate <= now);
      setStudyCards(due.length > 0 ? due : []);
    } else {
      setStudyCards(deck.cards);
    }
  }, [deck, mode]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (finished || studyCards.length === 0) return;
      
      // If in ghost mode with input focused, don't hijack keys
      if (ghostMode && document.activeElement?.tagName === 'INPUT') {
          if(e.key === 'Escape') skipGhost();
          return;
      }

      if (e.code === 'Space') {
         // Allow space to flip even in ghost mode
         setIsFlipped(prev => {
             soundService.playFlip();
             return !prev;
         });
      } else if (mode === 'standard' && !ghostMode) {
        if (e.code === 'ArrowRight') nextCard('right');
        if (e.code === 'ArrowLeft') nextCard('left');
      }
      // Numeric keys for SRS
      if (mode === 'srs' && isFlipped) {
        if (e.key === '1') handleSRSReview('again');
        if (e.key === '2') handleSRSReview('hard');
        if (e.key === '3') handleSRSReview('good');
        if (e.key === '4') handleSRSReview('easy');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, finished, isFlipped, studyCards.length, mode, ghostMode]);

  const nextCard = useCallback((dir: 'left' | 'right' = 'right') => {
    if (finished) return;

    soundService.playClick();
    setDirection(dir);
    
    // Check for Ghost Mode Trigger (20% chance on correct answer in Standard Mode)
    const currentCard = studyCards[currentIndex];
    const triggerGhost = mode === 'standard' && dir === 'right' && Math.random() < 0.2;

    setTimeout(() => {
        if (triggerGhost) {
            // Re-insert same card, activate ghost mode
            setGhostMode(true);
            ghostCardRef.current = currentCard;
            setDirection(null);
            setIsFlipped(false); // Reset to front
            setGhostInput('');
            setGhostFeedback(null);
            soundService.playPop(); // Surprise sound
        } else {
            if (currentIndex < studyCards.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setIsFlipped(false);
                setDirection(null);
            } else {
                finishSession();
            }
        }
    }, 300);
  }, [currentIndex, studyCards.length, finished, mode, studyCards]);

  const handleGhostSubmit = () => {
      if (!ghostCardRef.current || !ghostInput.trim()) return;
      
      const correct = ghostCardRef.current.back.toLowerCase().trim();
      const user = ghostInput.toLowerCase().trim();
      
      // Simple fuzzy check or direct match
      if (user === correct || (correct.includes(user) && user.length > 3)) {
          soundService.playSuccess();
          setGhostFeedback('correct');
          setTimeout(() => {
              setGhostMode(false);
              setGhostFeedback(null);
              // Move on
              if (currentIndex < studyCards.length - 1) {
                  setCurrentIndex(prev => prev + 1);
                  setIsFlipped(false);
              } else {
                  finishSession();
              }
          }, 1500);
      } else {
          soundService.playClick(); // Error sound
          setGhostFeedback('wrong');
      }
  };

  const skipGhost = () => {
      setGhostMode(false);
      if (currentIndex < studyCards.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setIsFlipped(false);
      } else {
          finishSession();
      }
  };

  const handleSRSReview = (rating: SRSRating) => {
    soundService.playClick();
    
    // Update the card logic
    const currentCard = studyCards[currentIndex];
    const updatedCard = calculateReview(currentCard, rating);
    
    // Update the actual deck data immediately
    const updatedDeckCards = deck.cards.map(c => c.id === updatedCard.id ? updatedCard : c);
    onUpdateDeck({ ...deck, cards: updatedDeckCards });

    setDirection('right');
    
    setTimeout(() => {
        if (currentIndex < studyCards.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setIsFlipped(false);
            setDirection(null);
        } else {
            finishSession();
        }
    }, 300);
  };

  const finishSession = () => {
    setFinished(true);
    soundService.playSuccess();
    confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b']
    });
  };

  const restart = () => {
      setCurrentIndex(0);
      setIsFlipped(false);
      setFinished(false);
      setDirection(null);
      setGhostMode(false);
      soundService.playPop();
  };

  if (studyCards.length === 0 && mode === 'srs') {
    return (
        <div className="flex flex-col items-center justify-center h-full animate-fade-in-up text-center p-8">
            <div className="w-28 h-28 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(99,102,241,0.2)] animate-pulse-soft border border-indigo-500/20">
                <Check className="w-14 h-14 text-indigo-400" />
            </div>
            <h2 className="text-4xl font-extrabold text-[var(--text-primary)] mb-4">All Caught Up!</h2>
            <p className="text-[var(--text-secondary)] mb-8 max-w-md text-lg">No cards are due for review in this deck right now. Great job keeping up!</p>
            <button 
                onClick={onExit}
                className="px-8 py-3.5 rounded-xl bg-[var(--input-bg)] border border-[var(--glass-border)] text-[var(--text-primary)] font-bold hover:bg-[var(--glass-bg)] transition-all hover:scale-105"
            >
                Back to Home
            </button>
        </div>
    );
  }

  if (finished) {
      return (
          <div className="flex flex-col items-center justify-center h-full animate-scale-in text-center p-8">
              <div className="w-28 h-28 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/40 animate-float">
                  <Check className="w-14 h-14 text-white" />
              </div>
              <h2 className="text-5xl font-extrabold text-[var(--text-primary)] mb-4">Session Complete!</h2>
              <p className="text-[var(--text-secondary)] mb-10 max-w-md text-lg">
                {mode === 'srs' 
                  ? "You've reviewed all due cards. Come back later to strengthen your memory!" 
                  : `You've mastered all ${studyCards.length} cards in this session.`}
              </p>
              
              <div className="flex gap-5">
                  <button 
                    onClick={onExit}
                    className="px-8 py-3.5 rounded-xl bg-[var(--input-bg)] border border-[var(--glass-border)] text-[var(--text-primary)] font-bold hover:bg-[var(--glass-bg)] transition-colors"
                  >
                      Back to Home
                  </button>
                  {mode === 'standard' && (
                    <button 
                        onClick={restart}
                        className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 hover:-translate-y-1"
                    >
                        Study Again
                    </button>
                  )}
              </div>
          </div>
      );
  }

  // Determine cards to render for the stack effect
  const visibleCards = studyCards.slice(currentIndex, currentIndex + 3);

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto p-4 md:p-8 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 z-50">
            <button 
                onClick={() => { soundService.playClick(); onExit(); }}
                className="glass-button p-3 rounded-full text-[var(--text-primary)]"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="flex flex-col items-center">
                 <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-wide truncate max-w-[200px]">{deck.title}</h2>
                 <div className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-widest flex items-center gap-2 mt-1 bg-[var(--input-bg)] px-3 py-1 rounded-full backdrop-blur-sm border border-[var(--glass-border)]">
                     {mode === 'srs' && <Clock className="w-3 h-3 text-indigo-400" />}
                     Card {currentIndex + 1} / {studyCards.length}
                 </div>
            </div>

            <button 
                onClick={restart}
                disabled={mode === 'srs'}
                className={`glass-button p-3 rounded-full text-[var(--text-primary)] ${mode === 'srs' ? 'opacity-0 pointer-events-none' : ''}`}
            >
                <RotateCcw className="w-5 h-5" />
            </button>
        </div>

        {/* Stack Area */}
        <div className="flex-1 flex items-center justify-center relative perspective-1000 mb-8 md:mb-0">
            {visibleCards.map((card, offset) => {
                const isCurrent = offset === 0;
                const zIndex = 30 - offset * 10;
                const scale = 1 - offset * 0.05;
                const translateY = offset * 24; 
                const opacity = 1 - offset * 0.2;
                
                let transformClass = '';
                if (isCurrent && direction === 'right') transformClass = 'translate-x-[150%] rotate-[20deg] opacity-0';
                if (isCurrent && direction === 'left') transformClass = '-translate-x-[150%] -rotate-[20deg] opacity-0';
                
                return (
                    <div
                        key={card.id}
                        className={`absolute w-[85vw] max-w-sm md:max-w-md aspect-[3/4] md:aspect-[4/3] h-auto transition-all duration-500 cubic-bezier(0.23, 1, 0.32, 1) ${transformClass} ${isCurrent ? 'animate-float' : ''}`}
                        style={{
                            zIndex,
                            transform: `scale(${scale}) translateY(${translateY}px) ${isCurrent && direction ? '' : ''}`,
                            opacity
                        }}
                    >
                         {/* GHOST CARD UI */}
                         {ghostMode && isCurrent ? (
                             <div 
                                onClick={() => { soundService.playFlip(); setIsFlipped(!isFlipped); }}
                                className={`relative w-full h-full cursor-pointer duration-700 transform-style-3d transition-transform cubic-bezier(0.4, 0, 0.2, 1) shadow-2xl rounded-3xl border-4 border-indigo-500/50 ${isFlipped ? 'rotate-y-180' : ''}`}
                             >
                                {/* Front (Same as normal) */}
                                <div className={`absolute w-full h-full backface-hidden rounded-3xl flex flex-col items-center justify-center p-8 text-center select-none ${card.color} text-slate-800`}>
                                    <div className="absolute top-2 right-2 p-2 bg-indigo-600 rounded-full text-white animate-pulse">
                                        <Ghost className="w-6 h-6" />
                                    </div>
                                    <div className="text-3xl font-bold leading-relaxed drop-shadow-sm text-slate-800">{card.front}</div>
                                    <div className="absolute bottom-8 text-[10px] font-bold uppercase tracking-widest opacity-60 flex items-center gap-2">
                                        <span className="w-1 h-1 bg-slate-800 rounded-full animate-pulse"></span>
                                        Tap to Answer
                                        <span className="w-1 h-1 bg-slate-800 rounded-full animate-pulse"></span>
                                    </div>
                                </div>

                                {/* Back (Ghost Input) - Now styled like a normal card back */}
                                <div 
                                    className={`absolute w-full h-full backface-hidden rounded-3xl rotate-y-180 flex flex-col items-center justify-center p-8 text-center bg-slate-800 text-white shadow-[inset_0_2px_20px_rgba(0,0,0,0.3)] border border-white/10`}
                                    onClick={(e) => e.stopPropagation()} // Prevent accidental flip when interacting with input
                                >
                                    {/* Normal card back background effects */}
                                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none rounded-3xl"></div>
                                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent rounded-3xl pointer-events-none"></div>

                                    {ghostFeedback === 'correct' ? (
                                        <div className="animate-pop-in flex flex-col items-center relative z-10">
                                            <Check className="w-16 h-16 text-emerald-400 mb-4" />
                                            <h3 className="text-2xl font-bold text-white">Correct!</h3>
                                            <p className="text-slate-400 mt-2">{card.back}</p>
                                        </div>
                                    ) : ghostFeedback === 'wrong' ? (
                                        <div className="animate-shake flex flex-col items-center w-full relative z-10">
                                            <X className="w-16 h-16 text-red-400 mb-4" />
                                            <h3 className="text-xl font-bold text-white mb-2">Not quite...</h3>
                                            <p className="text-slate-300 mb-6 bg-white/10 p-3 rounded-lg w-full font-bold">{card.back}</p>
                                            <button onClick={skipGhost} className="px-6 py-2 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform">Continue</button>
                                        </div>
                                    ) : (
                                        <div className="w-full flex flex-col items-center relative z-10">
                                            <div className="absolute top-[-30px] right-0 p-1 opacity-50"><Ghost className="w-5 h-5 text-indigo-400" /></div>
                                            <div className="absolute top-[-40px] left-0 text-[10px] font-bold opacity-50 uppercase tracking-[0.2em] text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full">Challenge</div>
                                            
                                            <h3 className="text-xl font-bold mb-6 text-slate-100">Type the Answer</h3>
                                            <input 
                                                autoFocus
                                                value={ghostInput}
                                                onChange={(e) => setGhostInput(e.target.value)}
                                                className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-4 text-center text-lg text-white mb-4 focus:border-indigo-500 outline-none transition-colors"
                                                placeholder="What's the answer?"
                                                onKeyDown={(e) => e.key === 'Enter' && handleGhostSubmit()}
                                            />
                                            <button 
                                                onClick={handleGhostSubmit}
                                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20"
                                            >
                                                Submit <Send className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                             </div>
                         ) : (
                             <Card 
                                card={card}
                                isFlipped={isCurrent ? isFlipped : false}
                                onFlip={isCurrent ? () => setIsFlipped(!isFlipped) : () => {}}
                                disabled={!isCurrent}
                                className={!isCurrent ? 'pointer-events-none brightness-[0.6] grayscale-[0.5]' : 'shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]'}
                             />
                         )}
                    </div>
                );
            })}
            
            {visibleCards.length === 0 && (
                <div className="text-[var(--text-tertiary)] animate-pulse">Loading...</div>
            )}
        </div>

        {/* Controls */}
        <div className="mt-auto md:mt-8 mb-4 z-50 min-h-[100px] flex items-center justify-center">
            {ghostMode ? (
                <div className="text-[var(--text-primary)] font-bold animate-pulse">Ghost Challenge Active</div>
            ) : !isFlipped ? (
                <div className="flex justify-center animate-fade-in-up w-full px-4">
                    <button
                        onClick={() => {
                            soundService.playFlip();
                            setIsFlipped(true);
                        }}
                        className="w-full md:w-auto px-10 py-4 bg-[var(--input-bg)] hover:bg-[var(--card-hover)] backdrop-blur-md border border-[var(--glass-border)] text-[var(--text-primary)] rounded-2xl md:rounded-full font-bold shadow-xl transition-all hover:scale-105 active:scale-95 uppercase tracking-wider text-sm"
                    >
                        Reveal Answer
                    </button>
                </div>
            ) : (
                <div className="animate-scale-in w-full px-4">
                    {mode === 'standard' ? (
                        <div className="flex items-center justify-center gap-8 md:gap-12">
                             <div className="flex flex-col items-center gap-2">
                                <button 
                                    onClick={() => nextCard('left')}
                                    className="w-16 h-16 rounded-full bg-[var(--input-bg)] border-2 border-slate-600 text-slate-400 hover:text-white hover:border-red-500 hover:bg-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all flex items-center justify-center"
                                >
                                    <X className="w-8 h-8" />
                                </button>
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Missed</span>
                             </div>

                             <div className="flex flex-col items-center gap-2">
                                <button 
                                    onClick={() => nextCard('right')}
                                    className="w-16 h-16 rounded-full bg-[var(--input-bg)] border-2 border-slate-600 text-slate-400 hover:text-white hover:border-emerald-500 hover:bg-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center"
                                >
                                    <Check className="w-8 h-8" />
                                </button>
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Got it</span>
                             </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
                            <button onClick={() => handleSRSReview('again')} className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-[var(--input-bg)] border border-slate-700 hover:bg-red-500/10 hover:border-red-500 transition-all hover:-translate-y-1">
                                <span className="text-sm text-red-400 font-extrabold uppercase mb-1 group-hover:text-red-300">Again</span>
                                <span className="text-xs text-slate-500 group-hover:text-slate-300 font-mono">&lt; 1min</span>
                            </button>
                            <button onClick={() => handleSRSReview('hard')} className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-[var(--input-bg)] border border-slate-700 hover:bg-orange-500/10 hover:border-orange-500 transition-all hover:-translate-y-1">
                                <span className="text-sm text-orange-400 font-extrabold uppercase mb-1 group-hover:text-orange-300">Hard</span>
                                <span className="text-xs text-slate-500 group-hover:text-slate-300 font-mono">~1d</span>
                            </button>
                            <button onClick={() => handleSRSReview('good')} className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-[var(--input-bg)] border border-slate-700 hover:bg-blue-500/10 hover:border-blue-500 transition-all hover:-translate-y-1">
                                <span className="text-sm text-blue-400 font-extrabold uppercase mb-1 group-hover:text-blue-300">Good</span>
                                <span className="text-xs text-slate-500 group-hover:text-slate-300 font-mono">~3d</span>
                            </button>
                            <button onClick={() => handleSRSReview('easy')} className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-[var(--input-bg)] border border-slate-700 hover:bg-green-500/10 hover:border-green-500 transition-all hover:-translate-y-1">
                                <span className="text-sm text-green-400 font-extrabold uppercase mb-1 group-hover:text-green-300">Easy</span>
                                <span className="text-xs text-slate-500 group-hover:text-slate-300 font-mono">~7d</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
        
        <div className="text-center text-[var(--text-tertiary)] text-xs font-medium tracking-wide pb-4">
             {mode === 'srs' && isFlipped 
                ? 'Rate your recall to optimize your learning path' 
                : ghostMode ? 'Surprise challenge! Answer to continue.' : <span className="hidden md:inline">PRESS SPACE TO FLIP</span>}
        </div>
    </div>
  );
};