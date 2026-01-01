
import React, { useState, useEffect, useRef } from 'react';
import { Deck, AppView, Card, SortOption, Test, ThemeMode, ColorScheme, UserProfile, ChatMessage, UserStats, ChatSession, Note, SeasonalEvent, SEASONAL_EVENTS } from '../types';
import { DeckBuilder } from './DeckBuilder';
import { StudyMode } from './StudyMode';
import { PreparationMode } from './PreparationMode';
import { Sidebar } from './Sidebar';
import { ProfileSetup } from './ProfileSetup';
import { ThemesPage } from './ThemesPage';
import { CardyPage } from './CardyPage';
import { AIStudio } from './AIStudio';
import { Dashboard } from './Dashboard';
import { FlashcardsPage } from './FlashcardsPage';
import { LearnMode } from './LearnMode';
import { PlayMode } from './PlayMode';
import { NotesPage } from './NotesPage';
import { NoteEditor } from './NoteEditor';
import { DockPage } from './DockPage';
import { SnapCardsPage } from './SnapCardsPage';
import { FocusTimer } from './FocusTimer';
import { ResourcesPage } from './ResourcesPage'; 
import { ExplorePage } from './ExplorePage';
import { Onboarding } from './Onboarding'; 
import { soundService } from '../services/soundService';
import { generateDailyGoals } from '../services/geminiService';
import { api } from '../services/api'; 
import { Plus, Play, Edit2, Trash2, Library, Zap, Share2, Menu, LogOut, Maximize2 } from 'lucide-react';

const THEME_COLORS: Record<ColorScheme, string> = {
  midnight: 'indigo',
  ocean: 'cyan',
  forest: 'emerald',
  berry: 'fuchsia',
  sunset: 'orange',
  crimson: 'red',
};

const BackgroundWrapper = ({ 
    children, 
    themeMode, 
    colorScheme,
    activeEvent,
    enableSeasonal
}: { 
    children?: React.ReactNode, 
    themeMode: ThemeMode, 
    colorScheme: ColorScheme,
    activeEvent: SeasonalEvent | null,
    enableSeasonal: boolean
}) => {
    
    const getGradient = () => {
        if (enableSeasonal && activeEvent) {
            return themeMode === 'light' ? activeEvent.lightGradient : activeEvent.darkGradient;
        }

        if (themeMode === 'light') {
            switch(colorScheme) {
                case 'ocean': return 'from-cyan-50 via-sky-100 to-white';
                case 'forest': return 'from-emerald-50 via-green-100 to-white';
                case 'berry': return 'from-fuchsia-50 via-purple-100 to-white';
                case 'sunset': return 'from-orange-50 via-red-100 to-white';
                case 'crimson': return 'from-red-50 via-rose-100 to-white';
                case 'midnight': default: return 'from-slate-100 via-white to-slate-50';
            }
        }
        
        switch(colorScheme) {
            case 'ocean': return 'from-cyan-950 via-sky-950 to-slate-950';
            case 'forest': return 'from-emerald-950 via-green-950 to-slate-950';
            case 'berry': return 'from-fuchsia-950 via-purple-950 to-slate-950';
            case 'sunset': return 'from-orange-950 via-red-950 to-slate-950';
            case 'crimson': return 'from-red-950 via-rose-950 to-black';
            case 'midnight': default: return 'from-slate-950 via-[#0f172a] to-black';
        }
    };

    return (
        <div className={`min-h-[100dvh] bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] ${getGradient()} transition-colors duration-1000`}>
            <div className={`fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none mix-blend-overlay ${themeMode === 'light' ? 'opacity-10' : 'opacity-20'}`}></div>
            {children}
        </div>
    );
};

const DEFAULT_STATS: UserStats = {
    xp: 0,
    streak: 0,
    cardsLearned: 0,
    minutesStudied: 0,
    level: 1,
    lastStudyDate: new Date().toDateString(),
    totalQuestionsAnswered: 0,
    correctAnswers: 0,
    fastestSession: 0,
    goals: [],
    goalsGeneratedDate: '',
    inventory: {},
    learnSessionsToday: 0
};

