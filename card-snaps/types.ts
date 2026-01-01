

export interface SRSData {
  interval: number; // Days
  repetition: number;
  easeFactor: number;
  dueDate: number; // Timestamp
}

export interface Card {
  id: string;
  front: string;
  back: string;
  color: string; // Tailwind color class or hex
  srs?: SRSData;
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  cards: Card[];
  createdAt: number;
}

export interface Note {
  id: string;
  title: string;
  subject: string;
  content: string; // HTML string
  background: 'blank' | 'lined' | 'grid';
  createdAt: number;
  lastModified: number;
}

export interface Test {
  id: string;
  title: string;
  date: number; // Timestamp
  topics: string[]; // Keywords to match decks
}

export interface UserProfile {
  name: string;
  avatar: string; // Base64 or URL
  gradeLevel: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  image?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastActive: number;
}

export interface DailyGoal {
  id: string;
  description: string;
  target: number;
  current: number;
  xpReward: number;
  completed: boolean;
  type: 'review_cards' | 'study_time' | 'create_deck' | 'perfect_score';
}

export interface UserStats {
  xp: number;
  streak: number;
  cardsLearned: number;
  minutesStudied: number;
  level: number;
  lastStudyDate: string; 
  totalQuestionsAnswered: number;
  correctAnswers: number;
  fastestSession: number; // Minutes
  goals: DailyGoal[];
  goalsGeneratedDate: string;
  inventory: Record<string, 'locked' | 'unlocked' | 'ready'>; // Snap Cards Inventory
  learnSessionsToday: number; // New: Track daily AI learn usage
}

export type SnapCardPerk = 
  | 'hint' | 'xp_boost' | 'safety_net' | 'auto_solve' | 'streak_max' 
  | 'retry' | 'skip_correct' | 'double_xp_auto' | 'restore_streak' | 'reveal_answer';

export interface SnapCard {
    id: string;
    name: string;
    description: string;
    condition: string;
    perk: SnapCardPerk;
    icon: string;
    color: string;
    type: 'snap' | 'crack';
}

export const SNAP_CARDS_DATA: SnapCard[] = [
  { id: 'card_insight', name: 'Mind\'s Eye', description: 'Eliminates 50% of wrong answers.', perk: 'hint', condition: 'Complete a Perfect Session (10+ Qs)', icon: 'Eye', color: 'cyan', type: 'snap' },
  { id: 'card_jackpot', name: 'Golden Touch', description: 'Next correct answer grants 10x XP.', perk: 'xp_boost', condition: 'Earn 500+ XP in a single session', icon: 'Sparkles', color: 'amber', type: 'snap' },
  { id: 'card_safetynet', name: 'Guardian', description: 'Prevents streak loss on next error.', perk: 'safety_net', condition: 'Achieve a 7-day streak', icon: 'Shield', color: 'emerald', type: 'snap' },
  { id: 'card_oracle', name: 'The Oracle', description: 'Instantly solves the question.', perk: 'auto_solve', condition: 'Study for 30 minutes in one go', icon: 'Zap', color: 'violet', type: 'snap' },
  { id: 'card_overdrive', name: 'Overdrive', description: 'Instantly maxes out streak multiplier.', perk: 'streak_max', condition: 'Reach Level 5', icon: 'Flame', color: 'red', type: 'snap' },
  { id: 'card_rewind', name: 'Chrono Trigger', description: 'Retry a wrong answer immediately.', perk: 'retry', condition: 'Answer 50 questions total', icon: 'RotateCcw', color: 'pink', type: 'snap' },
  { id: 'card_void', name: 'Void Walker', description: 'Skip question, count as correct.', perk: 'skip_correct', condition: 'Create 3 Decks', icon: 'Ghost', color: 'slate', type: 'snap' },
  { id: 'card_gemini', name: 'Gemini\'s Gift', description: 'Auto-solve & 2x XP.', perk: 'double_xp_auto', condition: 'Use AI Studio once', icon: 'Star', color: 'blue', type: 'snap' },
  { id: 'card_phoenix', name: 'Phoenix', description: 'Resurrect lost streak to max.', perk: 'restore_streak', condition: 'Login 5 days in a row', icon: 'Feather', color: 'orange', type: 'snap' },
  { id: 'card_xray', name: 'X-Ray', description: 'Reveal answer without submitting.', perk: 'reveal_answer', condition: 'Review 100 Cards', icon: 'EyeOff', color: 'teal', type: 'snap' },
];

