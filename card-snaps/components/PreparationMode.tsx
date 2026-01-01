
import React, { useState } from 'react';
import { Deck, Test } from '../types';
import { soundService } from '../services/soundService';
import { Plus, Calendar, BookOpen, Trash2, GraduationCap, AlertCircle, ArrowRight, X, Clock, Tag, Layers } from 'lucide-react';

interface PreparationModeProps {
  tests: Test[];
  decks: Deck[];
  onAddTest: (test: Test) => void;
  onDeleteTest: (id: string) => void;
  onNavigateToStudy: (deckId: string) => void;
  themeColor: string; 
  onSaveDeck: (deck: Deck) => void; 
}

export const PreparationMode: React.FC<PreparationModeProps> = ({ tests, decks, onAddTest, onDeleteTest, onNavigateToStudy, themeColor }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTestTitle, setNewTestTitle] = useState('');
  const [newTestDate, setNewTestDate] = useState('');
  const [newTestTopics, setNewTestTopics] = useState('');

  // Map themeColor to specific class names safely
  const getThemeClasses = () => {
        const map: Record<string, { bg: string, text: string, border: string, shadow: string, gradient: string, glow: string }> = {
            indigo: { bg: 'bg-indigo-500', text: 'text-indigo-500', border: 'border-indigo-500', shadow: 'shadow-indigo-500', gradient: 'from-indigo-600 to-violet-600', glow: 'shadow-indigo-500/20' },
            cyan: { bg: 'bg-cyan-500', text: 'text-cyan-500', border: 'border-cyan-500', shadow: 'shadow-cyan-500', gradient: 'from-cyan-600 to-blue-600', glow: 'shadow-cyan-500/20' },
            emerald: { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500', shadow: 'shadow-emerald-500', gradient: 'from-emerald-600 to-teal-600', glow: 'shadow-emerald-500/20' },
            fuchsia: { bg: 'bg-fuchsia-500', text: 'text-fuchsia-500', border: 'border-fuchsia-500', shadow: 'shadow-fuchsia-500', gradient: 'from-fuchsia-600 to-pink-600', glow: 'shadow-fuchsia-500/20' },
            orange: { bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-500', shadow: 'shadow-orange-500', gradient: 'from-orange-600 to-red-600', glow: 'shadow-orange-500/20' },
            red: { bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-500', shadow: 'shadow-red-500', gradient: 'from-red-600 to-rose-600', glow: 'shadow-red-500/20' },
        };
        return map[themeColor] || map['indigo'];
  };

  const theme = getThemeClasses();

  // Helper to match decks intelligently
  const getMatchingDecks = (testTitle: string, testTopics: string[]) => {
    const searchTerms = [...testTopics, testTitle].filter(t => t && t.trim().length > 0).map(t => t.toLowerCase());
    if (searchTerms.length === 0) return [];

    return decks.filter(deck => {
        // Create a large text blob of the deck's content
        const deckContent = (
            deck.title + " " + 
            deck.description + " " + 
            deck.cards.map(c => c.front).join(" ")
        ).toLowerCase();

        // Check if ANY of the test topics/title appear in the deck content
        return searchTerms.some(term => deckContent.includes(term));
    });
  };

  const handleCreateTest = async () => {
    if (!newTestTitle || !newTestDate) return;
    
    const topicsArray = newTestTopics.split(',').map(t => t.trim()).filter(t => t.length > 0);
    
    soundService.playSuccess();
    const test: Test = {
        id: crypto.randomUUID(),
        title: newTestTitle,
        date: new Date(newTestDate).getTime(),
        topics: topicsArray
    };
    onAddTest(test);
    setIsAdding(false);
    setNewTestTitle('');
    setNewTestDate('');
    setNewTestTopics('');
  };

  const getDaysUntil = (timestamp: number) => {
      const diff = timestamp - Date.now();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return days;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 pt-20 md:pt-12 animate-fade-in-up">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
                <h2 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)] flex items-center gap-4 mb-2">
                    Test Prep
                </h2>
                <p className="text-[var(--text-secondary)] text-lg max-w-xl">
                    Never miss a deadline.
                </p>
            </div>
            {!isAdding && (
                <button 
                    onClick={() => { soundService.playClick(); setIsAdding(true); }}
                    className={`px-8 py-4 bg-gradient-to-r ${theme.gradient} text-white rounded-2xl font-bold shadow-xl ${theme.glow} hover:-translate-y-1 transition-all flex items-center gap-3 group`}
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> Add New Test
                </button>
            )}
        </div>

        {/* Add Test Modal/Card */}
        {isAdding && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-pop-in">
                <div className={`w-full max-w-2xl glass-panel p-8 md:p-10 rounded-[2.5rem] shadow-2xl border ${theme.border}/20 relative bg-[var(--glass-bg)]`}>
                    <button 
                        onClick={() => setIsAdding(false)}
                        className="absolute top-6 right-6 p-2 rounded-full bg-[var(--input-bg)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-8 flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl ${theme.bg}/20 flex items-center justify-center`}>
                            <Plus className={`w-6 h-6 ${theme.text}`} />
                        </div>
                        Add Upcoming Test
                    </h3>
                    
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider pl-4">Test Name</label>
                                <div className="relative group">
                                    <input 
                                        type="text" 
                                        value={newTestTitle}
                                        onChange={(e) => setNewTestTitle(e.target.value)}
                                        placeholder="e.g. Midterm Biology"
                                        className={`w-full bg-[var(--input-bg)] glass-input border border-[var(--glass-border)] rounded-2xl pl-12 pr-4 py-4 text-[var(--text-primary)] outline-none transition-all shadow-inner focus:${theme.border}/50`}
                                        autoFocus
                                    />
                                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)] group-focus-within:text-[var(--text-primary)] transition-colors" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider pl-4">Date</label>
                                <div className="relative group">
                                    <input 
                                        type="date" 
                                        value={newTestDate}
                                        onChange={(e) => setNewTestDate(e.target.value)}
                                        className={`w-full bg-[var(--input-bg)] glass-input border border-[var(--glass-border)] rounded-2xl pl-12 pr-4 py-4 text-[var(--text-primary)] outline-none transition-all shadow-inner focus:${theme.border}/50`}
                                    />
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)] group-focus-within:text-[var(--text-primary)] transition-colors" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider pl-4">Topics (Keywords)</label>
                            <div className="relative group">
                                <input 
                                    type="text" 
                                    value={newTestTopics}
                                    onChange={(e) => setNewTestTopics(e.target.value)}
                                    placeholder="e.g. cells, photosynthesis, genetics"
                                    className={`w-full bg-[var(--input-bg)] glass-input border border-[var(--glass-border)] rounded-2xl pl-12 pr-4 py-4 text-[var(--text-primary)] outline-none transition-all shadow-inner focus:${theme.border}/50`}
                                />
                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)] group-focus-within:text-[var(--text-primary)] transition-colors" />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 mt-10">
                        <button 
                            onClick={() => setIsAdding(false)} 
                            className="px-6 py-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleCreateTest} 
                            disabled={!newTestTitle || !newTestDate}
                            className={`px-10 py-3 ${theme.bg} text-white rounded-2xl font-bold shadow-lg ${theme.glow} transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100 hover:brightness-110 flex items-center gap-2`}
                        >
                            Save Test
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Tests List */}
        <div className="grid grid-cols-1 gap-6">
            {tests.length === 0 ? (
                <div className="text-center py-24 glass-panel rounded-[2.5rem] border-dashed border-2 border-[var(--glass-border)] bg-transparent">
                    <div className="w-24 h-24 rounded-3xl bg-[var(--input-bg)] flex items-center justify-center mx-auto mb-6 border border-[var(--glass-border)]">
                        <Layers className="w-10 h-10 text-[var(--text-tertiary)]" />
                    </div>
                    <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">No upcoming tests</h3>
                    <p className="text-[var(--text-secondary)] mb-8 text-lg">Add a test to track your schedule.</p>
                    <button 
                        onClick={() => setIsAdding(true)}
                        className={`${theme.text} font-bold hover:underline text-lg`}
                    >
                        + Add your first test
                    </button>
                </div>
            ) : (
                tests.sort((a,b) => a.date - b.date).map((test, idx) => {
                    const daysLeft = getDaysUntil(test.date);
                    // Check matches for this specific test
                    const matchingDecks = getMatchingDecks(test.title, test.topics);
                    const isUrgent = daysLeft <= 3 && daysLeft >= 0;

                    return (
                        <div 
                            key={test.id} 
                            style={{ animationDelay: `${idx * 100}ms` }}
                            className={`glass-panel p-8 rounded-[2.5rem] relative overflow-hidden group hover:bg-[var(--card-hover)] transition-all animate-fade-in-up border border-[var(--glass-border)] ${isUrgent ? 'border-red-500/40 shadow-[0_0_40px_rgba(239,68,68,0.1)]' : ''}`}
                        >
                             {/* Background Glow for urgent items */}
                             {isUrgent && <div className="absolute inset-0 bg-red-500/5 pointer-events-none animate-pulse-soft"></div>}

                             <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
                                 <div className="flex-1">
                                     <div className="flex items-center gap-4 mb-4">
                                        <h3 className="text-3xl font-bold text-[var(--text-primary)]">{test.title}</h3>
                                        {isUrgent && (
                                            <span className="px-3 py-1 bg-red-500 text-white text-[10px] font-extrabold uppercase tracking-widest rounded-full animate-pulse shadow-lg shadow-red-500/30">
                                                Urgent
                                            </span>
                                        )}
                                     </div>
                                     
                                     <div className="flex flex-wrap items-center gap-6 text-[var(--text-secondary)] text-sm mb-6">
                                         <span className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--glass-border)] font-medium">
                                             <Calendar className="w-4 h-4 opacity-70" /> 
                                             {new Date(test.date).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}
                                         </span>
                                         <span className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-bold ${daysLeft < 0 ? 'bg-slate-800 border-slate-700 text-slate-400' : daysLeft <= 3 ? 'bg-red-500/10 border-red-500/20 text-red-400' : `${theme.bg}/10 ${theme.border}/20 ${theme.text}`}`}>
                                             <Clock className="w-4 h-4" />
                                             {daysLeft < 0 ? 'Passed' : daysLeft === 0 ? 'TODAY!' : `${daysLeft} days left`}
                                         </span>
                                     </div>
                                     
                                     {test.topics.length > 0 && (
                                         <div className="flex flex-wrap gap-2 mb-2">
                                             {test.topics.map((t, i) => (
                                                 <span key={i} className="px-3 py-1 bg-[var(--input-bg)] rounded-lg text-xs font-bold text-[var(--text-secondary)] border border-[var(--glass-border)] uppercase tracking-wide">
                                                     #{t}
                                                 </span>
                                             ))}
                                         </div>
                                     )}
                                 </div>

                                 <button 
                                    onClick={() => { soundService.playClick(); onDeleteTest(test.id); }}
                                    className="p-3 text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors self-start"
                                    title="Delete Test"
                                 >
                                     <Trash2 className="w-6 h-6" />
                                 </button>
                             </div>

                             {/* Matched Decks */}
                             <div className="mt-8 pt-8 border-t border-[var(--glass-border)]">
                                 <h4 className="text-xs font-extrabold text-[var(--text-tertiary)] uppercase tracking-widest mb-5 flex items-center gap-2">
                                     <BookOpen className="w-4 h-4" /> Recommended Study Material
                                 </h4>
                                 {matchingDecks.length > 0 ? (
                                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                         {matchingDecks.map(deck => (
                                             <button
                                                key={deck.id}
                                                onClick={() => onNavigateToStudy(deck.id)}
                                                className={`flex items-center justify-between p-4 rounded-2xl bg-[var(--input-bg)] hover:${theme.bg} hover:text-white border border-[var(--glass-border)] hover:${theme.border} hover:shadow-lg hover:-translate-y-1 transition-all group/deck text-left`}
                                             >
                                                 <span className="text-sm font-bold text-[var(--text-primary)] group-hover/deck:text-white truncate">{deck.title}</span>
                                                 <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover/deck:text-white/70 transform group-hover/deck:translate-x-1 transition-transform" />
                                             </button>
                                         ))}
                                     </div>
                                 ) : (
                                     <div className="flex items-center gap-3 text-[var(--text-secondary)] text-sm italic bg-[var(--input-bg)] p-5 rounded-2xl border border-[var(--glass-border)]">
                                         <AlertCircle className="w-5 h-5 text-[var(--text-tertiary)]" />
                                         <span>No specific decks found for this test.</span>
                                     </div>
                                 )}
                             </div>
                        </div>
                    );
                })
            )}
        </div>
    </div>
  );
};
