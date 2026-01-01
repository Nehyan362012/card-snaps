
import React, { useState, useEffect, useMemo } from 'react';
import { Deck, Note } from '../types';
import { soundService } from '../services/soundService';
import { api, CommunityItem } from '../services/api';
import { Globe, Download, Search, Tag, BookOpen, User, Loader2, StickyNote, RefreshCw, Share2, Play, Layout, WifiOff } from 'lucide-react';

interface ExplorePageProps {
  onImport: (item: Deck | Note, type: 'deck' | 'note') => void;
  onUseTemp: (item: Deck | Note, type: 'deck' | 'note') => void;
  themeColor: string;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({ onImport, onUseTemp, themeColor }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<CommunityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
      const handleStatusChange = () => {
          setIsOffline(!navigator.onLine);
      };
      window.addEventListener('online', handleStatusChange);
      window.addEventListener('offline', handleStatusChange);
      return () => {
          window.removeEventListener('online', handleStatusChange);
          window.removeEventListener('offline', handleStatusChange);
      };
  }, []);

  const fetchCommunity = async () => {
      setLoading(true);
      try {
          const fetchedItems = await api.getCommunityItems();
          setItems(fetchedItems);
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchCommunity();
  }, []);

  const handleImport = async (item: CommunityItem) => {
      setProcessingId(item.id);
      soundService.playClick();
      
      try {
          if (item.type === 'deck') {
              const template = item.data as Deck;
              const newDeck: Deck = {
                  ...template,
                  id: crypto.randomUUID(),
                  cards: template.cards.map((c: any) => ({...c, id: crypto.randomUUID()})),
                  createdAt: Date.now()
              };
              onImport(newDeck, 'deck');
          } else {
              const template = item.data as Note;
              const newNote: Note = {
                  ...template,
                  id: crypto.randomUUID(),
                  createdAt: Date.now(),
                  lastModified: Date.now()
              };
              onImport(newNote, 'note');
          }
          await api.incrementDownload(item.id);
          soundService.playSuccess();
      } catch (e) {
          alert("Import failed");
      } finally {
          setProcessingId(null);
      }
  };

  const handleUseTemp = (item: CommunityItem) => {
      soundService.playPop();
      onUseTemp(item.data, item.type);
  };

  const filteredItems = useMemo(() => {
      return items.filter(item => 
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.author.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [searchQuery, items]);

  return (
    <div className="p-4 md:p-12 animate-fade-in-up pb-32 max-w-[1400px] mx-auto">
        <div className="text-center mb-10">
            <h1 className="text-4xl md:text-6xl font-extrabold text-[var(--text-primary)] mb-4 flex items-center justify-center gap-4">
                <Globe className={`w-10 h-10 md:w-16 md:h-16 text-${themeColor}-500`} /> 
                Community Hub
            </h1>
            <p className="text-[var(--text-secondary)] text-lg md:text-xl max-w-2xl mx-auto">
                Discover, share, and study decks from students worldwide.
            </p>
            {isOffline && (
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse">
                    <WifiOff className="w-3 h-3" /> Offline Mode: Showing Saved Items Only
                </div>
            )}
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12 relative flex gap-2">
            <div className="relative flex-1">
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search decks, notes, authors..." 
                    className="w-full bg-[var(--input-bg)] glass-input border border-[var(--glass-border)] rounded-full py-4 pl-12 pr-6 text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-lg"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
            </div>
            <button 
                onClick={() => { soundService.playClick(); fetchCommunity(); }}
                className="p-4 rounded-full bg-[var(--input-bg)] border border-[var(--glass-border)] hover:bg-[var(--card-hover)] text-[var(--text-primary)] transition-colors"
                title="Refresh"
            >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
        </div>

        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
                <p className="font-bold text-[var(--text-secondary)]">Connecting to Community...</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.length > 0 ? filteredItems.map((item, i) => (
                    <div key={item.id} className="glass-panel p-6 rounded-[2rem] border border-[var(--glass-border)] hover:-translate-y-2 transition-all duration-300 hover:shadow-2xl flex flex-col h-full group animate-pop-in" style={{ animationDelay: `${i * 50}ms` }}>
                        
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${item.type === 'deck' ? `bg-${themeColor}-500/10 text-${themeColor}-500` : 'bg-orange-500/10 text-orange-500'} group-hover:bg-white group-hover:text-black transition-colors`}>
                                {item.type === 'deck' ? <BookOpen className="w-6 h-6" /> : <StickyNote className="w-6 h-6" />}
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="px-3 py-1 rounded-full bg-[var(--input-bg)] border border-[var(--glass-border)] text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1 mb-1">
                                    {item.type === 'deck' ? <><Tag className="w-3 h-3" /> {(item.data as Deck).cards?.length || 0} Cards</> : 'Note'}
                                </div>
                                <div className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1">
                                    <Download className="w-3 h-3" /> {item.downloads}
                                </div>
                            </div>
                        </div>
                        
                        {/* Content Info */}
                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1 line-clamp-1">{item.title}</h3>
                        <div className="flex items-center gap-2 mb-4">
                            <User className="w-3 h-3 text-[var(--text-tertiary)]" />
                            <span className="text-xs font-bold text-[var(--text-tertiary)]">{item.author}</span>
                        </div>
                        
                        <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed flex-1 line-clamp-3">{item.description}</p>
                        
                        {/* Actions */}
                        <div className="flex gap-3 mt-auto pt-6 border-t border-[var(--glass-border)]">
                            <button 
                                onClick={() => handleUseTemp(item)}
                                className="flex-1 py-3 rounded-xl bg-[var(--input-bg)] border border-[var(--glass-border)] hover:bg-[var(--card-hover)] font-bold text-[var(--text-primary)] transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                            >
                                <Play className="w-4 h-4" /> Use Now
                            </button>
                            <button 
                                onClick={() => handleImport(item)}
                                disabled={processingId === item.id}
                                className={`flex-1 py-3 rounded-xl bg-gradient-to-r from-${themeColor}-600 to-${themeColor}-500 hover:brightness-110 font-bold text-white transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-lg disabled:opacity-70`}
                            >
                                {processingId === item.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4" />}
                                Save
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full text-center py-20 text-[var(--text-tertiary)] border-2 border-dashed border-[var(--glass-border)] rounded-[3rem]">
                        <Layout className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p className="text-xl font-bold">No items found.</p>
                        <p className="text-sm mt-2">{isOffline ? "Go online to find new resources." : "Try a different search or check back later."}</p>
                    </div>
                )}
            </div>
        )}
        
        <div className="mt-16 text-center text-[var(--text-tertiary)] text-xs max-w-lg mx-auto leading-relaxed border-t border-[var(--glass-border)] pt-8">
            <p className="opacity-70">To access content created by the community, users must be online.</p>
        </div>
    </div>
  );
};
