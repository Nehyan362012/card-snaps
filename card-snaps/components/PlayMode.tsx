import React from 'react';
import { UserStats, DailyGoal, SeasonalEvent } from '../types';
import { Trophy, Flame, Clock, Brain, Star, TrendingUp, Zap, Target, CheckCircle2, Lock, Calendar } from 'lucide-react';
import { soundService } from '../services/soundService';
import confetti from 'canvas-confetti';

interface PlayModeProps {
  stats: UserStats;
  themeColor: string;
  onClaimGoal: (goalId: string) => void;
  activeEvent: SeasonalEvent | null;
}

export const PlayMode: React.FC<PlayModeProps> = ({ stats, themeColor, onClaimGoal, activeEvent }) => {
  // Leveling Logic: Double XP required for each next level
  const xpRequiredForNextLevel = 1000 * Math.pow(2, stats.level - 1);
  
  let xpAtStartOfLevel = 0;
  if (stats.level > 1) {
      xpAtStartOfLevel = 1000 * (1 - Math.pow(2, stats.level - 1)) / (1 - 2);
  }
  
  const xpInCurrentLevel = stats.xp - xpAtStartOfLevel;
  const progressPercent = Math.min(100, Math.max(0, (xpInCurrentLevel / xpRequiredForNextLevel) * 100));

  const handleClaim = (goalId: string) => {
      soundService.playSuccess();
      confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ffffff', '#fbbf24']
      });
      onClaimGoal(goalId);
  };

  const StatCard = ({ icon: Icon, label, value, subtext }: any) => (
    <div className={`glass-panel p-5 md:p-6 rounded-[2rem] border border-[var(--glass-border)] flex items-center gap-5 hover:scale-[1.02] transition-all duration-300 group hover:border-${themeColor}-500/30`}>
        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-${themeColor}-500/10 flex items-center justify-center shadow-lg border border-${themeColor}-500/20 group-hover:bg-${themeColor}-500 transition-colors flex-shrink-0`}>
            <Icon className={`w-6 h-6 md:w-7 md:h-7 text-${themeColor}-500 group-hover:text-white transition-colors`} />
        </div>
        <div>
            <div className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest mb-1">{label}</div>
            <div className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)]">{value}</div>
            {subtext && <div className="text-xs text-[var(--text-tertiary)] mt-1">{subtext}</div>}
        </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-12 animate-fade-in-up">
        {/* Header Section */}
        <div className="mb-12 text-center relative">
            <div className="inline-block relative group">
                <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-${themeColor}-500 to-${themeColor}-700 flex items-center justify-center shadow-[0_0_50px_rgba(var(--${themeColor}-500-rgb),0.5)] mb-6 animate-float mx-auto relative z-10 border-4 border-white/10`}>
                    <Trophy className="w-16 h-16 md:w-20 md:h-20 text-white" />
                    <div className="absolute -bottom-2 bg-amber-400 text-black text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider border-2 border-slate-900 shadow-lg">
                        Level {stats.level}
                    </div>
                </div>
                <div className={`absolute inset-0 bg-${themeColor}-500/20 blur-[60px] rounded-full z-0`}></div>
            </div>
            
            <h1 className="text-3xl md:text-6xl font-extrabold text-[var(--text-primary)] mb-4 tracking-tight">Your Progress</h1>
            
            {/* XP Bar */}
            <div className="max-w-lg mx-auto relative group px-2">
                <div className="flex justify-between text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-widest">
                    <span>{Math.floor(xpInCurrentLevel)} XP</span>
                    <span>{xpRequiredForNextLevel} XP</span>
                </div>
                <div className="h-5 bg-[var(--input-bg)] rounded-full overflow-hidden border border-[var(--glass-border)] relative shadow-inner">
                    <div 
                        className={`h-full bg-gradient-to-r from-${themeColor}-600 to-${themeColor}-400 transition-all duration-1000 ease-out relative overflow-hidden`}
                        style={{ width: `${progressPercent}%` }}
                    >
                         <div className="absolute inset-0 bg-white/20 shimmer-bg"></div>
                    </div>
                </div>
                <div className={`absolute top-full mt-2 w-full text-center opacity-0 group-hover:opacity-100 transition-opacity text-xs text-${themeColor}-400 font-bold`}>
                    {Math.floor(xpRequiredForNextLevel - xpInCurrentLevel)} XP until Level {stats.level + 1}
                </div>
            </div>
        </div>

        {/* Event Status */}
        {activeEvent && (
            <div className="mb-10 max-w-2xl mx-auto glass-panel p-4 rounded-2xl border border-[var(--glass-border)] flex items-center justify-center gap-4 bg-gradient-to-r from-slate-900/50 to-slate-800/50">
                <div className={`p-2 bg-${activeEvent.color}-500/20 rounded-lg text-${activeEvent.color}-400`}>
                    <Calendar className="w-5 h-5" />
                </div>
                <div className="text-sm font-medium text-slate-300">
                    Active Event: <span className={`text-${activeEvent.color}-400 font-bold`}>{activeEvent.name}</span> ({activeEvent.multiplier}x XP)
                </div>
            </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-12">
            <StatCard 
                icon={Flame} 
                label="Day Streak" 
                value={stats.streak} 
                subtext="Consecutive study days"
            />
            <StatCard 
                icon={Brain} 
                label="Cards Learned" 
                value={stats.cardsLearned} 
                subtext="Total cards mastered"
            />
            <StatCard 
                icon={Clock} 
                label="Time Studied" 
                value={`${Math.floor(stats.minutesStudied / 60)}h ${stats.minutesStudied % 60}m`} 
                subtext="Total focus time"
            />
             <StatCard 
                icon={Star} 
                label="Total XP" 
                value={stats.xp.toLocaleString()} 
                subtext="Lifetime earnings"
            />
             <StatCard 
                icon={TrendingUp} 
                label="Accuracy" 
                value={stats.totalQuestionsAnswered > 0 ? `${Math.round((stats.correctAnswers / stats.totalQuestionsAnswered) * 100)}%` : '-'} 
                subtext="Based on Learn sessions"
            />
             <StatCard 
                icon={Zap} 
                label="Fastest Session" 
                value={stats.fastestSession > 0 ? `${stats.fastestSession}m` : '-'} 
                subtext="Speed record (20+ min)"
            />
        </div>

        {/* Daily Goals */}
        <div className="glass-panel p-6 md:p-8 rounded-[2.5rem] border border-[var(--glass-border)]">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                    <Target className={`w-6 h-6 text-${themeColor}-500`} /> Daily Goals
                </h3>
                <div className={`px-3 py-1 rounded-lg bg-${themeColor}-500/10 text-${themeColor}-500 text-xs font-bold uppercase tracking-wider border border-${themeColor}-500/20`}>
                    Refreshes Daily
                </div>
            </div>
            
            <div className="space-y-4">
                {stats.goals.map((goal) => {
                    const progress = Math.min(100, (goal.current / goal.target) * 100);
                    const canClaim = goal.current >= goal.target && !goal.completed;

                    return (
                        <div key={goal.id} className={`p-5 rounded-2xl border transition-all ${goal.completed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-[var(--input-bg)] border-[var(--glass-border)]'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${goal.completed ? 'bg-emerald-500 border-emerald-500 text-white' : `border-${themeColor}-500/30 text-${themeColor}-500`}`}>
                                        {goal.completed ? <CheckCircle2 className="w-6 h-6" /> : <Star className="w-5 h-5 fill-current" />}
                                    </div>
                                    <div>
                                        <div className={`font-bold text-sm md:text-base ${goal.completed ? 'text-emerald-400 line-through opacity-70' : 'text-[var(--text-primary)]'}`}>{goal.description}</div>
                                        <div className="text-xs font-bold text-[var(--text-tertiary)] flex items-center gap-1">
                                            REWARD: <span className="text-amber-400">{goal.xpReward} XP</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {canClaim ? (
                                    <button 
                                        onClick={() => handleClaim(goal.id)}
                                        className="px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all animate-pulse text-xs md:text-sm"
                                    >
                                        CLAIM
                                    </button>
                                ) : goal.completed ? (
                                    <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 font-bold rounded-xl text-[10px] md:text-xs uppercase tracking-wide border border-emerald-500/20">
                                        Claimed
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-[var(--text-secondary)] font-mono text-xs md:text-sm">
                                        {goal.current} / {goal.target}
                                    </div>
                                )}
                            </div>
                            
                            {/* Goal Progress Bar */}
                            <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-700 ${goal.completed ? 'bg-emerald-500' : `bg-${themeColor}-500`}`}
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
  );
};