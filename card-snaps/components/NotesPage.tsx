
import React, { useState } from 'react';
import { Note } from '../types';
import { soundService } from '../services/soundService';
import { api } from '../services/api';
import { Plus, StickyNote, Edit2, Trash2, Globe, Loader2, Check } from 'lucide-react';

interface NotesPageProps {
  notes: Note[];
  onCreateNote: () => void;
  onEditNote: (id: string) => void;
  onDeleteNote: (e: React.MouseEvent, id: string) => void;
  themeColor: string;
}

export const NotesPage: React.FC<NotesPageProps> = ({ notes, onCreateNote, onEditNote, onDeleteNote, themeColor }) => {
  const [sharingId, setSharingId] = useState<string | null>(null);

  const handleCommunityShare = async (e: React.MouseEvent, note: Note) => {
        e.stopPropagation();
        if (sharingId) return;
        
        setSharingId(note.id);
        soundService.playClick();

        try {
            const user = await api.getMe();
            const author = user?.name || 'Anonymous Student';
            
            await api.shareToCommunity(note, 'note', author);
            soundService.playSuccess();
            alert(`"${note.title}" published to Community!`);
        } catch (error: any) {
            alert(error.message || "Failed to share.");
        } finally {
            setSharingId(null);
        }
  };

  return (
    <div className="p-6 md:p-12 animate-fade-in-up">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
            <div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] mb-2 flex items-center gap-4">
                    <StickyNote className={`w-10 h-10 md:w-12 md:h-12 text-${themeColor}-500`} /> Notes
                </h1>
                <p className="text-[var(--text-secondary)] text-lg">Your knowledge base, organized.</p>
            </div>
            <button 
                onClick={onCreateNote}
                className={`px-8 py-4 bg-${themeColor}-600 hover:bg-${themeColor}-500 text-white rounded-2xl font-bold shadow-lg shadow-${themeColor}-500/30 hover:-translate-y-1 transition-all flex items-center gap-2`}
            >
                <Plus className="w-5 h-5" /> Create Note
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {notes.map((note, index) => (
                <div 
                    key={note.id}
                    onClick={() => onEditNote(note.id)}
                    style={{ animationDelay: `${index * 50}ms` }}
                    className="glass-panel group relative rounded-[2rem] p-6 md:p-8 hover:bg-[var(--card-hover)] transition-all duration-500 hover:-translate-y-2 animate-pop-in flex flex-col hover:shadow-2xl cursor-pointer"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className={`px-3 py-1 rounded-lg bg-${themeColor}-500/10 text-${themeColor}-500 text-xs font-bold uppercase tracking-wide border border-${themeColor}-500/20`}>
                            {note.subject || 'General'}
                        </div>
                        
                        <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <button 
                                onClick={(e) => handleCommunityShare(e, note)} 
                                disabled={sharingId === note.id}
                                className="p-2 text-[var(--text-tertiary)] hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-colors" 
                                title="Share to Community"
                            >
                                {sharingId === note.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Globe className="w-4 h-4" />}
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDeleteNote(e, note.id); }} 
                                className="p-2 text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 line-clamp-2">{note.title || 'Untitled Note'}</h3>
                    <div className="text-xs text-[var(--text-tertiary)] font-mono mb-4">
                        {new Date(note.lastModified).toLocaleDateString()}
                    </div>
                    
                    <div className="flex-1 overflow-hidden relative">
                         <div className="text-[var(--text-secondary)] text-sm line-clamp-4 leading-relaxed opacity-70">
                            {note.content.replace(/<[^>]*>?/gm, '') || 'No content...'}
                         </div>
                         <div className="absolute bottom-0 w-full h-8 bg-gradient-to-t from-[var(--glass-bg)] to-transparent"></div>
                    </div>
                </div>
            ))}
            
            {notes.length === 0 && (
                 <div className="col-span-full p-12 text-center text-[var(--text-tertiary)] border-2 border-dashed border-[var(--glass-border)] rounded-[3rem]">
                    <p className="text-xl font-bold mb-4">No notes yet.</p>
                    <button onClick={onCreateNote} className={`text-${themeColor}-500 font-bold hover:underline`}>Create your first note</button>
                 </div>
            )}
        </div>
    </div>
  );
};
