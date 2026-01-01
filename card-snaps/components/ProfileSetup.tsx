import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { Camera, User, ArrowRight, Upload, GraduationCap } from 'lucide-react';
import { soundService } from '../services/soundService';
import { CustomSelect } from './CustomSelect';

interface ProfileSetupProps {
  onSave: (profile: UserProfile) => void;
}

const GRADES = [
    "Kindergarten", "1st Grade", "2nd Grade", "3rd Grade", "4th Grade", "5th Grade",
    "6th Grade", "7th Grade", "8th Grade", "9th Grade (Freshman)", "10th Grade (Sophomore)",
    "11th Grade (Junior)", "12th Grade (Senior)", "University (Year 1)", "University (Year 2)",
    "University (Year 3)", "University (Year 4+)", "Post-Graduate/Masters", "PhD"
];

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ onSave }) => {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string>('');
  const [grade, setGrade] = useState(GRADES[9]); // Default 10th
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      soundService.playClick();
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      soundService.playSuccess();
      onSave({
        name,
        avatar: avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + name,
        gradeLevel: grade
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 animate-fade-in-up">
      <div className="max-w-md w-full glass-panel p-8 md:p-12 rounded-[2.5rem] relative shadow-[0_0_100px_rgba(99,102,241,0.15)] border-[var(--glass-border)] bg-[var(--glass-bg)]">
        
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-6 animate-float">
             <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] mb-2">Welcome!</h1>
          <p className="text-[var(--text-secondary)]">Let's set up your profile to get started.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center">
             <div 
               className="relative group cursor-pointer"
               onClick={() => fileInputRef.current?.click()}
             >
                <div className={`w-32 h-32 rounded-full border-4 border-[var(--glass-border)] shadow-2xl overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:border-indigo-500/50 ${!avatar ? 'bg-[var(--input-bg)] flex items-center justify-center' : ''}`}>
                    {avatar ? (
                        <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <Camera className="w-10 h-10 text-[var(--text-tertiary)] group-hover:text-indigo-500 transition-colors" />
                    )}
                </div>
                <div className="absolute bottom-0 right-0 p-2.5 bg-indigo-600 rounded-full text-white shadow-lg transform translate-y-1 translate-x-1 group-hover:scale-110 transition-transform">
                    <Upload className="w-4 h-4" />
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange}
                />
             </div>
             <p className="mt-3 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Tap to upload photo</p>
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-tertiary)] mb-2 uppercase tracking-wider pl-4">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Smith"
              className="w-full bg-[var(--input-bg)] glass-input border border-[var(--glass-border)] rounded-2xl px-6 py-4 text-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all shadow-inner"
              autoFocus
            />
          </div>

          {/* Grade Input */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-tertiary)] mb-2 uppercase tracking-wider pl-4">Grade / Level</label>
            <CustomSelect 
                value={grade}
                onChange={setGrade}
                options={GRADES.map(g => ({ value: g, label: g }))}
                icon={<GraduationCap className="w-5 h-5" />}
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold text-white text-lg shadow-xl shadow-indigo-500/20 transition-all hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2 group"
          >
            Get Started <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
};