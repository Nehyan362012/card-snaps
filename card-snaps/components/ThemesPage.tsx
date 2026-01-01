
import React from 'react';
import { ThemeMode, ColorScheme } from '../types';
import { Sun, Moon, Palette, Check, CalendarDays, Lock } from 'lucide-react';
import { soundService } from '../services/soundService';

interface ThemesPageProps {
  themeMode: ThemeMode;
  onToggleTheme: () => void;
  colorScheme: ColorScheme;
  onSelectColorScheme: (scheme: ColorScheme) => void;
  enableSeasonal: boolean;
  onToggleSeasonal: () => void;
}

const SCHEMES: { id: ColorScheme; label: string; colors: string[] }[] = [
  { id: 'midnight', label: 'Midnight', colors: ['#0f172a', '#1e293b'] },
  { id: 'ocean', label: 'Ocean', colors: ['#0c4a6e', '#0369a1'] },
  { id: 'forest', label: 'Forest', colors: ['#064e3b', '#059669'] },
  { id: 'berry', label: 'Berry', colors: ['#4a044e', '#9333ea'] },
  { id: 'sunset', label: 'Sunset', colors: ['#7c2d12', '#ea580c'] },
  { id: 'crimson', label: 'Crimson', colors: ['#7f1d1d', '#ef4444'] },
];

export const ThemesPage: React.FC<ThemesPageProps> = ({
  themeMode,
  onToggleTheme,
  colorScheme,
  onSelectColorScheme,
  enableSeasonal,
  onToggleSeasonal
}) => {
  return (
    <div className="max-w-4xl mx-auto p-8 pt-24 md:pt-8 animate-fade-in-up pb-24">
      <h2 className="text-4xl font-extrabold text-[var(--text-primary)] mb-2">Themes & Appearance</h2>
      <p className="text-[var(--text-secondary)] mb-10 text-lg">Customize your study environment.</p>

      {/* Mode Section */}
      <section className="mb-12">
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2 justify-between">
           <span className="flex items-center gap-2"><Sun className="w-5 h-5" /> Mode</span>
           {enableSeasonal && <span className="text-xs font-bold text-emerald-500 uppercase flex items-center gap-1"><Lock className="w-3 h-3"/> Locked by Seasonal Event</span>}
        </h3>
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${enableSeasonal ? 'opacity-50 pointer-events-none' : ''}`}>
           <button
             onClick={() => { if(themeMode !== 'light') { soundService.playClick(); onToggleTheme(); } }}
             className={`p-6 rounded-3xl border-2 transition-all flex items-center gap-4 group ${themeMode === 'light' ? 'bg-indigo-500/10 border-indigo-500' : 'glass-panel border-transparent hover:border-[var(--glass-border)]'}`}
           >
             <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-500">
               <Sun className="w-6 h-6" />
             </div>
             <div className="text-left">
                <div className={`font-bold text-lg ${themeMode === 'light' ? 'text-indigo-600 dark:text-indigo-400' : 'text-[var(--text-primary)]'}`}>Light Mode</div>
                <div className="text-sm text-[var(--text-secondary)]">Clean and bright</div>
             </div>
             {themeMode === 'light' && <Check className="ml-auto w-6 h-6 text-indigo-500" />}
           </button>

           <button
             onClick={() => { if(themeMode !== 'dark') { soundService.playClick(); onToggleTheme(); } }}
             className={`p-6 rounded-3xl border-2 transition-all flex items-center gap-4 group ${themeMode === 'dark' ? 'bg-indigo-500/10 border-indigo-500' : 'glass-panel border-transparent hover:border-[var(--glass-border)]'}`}
           >
             <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400">
               <Moon className="w-6 h-6" />
             </div>
             <div className="text-left">
                <div className={`font-bold text-lg ${themeMode === 'dark' ? 'text-indigo-400' : 'text-[var(--text-primary)]'}`}>Dark Mode</div>
                <div className="text-sm text-[var(--text-secondary)]">Easy on the eyes</div>
             </div>
             {themeMode === 'dark' && <Check className="ml-auto w-6 h-6 text-indigo-500" />}
           </button>
        </div>
      </section>

      {/* Seasonal Section */}
      <section className="mb-12">
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
           <CalendarDays className="w-5 h-5" /> Seasonal Events
        </h3>
        <div className="glass-panel p-6 rounded-[2rem] border border-[var(--glass-border)] flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg">
                    <CalendarDays className="w-6 h-6" />
                </div>
                <div>
                    <div className="font-bold text-lg text-[var(--text-primary)]">Enable Seasonal Themes</div>
                    <div className="text-sm text-[var(--text-secondary)]">Optimized for Light Mode</div>
                </div>
            </div>
            
            <button 
                onClick={() => { soundService.playClick(); onToggleSeasonal(); }}
                className={`w-16 h-9 rounded-full p-1 transition-all duration-300 shadow-inner ${enableSeasonal ? 'bg-emerald-500' : 'bg-slate-700'}`}
            >
                <div className={`w-7 h-7 bg-white rounded-full shadow-md transform transition-transform duration-300 ${enableSeasonal ? 'translate-x-7' : 'translate-x-0'}`}></div>
            </button>
        </div>
      </section>

      {/* Color Scheme Section */}
      <section className={`${enableSeasonal ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'} transition-all duration-500`}>
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2 justify-between">
           <span className="flex items-center gap-2"><Palette className="w-5 h-5" /> Color Scheme</span>
           {enableSeasonal && <span className="text-xs font-bold text-emerald-500 uppercase flex items-center gap-1"><Lock className="w-3 h-3"/> Locked by Seasonal Event</span>}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
           {SCHEMES.map(scheme => (
             <button
                key={scheme.id}
                onClick={() => { soundService.playClick(); onSelectColorScheme(scheme.id); }}
                className={`group relative overflow-hidden p-6 rounded-3xl border-2 transition-all text-left glass-panel ${colorScheme === scheme.id ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-transparent hover:border-[var(--glass-border)]'}`}
             >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                
                <div className="flex gap-2 mb-4">
                   {scheme.colors.map(c => (
                     <div key={c} className="w-8 h-8 rounded-full shadow-lg" style={{ backgroundColor: c }}></div>
                   ))}
                </div>
                
                <div className="font-bold text-lg text-[var(--text-primary)]">{scheme.label}</div>
                <div className="text-sm text-[var(--text-secondary)]">Gradient atmosphere</div>
                
                {colorScheme === scheme.id && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
             </button>
           ))}
        </div>
      </section>
    </div>
  );
};
