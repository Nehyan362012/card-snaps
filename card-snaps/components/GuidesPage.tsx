
import React, { useState } from 'react';
import { Test, Deck } from '../types';
import { Book, Clock, Brain, Calendar, Layers, CheckCircle2, AlertCircle, ArrowRight, Flag, Map, GraduationCap } from 'lucide-react';
import { soundService } from '../services/soundService';

interface GuidesPageProps {
    tests?: Test[];
    decks?: Deck[];
}

export const GuidesPage: React.FC<GuidesPageProps> = ({ tests = [], decks = [] }) => {
    const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

    // Sort tests by date
    const sortedTests = [...tests].sort((a, b) => a.date - b.date);
    const selectedTest = tests.find(t => t.id === selectedTestId);

    const getRelevantDecks = (test: Test) => {
        const topics = test.topics.map(t => t.toLowerCase());
        const titleWords = test.title.toLowerCase().split(' ');
        
        return decks.filter(d => {
            const content = (d.title + ' ' + d.description).toLowerCase();
            const matchesTopic = topics.some(t => content.includes(t));
            const matchesTitle = titleWords.some(w => w.length > 3 && content.includes(w));
            return matchesTopic || matchesTitle;
        });
    };

    const activeDecks = selectedTest ? getRelevantDecks(selectedTest) : [];

    return (
        <div className="p-6 md:p-12 animate-fade-in-up pb-32 max-w-7xl mx-auto">
            <div className="text-center mb-16">
                <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 mb-6 tracking-tighter">
                    Study Guides
                </h1>
                <p className="text-[var(--text-secondary)] text-xl font-medium max-w-2xl mx-auto">
                    Your personalized roadmap to acing upcoming exams.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Timeline / Map Sidebar */}
                <div className="lg:col-span-4 relative">
                    <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-transparent opacity-20 rounded-full hidden lg:block"></div>
                    
                    <div className="space-y-8 relative z-10">
                        {sortedTests.length > 0 ? sortedTests.map((test, idx) => {
                            const daysLeft = Math.ceil((test.date - Date.now()) / (1000 * 60 * 60 * 24));
                            const isSelected = selectedTestId === test.id;
                            
                            return (
                                <button 
                                    key={test.id}
                                    onClick={() => { setSelectedTestId(test.id); soundService.playClick(); }}
                                    className={`w-full text-left group relative pl-4 lg:pl-16 transition-all duration-300 ${isSelected ? 'scale-105' : 'hover:scale-102'}`}
                                >
                                    {/* Timeline Node */}
                                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 hidden lg:flex shadow-xl border-4 ${isSelected ? 'bg-emerald-500 border-white text-white scale-110 z-20' : 'bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-tertiary)] group-hover:border-emerald-500/50'}`}>
                                        <Flag className={`w-6 h-6 ${isSelected ? 'fill-current' : ''}`} />
                                    </div>

                                    <div className={`p-6 rounded-[2rem] border transition-all duration-300 shadow-lg ${isSelected ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-transparent' : 'bg-[var(--input-bg)] border-[var(--glass-border)] hover:bg-[var(--card-hover)]'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className={`font-bold text-lg leading-tight ${isSelected ? 'text-white' : 'text-[var(--text-primary)]'}`}>{test.title}</h3>
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${isSelected ? 'bg-white/20 text-white' : 'bg-black/20 text-[var(--text-secondary)]'}`}>
                                                {daysLeft} Days
                                            </span>
                                        </div>
                                        <div className={`text-sm flex items-center gap-2 ${isSelected ? 'text-emerald-100' : 'text-[var(--text-tertiary)]'}`}>
                                            <Calendar className="w-4 h-4" /> {new Date(test.date).toLocaleDateString()}
                                        </div>
                                    </div>
                                </button>
                            );
                        }) : (
                            <div className="p-8 text-center text-[var(--text-tertiary)] border-2 border-dashed border-[var(--glass-border)] rounded-[2.5rem]">
                                <Map className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                <p className="font-bold">No journey planned.</p>
                                <p className="text-sm mt-2">Add a test in Preparation mode to generate a guide.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content: The Dynamic Guide */}
                <div className="lg:col-span-8">
                    {selectedTest ? (
                        <div className="glass-panel p-8 md:p-12 rounded-[3rem] border border-[var(--glass-border)] min-h-[600px] animate-pop-in relative overflow-hidden flex flex-col shadow-2xl">
                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none animate-pulse-slow"></div>
                            
                            <div className="relative z-10 flex-1">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-16 h-16 bg-gradient-to-tr from-emerald-400 to-cyan-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                                        <GraduationCap className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">Active Guide</div>
                                        <h2 className="text-4xl font-black text-[var(--text-primary)]">{selectedTest.title}</h2>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                                    <div className="bg-[var(--input-bg)] p-6 rounded-3xl border border-[var(--glass-border)]">
                                        <h3 className="text-sm font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-4">Target Topics</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedTest.topics.map((t, i) => (
                                                <span key={i} className="px-3 py-1.5 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl text-sm font-bold text-[var(--text-primary)] shadow-sm">
                                                    #{t}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="bg-[var(--input-bg)] p-6 rounded-3xl border border-[var(--glass-border)] flex flex-col justify-center items-center text-center">
                                        <div className="text-3xl font-black text-[var(--text-primary)] mb-1">{activeDecks.length}</div>
                                        <div className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Matching Decks</div>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                                    <Layers className="w-5 h-5 text-emerald-500" /> Study Materials
                                </h3>

                                <div className="space-y-4">
                                    {activeDecks.length > 0 ? activeDecks.map(deck => (
                                        <div key={deck.id} className="group p-5 bg-[var(--input-bg)] hover:bg-[var(--card-hover)] rounded-2xl border border-[var(--glass-border)] flex items-center gap-5 transition-all hover:translate-x-2">
                                            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                                <Book className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-[var(--text-primary)] text-lg">{deck.title}</div>
                                                <div className="text-xs text-[var(--text-secondary)] font-medium mt-1">{deck.cards.length} Cards • 100% Relevance</div>
                                            </div>
                                            <CheckCircle2 className="w-6 h-6 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    )) : (
                                        <div className="p-8 bg-amber-500/5 border-2 border-dashed border-amber-500/20 rounded-3xl flex flex-col items-center gap-4 text-center">
                                            <AlertCircle className="w-10 h-10 text-amber-500 opacity-80" />
                                            <div>
                                                <div className="font-bold text-amber-200 text-lg">Content Gap Detected</div>
                                                <div className="text-amber-200/60 text-sm mt-1 max-w-md">No decks match your test topics. Try creating a new deck with keywords like: {selectedTest.topics.join(', ')}.</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sticky Footer Action */}
                            <div className="mt-10 pt-8 border-t border-[var(--glass-border)] flex justify-end">
                                <button 
                                    disabled={activeDecks.length === 0} 
                                    className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/30 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                                >
                                    <Brain className="w-5 h-5" /> Start Cram Session
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12 glass-panel rounded-[3rem] border border-dashed border-[var(--glass-border)] bg-[var(--input-bg)]/30">
                            <div className="w-32 h-32 bg-[var(--input-bg)] rounded-full flex items-center justify-center mb-8 animate-float shadow-inner">
                                <Map className="w-16 h-16 text-[var(--text-tertiary)] opacity-50" />
                            </div>
                            <h3 className="text-3xl font-bold text-[var(--text-secondary)] mb-2">Select a Path</h3>
                            <p className="text-[var(--text-tertiary)]">Choose an upcoming test to generate your guide.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};