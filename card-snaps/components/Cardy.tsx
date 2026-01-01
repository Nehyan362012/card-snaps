import React, { useState, useEffect } from 'react';
import { Bot, X, MessageCircle, GraduationCap, Zap } from 'lucide-react';
import { Deck, Test } from '../types';

interface CardyProps {
  decks: Deck[];
  tests: Test[];
  onNavigateToStudy: (deckId: string) => void;
  onNavigateToPrep: () => void;
}

export const Cardy: React.FC<CardyProps> = ({ decks, tests, onNavigateToStudy, onNavigateToPrep }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [message, setMessage] = useState('');
  const [mood, setMood] = useState<'happy' | 'urgent' | 'chill'>('happy');

  useEffect(() => {
    // Logic to determine Cardy's advice
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    // 1. Check upcoming tests (within 3 days)
    const urgentTest = tests.find(t => t.date > now && t.date < now + (3 * oneDay));
    
    if (urgentTest) {
      setMood('urgent');
      setMessage(`Hey! You have the "${urgentTest.title}" test coming up soon! Review your matching cards now! 🚨`);
      return;
    }

    // 2. Check for overdue cards
    let totalDue = 0;
    decks.forEach(d => {
      totalDue += d.cards.filter(c => !c.srs || c.srs.dueDate <= now).length;
    });

    if (totalDue > 5) {
      setMood('urgent');
      setMessage(`You have ${totalDue} cards waiting for review. Consistency is key! 🧠`);
      return;
    }

    // 3. General encouragement
    if (decks.length === 0) {
      setMood('chill');
      setMessage("It's quiet... too quiet. Create your first deck to get started! ✨");
    } else {
      setMood('happy');
      setMessage("Great day for learning! Want to try a quick study session? 🚀");
    }

  }, [decks, tests]);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full shadow-lg shadow-indigo-500/40 flex items-center justify-center text-white z-50 hover:scale-110 transition-transform animate-float"
      >
        <Bot className="w-8 h-8" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 max-w-[300px] z-50 animate-fade-in-up">
      <div className={`glass-panel p-4 rounded-2xl shadow-2xl border-t border-white/20 relative ${mood === 'urgent' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-indigo-500'}`}>
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-2 right-2 text-slate-400 hover:text-white p-1"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl flex-shrink-0 ${mood === 'urgent' ? 'bg-red-500/20 text-red-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
             <Bot className="w-8 h-8" />
          </div>
          <div>
             <h4 className="font-bold text-sm mb-1 flex items-center gap-2">
                Snaps
                {mood === 'urgent' && <Zap className="w-3 h-3 text-yellow-400 fill-current" />}
             </h4>
             <p className="text-xs text-slate-300 leading-relaxed mb-3">
                {message}
             </p>

             <div className="flex gap-2">
                {mood === 'urgent' ? (
                   <button 
                      onClick={onNavigateToPrep}
                      className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                   >
                     <GraduationCap className="w-3 h-3" /> Go to Prep
                   </button>
                ) : (
                   <button 
                      onClick={() => onNavigateToStudy(decks[0]?.id || '')}
                      disabled={decks.length === 0}
                      className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                   >
                     <MessageCircle className="w-3 h-3" /> Study Now
                   </button>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};