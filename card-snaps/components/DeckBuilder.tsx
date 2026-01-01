import React, { useState } from 'react';
import { Deck, Card, CARD_COLORS } from '../types';
import { soundService } from '../services/soundService';
import { Plus, Trash2, ArrowLeft, Save, MoveRight } from 'lucide-react';

interface DeckBuilderProps {
  onSave: (deck: Deck) => void;
  onCancel: () => void;
  initialDeck?: Deck;
  allDecks: Deck[];
  onMoveCard: (card: Card, targetDeckId: string) => void;
}

export const DeckBuilder: React.FC<DeckBuilderProps> = ({ onSave, onCancel, initialDeck, allDecks, onMoveCard }) => {
  const [title, setTitle] = useState(initialDeck?.title || '');
  const [description, setDescription] = useState(initialDeck?.description || '');
  const [cards, setCards] = useState<Card[]>(initialDeck?.cards || []);
  
  // New Card State
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [selectedColor, setSelectedColor] = useState(CARD_COLORS[0]);

  // Move Modal State
  const [cardToMove, setCardToMove] = useState<Card | null>(null);

  const handleAddCard = () => {
    if (!front.trim() || !back.trim()) return;
    
    soundService.playPop();
    const newCard: Card = {
      id: crypto.randomUUID(),
      front,
      back,
      color: selectedColor
    };
    
    setCards([...cards, newCard]);
    setFront('');
    setBack('');
  };

  const handleDeleteCard = (id: string) => {
    soundService.playClick();
    setCards(cards.filter(c => c.id !== id));
  };

  const handleSaveDeck = () => {
    if (!title.trim() || cards.length === 0) return;
    soundService.playSuccess();
    
    const deck: Deck = {
      id: initialDeck?.id || crypto.randomUUID(),
      title,
      description,
      cards,
      createdAt: initialDeck?.createdAt || Date.now()
    };
    onSave(deck);
  };

  const executeMove = (deckId: string) => {
    if (cardToMove) {
        onMoveCard(cardToMove, deckId);
        setCards(cards.filter(c => c.id !== cardToMove.id));
        setCardToMove(null);
        soundService.playSuccess();
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-3 md:p-8 lg:p-12 animate-fade-in-up pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6 md:mb-8 sticky top-0 bg-inherit z-30 py-2 backdrop-blur-xl md:static">
        <button 
          onClick={() => { soundService.playClick(); onCancel(); }}
          className="flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors group px-3 py-2 rounded-xl hover:bg-[var(--glass-bg)]"
        >
          <div className="p-2 rounded-full bg-[var(--input-bg)] group-hover:bg-indigo-500/20 mr-2 md:mr-3 transition-colors">
            <ArrowLeft className="w-4 h-4" /> 
          </div>
          <span className="font-bold text-sm md:text-base">Back</span>
        </button>
        <h2 className="text-xl md:text-4xl font-extrabold bg-gradient-to-r from-pink-400 to-indigo-400 bg-clip-text text-transparent tracking-tight">
          {initialDeck ? 'Edit Deck' : 'Create Deck'}
        </h2>
        <div className="w-20 md:w-32"></div> 
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Left Column: Deck Info & New Card Input */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-6 md:p-8 rounded-[2rem] hover:shadow-xl transition-shadow border-[var(--glass-border)]">
            <h3 className="text-lg font-bold mb-4 md:mb-6 text-indigo-500 flex items-center gap-2">
                Deck Details
            </h3>
            <div className="space-y-4 md:space-y-6">
                <div>
                    <label className="block text-xs font-bold text-[var(--text-tertiary)] mb-2 uppercase tracking-wider pl-1">Title</label>
                    <input
                    type="text"
                    placeholder="e.g., Biology 101"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[var(--input-bg)] glass-input border border-[var(--glass-border)] rounded-2xl px-5 py-4 text-[var(--text-primary)] outline-none transition-all placeholder-[var(--text-tertiary)]"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-[var(--text-tertiary)] mb-2 uppercase tracking-wider pl-1">Description</label>
                    <textarea
                    placeholder="What is this deck about?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-[var(--input-bg)] glass-input border border-[var(--glass-border)] rounded-2xl px-5 py-4 text-[var(--text-primary)] outline-none transition-all h-24 md:h-32 resize-none placeholder-[var(--text-tertiary)]"
                    />
                </div>
            </div>
          </div>

          <div className="glass-panel p-6 md:p-8 rounded-[2rem] relative overflow-hidden group hover:shadow-xl transition-shadow border-[var(--glass-border)]">
            <h3 className="text-lg font-bold mb-6 text-indigo-500 mt-2">Add New Card</h3>
            
            <div className="space-y-4 md:space-y-6">
              <div>
                <label className="block text-xs font-bold text-[var(--text-tertiary)] mb-2 uppercase tracking-wider pl-1">Front (Question)</label>
                <input
                  type="text"
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  className="w-full bg-[var(--input-bg)] glass-input border border-[var(--glass-border)] rounded-2xl px-5 py-4 text-[var(--text-primary)] outline-none transition-all placeholder-[var(--text-tertiary)]"
                  placeholder="Enter question..."
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-[var(--text-tertiary)] mb-2 uppercase tracking-wider pl-1">Back (Answer)</label>
                <textarea
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  className="w-full bg-[var(--input-bg)] glass-input border border-[var(--glass-border)] rounded-2xl px-5 py-4 text-[var(--text-primary)] outline-none transition-all h-24 md:h-32 resize-none placeholder-[var(--text-tertiary)]"
                  placeholder="Enter answer..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-tertiary)] mb-4 uppercase tracking-wider pl-1">Card Color</label>
                <div className="flex flex-wrap gap-3 md:gap-4">
                  {CARD_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => { soundService.playClick(); setSelectedColor(color); }}
                      className={`w-8 h-8 md:w-10 md:h-10 rounded-full ${color} shadow-md transition-all duration-300 hover:scale-110 border border-black/5 ${selectedColor === color ? 'ring-4 ring-indigo-500/50 scale-110 shadow-xl' : 'hover:ring-2 hover:ring-indigo-500/20'}`}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={handleAddCard}
                disabled={!front.trim() || !back.trim()}
                className="w-full py-4 bg-[var(--input-bg)] hover:bg-[var(--card-hover)] border border-[var(--glass-border)] disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold text-[var(--text-primary)] flex items-center justify-center gap-3 transition-all active:scale-95 hover:shadow-lg mt-4"
              >
                <Plus className="w-5 h-5" /> Add to Deck
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Card List & Preview */}
        <div className="lg:col-span-8 flex flex-col h-[600px] lg:h-auto">
            <div className="flex items-center justify-between mb-4 md:mb-6 px-2">
               <h3 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                   Cards <span className="bg-[var(--input-bg)] px-3 py-1 rounded-lg text-base text-indigo-500 font-extrabold border border-[var(--glass-border)]">{cards.length}</span>
               </h3>
               <button
                  onClick={handleSaveDeck}
                  disabled={cards.length === 0 || !title.trim()}
                  className="px-6 md:px-10 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 active:translate-y-0 active:scale-95"
               >
                 <Save className="w-5 h-5" /> <span className="hidden sm:inline">Save Deck</span>
               </button>
            </div>
            
            <div className="flex-1 glass-panel rounded-[2rem] p-4 md:p-6 overflow-y-auto custom-scrollbar space-y-3 md:space-y-4 bg-[var(--input-bg)]">
              {cards.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[var(--text-tertiary)] py-20">
                   <div className="w-24 h-24 border-2 border-dashed border-[var(--glass-border)] rounded-3xl mb-6 flex items-center justify-center animate-pulse-soft">
                      <Plus className="w-10 h-10" />
                   </div>
                   <p className="font-bold text-lg">No cards yet. Start building!</p>
                </div>
              ) : (
                cards.map((card, index) => (
                  <div 
                    key={card.id} 
                    style={{ animationDelay: `${index * 50}ms` }}
                    className="group flex items-center gap-4 md:gap-6 bg-[var(--glass-bg)] hover:bg-[var(--card-hover)] p-4 md:p-5 rounded-2xl border border-[var(--glass-border)] transition-all animate-pop-in hover:shadow-lg hover:translate-x-1"
                  >
                    <div className={`w-12 h-16 md:w-16 md:h-24 rounded-xl shadow-sm flex-shrink-0 ${card.color} border border-black/5 transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[var(--text-primary)] truncate text-base md:text-lg mb-1 md:mb-2">{card.front}</p>
                      <p className="text-sm text-[var(--text-secondary)] truncate font-medium">{card.back}</p>
                    </div>
                    
                    <div className="flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200 lg:transform lg:translate-x-4 lg:group-hover:translate-x-0">
                        <button
                          onClick={() => setCardToMove(card)}
                          className="p-2 md:p-3 text-[var(--text-tertiary)] hover:text-indigo-500 hover:bg-indigo-500/10 rounded-xl transition-colors"
                          title="Move to another deck"
                        >
                            <MoveRight className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCard(card.id)}
                          className="p-2 md:p-3 text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                  </div>
                ))
              )}
            </div>
        </div>
      </div>

      {/* Move Card Modal */}
      {cardToMove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-pop-in">
             <div className="glass-panel w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl border-[var(--glass-border)] bg-[var(--glass-bg)]">
                <h3 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Move Card</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-8 font-medium">Where should we move "<span className="text-[var(--text-primary)] font-bold">{cardToMove.front}</span>"?</p>
                
                <div className="max-h-60 overflow-y-auto space-y-3 mb-8 pr-2 custom-scrollbar">
                    {allDecks.filter(d => d.id !== (initialDeck?.id)).map(deck => (
                        <button
                            key={deck.id}
                            onClick={() => executeMove(deck.id)}
                            className="w-full text-left p-4 rounded-2xl bg-[var(--input-bg)] hover:bg-indigo-600/10 border border-[var(--glass-border)] hover:border-indigo-500/50 transition-all flex items-center justify-between group"
                        >
                            <span className="truncate text-[var(--text-secondary)] group-hover:text-indigo-500 font-bold">{deck.title}</span>
                            <MoveRight className="w-5 h-5 opacity-0 group-hover:opacity-100 text-indigo-500 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" />
                        </button>
                    ))}
                    {allDecks.length <= 1 && (
                        <div className="text-[var(--text-tertiary)] text-sm italic text-center py-6 bg-[var(--input-bg)] rounded-2xl">No other decks available.</div>
                    )}
                </div>

                <div className="flex justify-end">
                    <button 
                        onClick={() => setCardToMove(null)}
                        className="px-6 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold transition-colors"
                    >
                        Cancel
                    </button>
                </div>
             </div>
        </div>
      )}
    </div>
  );
};