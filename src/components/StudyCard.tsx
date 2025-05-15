'use client';

import { useState } from 'react';
import { Flashcard, updateFlashcard, calculateNextReview } from '../lib/api';

type StudyCardProps = {
  card: Flashcard;
  onComplete: (updatedCard: Flashcard) => void;
  onSkip: () => void;
};

export function StudyCard({ card, onComplete, onSkip }: StudyCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleRating = async (quality: number) => {
    try {
      setIsSubmitting(true);
      
      const { interval, nextReview } = calculateNextReview(card.interval, quality);
      
      const updatedCard = await updateFlashcard(card.id, {
        interval,
        next_review: nextReview.toISOString(),
      });
      
      onComplete(updatedCard);
    } catch (err) {
      console.error('Error updating flashcard review:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="relative w-full h-[250px]" style={{ perspective: '1000px' }}>
        <div 
          className={`absolute w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* Front of card */}
          <div className="absolute w-full h-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 backface-hidden">
            <div className="h-full flex flex-col">
              <div className="flex-1 flex items-center justify-center p-4">
                <p className="text-lg text-gray-900 dark:text-white text-center">
                  {card.front_text}
                </p>
              </div>
              
              <div className="mt-4">
                <button
                  onClick={handleFlip}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                  Show Answer
                </button>
              </div>
            </div>
          </div>
          
          {/* Back of card */}
          <div className="absolute w-full h-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 backface-hidden rotate-y-180">
            <div className="h-full flex flex-col">
              <div className="flex-1 flex items-center justify-center p-4">
                <p className="text-lg text-gray-900 dark:text-white text-center">
                  {card.back_text}
                </p>
              </div>
              
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center mb-2">
                  How well did you know this?
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleRating(1)}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    Difficult
                  </button>
                  <button
                    onClick={() => handleRating(3)}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-md hover:bg-yellow-200 dark:hover:bg-yellow-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                  >
                    Good
                  </button>
                  <button
                    onClick={() => handleRating(5)}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    Easy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex justify-center">
        <button
          onClick={onSkip}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
        >
          Skip for now
        </button>
      </div>
      
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
        Current interval: {card.interval} days
        <br />
        Next review: {new Date(card.next_review).toLocaleDateString()}
      </div>
    </div>
  );
} 