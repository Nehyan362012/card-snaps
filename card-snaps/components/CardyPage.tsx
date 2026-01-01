import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, UserProfile, Deck, ChatSession, Test, UserStats } from '../types';
import { chatWithCardy } from '../services/geminiService';
import { soundService } from '../services/soundService';
import { api } from '../services/api';
import { Send, Trash2, Paperclip, Plus, X, Image as ImageIcon, Bot, Sparkles, MessageSquare, History } from 'lucide-react';

interface CardyPageProps {
  chatSessions: ChatSession[];
  currentSessionId: string | null;
  onUpdateSessions: (sessions: ChatSession[]) => void;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  userProfile?: UserProfile;
  decks?: Deck[];
  tests?: Test[];
  stats?: UserStats;
}

export const CardyPage: React.FC<CardyPageProps> = ({ 
    chatSessions, 
    currentSessionId, 
    onUpdateSessions, 
    onSelectSession, 
    onCreateSession,
    userProfile, 
    decks = [],
    tests = [],
    stats = null
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showHistoryMobile, setShowHistoryMobile] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentSession = chatSessions.find(s => s.id === currentSessionId);
  const messages = currentSession ? currentSession.messages : [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, selectedImage]);

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;
    if (!currentSession) {
        onCreateSession();
        // Allow state to propagate in App
    }

    soundService.playPop();
    const userMsg: ChatMessage = { 
        role: 'user', 
        text: input, 
        timestamp: Date.now(),
        image: selectedImage || undefined
    };
    
    // Optimistic Update
    const updatedMessages = [...messages, userMsg];
    updateCurrentSession(updatedMessages);
    
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const responseText = await chatWithCardy(updatedMessages, userMsg.text, userMsg.image || null, decks, tests, stats);
      const botMsg: ChatMessage = { role: 'model', text: responseText || "I'm thinking...", timestamp: Date.now() };
      updateCurrentSession([...updatedMessages, botMsg]);
      soundService.playSuccess();
    } catch (e: any) {
      const errorText = e.message.includes('limit') ? e.message : "Oops, I had a brain freeze. Try again?";
      const errorMsg: ChatMessage = { role: 'model', text: errorText, timestamp: Date.now() };
      updateCurrentSession([...updatedMessages, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCurrentSession = async (newMessages: ChatMessage[]) => {
      if (!currentSessionId) return;
      
      const sessionToUpdate = chatSessions.find(s => s.id === currentSessionId);
      if (!sessionToUpdate) return;

      const updatedSession = {
          ...sessionToUpdate,
          messages: newMessages,
          lastActive: Date.now(),
          title: sessionToUpdate.messages.length === 0 && newMessages.length > 0 
            ? newMessages[0].text.slice(0, 30) + (newMessages[0].text.length > 30 ? '...' : '') 
            : sessionToUpdate.title
      };

      // Local State Update
      const updatedSessions = chatSessions.map(s => s.id === currentSessionId ? updatedSession : s);
      updatedSessions.sort((a,b) => b.lastActive - a.lastActive);
      onUpdateSessions(updatedSessions);

      // Backend Sync
      await api.saveChatSession(updatedSession);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setSelectedImage(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const formatTime = (timestamp: number) => {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-[calc(100dvh)] md:h-[calc(100vh)] flex overflow-hidden animate-fade-in-up">
        {/* Sidebar - History */}
        <div className={`fixed inset-0 z-40 bg-black/80 md:static md:bg-[var(--glass-bg)] md:w-80 md:border-r border-[var(--glass-border)] md:flex flex-col p-6 backdrop-blur-xl transition-transform duration-300 ${showHistoryMobile ? 'flex' : 'hidden'}`}>
            <button 
                onClick={() => setShowHistoryMobile(false)}
                className="absolute top-4 right-4 md:hidden text-white"
            >
                <X className="w-6 h-6" />
            </button>

            <button 
                onClick={() => { onCreateSession(); setShowHistoryMobile(false); }}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 mb-8 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
            >
                <Plus className="w-5 h-5" /> NEW CHAT
            </button>

            <div className="mb-4 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-widest flex items-center gap-2">
                <History className="w-4 h-4" /> History
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                {chatSessions.length > 0 ? (
                    chatSessions.map(session => (
                        <button 
                            key={session.id}
                            onClick={() => { onSelectSession(session.id); setShowHistoryMobile(false); }}
                            className={`w-full text-left p-4 rounded-2xl border transition-all ${session.id === currentSessionId ? 'bg-[var(--input-bg)] border-indigo-500/50 shadow-md' : 'border-transparent hover:bg-[var(--glass-bg)] hover:border-[var(--glass-border)]'}`}
                        >
                            <div className="text-sm font-bold text-[var(--text-primary)] truncate">{session.title}</div>
                            <div className="text-xs text-[var(--text-secondary)] mt-1 flex justify-between">
                                <span>{new Date(session.lastActive).toLocaleDateString()}</span>
                                <span>{session.messages.length} msgs</span>
                            </div>
                        </button>
                    ))
                ) : (
                    <div className="text-sm text-[var(--text-tertiary)] italic text-center py-4">No history yet</div>
                )}
            </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col relative bg-transparent w-full">
            {/* Header */}
            <div className="h-20 border-b border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md flex items-center px-6 md:px-10 justify-between sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setShowHistoryMobile(true)}
                        className="md:hidden p-2 -ml-2 text-[var(--text-secondary)]"
                    >
                        <History className="w-6 h-6" />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/30">
                         <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="font-bold text-[var(--text-primary)] uppercase tracking-wider text-sm">Snaps Intelligence</div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] font-bold text-emerald-500 uppercase">Online</span>
                        </div>
                    </div>
                </div>
                {messages.length > 0 && (
                    <button 
                        onClick={() => {
                             if(confirm("Clear current chat messages?")) updateCurrentSession([]);
                        }} 
                        className="p-2 text-[var(--text-tertiary)] hover:text-red-500 transition-colors"
                        title="Clear messages"
                    >
                        <Trash2 className="w-5 h-5"/>
                    </button>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8" ref={scrollRef}>
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center opacity-70">
                        <div className="w-24 h-24 rounded-3xl bg-[var(--input-bg)] flex items-center justify-center mb-6 border border-[var(--glass-border)] animate-float">
                            <Bot className="w-12 h-12 text-indigo-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Hello, {userProfile?.name}!</h3>
                        <p className="text-[var(--text-secondary)] font-medium text-center max-w-md">
                            I'm Snaps. I can help you study your decks, explain concepts, or just chat.
                        </p>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`flex w-full animate-pop-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex max-w-[85%] md:max-w-[70%] gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Avatar */}
                            <div className="flex-shrink-0 mt-auto">
                                {msg.role === 'user' ? (
                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white overflow-hidden shadow-md border-2 border-[var(--glass-border)]">
                                        {userProfile?.avatar ? <img src={userProfile.avatar} className="w-full h-full object-cover" /> : "U"}
                                    </div>
                                ) : (
                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md border-2 border-[var(--glass-border)]">
                                        <Bot className="w-5 h-5" />
                                    </div>
                                )}
                            </div>

                            {/* Bubble */}
                            <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div 
                                    className={`relative p-4 md:p-6 shadow-sm text-sm md:text-base leading-relaxed break-words border ${
                                        msg.role === 'user' 
                                        ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-[2rem] rounded-br-none shadow-indigo-500/20 border-white/10' 
                                        : 'glass-panel text-[var(--text-primary)] rounded-[2rem] rounded-bl-none border-[var(--glass-border)]'
                                    }`}
                                >
                                    {msg.image && (
                                        <div className="mb-3 rounded-xl overflow-hidden border border-white/20">
                                            <img src={msg.image} alt="User upload" className="max-w-full max-h-60 object-cover" />
                                        </div>
                                    )}
                                    {msg.text}
                                </div>
                                <span className="text-[10px] font-bold text-[var(--text-tertiary)] mt-2 mx-2">
                                    {formatTime(msg.timestamp)}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
                
                {isLoading && (
                    <div className="flex w-full justify-start">
                         <div className="flex max-w-[70%] gap-4">
                            <div className="flex-shrink-0 mt-auto">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md border-2 border-[var(--glass-border)]">
                                    <Bot className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="glass-panel p-5 rounded-[2rem] rounded-bl-none border-[var(--glass-border)] flex items-center gap-2">
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                            </div>
                         </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 md:p-6 bg-[var(--glass-bg)] border-t border-[var(--glass-border)] backdrop-blur-xl">
                <div className="max-w-4xl mx-auto relative">
                    {selectedImage && (
                        <div className="absolute bottom-full mb-4 left-0 p-3 bg-[var(--glass-bg)] backdrop-blur-md rounded-2xl shadow-xl border border-[var(--glass-border)] flex items-center gap-3 animate-pop-in">
                            <img src={selectedImage} className="w-12 h-12 object-cover rounded-xl" />
                            <span className="text-xs font-bold text-[var(--text-secondary)]">Image attached</span>
                            <button onClick={() => setSelectedImage(null)} className="p-1 hover:bg-[var(--card-hover)] rounded-full text-[var(--text-tertiary)]"><X className="w-4 h-4" /></button>
                        </div>
                    )}
                    
                    <div className="flex items-center gap-3 bg-[var(--input-bg)] p-2 rounded-[2rem] border border-[var(--glass-border)] focus-within:ring-2 ring-indigo-500/30 transition-all shadow-inner">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-12 h-12 rounded-full bg-[var(--glass-bg)] hover:bg-[var(--card-hover)] flex items-center justify-center text-[var(--text-secondary)] hover:text-indigo-400 transition-colors border border-[var(--glass-border)]"
                        >
                            <Paperclip className="w-5 h-5" />
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleImageUpload}
                        />

                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask Snaps anything..."
                            className="flex-1 bg-transparent outline-none text-[var(--text-primary)] placeholder-[var(--text-tertiary)] font-medium px-2 text-base"
                        />

                        <button 
                            onClick={handleSend}
                            disabled={!input.trim() && !selectedImage}
                            className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:scale-90 hover:scale-105"
                        >
                            <Send className="w-5 h-5 ml-0.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};