const App: React.FC = () => {
  const [appLoading, setAppLoading] = useState(true);
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  
  // Data State
  const [decks, setDecks] = useState<Deck[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  
  // Temporary State for Community Items (Use without Save)
  const [tempDeck, setTempDeck] = useState<Deck | null>(null);
  const [tempNote, setTempNote] = useState<Note | null>(null);

  // User Profile & Stats
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
  
  // UI State
  const [showSidebarMobile, setShowSidebarMobile] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [colorScheme, setColorScheme] = useState<ColorScheme>('midnight');
  const [enableSeasonal, setEnableSeasonal] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(true);

  // Chat State
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Event State
  const [activeEvent, setActiveEvent] = useState<SeasonalEvent | null>(null);

  // Focus Timer State
  const [focusTimeLeft, setFocusTimeLeft] = useState(25 * 60);
  const [focusIsActive, setFocusIsActive] = useState(false);
  const [focusMode, setFocusMode] = useState<'focus' | 'short' | 'long'>('focus');

  useEffect(() => {
      const onboardingDone = localStorage.getItem('cardsnaps_onboarding_done');
      if (onboardingDone) setShowOnboarding(false);

      const initData = async () => {
          try {
              const user = await api.getMe();
              if (user) {
                  setUserProfile({
                      name: user.name,
                      avatar: user.avatar,
                      gradeLevel: user.gradeLevel || 'Student'
                  });
                  if (user.themeMode) setThemeMode(user.themeMode);
                  if (user.colorScheme) setColorScheme(user.colorScheme);
                  if (user.enableSeasonal !== undefined) setEnableSeasonal(user.enableSeasonal);
              }

              const [fetchedDecks, fetchedNotes, fetchedTests, fetchedStats, fetchedChats] = await Promise.all([
                  api.getDecks(),
                  api.getNotes(),
                  api.getTests(),
                  api.getStats(),
                  api.getChatSessions()
              ]);

              setDecks(fetchedDecks);
              setNotes(fetchedNotes);
              setTests(fetchedTests);
              setChatSessions(fetchedChats);
              if (fetchedChats.length > 0) setCurrentSessionId(fetchedChats[0].id);

              const currentStats = fetchedStats || DEFAULT_STATS;
              // Ensure fields exists
              if (!currentStats.inventory) currentStats.inventory = {};
              if (currentStats.learnSessionsToday === undefined) currentStats.learnSessionsToday = 0;

              const today = new Date().toDateString();
              
              // Reset daily learn session limit if new day
              if (currentStats.lastStudyDate !== today && currentStats.lastStudyDate) {
                  currentStats.learnSessionsToday = 0;
              }
              
              if (currentStats.goalsGeneratedDate !== today && user) {
                   const deckTitles = fetchedDecks.map(d => d.title);
                   try {
                       const goals = await generateDailyGoals(deckTitles);
                       const updatedStats = {
                            ...currentStats,
                            goals: goals,
                            goalsGeneratedDate: today,
                            learnSessionsToday: 0
                       };
                       setStats(updatedStats);
                       api.syncStats(updatedStats); 
                   } catch (e) {
                       setStats(currentStats); 
                   }
              } else {
                  setStats(currentStats);
              }

          } catch (e) {
              console.error("Failed to initialize app data", e);
          } finally {
              setAppLoading(false);
          }
      };

      initData();
  }, []);

  useEffect(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), currentMonth + 1, 0).getDate();
    const isLastWeek = currentDay > (daysInMonth - 7);
    const event = SEASONAL_EVENTS.find(e => e.month === currentMonth);
    setActiveEvent((event && isLastWeek) ? event : null);
  }, []);

  useEffect(() => {
    if (enableSeasonal && activeEvent) {
        setThemeMode('light');
        document.body.classList.add('light-mode');
    } else {
        if (themeMode === 'light') {
            document.body.classList.add('light-mode');
        } else {
            document.body.classList.remove('light-mode');
        }
    }
  }, [themeMode, enableSeasonal, activeEvent]);

  useEffect(() => {
      if (!appLoading && userProfile) {
          api.savePreferences(themeMode, colorScheme, enableSeasonal);
      }
  }, [themeMode, colorScheme, enableSeasonal, appLoading, userProfile]);

  const handleOnboardingComplete = () => {
    localStorage.setItem('cardsnaps_onboarding_done', 'true');
    setShowOnboarding(false);
  };

  const handleProfileSave = async (profile: UserProfile) => {
      await api.saveProfile(profile);
      setUserProfile(profile);
      const goals = await generateDailyGoals([]);
      const newStats = { ...DEFAULT_STATS, goals, goalsGeneratedDate: new Date().toDateString() };
      setStats(newStats);
      api.syncStats(newStats);
  };

  // --- Core Action Handlers ---

  const handleCreateDeck = () => {
    soundService.playClick();
    setActiveDeckId(null);
    setView(AppView.CREATE_DECK);
    setShowSidebarMobile(false);
  };

  const handleSaveDeck = async (deck: Deck, fromAI: boolean = false) => {
    try {
        if (activeDeckId) {
            await api.updateDeck(deck);
            setDecks(decks.map(d => d.id === deck.id ? deck : d));
        } else {
            const createdDeck = await api.createDeck(deck);
            setDecks([createdDeck, ...decks]);
            const newStats = {
                ...stats,
                goals: stats.goals.map(g => g.type === 'create_deck' ? { ...g, current: g.current + 1 } : g)
            };
            setStats(newStats);
            // Trigger unlock checks for 'Create Deck' or 'AI Studio' conditions
            handleUpdateStats(0, 0, { aiUsed: fromAI });
        }
        setView(AppView.FLASHCARDS);
        setActiveDeckId(null);
    } catch (e) {
        alert("Error saving deck.");
    }
  };

  const handleDeleteDeck = async (e: React.MouseEvent, deckId: string) => {
    e.stopPropagation();
    soundService.playClick();
    if (confirm("Are you sure you want to delete this deck?")) {
      await api.deleteDeck(deckId);
      setDecks(prev => prev.filter(d => d.id !== deckId));
    }
  };

  const handleSaveNote = async (note: Note) => {
      try {
          const savedNote = await api.saveNote(note);
          if (activeNoteId) {
              setNotes(notes.map(n => n.id === savedNote.id ? savedNote : n));
          } else {
              setNotes([savedNote, ...notes]);
          }
          setView(AppView.NOTES);
          setActiveNoteId(null);
      } catch (e) {
          alert("Error saving note.");
      }
  };

  const handleDeleteNote = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(confirm("Delete note?")) {
          await api.deleteNote(id);
          setNotes(prev => prev.filter(n => n.id !== id));
      }
  };

  const handleAddTest = async (test: Test) => {
      try {
          const newTest = await api.addTest(test);
          setTests([...tests, newTest]);
      } catch (e) {
          alert("Error saving test.");
      }
  };
  
  const handleDeleteTest = async (id: string) => {
      await api.deleteTest(id);
      setTests(tests.filter(t => t.id !== id));
  };

  // Stats & Unlock Logic
  const handleUpdateStats = (sessionScore: number, sessionMinutes: number, payload: { inventory?: any, isPerfect?: boolean, aiUsed?: boolean } = {}) => {
      setStats(prev => {
          const now = new Date();
          const today = now.toDateString();
          let streak = prev.streak;
          
          if (prev.lastStudyDate !== today) {
              const yesterday = new Date(now);
              yesterday.setDate(now.getDate() - 1);
              if (prev.lastStudyDate === yesterday.toDateString()) {
                  streak++;
              } else {
                  // Keep streak if played today, else reset
                  if (prev.lastStudyDate !== today) streak = 1;
              }
          }

          const multiplier = (activeEvent && enableSeasonal) ? activeEvent.multiplier : 1;
          const finalScore = Math.floor(sessionScore * multiplier);

          let newXP = prev.xp + finalScore;
          let newLevel = prev.level;
          
          while(true) {
             const xpToCompleteCurrentLevel = 1000 * (Math.pow(2, newLevel) - 1);
             if (newXP >= xpToCompleteCurrentLevel) {
                 newLevel++;
             } else {
                 break;
             }
          }

          // --- CENTRALIZED CARD UNLOCK LOGIC ---
          let newInventory = { ...prev.inventory, ...(payload.inventory || {}) };
          
          const unlock = (id: string) => {
              if (newInventory[id] !== 'ready' && newInventory[id] !== 'unlocked') {
                  newInventory[id] = 'unlocked';
              }
          };

          // Data for checks
          const totalQs = prev.totalQuestionsAnswered + (sessionScore > 0 ? 10 : 0);
          const totalCardsReviewed = prev.cardsLearned + Math.floor(finalScore / 50);
          const deckCount = decks.length; 
          
          // 1. SNAP CARDS (Premium)
          if (payload.isPerfect) unlock('card_insight'); 
          if (sessionScore >= 500) unlock('card_jackpot'); 
          if (streak >= 7) unlock('card_safetynet');
          if (sessionMinutes >= 30) unlock('card_oracle');
          if (newLevel >= 5) unlock('card_overdrive');
          if (totalQs >= 50) unlock('card_rewind'); 
          if (deckCount >= 3) unlock('card_void'); 
          // Note: Gemini Gift condition (payload.aiUsed) will only trigger via Learn mode now
          if (payload.aiUsed) unlock('card_gemini'); 
          if (streak >= 5) unlock('card_phoenix'); 
          if (totalCardsReviewed >= 100) unlock('card_xray'); 

          // 2. CRACK CARDS (Standard)
          if (totalQs >= 10) unlock('crack_insight');
          if (sessionScore >= 100) unlock('crack_jackpot');
          if (streak >= 3) unlock('crack_safetynet');
          if (sessionMinutes >= 5) unlock('crack_oracle');
          if (newLevel >= 2) unlock('crack_overdrive');
          if (totalQs >= 10) unlock('crack_rewind');
          if (deckCount >= 1) unlock('crack_void');
          if (payload.aiUsed) unlock('crack_gemini'); 
          if (streak >= 2) unlock('crack_phoenix');
          if (totalCardsReviewed >= 20) unlock('crack_xray');

          const updatedGoals = prev.goals.map(g => {
              if (g.completed) return g;
              let newValue = g.current;
              if (g.type === 'review_cards') newValue += 1; 
              if (g.type === 'study_time') newValue += sessionMinutes;
              if (g.type === 'perfect_score' && finalScore >= 1000) newValue += 1; 
              return { ...g, current: newValue };
          });

          // Increment daily session count if this was a Learn session (payload usually implies this)
          const newLearnSessions = payload.aiUsed ? (prev.learnSessionsToday + 1) : prev.learnSessionsToday;

          const newStats = {
              ...prev,
              xp: newXP,
              level: newLevel,
              minutesStudied: prev.minutesStudied + sessionMinutes,
              cardsLearned: totalCardsReviewed,
              streak: streak,
              lastStudyDate: today,
              totalQuestionsAnswered: totalQs,
              correctAnswers: prev.correctAnswers + Math.floor(sessionScore/100 * 0.9), // Approx
              fastestSession: (sessionMinutes > 0 && (prev.fastestSession === 0 || sessionMinutes < prev.fastestSession)) ? sessionMinutes : prev.fastestSession,
              goals: updatedGoals,
              inventory: newInventory,
              learnSessionsToday: newLearnSessions
          };
          
          api.syncStats(newStats); 
          return newStats;
      });
  };

  // Focus Timer Effect (must be after handleUpdateStats definition)
  useEffect(() => {
      let interval: any = null;
      if (focusIsActive && focusTimeLeft > 0) {
          interval = setInterval(() => {
              setFocusTimeLeft((prev) => prev - 1);
          }, 1000);
      } else if (focusTimeLeft === 0 && focusIsActive) {
          setFocusIsActive(false);
          soundService.playSuccess();
          // Update stats if it was a focus session
          if (focusMode === 'focus') {
             handleUpdateStats(0, 25); 
          }
      }
      return () => clearInterval(interval);
  }, [focusIsActive, focusTimeLeft, focusMode]);
  
  const handleClaimGoal = (goalId: string) => {
      setStats(prev => {
          const goal = prev.goals.find(g => g.id === goalId);
          if (!goal || goal.completed) return prev;
          
          const newStats = {
              ...prev,
              xp: prev.xp + goal.xpReward,
              goals: prev.goals.map(g => g.id === goalId ? { ...g, completed: true } : g)
          };
          api.syncStats(newStats);
          return newStats;
      });
  };

  const handleClaimSnapCard = (cardId: string) => {
      setStats(prev => {
          const newInventory = { ...prev.inventory, [cardId]: 'ready' as const };
          const newStats = { ...prev, inventory: newInventory };
          api.syncStats(newStats);
          return newStats;
      });
  };

  const handleMoveCard = async (card: Card, targetDeckId: string) => {
      const targetDeck = decks.find(d => d.id === targetDeckId);
      if (targetDeck) {
          const updatedTarget = { ...targetDeck, cards: [...targetDeck.cards, card] };
          await api.updateDeck(updatedTarget);
          setDecks(decks.map(d => d.id === targetDeckId ? updatedTarget : d));
      }
  };
  
  const handleStudyDeck = (deckId: string, mode: AppView = AppView.STUDY) => {
      soundService.playPop();
      setActiveDeckId(deckId);
      setTempDeck(null); // Clear temp
      setView(mode);
  };

  // --- Community Hub Handlers ---
  const handleImportItem = (item: Deck | Note, type: 'deck' | 'note') => {
      if (type === 'deck') {
          setDecks(prev => [item as Deck, ...prev]);
          api.createDeck(item as Deck);
      } else {
          setNotes(prev => [item as Note, ...prev]);
          api.saveNote(item as Note);
      }
  };

  const handleUseTempItem = (item: Deck | Note, type: 'deck' | 'note') => {
      if (type === 'deck') {
          setTempDeck(item as Deck);
          setActiveDeckId(null); // No ID active
          setView(AppView.STUDY);
      } else {
          setTempNote(item as Note);
          setActiveNoteId(null);
          setView(AppView.EDIT_NOTE);
      }
  };

  const createNewChatSession = () => {
      const newSession: ChatSession = {
          id: crypto.randomUUID(),
          title: 'New Chat',
          messages: [],
          lastActive: Date.now()
      };
      setChatSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      api.saveChatSession(newSession); 
      return newSession;
  };

  const handleUpdateSessions = (updatedSessions: ChatSession[]) => {
      setChatSessions(updatedSessions);
  };
  
  // --- View Rendering ---

  if (appLoading) {
     return (
        <BackgroundWrapper themeMode={themeMode} colorScheme={colorScheme} activeEvent={activeEvent} enableSeasonal={enableSeasonal}>
             <div className="min-h-screen flex items-center justify-center">
                 <div className="animate-pulse text-white font-bold text-xl">Loading Card Snaps...</div>
             </div>
        </BackgroundWrapper>
     );
  }

  if (showOnboarding) {
      return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (!userProfile) {
      return (
          <BackgroundWrapper themeMode={themeMode} colorScheme={colorScheme} activeEvent={activeEvent} enableSeasonal={enableSeasonal}>
              <ProfileSetup onSave={handleProfileSave} />
          </BackgroundWrapper>
      );
  }

  const themeColor = (enableSeasonal && activeEvent) ? activeEvent.color : THEME_COLORS[colorScheme];
  const themeButtonClass = `bg-${themeColor}-500 hover:bg-${themeColor}-600`;

  const renderContent = () => {
      // 1. Study Mode (Deck or Temp Deck)
      if (view === AppView.STUDY || view === AppView.STUDY_SRS) {
        const deck = tempDeck || decks.find(d => d.id === activeDeckId);
        if (deck) {
          return (
               <StudyMode 
                    deck={deck} 
                    onExit={() => setView(AppView.DASHBOARD)} 
                    mode={view === AppView.STUDY_SRS ? 'srs' : 'standard'}
                    onUpdateDeck={async (updated) => {
                        // Only save if it's a real deck in the user's library
                        if (!tempDeck && activeDeckId) {
                            setDecks(decks.map(d => d.id === updated.id ? updated : d));
                            await api.updateDeck(updated);
                        }
                    }}
               />
          );
        }
      }

      if (view === AppView.CREATE_DECK || (view === AppView.EDIT_DECK && activeDeckId)) {
        const deckToEdit = activeDeckId ? decks.find(d => d.id === activeDeckId) : undefined;
        return (
            <div className="h-full overflow-y-auto">
              <DeckBuilder 
                onSave={handleSaveDeck} 
                onCancel={() => setView(AppView.DASHBOARD)} 
                initialDeck={deckToEdit} 
                allDecks={decks}
                onMoveCard={handleMoveCard}
              />
            </div>
        );
      }
      
      if (view === AppView.AI_STUDIO) {
          return (
              <AIStudio 
                onSaveDeck={handleSaveDeck}
                onCancel={() => setView(AppView.DASHBOARD)}
              />
          );
      }

      if (view === AppView.PREPARATION) {
          return (
              <PreparationMode 
                 tests={tests} 
                 decks={decks} 
                 onAddTest={handleAddTest} 
                 onDeleteTest={handleDeleteTest}
                 onNavigateToStudy={(id) => handleStudyDeck(id, AppView.STUDY)}
                 themeColor={themeColor}
                 onSaveDeck={handleSaveDeck} 
              />
          );
      }
      
      if (view === AppView.CARDY) {
          return (
              <CardyPage 
                  chatSessions={chatSessions}
                  currentSessionId={currentSessionId}
                  onUpdateSessions={handleUpdateSessions}
                  onSelectSession={setCurrentSessionId}
                  onCreateSession={createNewChatSession}
                  userProfile={userProfile}
                  decks={decks}
                  tests={tests}
                  stats={stats}
              />
          );
      }

      if (view === AppView.FLASHCARDS) {
          return (
              <FlashcardsPage 
                  decks={decks}
                  onCreateDeck={handleCreateDeck}
                  onStudy={(id) => handleStudyDeck(id)}
                  onEdit={(id) => { setActiveDeckId(id); setView(AppView.EDIT_DECK); }}
                  onDelete={handleDeleteDeck}
                  onShare={(e, deck) => {
                      e.stopPropagation();
                      alert("Use the share button on the card itself to publish.");
                  }}
              />
          );
      }

      if (view === AppView.NOTES) {
          return (
              <NotesPage 
                  notes={notes}
                  onCreateNote={() => { setActiveNoteId(null); setView(AppView.CREATE_NOTE); }}
                  onEditNote={(id) => { setActiveNoteId(id); setView(AppView.EDIT_NOTE); }}
                  onDeleteNote={handleDeleteNote}
                  themeColor={themeColor}
              />
          );
      }

      if (view === AppView.CREATE_NOTE || view === AppView.EDIT_NOTE) {
          const noteToEdit = tempNote || (activeNoteId ? notes.find(n => n.id === activeNoteId) : undefined);
          return (
              <NoteEditor 
                  initialNote={noteToEdit}
                  onSave={(n) => {
                      // If it was a temp note, saving it makes it real.
                      if (tempNote) {
                          setTempNote(null);
                          setNotes([n, ...notes]);
                          api.saveNote(n);
                          setView(AppView.NOTES);
                      } else {
                          handleSaveNote(n);
                      }
                  }}
                  onCancel={() => setView(AppView.NOTES)}
                  themeColor={themeColor}
              />
          );
      }

      if (view === AppView.THEMES) {
          return (
              <ThemesPage 
                 themeMode={themeMode}
                 onToggleTheme={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
                 colorScheme={colorScheme}
                 onSelectColorScheme={setColorScheme}
                 enableSeasonal={enableSeasonal}
                 onToggleSeasonal={() => setEnableSeasonal(!enableSeasonal)}
              />
          );
      }

      if (view === AppView.LEARN) {
          return (
              <LearnMode 
                 decks={decks}
                 onExit={() => setView(AppView.DASHBOARD)}
                 onUpdateStats={handleUpdateStats}
                 xpMultiplier={(activeEvent && enableSeasonal) ? activeEvent.multiplier : 1}
                 userStats={stats}
              />
          );
      }

      if (view === AppView.PLAY) {
          return (
              <PlayMode 
                stats={stats} 
                themeColor={themeColor}
                onClaimGoal={handleClaimGoal}
                activeEvent={enableSeasonal ? activeEvent : null}
              />
          );
      }

      if (view === AppView.DOCK) {
          return <DockPage 
                    onDeckAdded={(d) => setDecks(prev => [d, ...prev])} 
                    onNoteAdded={(n) => setNotes(prev => [n, ...prev])} 
                 />;
      }

      if (view === AppView.SNAP_CARDS) {
          return <SnapCardsPage stats={stats} onClaimCard={handleClaimSnapCard} />;
      }

      if (view === AppView.FOCUS) {
          return (
            <FocusTimer 
                timeLeft={focusTimeLeft}
                setTimeLeft={setFocusTimeLeft}
                isActive={focusIsActive}
                setIsActive={setFocusIsActive}
                mode={focusMode}
                setMode={setFocusMode}
            />
          );
      }

      // New Community Hub
      if (view === AppView.COMMUNITY) {
          return <ExplorePage onImport={handleImportItem} onUseTemp={handleUseTempItem} themeColor={themeColor} />;
      }

      // Reference Hub
      if (view === AppView.RESOURCES) {
          return <ResourcesPage />;
      }

      return (
          <Dashboard 
              userProfile={userProfile}
              decks={decks}
              tests={tests}
              onNavigate={setView}
              onStudy={handleStudyDeck}
              onCreateDeck={handleCreateDeck}
              themeColor={themeColor}
              activeEvent={enableSeasonal ? activeEvent : null}
          />
      );
  };

  return (
    <BackgroundWrapper themeMode={themeMode} colorScheme={colorScheme} activeEvent={activeEvent} enableSeasonal={enableSeasonal}>
       <div className="flex min-h-[100dvh] text-[var(--text-primary)] relative">
           <Sidebar 
               currentView={view} 
               onNavigate={(v) => { setView(v); setShowSidebarMobile(false); }} 
               userProfile={userProfile}
               className={`md:flex fixed left-0 top-0 h-full w-72 transition-transform duration-300 z-50 ${showSidebarMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}`}
               themeColor={themeColor}
               activeEvent={enableSeasonal ? activeEvent : null}
           />
           
           {!showSidebarMobile && (
               <div className="md:hidden fixed top-4 left-4 z-50 animate-fade-in-up">
                   <button 
                      onClick={() => setShowSidebarMobile(true)}
                      className={`p-3 ${themeButtonClass} text-white rounded-xl shadow-lg border border-white/10 transition-colors`}
                   >
                       <Menu className="w-6 h-6" />
                   </button>
               </div>
           )}

           {showSidebarMobile && (
               <div 
                   className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm animate-fade-in-up"
                   onClick={() => setShowSidebarMobile(false)}
               ></div>
           )}

           <main className="flex-1 ml-0 md:ml-72 relative transition-all duration-300">
              {renderContent()}
           </main>
       </div>
    </BackgroundWrapper>
  );
};

export default App;
