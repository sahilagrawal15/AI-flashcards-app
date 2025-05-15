'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '../../../../components/Navbar';
import { useAuth } from '../../../../context/AuthContext';
import { getDeck, getFlashcardsForReview, updateFlashcard, Flashcard } from '../../../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deckName, setDeckName] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const deckId = resolvedParams.id;

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        
        // Get deck info
        const deck = await getDeck(deckId);
        if (deck) {
          setDeckName(deck.name);
        }
        
        // Get flashcards due for review
        const cardsForReview = await getFlashcardsForReview(deckId);
        setFlashcards(cardsForReview);
        
        if (cardsForReview.length === 0) {
          setIsComplete(true);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching review data:', err);
        setError('Failed to load review session. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchData();
    }
  }, [deckId, user]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleRating = async (rating: 'again' | 'good' | 'easy') => {
    if (isUpdating || currentCardIndex >= flashcards.length) return;
    
    setIsUpdating(true);
    
    try {
      const currentCard = flashcards[currentCardIndex];
      let newInterval = currentCard.interval;
      const now = new Date();
      let nextReview: Date;
      
      // Calculate new interval and next review date based on rating
      switch (rating) {
        case 'again':
          newInterval = 1;
          nextReview = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +1 day
          break;
        case 'good':
          newInterval = Math.max(1, currentCard.interval * 2);
          nextReview = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);
          break;
        case 'easy':
          newInterval = Math.max(1, currentCard.interval * 3);
          nextReview = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);
          break;
      }
      
      // Update the card in the database
      await updateFlashcard(currentCard.id, {
        interval: newInterval,
        next_review: nextReview.toISOString()
      });
      
      // Move to next card
      if (currentCardIndex < flashcards.length - 1) {
        setIsFlipped(false);
        setTimeout(() => {
          setCurrentCardIndex(currentCardIndex + 1);
        }, 300);
      } else {
        setIsComplete(true);
      }
    } catch (err) {
      console.error('Error updating flashcard:', err);
      setError('Failed to update card. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading || isAuthLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </>
    );
  }

  if (!user) {
    return null;
  }
  
  if (error) {
    return (
      <>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
            <p className="text-red-700 dark:text-red-400">{error}</p>
            <Link href={`/decks/${deckId}`} className="mt-2 inline-block text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
              Return to deck
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="md:flex md:items-center md:justify-between mb-8">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
                Reviewing: {deckName}
              </h1>
              {!isComplete && flashcards.length > 0 && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Card {currentCardIndex + 1} of {flashcards.length}
                </p>
              )}
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Link
                href={`/decks/${deckId}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back to Deck
              </Link>
            </div>
          </div>
          
          {isComplete || flashcards.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
              <div className="text-center py-16 px-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  You're done for today!
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  {flashcards.length === 0 
                    ? "You don't have any cards due for review in this deck." 
                    : "You've reviewed all cards due for this session."}
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <Link
                    href={`/decks/${deckId}/cards/new`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                  >
                    Add More Cards
                  </Link>
                  <Link
                    href={`/decks/${deckId}/generate`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-600"
                  >
                    Generate with AI
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={currentCardIndex + (isFlipped ? '-flipped' : '')}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="w-full max-w-2xl perspective-1000"
                >
                  <div 
                    className={`relative w-full h-64 sm:h-80 cursor-pointer transform-style-3d transition-transform duration-500 ${isFlipped ? 'rotate-y-180' : ''}`}
                    onClick={handleFlip}
                  >
                    {/* Front of card */}
                    <div className={`absolute w-full h-full backface-hidden ${isFlipped ? 'invisible' : ''} bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 flex flex-col justify-center items-center`}>
                      <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-4">Question</h3>
                      <p className="text-center text-gray-700 dark:text-gray-300 text-lg">
                        {flashcards[currentCardIndex]?.front_text}
                      </p>
                      <div className="absolute bottom-4 text-sm text-gray-500 dark:text-gray-400">
                        Click to reveal answer
                      </div>
                    </div>
                    
                    {/* Back of card */}
                    <div className={`absolute w-full h-full backface-hidden rotate-y-180 ${isFlipped ? '' : 'invisible'} bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 flex flex-col justify-center items-center`}>
                      <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-4">Answer</h3>
                      <p className="text-center text-gray-700 dark:text-gray-300 text-lg">
                        {flashcards[currentCardIndex]?.back_text}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
              
              {isFlipped && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="mt-8 flex flex-wrap justify-center gap-4"
                >
                  <button
                    onClick={() => handleRating('again')}
                    disabled={isUpdating}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow transition-colors disabled:opacity-50"
                  >
                    Again
                    <span className="block text-xs mt-1 opacity-80">1 day</span>
                  </button>
                  <button
                    onClick={() => handleRating('good')}
                    disabled={isUpdating}
                    className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg shadow transition-colors disabled:opacity-50"
                  >
                    Good
                    <span className="block text-xs mt-1 opacity-80">{flashcards[currentCardIndex]?.interval * 2} days</span>
                  </button>
                  <button
                    onClick={() => handleRating('easy')}
                    disabled={isUpdating}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow transition-colors disabled:opacity-50"
                  >
                    Easy
                    <span className="block text-xs mt-1 opacity-80">{flashcards[currentCardIndex]?.interval * 3} days</span>
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
} 