import React, { useState } from 'react';
import { ArrowRight, Sparkles, Zap, BrainCircuit } from 'lucide-react';
import { soundService } from '../services/soundService';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [slide, setSlide] = useState(0);

  const nextSlide = () => {
    soundService.playClick();
    if (slide < 2) {
      setSlide(slide + 1);
    } else {
      soundService.playSuccess();
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[var(--glass-bg)] backdrop-blur-3xl flex items-center justify-center overflow-hidden transition-colors duration-500">
        {/* Background Animation - Adjusted for visibility in Light Mode */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50 dark:opacity-100">
            <div className={`absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/30 rounded-full blur-[100px] animate-blob transition-all duration-1000 ${slide === 1 ? 'bg-purple-500/30' : slide === 2 ? 'bg-emerald-500/30' : ''}`}></div>
            <div className={`absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-[100px] animate-blob animation-delay-2000 transition-all duration-1000 ${slide === 1 ? 'bg-pink-500/30' : slide === 2 ? 'bg-cyan-500/30' : ''}`}></div>
        </div>

        <div className="relative z-10 max-w-md w-full p-8 flex flex-col items-center text-center">
            
            {/* Slide Content */}
            <div className="mb-12 min-h-[300px] flex flex-col items-center justify-center">
                {slide === 0 && (
                    <div className="animate-pop-in">
                        <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-indigo-500/30 mb-8 animate-float mx-auto">
                            <Zap className="w-16 h-16 text-white" />
                        </div>
                        <h1 className="text-4xl font-extrabold text-[var(--text-primary)] mb-4">Card Snaps</h1>
                        <p className="text-[var(--text-secondary)] text-lg font-medium">The ultimate flashcard experience.</p>
                    </div>
                )}
                
                {slide === 1 && (
                    <div className="animate-slide-in-right">
                        <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-pink-500/30 mb-8 animate-float mx-auto">
                            <Sparkles className="w-16 h-16 text-white" />
                        </div>
                        <h1 className="text-4xl font-extrabold text-[var(--text-primary)] mb-4">AI Powered</h1>
                        <p className="text-[var(--text-secondary)] text-lg font-medium">Turn notes into decks instantly with Gemini.</p>
                    </div>
                )}

                {slide === 2 && (
                    <div className="animate-slide-in-right">
                        <div className="w-32 h-32 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-emerald-500/30 mb-8 animate-float mx-auto">
                            <BrainCircuit className="w-16 h-16 text-white" />
                        </div>
                        <h1 className="text-4xl font-extrabold text-[var(--text-primary)] mb-4">Smart Study</h1>
                        <p className="text-[var(--text-secondary)] text-lg font-medium">Master any subject with Spaced Repetition.</p>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center gap-8 w-full">
                <div className="flex gap-2">
                    {[0, 1, 2].map(i => (
                        <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === slide ? 'w-8 bg-indigo-500' : 'w-2 bg-[var(--text-tertiary)] opacity-30'}`} />
                    ))}
                </div>

                <button 
                    onClick={nextSlide}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-indigo-600/20"
                >
                    <span>{slide === 2 ? 'Get Started' : 'Next'}</span> <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    </div>
  );
};