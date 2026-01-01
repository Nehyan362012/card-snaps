import React, { useState, useEffect } from 'react';
import { Deck, Exercise, SnapCard, SNAP_CARDS_DATA, CRACK_CARDS_DATA, UserStats } from '../types';
import { generateGamifiedExercises, checkAnswerWithAI } from '../services/geminiService';
import { soundService } from '../services/soundService';
import { Gamepad2, Sparkles, BookOpen, Edit, ArrowRight, Check, X, Trophy, RefreshCcw, Loader2, ArrowLeft, BrainCircuit, Coins, Flame, ArrowUp, ArrowDown, Zap, Eye, Shield, RotateCcw, Ghost, Star, Feather, EyeOff, Scale, HelpCircle, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LearnModeProps {
  decks: Deck[];
  onExit: () => void;
  onUpdateStats: (xp: number, time: number, statsUpdatePayload: Partial<UserStats> & { isPerfect?: boolean, aiUsed?: boolean }) => void;
  xpMultiplier: number;
  userStats: UserStats;
}

type GameState = 'setup' | 'settings' | 'deck_select' | 'loading' | 'playing' | 'finished';
type SourceType = 'deck' | 'ai' | 'manual';

const DAILY_LIMIT = 3;

export const LearnMode: React.FC<LearnModeProps> = ({ decks, onExit, onUpdateStats, xpMultiplier = 1, userStats }) => {
  // Setup States
  const [gameState, setGameState] = useState<GameState>('setup');
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [sourceType, setSourceType] = useState<SourceType | null>(null);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [manualText, setManualText] = useState('');
  const [questionCount, setQuestionCount] = useState(20); 

  // Game Engine
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [sessionCorrectCount, setSessionCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string>(''); 
  const [startTime, setStartTime] = useState(0);
  const [isChecking, setIsChecking] = useState(false); 
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Snap Cards
  const [cardsUsedThisSession, setCardsUsedThisSession] = useState<string[]>([]);
  
  // Perks
  const [hintActive, setHintActive] = useState(false);
  const [weakHintActive, setWeakHintActive] = useState(false);
  const [xpBonusActive, setXpBonusActive] = useState(false);
  const [weakXpBonusActive, setWeakXpBonusActive] = useState(false);
  const [safetyNetActive, setSafetyNetActive] = useState(false);
  const [weakSafetyNetActive, setWeakSafetyNetActive] = useState(false);
  const [noXpNext, setNoXpNext] = useState(false);
  const [halfXpNext, setHalfXpNext] = useState(false);

  // Interaction States
  const [doubleOrNothing, setDoubleOrNothing] = useState(false); // The user's toggle
  const [textInput, setTextInput] = useState(''); 
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  // Matching
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set()); 
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [rightItems, setRightItems] = useState<{id: string, text: string}[]>([]); 
  
  // Sorting / Ranking / Timeline
  const [orderedItems, setOrderedItems] = useState<{id: string, text: string, order: number}[]>([]);
  
  // Unscramble
  const [unscrambleSelected, setUnscrambleSelected] = useState<string[]>([]);
  const [unscramblePool, setUnscramblePool] = useState<string[]>([]);
  
  // Classification
  const [classificationMap, setClassificationMap] = useState<Record<string, string[]>>({}); // category -> items[]
  const [dragItemPool, setDragItemPool] = useState<string[]>([]);
  const [selectedDragItem, setSelectedDragItem] = useState<string | null>(null);

  // Elimination / Syntax
  const [eliminatedIds, setEliminatedIds] = useState<Set<string>>(new Set());

  // Blind Spot
  const [blindSpotRevealed, setBlindSpotRevealed] = useState(false);

  // Comparison
  const [comparisonSelection, setComparisonSelection] = useState<'left' | 'right' | 'equal' | null>(null);

  useEffect(() => {
    const ex = exercises[currentIdx];
    if (!ex) return;

    // Reset interactions
    setTextInput('');
    setDoubleOrNothing(false);
    setSelectedOption(null);
    setMatchedPairs(new Set());
    setSelectedLeft(null);
    setRightItems([]);
    setOrderedItems([]);
    setUnscrambleSelected([]);
    setUnscramblePool([]);
    setClassificationMap({});
    setDragItemPool([]);
    setSelectedDragItem(null);
    setEliminatedIds(new Set());
    setBlindSpotRevealed(false);
    setComparisonSelection(null);
    setFeedbackMsg('');
    
    // Reset ONE-TIME perks
    setHintActive(false); 
    setWeakHintActive(false);
    setNoXpNext(false); 
    setHalfXpNext(false);

    // Initializers
    if (ex.type === 'matching' && ex.pairs) {
        const scrambled = [...ex.pairs].map(p => ({ id: p.right, text: p.right })).sort(() => Math.random() - 0.5);
        setRightItems(scrambled);
    } 
    else if (ex.type === 'unscramble') {
        const words = ex.correctAnswer.split(' ').sort(() => Math.random() - 0.5);
        setUnscramblePool(words);
    } 
    else if ((ex.type === 'ranking' || ex.type === 'timeline') && ex.events) {
        setOrderedItems([...ex.events].sort(() => Math.random() - 0.5));
    }
    else if ((ex.type === 'classification' || ex.type === 'category_sort') && ex.categories && ex.dragItems) {
        const initMap: Record<string, string[]> = {};
        ex.categories.forEach(c => initMap[c] = []);
        setClassificationMap(initMap);
        setDragItemPool([...ex.dragItems].sort(() => Math.random() - 0.5));
    }

  }, [currentIdx, exercises]);

  // --- Logic ---

  const handleStart = async () => {
    // Check limit
    if (userStats.learnSessionsToday >= DAILY_LIMIT) {
        alert("Daily limit reached! Come back tomorrow.");
        return;
    }

    setGameState('loading');
    soundService.playPop();
    setStartTime(Date.now());
    setSessionCorrectCount(0);

    try {
      let contentToProcess = '';
      if (sourceType === 'deck' && selectedDeck) {
        contentToProcess = selectedDeck.cards.map(c => `Q: ${c.front} A: ${c.back}`).join('\n');
      } else if (sourceType === 'ai') {
        contentToProcess = `Generate relevant study content for Subject: ${subject}, Topic: ${topic}.`;
      } else if (sourceType === 'manual') {
        contentToProcess = manualText;
      }

      const generated = await generateGamifiedExercises(contentToProcess, topic || (selectedDeck?.title ?? 'General'), questionCount);
      // Ensure specific types have valid data structure or fallback
      const validExercises = generated.filter(e => {
          if (e.type === 'ranking' || e.type === 'timeline') return e.events && e.events.length > 1;
          if (e.type === 'matching') return e.pairs && e.pairs.length > 1;
          return true;
      });

      setExercises(validExercises);
      setGameState('playing');
    } catch (e) {
      alert("Failed to generate. Try again.");
      setGameState('setup');
    }
  };

  const handleNext = () => {
      setIsTransitioning(true);
      setTimeout(() => {
          setFeedback(null);
          if (currentIdx < exercises.length - 1) {
              setCurrentIdx(prev => prev + 1);
          } else {
              finishSession();
          }
          setIsTransitioning(false);
      }, 800);
  };

  const finishSession = () => {
      const endTime = Date.now();
      const minutes = Math.ceil((endTime - startTime) / 60000);
      const newInventory = { ...userStats.inventory };
      cardsUsedThisSession.forEach(id => newInventory[id] = 'locked');
      
      const isPerfect = sessionCorrectCount === exercises.length && exercises.length >= 10;
      
      // Call App.tsx with all data needed for unlocking logic
      onUpdateStats(
          Math.floor(score / xpMultiplier), 
          minutes, 
          { 
              inventory: newInventory,
              isPerfect: isPerfect,
              aiUsed: sourceType === 'ai' || sourceType === 'manual' // Trigger for Gemini card
          }
      );
      setGameState('finished');
      soundService.playSuccess();
      confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } });
  };

  // ... (Other handlers like handleCorrect, handleWrong, checkAnswer remain same)
  const handleCorrect = () => {
      let xpGain = 20;
      let streakBonus = 0;
      if (streak >= 3) {
          streakBonus = 10; 
          if (streak === 3) soundService.playLevelUp();
      }
      setStreak(prev => prev + 1);
      xpGain += streakBonus;

      if (xpBonusActive) { xpGain *= 10; setXpBonusActive(false); }
      else if (weakXpBonusActive) { xpGain *= 2; setWeakXpBonusActive(false); }
      if (halfXpNext) { xpGain = Math.floor(xpGain / 2); setHalfXpNext(false); }
      if (noXpNext) { xpGain = 0; setNoXpNext(false); }

      setSessionCorrectCount(prev => prev + 1);
      
      if (doubleOrNothing) {
          setScore(prev => (prev * 2) + Math.floor(xpGain * xpMultiplier));
          setFeedbackMsg("Risk Paid Off! Score Doubled!");
      } else {
          setScore(prev => prev + Math.floor(xpGain * xpMultiplier));
          setFeedbackMsg("");
      }

      setFeedback('correct');
      soundService.playSuccess();
      handleNext();
  };

  const handleWrong = (msg?: string) => {
      if (doubleOrNothing) {
          setStreak(0);
          setScore(0);
          setFeedbackMsg(msg || "Lost the bet! Score reset to 0.");
          soundService.playClick();
          setFeedback('wrong');
          setTimeout(handleNext, 1500);
          return;
      }
      if (safetyNetActive) {
          setSafetyNetActive(false);
          setFeedbackMsg("Shield Saved Streak!");
          soundService.playPop();
          setFeedback('wrong');
          setTimeout(handleNext, 1500);
          return;
      }
      if (weakSafetyNetActive) {
          setWeakSafetyNetActive(false);
          setStreak(1);
          setFeedbackMsg("Buckler: Streak -> 1");
          setFeedback('wrong');
          setTimeout(handleNext, 1500);
          return;
      }
      setStreak(0);
      setFeedback('wrong');
      if (msg) setFeedbackMsg(msg);
      soundService.playClick();
      setTimeout(handleNext, 1500);
  };

  const checkAnswer = async (userAnswer: any, type: string) => {
      setIsChecking(true);
      const ex = exercises[currentIdx];
      
      if (type === 'quiz' || type === 'odd_one_out' || type === 'true_false') {
          if (userAnswer === ex.correctAnswer) handleCorrect();
          else handleWrong();
      }
      else if (type === 'ranking' || type === 'timeline') {
          const currentOrderIds = orderedItems.map(i => i.id);
          const correctOrderIds = [...(ex.events || [])].sort((a,b) => a.order - b.order).map(e => e.id);
          if (JSON.stringify(currentOrderIds) === JSON.stringify(correctOrderIds)) handleCorrect();
          else handleWrong("Incorrect Order.");
      }
      else if (type === 'classification' || type === 'category_sort') {
          const result = await checkAnswerWithAI(ex.question, ex.correctAnswer, JSON.stringify(classificationMap));
          if (result.correct) handleCorrect(); else handleWrong(result.feedback);
      }
      else {
          const result = await checkAnswerWithAI(ex.question, ex.correctAnswer, String(userAnswer));
          if (result.correct) handleCorrect(); else handleWrong(result.feedback);
      }
      setIsChecking(false);
  };

  // --- Renderers ---

  const renderSetup = () => {
    // BLOCKED STATE
    if (userStats.learnSessionsToday >= DAILY_LIMIT) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 animate-fade-in-up text-center">
                <div className="w-24 h-24 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center mb-6 border border-red-500/20 shadow-lg">
                    <Lock className="w-10 h-10 text-red-500" />
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] mb-4">Daily Limit Reached</h1>
                <p className="text-[var(--text-secondary)] text-lg max-w-md mx-auto mb-8">
                    You have used all {DAILY_LIMIT} AI learn sessions for today. Come back tomorrow to play more!
                </p>
                <button onClick={onExit} className="px-8 py-4 bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-2xl font-bold text-[var(--text-primary)] hover:bg-[var(--glass-bg)] transition-all">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-full animate-fade-in-up p-4 md:p-8">
        <div className="text-center mb-8 md:mb-12">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-500/30 animate-float">
                <Gamepad2 className="w-10 h-10 md:w-12 md:h-12 text-white" />
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-[var(--text-primary)] mb-4">Learn Mode</h1>
            <p className="text-[var(--text-secondary)] text-base md:text-lg max-w-md mx-auto">
                Gamified AI study sessions.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 font-bold text-sm">
                <Zap className="w-4 h-4" />
                {DAILY_LIMIT - userStats.learnSessionsToday} sessions remaining today
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl w-full">
            <button 
                onClick={() => { setSourceType('deck'); setGameState('deck_select'); soundService.playClick(); }}
                className="glass-panel p-6 md:p-8 rounded-[2rem] border border-[var(--glass-border)] hover:border-indigo-500 hover:bg-indigo-500/5 transition-all group text-left hover:-translate-y-2"
            >
                <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 mb-6 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-[var(--text-primary)] mb-2">From Deck</h3>
                <p className="text-sm text-[var(--text-secondary)]">Use one of your existing flashcard decks.</p>
            </button>

            <button 
                onClick={() => { setSourceType('ai'); setGameState('settings'); soundService.playClick(); }}
                className="glass-panel p-6 md:p-8 rounded-[2rem] border border-[var(--glass-border)] hover:border-sky-500 hover:bg-sky-500/5 transition-all group text-left hover:-translate-y-2"
            >
                <div className="w-12 h-12 md:w-14 md:h-14 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-500 mb-6 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-[var(--text-primary)] mb-2">AI Generator</h3>
                <p className="text-sm text-[var(--text-secondary)]">Create a quiz from any topic instantly.</p>
            </button>

            <button 
                onClick={() => { setSourceType('manual'); setGameState('settings'); soundService.playClick(); }}
                className="glass-panel p-6 md:p-8 rounded-[2rem] border border-[var(--glass-border)] hover:border-emerald-500 hover:bg-emerald-500/5 transition-all group text-left hover:-translate-y-2"
            >
                <div className="w-12 h-12 md:w-14 md:h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-6 group-hover:scale-110 transition-transform">
                    <Edit className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-[var(--text-primary)] mb-2">From Text</h3>
                <p className="text-sm text-[var(--text-secondary)]">Paste notes or an article to quiz yourself.</p>
            </button>
        </div>

        <button onClick={onExit} className="mt-8 md:mt-12 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] font-bold">Cancel</button>
        </div>
    );
  };

  const renderDeckSelect = () => (
      <div className="max-w-4xl mx-auto p-4 md:p-8 animate-slide-in-right">
          <button onClick={() => { setGameState('setup'); soundService.playClick(); }} className="flex items-center gap-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] mb-8 font-bold"><ArrowLeft className="w-4 h-4" /> Back</button>
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-8">Select a Deck</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {decks.map(deck => (
                  <button 
                    key={deck.id}
                    onClick={() => { setSelectedDeck(deck); setTopic(deck.title); setGameState('settings'); soundService.playClick(); }}
                    className="p-6 rounded-2xl bg-[var(--input-bg)] border border-[var(--glass-border)] hover:border-indigo-500 text-left group hover:shadow-lg transition-all"
                  >
                      <h3 className="font-bold text-[var(--text-primary)] mb-1 group-hover:text-indigo-500 transition-colors">{deck.title}</h3>
                      <p className="text-xs text-[var(--text-secondary)]">{deck.cards.length} cards</p>
                  </button>
              ))}
              {decks.length === 0 && (
                  <div className="col-span-full text-center text-[var(--text-tertiary)] p-8">No decks found. Create one first!</div>
              )}
          </div>
      </div>
  );

  const renderSettings = () => (
      <div className="max-w-2xl mx-auto p-4 md:p-8 animate-slide-in-right">
          <button onClick={() => { setGameState(sourceType === 'deck' ? 'deck_select' : 'setup'); soundService.playClick(); }} className="flex items-center gap-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] mb-8 font-bold"><ArrowLeft className="w-4 h-4" /> Back</button>
          
          <div className="glass-panel p-6 md:p-8 rounded-[2.5rem] border border-[var(--glass-border)]">
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-8 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white"><Coins className="w-5 h-5" /></div>
                  Configure Session
              </h2>

              <div className="space-y-6">
                  {sourceType === 'deck' && (
                      <div className="p-4 bg-[var(--input-bg)] rounded-xl border border-[var(--glass-border)]">
                          <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase">Selected Deck</p>
                          <p className="text-lg font-bold text-[var(--text-primary)]">{selectedDeck?.title}</p>
                      </div>
                  )}

                  {sourceType === 'ai' && (
                      <>
                        <div>
                            <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 pl-1">Subject</label>
                            <input 
                                type="text" 
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full bg-[var(--input-bg)] glass-input border border-[var(--glass-border)] rounded-xl px-4 py-3 text-[var(--text-primary)] outline-none focus:border-indigo-500 transition-colors"
                                placeholder="e.g. Physics"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 pl-1">Topic</label>
                            <input 
                                type="text" 
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                className="w-full bg-[var(--input-bg)] glass-input border border-[var(--glass-border)] rounded-xl px-4 py-3 text-[var(--text-primary)] outline-none focus:border-indigo-500 transition-colors"
                                placeholder="e.g. Quantum Mechanics"
                            />
                        </div>
                      </>
                  )}

                  {sourceType === 'manual' && (
                      <>
                        <div>
                            <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 pl-1">Topic (for context)</label>
                            <input 
                                type="text" 
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                className="w-full bg-[var(--input-bg)] glass-input border border-[var(--glass-border)] rounded-xl px-4 py-3 text-[var(--text-primary)] outline-none focus:border-indigo-500 transition-colors"
                                placeholder="e.g. My History Notes"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 pl-1">Content</label>
                            <textarea 
                                value={manualText}
                                onChange={(e) => setManualText(e.target.value)}
                                className="w-full h-32 bg-[var(--input-bg)] glass-input border border-[var(--glass-border)] rounded-xl px-4 py-3 text-[var(--text-primary)] outline-none focus:border-indigo-500 transition-colors resize-none"
                                placeholder="Paste your text here..."
                            />
                        </div>
                      </>
                  )}

                  <div>
                      <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 pl-1">Number of Questions</label>
                      <div className="grid grid-cols-5 gap-2">
                          {[20, 25, 30, 40, 50].map(n => (
                              <button 
                                key={n}
                                onClick={() => setQuestionCount(n)}
                                className={`py-3 rounded-xl border font-bold transition-all text-sm md:text-base ${questionCount === n ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-[var(--input-bg)] border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-slate-500'}`}
                              >
                                  {n}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>

              <button 
                onClick={handleStart}
                disabled={(sourceType === 'ai' && (!topic || !subject)) || (sourceType === 'manual' && !manualText)}
                className="w-full mt-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
              >
                  Start Session <ArrowRight className="w-5 h-5" />
              </button>
          </div>
      </div>
  );

  const renderFinished = () => (
      <div className="flex flex-col items-center justify-center h-full animate-pop-in p-8 text-center">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center shadow-2xl shadow-orange-500/40 mb-8 animate-float"><Trophy className="w-16 h-16 md:w-20 md:h-20 text-white" /></div>
          <h2 className="text-5xl md:text-6xl font-extrabold text-[var(--text-primary)] mb-4 drop-shadow-md">{score}</h2>
          <p className="text-xl md:text-2xl text-[var(--text-secondary)] font-medium mb-12">Total Score</p>
          <div className="flex gap-6">
              <button onClick={onExit} className="px-8 py-4 bg-[var(--input-bg)] border border-[var(--glass-border)] text-[var(--text-primary)] font-bold rounded-2xl hover:bg-[var(--glass-bg)] transition-colors">Exit</button>
              <button onClick={() => { setGameState('setup'); setExercises([]); setCurrentIdx(0); setScore(0); }} className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 flex items-center gap-2"><RefreshCcw className="w-5 h-5" /> Play Again</button>
          </div>
      </div>
  );

  // 1. Ranking / Timeline
  const renderRanking = (ex: Exercise) => (
      <div className="w-full max-w-lg mx-auto space-y-3">
          {orderedItems.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-3 p-4 bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-xl animate-pop-in">
                  <div className="flex flex-col gap-1">
                      <button onClick={() => {
                          if (idx === 0) return;
                          const newItems = [...orderedItems];
                          [newItems[idx], newItems[idx-1]] = [newItems[idx-1], newItems[idx]];
                          setOrderedItems(newItems);
                          soundService.playClick();
                      }} disabled={idx === 0} className="p-1 hover:bg-white/10 rounded disabled:opacity-30"><ArrowUp className="w-4 h-4"/></button>
                      <button onClick={() => {
                          if (idx === orderedItems.length - 1) return;
                          const newItems = [...orderedItems];
                          [newItems[idx], newItems[idx+1]] = [newItems[idx+1], newItems[idx]];
                          setOrderedItems(newItems);
                          soundService.playClick();
                      }} disabled={idx === orderedItems.length - 1} className="p-1 hover:bg-white/10 rounded disabled:opacity-30"><ArrowDown className="w-4 h-4"/></button>
                  </div>
                  <div className="flex-1 font-bold text-[var(--text-primary)]">{item.text}</div>
                  <div className="text-2xl font-black text-white/10">{idx + 1}</div>
              </div>
          ))}
          <button onClick={() => checkAnswer(orderedItems, 'ranking')} disabled={isChecking} className="w-full mt-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:scale-[1.02] transition-all">
              {isChecking ? <Loader2 className="animate-spin mx-auto"/> : "Submit Order"}
          </button>
      </div>
  );

  // 2. Matching
  const renderMatching = (ex: Exercise) => (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6 w-full">
          <div className="space-y-3">
              {ex.pairs?.map((p, i) => (
                  <button key={i} disabled={matchedPairs.has(p.left)} onClick={() => { setSelectedLeft(p.left); soundService.playClick(); }} 
                    className={`w-full p-3 md:p-4 text-left rounded-xl border-2 transition-all text-sm md:text-base ${matchedPairs.has(p.left) ? 'opacity-30 border-transparent bg-emerald-500/20' : selectedLeft === p.left ? 'border-indigo-500 bg-indigo-500/20' : 'border-[var(--glass-border)] bg-[var(--input-bg)]'}`}>
                      {p.left}
                  </button>
              ))}
          </div>
          <div className="space-y-3">
              {rightItems.map((item, i) => (
                  <button key={i} disabled={matchedPairs.has(ex.pairs?.find(p => p.right === item.text)?.left || '')} onClick={() => {
                      if (!selectedLeft) return;
                      const pair = ex.pairs?.find(p => p.left === selectedLeft);
                      if (pair?.right === item.text) {
                          const newSet = new Set(matchedPairs).add(selectedLeft);
                          setMatchedPairs(newSet);
                          setSelectedLeft(null);
                          soundService.playSuccess();
                          if (newSet.size === ex.pairs?.length) handleCorrect();
                      } else {
                          soundService.playClick(); // Error
                          setSelectedLeft(null);
                      }
                  }} className={`w-full p-3 md:p-4 text-left rounded-xl border-2 transition-all text-sm md:text-base ${
                      // Check if this right item is already matched
                      matchedPairs.has(ex.pairs?.find(p => p.right === item.text)?.left || '') ? 'opacity-30 border-transparent bg-emerald-500/20' : 'border-[var(--glass-border)] bg-[var(--input-bg)] hover:bg-white/5'
                  }`}>
                      {item.text}
                  </button>
              ))}
          </div>
      </div>
  );

  // 3. Classification
  const renderClassification = (ex: Exercise) => (
      <div className="w-full">
          <div className="flex gap-2 flex-wrap justify-center mb-6">
              {dragItemPool.map((item, i) => (
                  <button key={i} onClick={() => { setSelectedDragItem(item); soundService.playClick(); }} className={`px-4 py-2 rounded-lg border font-bold transition-all text-sm ${selectedDragItem === item ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-[var(--input-bg)] border-[var(--glass-border)]'}`}>
                      {item}
                  </button>
              ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {ex.categories?.map((cat, i) => (
                  <div key={i} onClick={() => {
                      if (selectedDragItem) {
                          const newMap = { ...classificationMap, [cat]: [...(classificationMap[cat] || []), selectedDragItem] };
                          setClassificationMap(newMap);
                          setDragItemPool(dragItemPool.filter(i => i !== selectedDragItem));
                          setSelectedDragItem(null);
                          soundService.playPop();
                      }
                  }} className="min-h-[120px] md:min-h-[150px] bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-xl p-4 cursor-pointer hover:bg-white/5 transition-colors">
                      <div className="font-bold text-center mb-2 text-[var(--text-tertiary)] uppercase text-xs md:text-sm">{cat}</div>
                      <div className="flex flex-wrap gap-2 justify-center">
                          {classificationMap[cat]?.map((item, idx) => (
                              <span key={idx} className="text-[10px] md:text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded">{item}</span>
                          ))}
                      </div>
                  </div>
              ))}
          </div>
          <button onClick={() => checkAnswer(classificationMap, 'classification')} disabled={isChecking || dragItemPool.length > 0} className="w-full mt-6 py-3 bg-indigo-600 text-white font-bold rounded-xl disabled:opacity-50">Check</button>
      </div>
  );

  // 4. Elimination
  const renderElimination = (ex: Exercise) => (
      <div className="w-full space-y-3">
          <p className="text-center text-sm text-[var(--text-secondary)] mb-4">Tap to eliminate incorrect statements.</p>
          {ex.statements?.map((stmt, i) => (
              <button key={i} onClick={() => {
                  const newSet = new Set(eliminatedIds);
                  if (newSet.has(stmt.id)) newSet.delete(stmt.id); else newSet.add(stmt.id);
                  setEliminatedIds(newSet);
                  soundService.playClick();
              }} className={`w-full p-4 text-left rounded-xl border-2 transition-all ${eliminatedIds.has(stmt.id) ? 'bg-red-500/20 border-red-500 text-red-300 line-through opacity-70' : 'bg-[var(--input-bg)] border-[var(--glass-border)]'}`}>
                  {stmt.text}
              </button>
          ))}
          <button onClick={() => {
              // Check: Did we eliminate ALL items where isCorrect === false?
              const incorrectIds = ex.statements?.filter(s => !s.isCorrect).map(s => s.id) || [];
              const userIds = Array.from(eliminatedIds);
              const allCaught = incorrectIds.every(id => userIds.includes(id)) && userIds.length === incorrectIds.length;
              if (allCaught) handleCorrect(); else handleWrong("You missed some wrong statements or eliminated correct ones.");
          }} className="w-full mt-6 py-3 bg-indigo-600 text-white font-bold rounded-xl">Confirm Elimination</button>
      </div>
  );

  // 5. Comparison
  const renderComparison = (ex: Exercise) => (
      <div className="w-full text-center">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-8">
              <div className="text-xl font-bold">{ex.comparisonItems?.left}</div>
              <div className="text-[var(--text-tertiary)] font-bold">VS</div>
              <div className="text-xl font-bold">{ex.comparisonItems?.right}</div>
          </div>
          <p className="mb-6 font-medium text-lg">{ex.question}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => checkAnswer('left', 'comparison')} className="px-8 py-4 bg-[var(--input-bg)] border border-[var(--glass-border)] hover:bg-indigo-500 hover:text-white rounded-2xl transition-all font-bold">{ex.comparisonItems?.left}</button>
              <button onClick={() => checkAnswer('equal', 'comparison')} className="px-8 py-4 bg-[var(--input-bg)] border border-[var(--glass-border)] hover:bg-purple-500 hover:text-white rounded-2xl transition-all font-bold">Equal / Both</button>
              <button onClick={() => checkAnswer('right', 'comparison')} className="px-8 py-4 bg-[var(--input-bg)] border border-[var(--glass-border)] hover:bg-cyan-500 hover:text-white rounded-2xl transition-all font-bold">{ex.comparisonItems?.right}</button>
          </div>
      </div>
  );

  // 6. Blind Spot
  const renderBlindSpot = (ex: Exercise) => (
      <div className="w-full text-center">
          {!blindSpotRevealed ? (
              <div className="py-20 cursor-pointer" onClick={() => setBlindSpotRevealed(true)}>
                  <EyeOff className="w-16 h-16 mx-auto mb-4 text-[var(--text-tertiary)]" />
                  <p className="font-bold">Tap to Reveal Question</p>
              </div>
          ) : (
              <div className="animate-pop-in">
                  <h3 className="text-2xl font-bold mb-6">{ex.question}</h3>
                  <input type="text" value={textInput} onChange={e => setTextInput(e.target.value)} className="w-full bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-xl p-4 text-center mb-4" placeholder="Answer..." />
                  <button onClick={() => checkAnswer(textInput, 'short_answer')} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold">Submit</button>
              </div>
          )}
      </div>
  );

  // 7. General Text Input (Fill Blank, Short Answer, Analogy, Syntax Repair)
  const renderTextInput = (ex: Exercise) => (
      <div className="w-full max-w-lg mx-auto">
          <input type="text" value={textInput} onChange={e => setTextInput(e.target.value)} className="w-full bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-2xl px-6 py-4 text-xl text-center mb-6 outline-none focus:border-indigo-500 transition-colors" placeholder="Type your answer..." autoFocus onKeyDown={e => e.key === 'Enter' && checkAnswer(textInput, 'text')} />
          <button onClick={() => checkAnswer(textInput, 'text')} disabled={isChecking} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:scale-[1.02] transition-all">Submit</button>
      </div>
  );

  // 8. Quiz / Odd One Out / True False
  const renderOptions = (ex: Exercise) => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {ex.type === 'true_false' 
            ? ['True', 'False'].map(opt => (
                <button key={opt} onClick={() => checkAnswer(opt, 'true_false')} className={`py-6 md:py-8 rounded-2xl border-2 font-bold text-lg md:text-xl transition-all hover:scale-105 ${opt === 'True' ? 'border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white' : 'border-red-500/50 bg-red-500/10 hover:bg-red-500 hover:text-white'}`}>{opt}</button>
            ))
            : ex.options?.map((opt, i) => (
                <button key={i} onClick={() => checkAnswer(opt, ex.type)} className="p-4 md:p-6 rounded-2xl bg-[var(--input-bg)] border border-[var(--glass-border)] hover:bg-indigo-600 hover:text-white transition-all font-bold text-base md:text-lg text-left shadow-sm">{opt}</button>
            ))
          }
      </div>
  );

  // 9. Unscramble
  const renderUnscramble = (ex: Exercise) => (
      <div className="w-full flex flex-col items-center gap-6 md:gap-8">
          <div className="min-h-[60px] flex flex-wrap gap-2 justify-center p-4 rounded-2xl border-2 border-dashed border-[var(--glass-border)] w-full">
              {unscrambleSelected.map((word, idx) => (
                  <button key={`${word}-${idx}`} onClick={() => {
                      const newSel = [...unscrambleSelected]; newSel.splice(idx, 1); setUnscrambleSelected(newSel);
                      setUnscramblePool([...unscramblePool, word]);
                  }} className="px-3 py-1.5 md:px-4 md:py-2 bg-indigo-600 text-white rounded-lg font-bold hover:scale-105 transition-transform text-sm md:text-base">{word}</button>
              ))}
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
              {unscramblePool.map((word, idx) => (
                  <button key={`${word}-${idx}`} onClick={() => {
                      const newPool = [...unscramblePool]; newPool.splice(idx, 1); setUnscramblePool(newPool);
                      setUnscrambleSelected([...unscrambleSelected, word]);
                  }} className="px-3 py-1.5 md:px-4 md:py-2 bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-lg font-bold text-sm md:text-base">{word}</button>
              ))}
          </div>
          <button onClick={() => checkAnswer(unscrambleSelected.join(' '), 'text')} disabled={isChecking} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg mt-4">Check Order</button>
      </div>
  );

  const renderGame = () => {
      if (isTransitioning) return <div className="h-full flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;
      
      const ex = exercises[currentIdx];
      if (!ex) return <div>Err</div>;

      // Double Or Nothing Toggle
      const riskToggle = (
          <div className="flex justify-center mb-6">
              <button 
                onClick={() => { soundService.playClick(); setDoubleOrNothing(!doubleOrNothing); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-sm font-bold ${doubleOrNothing ? 'bg-red-500 text-white border-red-600 animate-pulse' : 'bg-transparent border-[var(--glass-border)] text-[var(--text-tertiary)] hover:border-red-400 hover:text-red-400'}`}
              >
                  <Scale className="w-4 h-4" /> Double or Nothing {doubleOrNothing && "(Active)"}
              </button>
          </div>
      );

      return (
          <div className="max-w-4xl mx-auto p-4 md:p-10 flex flex-col items-center">
              {/* Stats Header */}
              <div className="w-full flex justify-between items-center mb-6 md:mb-8 bg-[var(--input-bg)] p-4 rounded-3xl border border-[var(--glass-border)]">
                  <div className="text-sm font-bold text-[var(--text-secondary)]">Q {currentIdx + 1}/{exercises.length}</div>
                  <div className="flex gap-1">{[...Array(3)].map((_,i) => <div key={i} className={`w-3 h-3 rounded-full ${streak > i ? 'bg-emerald-400 shadow-emerald-400/50 shadow-lg' : 'bg-slate-700'}`}/>)}</div>
                  <div className="font-black text-xl text-indigo-400">{score} XP</div>
              </div>

              {/* Snap Cards Inventory */}
              <div className="flex gap-2 overflow-x-auto w-full justify-center pb-4 mb-4 custom-scrollbar">
                  {[...SNAP_CARDS_DATA, ...CRACK_CARDS_DATA].filter(c => userStats.inventory[c.id] === 'ready' && !cardsUsedThisSession.includes(c.id)).map(c => (
                      <button key={c.id} onClick={() => {
                          setCardsUsedThisSession([...cardsUsedThisSession, c.id]);
                          soundService.playPop();
                          // Activate Logic
                          if(c.perk === 'hint') { if(c.type==='snap') setHintActive(true); else setWeakHintActive(true); }
                          if(c.perk === 'xp_boost') { if(c.type==='snap') setXpBonusActive(true); else setWeakXpBonusActive(true); }
                          if(c.perk === 'safety_net') { if(c.type==='snap') setSafetyNetActive(true); else setWeakSafetyNetActive(true); }
                          if(c.perk === 'auto_solve') { if(c.type==='snap') handleCorrect(); else Math.random()>.5 ? handleCorrect() : handleWrong("Backfire!"); }
                      }} className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border shadow-lg hover:scale-110 transition-transform ${c.type === 'snap' ? `bg-${c.color}-500 text-white border-white/20` : 'bg-slate-700 border-slate-600 text-slate-300'}`}>
                          {c.icon === 'Zap' && <Zap className="w-5 h-5"/>}
                          {c.icon === 'Eye' && <Eye className="w-5 h-5"/>}
                          {c.icon === 'Shield' && <Shield className="w-5 h-5"/>}
                          {c.icon === 'Star' && <Star className="w-5 h-5"/>}
                          {!['Zap','Eye','Shield','Star'].includes(c.icon) && <Sparkles className="w-5 h-5"/>}
                      </button>
                  ))}
              </div>

              <div className="w-full glass-panel p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] border border-[var(--glass-border)] relative overflow-hidden">
                  {/* WRONG / CORRECT OVERLAY */}
                  {feedback && (
                      <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-md animate-fade-in-up p-6 md:p-8 text-center break-words ${feedback === 'correct' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                          {feedback === 'correct' ? <Check className="w-16 h-16 md:w-24 md:h-24 mb-6 animate-bounce text-white"/> : <X className="w-16 h-16 md:w-24 md:h-24 mb-6 animate-shake text-white"/>}
                          <div className="text-3xl md:text-5xl font-black text-white">{feedback === 'correct' ? 'Excellent!' : 'Missed it!'}</div>
                          <div className="mt-4 font-bold text-white text-lg md:text-xl max-w-lg">{feedbackMsg}</div>
                      </div>
                  )}

                  {riskToggle}

                  <h2 className="text-xl md:text-3xl font-bold text-center mb-6 md:mb-8">{ex.question}</h2>

                  {/* Switch on types */}
                  {(ex.type === 'quiz' || ex.type === 'odd_one_out' || ex.type === 'true_false') && renderOptions(ex)}
                  {(ex.type === 'ranking' || ex.type === 'timeline') && renderRanking(ex)}
                  {ex.type === 'matching' && renderMatching(ex)}
                  {(ex.type === 'classification' || ex.type === 'category_sort') && renderClassification(ex)}
                  {(ex.type === 'elimination') && renderElimination(ex)}
                  {ex.type === 'comparison' && renderComparison(ex)}
                  {ex.type === 'blind_spot' && renderBlindSpot(ex)}
                  {ex.type === 'unscramble' && renderUnscramble(ex)}
                  {(ex.type === 'fill_blank' || ex.type === 'short_answer' || ex.type === 'analogy' || ex.type === 'syntax_repair' || ex.type === 'flashcard_review' || ex.type === 'connection' || ex.type === 'flashcard_type' || ex.type === 'reaction') && renderTextInput(ex)}
              </div>
          </div>
      );
  };

  // --- Main Render ---
  return (
    <div className="h-full w-full overflow-y-auto">
        {gameState === 'setup' && renderSetup()}
        {gameState === 'settings' && renderSettings()}
        {gameState === 'deck_select' && renderDeckSelect()}
        {gameState === 'loading' && (
            <div className="flex flex-col items-center justify-center h-full">
                <BrainCircuit className="w-20 h-20 text-indigo-500 animate-pulse mb-4"/>
                <div className="font-bold text-xl">Constructing Session...</div>
            </div>
        )}
        {gameState === 'playing' && renderGame()}
        {gameState === 'finished' && renderFinished()}
    </div>
  );
};