import { Card, SRSData } from '../types';

// Ratings:
// 1: Again (Fail) - Review immediately/soon
// 2: Hard - Review soon
// 3: Good - Standard increase
// 4: Easy - Large increase

export type SRSRating = 'again' | 'hard' | 'good' | 'easy';

const DEFAULT_SRS: SRSData = {
  interval: 0,
  repetition: 0,
  easeFactor: 2.5,
  dueDate: 0,
};

export const calculateReview = (card: Card, rating: SRSRating): Card => {
  const currentSRS = card.srs || { ...DEFAULT_SRS };
  
  let { interval, repetition, easeFactor } = currentSRS;
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  if (rating === 'again') {
    repetition = 0;
    interval = 0; // Reset to 0 days (review today/tomorrow)
  } else {
    // Quality numbers for SM-2: 3 (Hard), 4 (Good), 5 (Easy)
    // We map our inputs roughly to these logic
    let quality = 0;
    if (rating === 'hard') quality = 3;
    if (rating === 'good') quality = 4;
    if (rating === 'easy') quality = 5;

    // Calculate new Ease Factor
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    repetition += 1;

    // Calculate Interval
    if (repetition === 1) {
      interval = 1;
    } else if (repetition === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    
    // Adjust interval based on rating specifically for "Hard" to be shorter
    if (rating === 'hard') {
      interval = Math.max(1, Math.floor(interval * 0.5));
    }
  }

  // Calculate new Due Date
  // If interval is 0 (Again), set due date to 5 minutes from now for immediate review in a real queue,
  // but for this simple app, we'll set it to "Now"
  const dueDate = now + (interval * oneDay);

  return {
    ...card,
    srs: {
      interval,
      repetition,
      easeFactor,
      dueDate
    }
  };
};

export const getDueCards = (cards: Card[]): Card[] => {
  const now = Date.now();
  return cards.filter(c => !c.srs || c.srs.dueDate <= now);
};
