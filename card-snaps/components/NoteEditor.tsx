
import React, { useState, useRef, useEffect } from 'react';
import { Note } from '../types';
import { soundService } from '../services/soundService';
import { ArrowLeft, Save, Bold, Italic, Heading1, Heading2, Grid3X3, AlignLeft, File, Underline, Check, Palette } from 'lucide-react';

interface NoteEditorProps {
  initialNote?: Note;
  onSave: (note: Note) => void;
  onCancel: () => void;
  themeColor: string;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ initialNote, onSave, onCancel, themeColor }) => {
  const [title, setTitle] = useState(initialNote?.title || '');
  const [subject, setSubject] = useState(initialNote?.subject || '');
  const [background, setBackground] = useState<'blank' | 'lined' | 'grid'>(initialNote?.background || 'blank');
  
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      if (contentRef.current && initialNote) {
          contentRef.current.innerHTML = initialNote.content;
      }
  }, []);

  const handleSave = () => {
    soundService.playSuccess();
    onSave({
        id: initialNote?.id || crypto.randomUUID(),
        title: title || 'Untitled Note',
        subject: subject || 'General',
        content: contentRef.current?.innerHTML || '',
        background,
        createdAt: initialNote?.createdAt || Date.now(),
        lastModified: Date.now()
    });
  };

  const execCmd = (command: string, value: string | undefined = undefined) => {
      document.execCommand(command, false, value);
      contentRef.current?.focus();
  };

  const bgStyles = {
      blank: '',
      lined: 'bg-[linear-gradient(var(--line-color)_1px,transparent_1px)] bg-[length:100%_2rem]',
      grid: 'bg-[linear-gradient(var(--line-color)_1px,transparent_1px),linear-gradient(90deg,var(--line-color)_1px,transparent_1px)] bg-[length:20px_20px]'
  };

  // Reusable Button Components for cleaner layout logic
  const BackButton = ({ className = "" }: { className?: string }) => (
    <button onClick={onCancel} className={`p-3 rounded-xl bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex-shrink-0 active:scale-95 transition-transform min-w-[44px] min-h-[44px] flex items-center justify-center ${className}`}>
        <ArrowLeft className="w-5 h-5" />
    </button>
  );

  const SaveButton = ({ className = "" }: { className?: string }) => (
    <button onClick={handleSave} className={`p-3 bg-${themeColor}-600 text-white rounded-xl shadow-lg flex-shrink-0 active:scale-95 transition-transform min-w-[44px] min-h-[44px] flex items-center justify-center ${className}`}>
        <Check className="w-6 h-6" />
    </button>
  );

  return (
    <div className="h-full flex flex-col w-full relative bg-[var(--glass-bg)] md:bg-transparent">
        
        {/* STACKED Sticky Toolbar */}
        <div className="sticky top-0 z-30 w-full bg-[var(--glass-bg)] backdrop-blur-xl border-b border-[var(--glass-border)] shadow-sm px-4 py-3 flex flex-col md:flex-row gap-4 md:gap-3 transition-all">
            
            {/* Mobile: Top Navigation Row */}
            <div className="flex md:hidden items-center justify-between w-full border-b border-[var(--glass-border)] pb-3 mb-1">
                <BackButton />
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] opacity-70">Editing Note</span>
                <SaveButton />
            </div>

            {/* Formatting Tools - Wrapped on Mobile, Row on Desktop */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 w-full md:w-auto">
                {/* Desktop Back Button */}
                <div className="hidden md:block border-r border-[var(--glass-border)] pr-3 mr-1">
                    <BackButton />
                </div>
                
                {/* Text Style Group */}
                <div className="flex items-center bg-[var(--input-bg)] rounded-xl p-1 border border-[var(--glass-border)]">
                    <button onClick={() => execCmd('bold')} className="p-2.5 hover:bg-[var(--glass-bg)] rounded-lg text-[var(--text-primary)]" title="Bold"><Bold className="w-5 h-5" /></button>
                    <button onClick={() => execCmd('italic')} className="p-2.5 hover:bg-[var(--glass-bg)] rounded-lg text-[var(--text-primary)]" title="Italic"><Italic className="w-5 h-5" /></button>
                    <button onClick={() => execCmd('underline')} className="p-2.5 hover:bg-[var(--glass-bg)] rounded-lg text-[var(--text-primary)]" title="Underline"><Underline className="w-5 h-5" /></button>
                </div>

                {/* Heading Group */}
                <div className="flex items-center bg-[var(--input-bg)] rounded-xl p-1 border border-[var(--glass-border)]">
                    <button onClick={() => execCmd('formatBlock', 'H1')} className="p-2.5 hover:bg-[var(--glass-bg)] rounded-lg text-[var(--text-primary)] font-black" title="H1"><Heading1 className="w-5 h-5" /></button>
                    <button onClick={() => execCmd('formatBlock', 'H2')} className="p-2.5 hover:bg-[var(--glass-bg)] rounded-lg text-[var(--text-primary)] font-bold" title="H2"><Heading2 className="w-5 h-5" /></button>
                </div>

                {/* Paper Style Group */}
                <div className="flex items-center bg-[var(--input-bg)] rounded-xl p-1 border border-[var(--glass-border)]">
                    <button onClick={() => setBackground('blank')} className={`p-2.5 rounded-lg transition-colors ${background === 'blank' ? `bg-${themeColor}-500 text-white shadow-sm` : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}><File className="w-5 h-5" /></button>
                    <button onClick={() => setBackground('lined')} className={`p-2.5 rounded-lg transition-colors ${background === 'lined' ? `bg-${themeColor}-500 text-white shadow-sm` : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}><AlignLeft className="w-5 h-5" /></button>
                    <button onClick={() => setBackground('grid')} className={`p-2.5 rounded-lg transition-colors ${background === 'grid' ? `bg-${themeColor}-500 text-white shadow-sm` : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}><Grid3X3 className="w-5 h-5" /></button>
                </div>
            </div>

            {/* Desktop Save Button */}
            <div className="hidden md:flex flex-1 justify-end">
                <SaveButton />
            </div>
        </div>

        {/* Editor Container */}
        <div className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto custom-scrollbar">
            <div className="p-6 md:p-12 pb-40">
                
                {/* Header Inputs - Clean Design */}
                <div className="mb-8 space-y-4">
                    <input 
                        type="text" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Untitled Note"
                        className="w-full bg-transparent text-3xl md:text-5xl font-black text-[var(--text-primary)] outline-none placeholder-[var(--text-tertiary)]"
                    />
                    
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full bg-${themeColor}-500`}></div>
                        <input 
                            type="text" 
                            value={subject} 
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Add Subject..."
                            className="bg-transparent text-[var(--text-secondary)] font-bold uppercase tracking-wider text-xs md:text-sm outline-none placeholder-[var(--text-tertiary)] w-full"
                        />
                    </div>
                </div>

                {/* Content Area */}
                <div className={`min-h-[60vh] outline-none text-lg leading-relaxed text-[var(--text-primary)] ${bgStyles[background]} transition-colors duration-300 rounded-xl p-2`}
                    contentEditable
                    ref={contentRef}
                    suppressContentEditableWarning
                    data-placeholder="Start typing..."
                />
            </div>
        </div>
        
        {/* Style injection for editable content typography & placeholder */}
        <style>{`
           [contenteditable] h1 { font-size: 1.8em; font-weight: 800; margin-bottom: 0.5em; margin-top: 1em; line-height: 1.2; color: var(--text-primary); }
           [contenteditable] h2 { font-size: 1.4em; font-weight: 700; margin-bottom: 0.5em; margin-top: 1em; color: var(--text-primary); }
           [contenteditable] b { font-weight: 800; color: var(--text-primary); }
           [contenteditable] i { font-style: italic; opacity: 0.9; }
           [contenteditable]:empty:before { content: attr(data-placeholder); color: var(--text-tertiary); pointer-events: none; opacity: 0.6; }
           [contenteditable]:focus { outline: none; }
        `}</style>
    </div>
  );
};
