'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '../../../../components/Navbar';
import { StudyCard } from '../../../../components/StudyCard';
import { useAuth } from '../../../../context/AuthContext';
import { getDeck, getFlashcardsForReview, Flashcard } from '../../../../lib/api';

export default function StudyPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deckName, setDeckName] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const deckId = resolvedParams.id;

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login');
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
        console.error('Error fetching study data:', err);
        setError('Failed to load study session. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchData();
    }
  }, [deckId, user]);

  const handleCardComplete = (updatedCard: Flashcard) => {
    // Update flashcards array with the updated card
    const updatedFlashcards = [...flashcards];
    const cardIndex = updatedFlashcards.findIndex(card => card.id === updatedCard.id);
    
    if (cardIndex !== -1) {
      updatedFlashcards[cardIndex] = updatedCard;
    }
    
    // Move to next card
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handleSkip = () => {
    // Move the current card to the end of the array
    if (flashcards.length > 1) {
      const updatedFlashcards = [...flashcards];
      const skippedCard = updatedFlashcards.splice(currentCardIndex, 1)[0];
      updatedFlashcards.push(skippedCard);
      setFlashcards(updatedFlashcards);
    } else {
      // If there's only one card, just move to next (which will end the session)
      setCurrentCardIndex(currentCardIndex + 1);
      setIsComplete(true);
    }
  };

  const handleRestart = () => {
    setCurrentCardIndex(0);
    setIsComplete(false);
  };

  if (isLoading || isAuthLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex justify-center items-center">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
              Studying: {deckName}
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
        
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg p-6">
          {isComplete || flashcards.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Study Session Complete
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {flashcards.length === 0 
                  ? "You don't have any cards due for review in this deck." 
                  : "You've reviewed all cards due for this session."}
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                {flashcards.length > 0 && (
                  <button
                    onClick={handleRestart}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                  >
                    Study Again
                  </button>
                )}
                <Link
                  href={`/decks/${deckId}/cards/new`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                  Add More Cards
                </Link>
              </div>
            </div>
          ) : (
            <StudyCard
              card={flashcards[currentCardIndex]}
              onComplete={handleCardComplete}
              onSkip={handleSkip}
            />
          )}
        </div>
      </div>
    </>
  );
} 