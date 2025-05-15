import { supabase } from './supabase';

// Deck Types
export type Deck = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export type NewDeck = {
  name: string;
  user_id: string;
};

// Flashcard Types
export type Flashcard = {
  id: string;
  deck_id: string;
  front_text: string;
  back_text: string;
  interval: number;
  next_review: string;
  created_at: string;
};

export type NewFlashcard = {
  deck_id: string;
  front_text: string;
  back_text: string;
  interval: number;
  next_review: string;
};

// Deck API Functions
export async function getDecks(userId: string): Promise<Deck[]> {
  try {
    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching decks:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error in getDecks:', err);
    return [];
  }
}

export async function getDeck(deckId: string): Promise<Deck | null> {
  try {
    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .eq('id', deckId)
      .single();

    if (error) {
      console.error('Error fetching deck:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error in getDeck:', err);
    return null;
  }
}

export async function createDeck(deck: NewDeck): Promise<Deck | null> {
  try {
    const { data, error } = await supabase
      .from('decks')
      .insert(deck)
      .select()
      .single();

    if (error) {
      console.error('Error creating deck:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error in createDeck:', err);
    return null;
  }
}

export async function updateDeck(id: string, deck: Partial<Deck>): Promise<Deck | null> {
  try {
    const { data, error } = await supabase
      .from('decks')
      .update(deck)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating deck:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error in updateDeck:', err);
    return null;
  }
}

export async function deleteDeck(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('decks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting deck:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error in deleteDeck:', err);
    return false;
  }
}

// Flashcard API Functions
export async function getFlashcards(deckId: string): Promise<Flashcard[]> {
  try {
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('deck_id', deckId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching flashcards:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error in getFlashcards:', err);
    return [];
  }
}

export async function getFlashcardsForReview(deckId: string): Promise<Flashcard[]> {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('deck_id', deckId)
      .lte('next_review', now)
      .order('next_review');

    if (error) {
      console.error('Error fetching flashcards for review:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error in getFlashcardsForReview:', err);
    return [];
  }
}

export async function createFlashcard(flashcard: NewFlashcard): Promise<Flashcard | null> {
  try {
    // First verify that the user has permission to add to this deck
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      console.error('Error creating flashcard: No authenticated user');
      return null;
    }

    // Check if the deck belongs to the current user
    const { data: deckData, error: deckError } = await supabase
      .from('decks')
      .select('user_id')
      .eq('id', flashcard.deck_id)
      .single();

    if (deckError || !deckData) {
      console.error('Error creating flashcard: Could not verify deck ownership', deckError);
      return null;
    }

    if (deckData.user_id !== session.session.user.id) {
      console.error('Error creating flashcard: User does not own this deck');
      return null;
    }

    // Now insert the flashcard
    const { data, error } = await supabase
      .from('flashcards')
      .insert(flashcard)
      .select()
      .single();

    if (error) {
      console.error('Error creating flashcard:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error in createFlashcard:', err);
    return null;
  }
}

export async function updateFlashcard(id: string, flashcard: Partial<Flashcard>): Promise<Flashcard | null> {
  try {
    const { data, error } = await supabase
      .from('flashcards')
      .update(flashcard)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating flashcard:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error in updateFlashcard:', err);
    return null;
  }
}

export async function deleteFlashcard(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('flashcards')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting flashcard:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error in deleteFlashcard:', err);
    return false;
  }
}

// Spaced Repetition Logic
export function calculateNextReview(interval: number, quality: number): { interval: number; nextReview: Date } {
  // quality: 0-2 = failed, 3-5 = success (higher = easier)
  let newInterval = interval;
  
  if (quality < 3) {
    // Failed, reset interval to 1 day
    newInterval = 1;
  } else {
    if (interval === 0) {
      newInterval = 1;
    } else if (interval === 1) {
      newInterval = 3;
    } else {
      // Calculate new interval based on current interval and quality
      // Increase more for higher quality
      const factor = 1.5 + (quality - 3) * 0.2; // 1.5, 1.7, 1.9 for quality 3, 4, 5
      newInterval = Math.round(interval * factor);
    }
  }
  
  // Cap maximum interval at 365 days (1 year)
  newInterval = Math.min(newInterval, 365);
  
  // Calculate the next review date
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);
  
  return { interval: newInterval, nextReview };
} 