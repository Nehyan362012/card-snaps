
import React from 'react';
import { LayoutDashboard, WalletCards, PlusCircle, GraduationCap, Palette, LayoutGrid, Bot, Sparkles, Gamepad2, Trophy, StickyNote, Anchor, Zap, BookOpen, Calculator, Book, Globe, Clock } from 'lucide-react';
import { AppView, UserProfile, ColorScheme, SeasonalEvent } from '../types';
import { soundService } from '../services/soundService';

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  userProfile?: UserProfile;
  className?: string;
  themeColor?: string; // e.g. 'indigo', 'cyan', 'red'
  activeEvent?: SeasonalEvent | null;
}

// Helper to map color scheme/event to Tailwind classes
const getThemeStyles = (themeColor: string) => {
    const map: Record<string, { gradient: string, text: string, border: string, bg: string, hoverText: string }> = {
        indigo: { gradient: 'from-indigo-600 to-violet-600', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500', bg: 'bg-indigo-500', hoverText: 'group-hover:text-indigo-500' },
        cyan: { gradient: 'from-cyan-600 to-blue-600', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500', bg: 'bg-cyan-500', hoverText: 'group-hover:text-cyan-500' },
        emerald: { gradient: 'from-emerald-600 to-teal-600', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500', bg: 'bg-emerald-500', hoverText: 'group-hover:text-emerald-500' },
        fuchsia: { gradient: 'from-fuchsia-600 to-pink-600', text: 'text-fuchsia-600 dark:text-fuchsia-400', border: 'border-fuchsia-500', bg: 'bg-fuchsia-500', hoverText: 'group-hover:text-fuchsia-500' },
        orange: { gradient: 'from-orange-600 to-red-600', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500', bg: 'bg-orange-500', hoverText: 'group-hover:text-orange-500' },
        red: { gradient: 'from-red-600 to-rose-600', text: 'text-red-600 dark:text-red-400', border: 'border-red-500', bg: 'bg-red-500', hoverText: 'group-hover:text-red-500' },
        pink: { gradient: 'from-pink-500 to-rose-500', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-500', bg: 'bg-pink-500', hoverText: 'group-hover:text-pink-500' },
        yellow: { gradient: 'from-yellow-500 to-orange-500', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-500', bg: 'bg-yellow-500', hoverText: 'group-hover:text-yellow-500' },
    };
    return map[themeColor] || map['indigo'];
};

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  userProfile,
  className = '',
  themeColor = 'indigo',
  activeEvent
}) => {
  
  const styles = getThemeStyles(themeColor);

  const NavItem = ({ view, icon: Icon, label, highlight = false }: { view: AppView, icon: any, label: string, highlight?: boolean }) => {
    const isActive = currentView === view;
    return (
        <button
        onClick={() => { soundService.playClick(); onNavigate(view); }}
        className={`w-full flex items-center gap-4 px-6 py-4 rounded-3xl transition-all duration-300 group relative overflow-hidden outline-none focus:outline-none focus:ring-0 ${
            isActive
            ? `bg-gradient-to-r ${styles.gradient} text-white font-bold scale-[1.02] shadow-lg` 
            : highlight 
                ? `bg-[var(--input-bg)] text-[var(--text-primary)] hover:bg-[var(--card-hover)] font-semibold`
                : `text-[var(--text-secondary)] hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)] font-medium hover:translate-x-1`
        }`}
        >
        {isActive && <div className="absolute inset-0 bg-white/10 shimmer-bg pointer-events-none"></div>}
        <Icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-white' : highlight ? styles.text : `text-[var(--text-tertiary)] ${styles.hoverText}`} transition-colors`} />
        <span className="text-sm relative z-10">{label}</span>
        {isActive && (
            <div className="ml-auto w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_10px_white]"></div>
        )}
        </button>
    );
  };

  return (
    <div className={`flex flex-col z-50 h-full backdrop-blur-xl bg-[var(--glass-bg)] border-r transition-colors duration-300 ${className}`}
         style={{ borderColor: `var(--glass-border)` }}
    >
      {/* Logo Area */}
      <div className="p-8 mb-2">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${styles.gradient} flex items-center justify-center shadow-lg animate-float group-hover:scale-110 transition-transform duration-500`}>
            <LayoutGrid className="w-6 h-6 text-white" />
          </div>
          <span className="font-extrabold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)] tracking-tight">
            Card Snaps
          </span>
        </div>
      </div>
      
      {/* User Profile Snippet */}
      {userProfile && (
        <div className="px-8 mb-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <div className={`flex items-center gap-3 p-3 bg-[var(--input-bg)] rounded-3xl border border-[var(--glass-border)] backdrop-blur-sm hover:border-opacity-50 transition-colors shadow-sm group hover:${styles.border}`}>
                <img src={userProfile.avatar} alt="User" className={`w-10 h-10 rounded-full border-2 border-[var(--glass-border)] object-cover group-hover:${styles.border}`} />
                <div className="min-w-0">
                    <p className="text-[var(--text-primary)] text-sm font-bold truncate">{userProfile.name}</p>
                    <p className={`text-xs font-medium ${styles.text}`}>Pro Member</p>
                </div>
            </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 px-6 space-y-3 overflow-y-auto custom-scrollbar">
        <div className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-widest px-4 mb-4">Menu</div>
        <NavItem view={AppView.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
        <NavItem view={AppView.PLAY} icon={Trophy} label="Play & Stats" highlight={true} />
        <NavItem view={AppView.LEARN} icon={Gamepad2} label="Learn" />
        <NavItem view={AppView.FOCUS} icon={Clock} label="Focus Timer" />
        <NavItem view={AppView.COMMUNITY} icon={Globe} label="Community" />
        <NavItem view={AppView.RESOURCES} icon={BookOpen} label="Reference Hub" />
        <NavItem view={AppView.SNAP_CARDS} icon={Zap} label="Snap Cards" />
        <NavItem view={AppView.NOTES} icon={StickyNote} label="Notes" />
        <NavItem view={AppView.FLASHCARDS} icon={WalletCards} label="Flashcards" />
        <NavItem view={AppView.PREPARATION} icon={GraduationCap} label="Preparation" />
        <NavItem view={AppView.DOCK} icon={Anchor} label="Dock" />
      </div>

      {/* Footer Nav */}
      <div className="p-6 mx-4 mb-6">
         <NavItem view={AppView.THEMES} icon={Palette} label="Themes" />
      </div>
    </div>
  );
};
