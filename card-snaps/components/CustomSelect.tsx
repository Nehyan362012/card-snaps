import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { soundService } from '../services/soundService';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  icon?: React.ReactNode;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, options, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (newValue: string) => {
    soundService.playClick();
    onChange(newValue);
    setIsOpen(false);
  };

  const selectedLabel = options.find(o => o.value === value)?.label || value;

  return (
    <div className="relative w-full" ref={containerRef}>
      <button 
        type="button"
        onClick={() => { soundService.playClick(); setIsOpen(!isOpen); }}
        className={`flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-200 w-full justify-between border shadow-sm group glass-input ${
            isOpen 
            ? 'bg-[var(--input-bg)] border-indigo-500 ring-2 ring-indigo-500/20 text-[var(--text-primary)]' 
            : 'bg-[var(--input-bg)] border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-indigo-500/50 hover:text-[var(--text-primary)]'
        }`}
      >
        <div className="flex items-center gap-3 truncate">
          {icon && <span className={`transition-colors ${isOpen ? 'text-indigo-500' : 'text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)]'}`}>{icon}</span>}
          <span className="font-bold text-base truncate">{selectedLabel}</span>
        </div>
        <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-500' : 'text-[var(--text-tertiary)]'}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-full bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-2xl shadow-2xl z-[100] overflow-hidden animate-scale-in origin-top ring-1 ring-black/5 p-2 max-h-64 overflow-y-auto custom-scrollbar">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full text-left px-4 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-between group mb-1 last:mb-0 ${
                    option.value === value 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                    : 'text-[var(--text-primary)] hover:bg-[var(--card-hover)]'
                }`}
              >
                <span>{option.label}</span>
                {option.value === value && <Check className="w-4 h-4" />}
              </button>
            ))}
        </div>
      )}
    </div>
  );
};