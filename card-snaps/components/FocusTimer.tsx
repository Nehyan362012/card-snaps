
import React from 'react';
import { Play, Pause, RotateCcw, Coffee, Zap, Moon } from 'lucide-react';
import { soundService } from '../services/soundService';

interface FocusTimerProps {
    timeLeft: number;
    setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
    isActive: boolean;
    setIsActive: React.Dispatch<React.SetStateAction<boolean>>;
    mode: 'focus' | 'short' | 'long';
    setMode: React.Dispatch<React.SetStateAction<'focus' | 'short' | 'long'>>;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({ 
    timeLeft, setTimeLeft, isActive, setIsActive, mode, setMode 
}) => {
  
  const toggleTimer = () => {
    soundService.playClick();
    setIsActive(!isActive);
  };

  const resetTimer = (newMode: 'focus' | 'short' | 'long' = mode) => {
    soundService.playClick();
    setIsActive(false);
    setMode(newMode);
    if (newMode === 'focus') setTimeLeft(25 * 60);
    if (newMode === 'short') setTimeLeft(5 * 60);
    if (newMode === 'long') setTimeLeft(15 * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const maxTime = mode === 'focus' ? 1500 : mode === 'short' ? 300 : 900;
  // Calculate stroke dashoffset
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / maxTime) * circumference;

  const getModeColor = () => {
      if (mode === 'focus') return 'indigo';
      if (mode === 'short') return 'emerald';
      return 'amber';
  };
  
  const color = getModeColor();

  return (
    <div className="flex flex-col items-center justify-start h-full pt-24 px-6 md:px-8 pb-12 animate-fade-in-up overflow-y-auto">
      <div className="max-w-md w-full flex flex-col items-center">
        
        {/* Mode Selector - Mobile Friendly Button Grid */}
        <div className="grid grid-cols-3 gap-2 w-full mb-10 p-1 bg-[var(--input-bg)] rounded-2xl border border-[var(--glass-border)]">
            {[
                { id: 'focus', label: 'Focus', icon: Zap },
                { id: 'short', label: 'Short', icon: Coffee },
                { id: 'long', label: 'Long', icon: Moon }
            ].map((m) => {
                const isSelected = mode === m.id;
                const Icon = m.icon;
                return (
                    <button 
                        key={m.id}
                        onClick={() => resetTimer(m.id as any)}
                        className={`flex flex-col items-center justify-center py-3 rounded-xl transition-all duration-300 ${
                            isSelected 
                            ? `bg-[var(--glass-bg)] shadow-md text-${color}-500 font-bold border border-[var(--glass-border)]` 
                            : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                        }`}
                    >
                        <Icon className="w-5 h-5 mb-1" />
                        <span className="text-xs uppercase tracking-wide">{m.label}</span>
                    </button>
                );
            })}
        </div>

        {/* Timer Circle */}
        <div className="relative w-72 h-72 mb-12">
           {/* Background Glow */}
           <div className={`absolute inset-0 bg-${color}-500/10 rounded-full blur-[60px] animate-pulse-slow`}></div>
           
           <svg className="w-full h-full transform -rotate-90 drop-shadow-2xl" viewBox="0 0 300 300">
             {/* Track */}
             <circle 
                cx="150" cy="150" r={radius} 
                fill="none" 
                stroke="var(--input-bg)" 
                strokeWidth="12" 
                className="opacity-50" 
             />
             {/* Progress */}
             <circle 
                cx="150" cy="150" r={radius} 
                fill="none" 
                className={`text-${color}-500 stroke-current transition-all duration-1000 ease-linear`}
                strokeWidth="12" 
                strokeDasharray={circumference} 
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
             />
           </svg>
           
           <div className="absolute inset-0 flex items-center justify-center flex-col">
              <div className="text-6xl font-black text-[var(--text-primary)] tracking-tighter tabular-nums leading-none drop-shadow-lg">
                  {formatTime(timeLeft)}
              </div>
              <div className={`text-sm font-bold uppercase tracking-[0.3em] mt-4 px-4 py-1 rounded-full border border-${color}-500/30 text-${color}-400 bg-${color}-500/10`}>
                  {isActive ? 'Running' : 'Paused'}
              </div>
           </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center gap-6 w-full justify-center">
            <button 
                onClick={() => resetTimer()}
                className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[var(--input-bg)] border-2 border-[var(--glass-border)] hover:bg-[var(--card-hover)] transition-all active:scale-95 text-[var(--text-secondary)] shadow-lg"
            >
                <RotateCcw className="w-6 h-6" />
            </button>

            <button 
                onClick={toggleTimer}
                className={`flex-1 h-20 rounded-3xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-xl font-bold text-xl gap-3 ${
                    isActive 
                    ? 'bg-[var(--input-bg)] border-2 border-[var(--glass-border)] text-[var(--text-primary)]' 
                    : `bg-gradient-to-r from-${color}-500 to-${color}-600 text-white shadow-${color}-500/30`
                }`}
            >
                {isActive ? (
                    <><Pause className="w-8 h-8 fill-current" /> Pause</>
                ) : (
                    <><Play className="w-8 h-8 fill-current ml-1" /> Start</>
                )}
            </button>
        </div>

      </div>
    </div>
  );
};
