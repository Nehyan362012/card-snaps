
import React from 'react';
import { Deck, AppView, Test, UserProfile, SeasonalEvent } from '../types';
import { soundService } from '../services/soundService';
import { Plus, Play, Zap, ArrowRight, Layers, GraduationCap, ChevronRight, Snowflake, Flower, Sun, Flame, Wheat, Moon, Gift, Coffee } from 'lucide-react';

interface DashboardProps {
    userProfile: UserProfile;
    decks: Deck[];
    tests: Test[];
    onNavigate: (view: AppView) => void;
    onStudy: (deckId: string) => void;
    onCreateDeck: () => void;
    themeColor: string;
    activeEvent: SeasonalEvent | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ userProfile, decks, tests, onNavigate, onStudy, onCreateDeck, themeColor, activeEvent }) => {
    
    const recentDecks = [...decks].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);
    const upcomingTest = tests.sort((a, b) => a.date - b.date).find(t => t.date > Date.now());

    const getThemeClasses = () => {
        const map: Record<string, { bg: string, text: string, border: string, shadow: string, gradient: string }> = {
            indigo: { bg: 'bg-indigo-500', text: 'text-indigo-500', border: 'border-indigo-500', shadow: 'shadow-indigo-500', gradient: 'from-indigo-600 to-violet-600' },
            cyan: { bg: 'bg-cyan-500', text: 'text-cyan-500', border: 'border-cyan-500', shadow: 'shadow-cyan-500', gradient: 'from-cyan-600 to-blue-600' },
            emerald: { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500', shadow: 'shadow-emerald-500', gradient: 'from-emerald-600 to-teal-600' },
            fuchsia: { bg: 'bg-fuchsia-500', text: 'text-fuchsia-500', border: 'border-fuchsia-500', shadow: 'shadow-fuchsia-500', gradient: 'from-fuchsia-600 to-pink-600' },
            orange: { bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-500', shadow: 'shadow-orange-500', gradient: 'from-orange-600 to-red-600' },
            red: { bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-500', shadow: 'shadow-red-500', gradient: 'from-red-600 to-rose-600' },
        };
        return map[themeColor] || map['indigo'];
    };

    const theme = getThemeClasses();

    const EventIcon = ({ name }: { name: string }) => {
        switch(name) {
            case 'Snowflake': return <Snowflake className="w-6 h-6" />;
            case 'Flower': return <Flower className="w-6 h-6" />;
            case 'Sun': return <Sun className="w-6 h-6" />;
            case 'Flame': return <Flame className="w-6 h-6" />;
            case 'Wheat': return <Wheat className="w-6 h-6" />;
            case 'Moon': return <Moon className="w-6 h-6" />;
            case 'Gift': return <Gift className="w-6 h-6" />;
            default: return <Zap className="w-6 h-6" />;
        }
    };

    return (
        <div className="p-4 md:p-10 lg:p-12 pt-20 md:pt-10 animate-fade-in-up max-w-7xl mx-auto pb-24 md:pb-12 overflow-x-hidden">
            {/* Header with Greeting Animation */}
            <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
                <div className="animate-slide-in-left">
                    <h1 className="text-3xl md:text-6xl font-extrabold text-[var(--text-primary)] mb-1 md:mb-3 tracking-tight">
                        Dashboard
                    </h1>
                    <p className="text-[var(--text-secondary)] text-base md:text-xl font-medium">
                        Ready to learn, <span className={`${theme.text} font-bold`}>{userProfile.name}</span>?
                    </p>
                </div>
                
                {upcomingTest && (
                    <div className="glass-panel p-3 md:p-4 rounded-2xl flex items-center gap-3 md:gap-4 border border-[var(--glass-border)] animate-float shadow-lg self-start md:self-auto w-full md:w-auto">
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl ${theme.bg}/20 flex items-center justify-center ${theme.text} flex-shrink-0`}>
                            <GraduationCap className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <div className="min-w-0">
                            <div className="text-[10px] md:text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Up Next</div>
                            <div className="font-bold text-[var(--text-primary)] text-sm md:text-base truncate">{upcomingTest.title}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Active Event Banner */}
            {activeEvent && (
                <div className="mb-6 md:mb-12 relative overflow-hidden rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-r from-slate-900 to-slate-800 p-1 border border-white/10 shadow-2xl animate-pop-in">
                    <div className={`absolute inset-0 bg-gradient-to-r from-${activeEvent.color}-500/20 to-transparent pointer-events-none`}></div>
                    <div className="relative z-10 p-4 md:p-8 flex flex-col sm:flex-row items-center gap-4 md:gap-6 text-center sm:text-left">
                        <div className={`w-12 h-12 md:w-20 md:h-20 rounded-2xl bg-${activeEvent.color}-500 flex items-center justify-center shadow-lg shadow-${activeEvent.color}-500/40 animate-pulse-soft flex-shrink-0`}>
                            <div className="text-white scale-75 md:scale-100"><EventIcon name={activeEvent.icon} /></div>
                        </div>
                        <div className="flex-1">
                            <div className={`text-[10px] md:text-sm font-extrabold text-${activeEvent.color}-400 uppercase tracking-widest mb-0.5 md:mb-1 flex items-center justify-center sm:justify-start gap-2`}>
                                Seasonal Event <span className="bg-white/10 px-1.5 py-0.5 rounded text-[8px] md:text-[10px]">LIMITED</span>
                            </div>
                            <h2 className="text-lg md:text-3xl font-black text-white mb-1 md:mb-2 leading-tight">{activeEvent.name}</h2>
                            <p className="text-slate-300 font-medium text-xs md:text-base">{activeEvent.description}</p>
                        </div>
                        <div className="sm:ml-auto">
                            <div className={`text-4xl md:text-5xl font-black text-${activeEvent.color}-500 drop-shadow-lg opacity-80`}>{activeEvent.multiplier}X</div>
                            <div className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest">XP Boost</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                
                {/* 1. Focus Timer */}
                <button 
                    onClick={() => { soundService.playClick(); onNavigate(AppView.FOCUS); }}
                    className={`lg:col-span-2 p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br ${theme.gradient} text-white relative overflow-hidden group hover:scale-[1.01] md:hover:scale-[1.02] transition-all duration-500 shadow-xl md:shadow-2xl ${theme.shadow}/30 text-left`}
                >
                    <div className="absolute top-0 right-0 w-40 h-40 md:w-80 md:h-80 bg-white/10 rounded-full -mr-10 -mt-10 md:-mr-20 md:-mt-20 blur-3xl group-hover:blur-2xl transition-all duration-700 animate-pulse-slow"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 md:w-60 md:h-60 bg-black/10 rounded-full -ml-5 -mb-5 md:-ml-10 md:-mb-10 blur-3xl"></div>
                    
                    <div className="relative z-10 flex flex-col h-full justify-between min-h-[180px]">
                        <div>
                            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-6">
                                <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg md:rounded-xl border border-white/20 shadow-lg">
                                    <Coffee className="w-4 h-4 md:w-6 md:h-6 text-white" />
                                </div>
                                <span className="font-bold opacity-90 uppercase tracking-widest text-[10px] md:text-xs border border-white/20 px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-black/10 backdrop-blur-sm">New Feature</span>
                            </div>
                            <h3 className="text-2xl md:text-4xl font-extrabold mb-2 md:mb-3 leading-tight">Focus Timer</h3>
                            <p className="opacity-90 max-w-md text-sm md:text-lg font-medium leading-relaxed">Use the Pomodoro technique to study smarter. Distraction-free tracking.</p>
                        </div>
                        <div className="mt-6 md:mt-10">
                             <div className="inline-flex items-center gap-2 font-bold bg-white text-black px-4 py-2 md:px-6 md:py-3.5 rounded-xl md:rounded-2xl shadow-lg md:shadow-xl group-hover:shadow-2xl group-hover:scale-105 transition-all duration-300 text-xs md:text-base">
                                 Start Session <ArrowRight className="w-3 h-3 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                             </div>
                        </div>
                    </div>
                </button>

                {/* 2. Manual Create & Prep Stack */}
                <div className="flex flex-col gap-4 md:gap-6">
                    <button 
                        onClick={onCreateDeck}
                        className="flex-1 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] glass-panel border border-[var(--glass-border)] hover:bg-[var(--card-hover)] text-left group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative overflow-hidden flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-0"
                    >
                        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl ${theme.bg}/10 flex items-center justify-center md:mb-4 ${theme.text} group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 border border-${theme.border}/20 flex-shrink-0`}>
                            <Plus className="w-6 h-6 md:w-7 md:h-7" />
                        </div>
                        <div>
                            <h3 className="text-lg md:text-2xl font-bold text-[var(--text-primary)]">New Deck</h3>
                            <p className="text-[var(--text-secondary)] font-medium text-xs md:text-base">Create manually</p>
                        </div>
                    </button>

                    <button 
                        onClick={() => onNavigate(AppView.PREPARATION)}
                        className="flex-1 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] glass-panel border border-[var(--glass-border)] hover:bg-[var(--card-hover)] text-left group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative overflow-hidden flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-0"
                    >
                        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl ${theme.bg}/10 flex items-center justify-center md:mb-4 ${theme.text} group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500 border border-${theme.border}/20 flex-shrink-0`}>
                            <Zap className="w-6 h-6 md:w-7 md:h-7" />
                        </div>
                        <div>
                            <h3 className="text-lg md:text-2xl font-bold text-[var(--text-primary)]">Test Prep</h3>
                            <p className="text-[var(--text-secondary)] font-medium text-xs md:text-base">Manage exams</p>
                        </div>
                    </button>
                </div>

                {/* 4. Recent List */}
                <div className="lg:col-span-3 glass-panel rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-10 border border-[var(--glass-border)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/5 to-transparent rounded-full -mr-16 -mt-16 pointer-events-none"></div>
                    
                    <div className="flex items-center justify-between mb-6 md:mb-8 relative z-10">
                        <h3 className="text-lg md:text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2 md:gap-3">
                             <div className={`p-1.5 md:p-2 rounded-lg md:rounded-xl ${theme.bg}/10 ${theme.text}`}>
                                <Layers className="w-4 h-4 md:w-5 md:h-5" />
                             </div>
                             Recent Activity
                        </h3>
                        <button 
                            onClick={() => onNavigate(AppView.FLASHCARDS)} 
                            className={`flex items-center gap-1 text-xs md:text-sm font-bold ${theme.text} hover:opacity-80 transition-opacity bg-${theme.bg}/5 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl`}
                        >
                            View Library <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 relative z-10">
                        {recentDecks.length > 0 ? (
                            recentDecks.map((deck, i) => (
                                <div 
                                    key={deck.id} 
                                    style={{ animationDelay: `${i * 100}ms` }}
                                    className="p-4 md:p-5 rounded-[1.25rem] md:rounded-[1.5rem] bg-[var(--input-bg)] flex flex-col justify-between group hover:bg-[var(--glass-bg)] border border-[var(--glass-border)] hover:border-[var(--text-secondary)]/30 transition-all hover:-translate-y-1 hover:shadow-xl animate-fade-in-up"
                                >
                                    <div className="flex items-start justify-between mb-2 md:mb-4">
                                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl ${theme.bg}/10 flex items-center justify-center ${theme.text} font-bold text-base md:text-lg border border-${theme.border}/10 group-hover:scale-110 transition-transform duration-300`}>
                                            {deck.title.charAt(0)}
                                        </div>
                                        <button 
                                            onClick={() => onStudy(deck.id)}
                                            className={`w-8 h-8 md:w-10 md:h-10 rounded-full ${theme.bg} text-white flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transform translate-y-0 md:translate-y-2 md:group-hover:translate-y-0 transition-all duration-300 shadow-lg`}
                                        >
                                            <Play className="w-3 h-3 md:w-4 md:h-4 fill-current ml-0.5" />
                                        </button>
                                    </div>
                                    <div>
                                        <h4 className="text-base md:text-lg font-bold text-[var(--text-primary)] mb-0.5 md:mb-1 truncate group-hover:text-[var(--text-primary)] transition-colors">{deck.title}</h4>
                                        <p className="text-xs md:text-sm text-[var(--text-secondary)] font-medium">{deck.cards.length} Cards</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-3 text-center py-8 md:py-12 text-[var(--text-tertiary)] border-2 border-dashed border-[var(--glass-border)] rounded-[2rem]">
                                <p className="text-sm md:text-lg font-medium mb-2">Your library looks empty.</p>
                                <button onClick={onCreateDeck} className={`${theme.text} font-bold hover:underline text-sm md:text-base`}>Create your first deck</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
