import React from 'react';
import { Card as CardType } from '../types';
import { soundService } from '../services/soundService';

interface CardProps {
  card: CardType;
  isFlipped: boolean;
  onFlip: () => void;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  card, 
  isFlipped, 
  onFlip, 
  className = '', 
  style = {},
  disabled = false
}) => {
  
  const handleClick = () => {
    if (disabled) return;
    soundService.playFlip();
    onFlip();
  };

  return (
    <div 
      className={`relative w-full h-full cursor-pointer perspective-1000 group ${className}`}
      onClick={handleClick}
      style={style}
    >
      <div 
        className={`w-full h-full duration-700 transform-style-3d transition-transform cubic-bezier(0.4, 0, 0.2, 1) shadow-2xl rounded-3xl border-2 border-white/20 ${isFlipped ? 'rotate-y-180' : ''}`}
      >
        {/* Front */}
        <div 
          className={`absolute w-full h-full backface-hidden rounded-3xl flex flex-col items-center justify-center p-8 text-center select-none ${card.color} text-slate-800 shadow-[inset_0_2px_20px_rgba(0,0,0,0.1)]`}
        >
           {/* Subtle texture overlay */}
           <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none rounded-3xl"></div>
           
           <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
             <div className="absolute top-0 left-0 text-[10px] font-bold opacity-40 uppercase tracking-[0.2em] text-slate-900 border border-slate-900/20 px-3 py-1 rounded-full">Question</div>
             <div className="text-3xl font-bold leading-relaxed drop-shadow-sm text-slate-800">{card.front}</div>
             <div className="absolute bottom-0 text-[10px] font-medium opacity-50 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-1 bg-slate-800 rounded-full animate-pulse"></span>
                Tap to flip
                <span className="w-1 h-1 bg-slate-800 rounded-full animate-pulse"></span>
             </div>
           </div>
        </div>

        {/* Back */}
        <div 
          className={`absolute w-full h-full backface-hidden rounded-3xl rotate-y-180 flex flex-col items-center justify-center p-8 text-center select-none bg-slate-800 text-white shadow-[inset_0_2px_20px_rgba(0,0,0,0.3)] border border-white/10`}
        >
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none rounded-3xl"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent rounded-3xl pointer-events-none"></div>

          <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
            <div className="absolute top-0 left-0 text-[10px] font-bold opacity-50 uppercase tracking-[0.2em] text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full">Answer</div>
            <div className="text-2xl font-medium leading-relaxed text-slate-100">{card.back}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