export const CRACK_CARDS_DATA: SnapCard[] = [
  { id: 'crack_insight', name: 'Cracked Eye', description: 'Eliminates 1 wrong answer.', perk: 'hint', condition: 'Answer 10 Questions', icon: 'Eye', color: 'cyan', type: 'crack' },
  { id: 'crack_jackpot', name: 'Bronze Touch', description: 'Next correct answer 2x XP.', perk: 'xp_boost', condition: 'Earn 100 XP', icon: 'Sparkles', color: 'amber', type: 'crack' },
  { id: 'crack_safetynet', name: 'Buckler', description: 'Prevents streak reset (drops to 1x).', perk: 'safety_net', condition: '3-day streak', icon: 'Shield', color: 'emerald', type: 'crack' },
  { id: 'crack_oracle', name: 'Magic 8-Ball', description: '50% chance to solve.', perk: 'auto_solve', condition: 'Study 5 mins', icon: 'Zap', color: 'violet', type: 'crack' },
  { id: 'crack_overdrive', name: 'Spark Plug', description: 'Boosts streak to 2x.', perk: 'streak_max', condition: 'Reach Level 2', icon: 'Flame', color: 'red', type: 'crack' },
  { id: 'crack_rewind', name: 'Deja Vu', description: 'Retry (no XP gained).', perk: 'retry', condition: 'Answer 10 questions', icon: 'RotateCcw', color: 'pink', type: 'crack' },
  { id: 'crack_void', name: 'Blink', description: 'Skip question (no XP).', perk: 'skip_correct', condition: 'Create 1 Deck', icon: 'Ghost', color: 'slate', type: 'crack' },
  { id: 'crack_gemini', name: 'Sparkler', description: 'Auto-solve (normal XP).', perk: 'double_xp_auto', condition: 'Visit AI Studio', icon: 'Star', color: 'blue', type: 'crack' },
  { id: 'crack_phoenix', name: 'Ember', description: 'Recover streak to 2x.', perk: 'restore_streak', condition: 'Login 2 days in a row', icon: 'Feather', color: 'orange', type: 'crack' },
  { id: 'crack_xray', name: 'Peek', description: 'Reveal answer (half XP).', perk: 'reveal_answer', condition: 'Review 20 Cards', icon: 'EyeOff', color: 'teal', type: 'crack' },
];

export type ExerciseType = 
  | 'quiz' 
  | 'true_false' 
  | 'fill_blank' 
  | 'matching' 
  | 'unscramble' 
  | 'timeline' 
  | 'flashcard_review' 
  | 'flashcard_type'
  | 'short_answer'
  | 'ranking'
  | 'reaction'
  | 'comparison'
  | 'odd_one_out'
  | 'analogy'
  | 'classification'
  | 'syntax_repair'
  | 'connection'
  | 'elimination'
  | 'blind_spot'
  | 'category_sort';

export interface Exercise {
  id: string;
  type: ExerciseType;
  question: string;
  options?: string[];
  correctAnswer: string;
  pairs?: { left: string; right: string }[]; 
  context?: string;
  // For Timeline / Ranking
  events?: { id: string; date?: string; text: string; order: number }[];
  // For Reaction / Logic Builder
  slots?: string[]; // E.g., ["Reactant 1", "Reactant 2", "Product"]
  dragItems?: string[]; // E.g., ["C", "O2", "CO2"]
  // For Comparison
  comparisonItems?: { left: string; right: string }; // The two headers to compare
  // For Classification / Category Sort
  categories?: string[]; // ["Metal", "Non-metal"]
  // For Elimination / Syntax
  statements?: { id: string; text: string; isCorrect: boolean }[];
}

export interface SeasonalEvent {
  month: number; // 0-11
  name: string;
  multiplier: number;
  description: string;
  icon: string; 
  color: string; // Tailwind color name
  darkGradient: string; 
  lightGradient: string;
}

export const SEASONAL_EVENTS: SeasonalEvent[] = [
  { 
    month: 0, 
    name: "Frost Festival", 
    multiplier: 2, 
    description: "Stay cool and earn double XP all January!", 
    icon: "Snowflake", 
    color: "cyan", 
    darkGradient: "from-cyan-950 via-sky-950 to-slate-950",
    lightGradient: "from-sky-100 via-cyan-50 to-white"
  },
  { 
    month: 2, 
    name: "Bloom Week", 
    multiplier: 3, 
    description: "Spring into action with TRIPLE XP!", 
    icon: "Flower", 
    color: "pink", 
    darkGradient: "from-pink-950 via-rose-950 to-slate-950",
    lightGradient: "from-rose-100 via-pink-50 to-white"
  },
  { 
    month: 4, 
    name: "Solar Surge", 
    multiplier: 2, 
    description: "Brighten your mind with 2x XP boosts.", 
    icon: "Sun", 
    color: "yellow", 
    darkGradient: "from-yellow-950 via-amber-950 to-slate-950",
    lightGradient: "from-yellow-100 via-orange-50 to-white"
  },
  { 
    month: 6, 
    name: "Heatwave Hero", 
    multiplier: 5, 
    description: "It's scorching! Massive 5x XP active!", 
    icon: "Flame", 
    color: "orange", 
    darkGradient: "from-orange-950 via-red-950 to-slate-950",
    lightGradient: "from-orange-100 via-red-50 to-white"
  },
  { 
    month: 8, 
    name: "Harvest Moon", 
    multiplier: 2, 
    description: "Gather knowledge with 2x XP.", 
    icon: "Wheat", 
    color: "amber", 
    darkGradient: "from-amber-950 via-orange-950 to-slate-950",
    lightGradient: "from-amber-100 via-orange-50 to-white"
  },
  { 
    month: 10, 
    name: "Aurora Nights", 
    multiplier: 3, 
    description: "Light up the dark with 3x XP.", 
    icon: "Moon", 
    color: "indigo", 
    darkGradient: "from-indigo-950 via-violet-950 to-slate-950",
    lightGradient: "from-indigo-100 via-violet-50 to-white"
  },
  { 
    month: 11, 
    name: "Christmas", 
    multiplier: 10, 
    description: "Merry Christmas! Unwrap a massive 10x XP boost!", 
    icon: "Gift", 
    color: "emerald", 
    darkGradient: "from-red-950 via-emerald-950 to-slate-950", 
    // New refined Light Mode Christmas Gradient: Soft Red to Greenish-White
    lightGradient: "from-red-100 via-emerald-50 to-white"
  }
];

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  FLASHCARDS = 'FLASHCARDS',
  CREATE_DECK = 'CREATE_DECK',
  EDIT_DECK = 'EDIT_DECK',
  STUDY = 'STUDY',
  STUDY_SRS = 'STUDY_SRS',
  PREPARATION = 'PREPARATION',
  THEMES = 'THEMES',
  LEARN = 'LEARN',
  PLAY = 'PLAY',
  NOTES = 'NOTES',
  CREATE_NOTE = 'CREATE_NOTE',
  EDIT_NOTE = 'EDIT_NOTE',
  DOCK = 'DOCK',
  SNAP_CARDS = 'SNAP_CARDS',
  AI_STUDIO = 'AI_STUDIO',
  CARDY = 'CARDY',
  RESOURCES = 'RESOURCES', // Replaces Explore, Tools, Guides
  FOCUS = 'FOCUS',
  COMMUNITY = 'COMMUNITY'
}

export type SortOption = 'date' | 'name' | 'count';

export type ThemeMode = 'dark' | 'light';
export type ColorScheme = 'ocean' | 'sunset' | 'forest' | 'midnight' | 'berry' | 'crimson';

export const CARD_COLORS = [
  'bg-white',
  'bg-blue-100',
  'bg-green-100',
  'bg-yellow-100',
  'bg-red-100',
  'bg-purple-100',
  'bg-pink-100',
  'bg-orange-100',
  'bg-teal-100',
  'bg-indigo-100',
];

export const CARD_BG_COLORS_MAP: Record<string, string> = {
  'bg-white': '#ffffff',
  'bg-blue-100': '#dbeafe',
  'bg-green-100': '#dcfce7',
  'bg-yellow-100': '#fef9c3',
  'bg-red-100': '#fee2e2',
  'bg-purple-100': '#f3e8ff',
  'bg-pink-100': '#fce7f3',
  'bg-orange-100': '#ffedd5',
  'bg-teal-100': '#ccfbf1',
  'bg-indigo-100': '#e0e7ff',
};
