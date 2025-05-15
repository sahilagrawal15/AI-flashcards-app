'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flashcard, getFlashcards, deleteFlashcard } from '../lib/api';

type FlashcardListProps = {
  deckId: string;
};

export function FlashcardList({ deckId }: FlashcardListProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFlashcards() {
      try {
        setIsLoading(true);
        const fetchedFlashcards = await getFlashcards(deckId);
        setFlashcards(fetchedFlashcards);
        setError(null);
      } catch (err) {
        console.error('Error in FlashcardList fetchFlashcards:', err);
        setError('Failed to load flashcards. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchFlashcards();
  }, [deckId]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this flashcard? This cannot be undone.')) {
      return;
    }
    
    try {
      setDeleteId(id);
      const success = await deleteFlashcard(id);
      
      if (success) {
        setFlashcards(flashcards.filter(card => card.id !== id));
      } else {
        setError('Failed to delete flashcard. Please try again.');
      }
    } catch (err) {
      console.error('Error in FlashcardList handleDelete:', err);
      setError('Failed to delete flashcard. Please try again.');
    } finally {
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md mt-4">
        <p className="text-red-700 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="text-center py-8 px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mx-auto max-w-md">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">No flashcards yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">You haven't added any flashcards to this deck yet. Create your first card to start learning!</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link
              href={`/decks/${deckId}/cards/new`}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              Add First Card
            </Link>
            <Link
              href={`/decks/${deckId}/generate`}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-600"
            >
              Generate with AI
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {flashcards.map((card) => (
        <div 
          key={card.id} 
          className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden"
        >
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 pb-4 md:pb-0 md:pr-4">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Front</h4>
                <p className="text-gray-900 dark:text-white">{card.front_text}</p>
              </div>
              <div className="pt-4 md:pt-0 md:pl-4">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Back</h4>
                <p className="text-gray-900 dark:text-white">{card.back_text}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Next review: {new Date(card.next_review).toLocaleDateString()}
              </div>
              <div className="flex space-x-2">
                <Link
                  href={`/decks/${deckId}/cards/${card.id}/edit`}
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-medium text-sm"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(card.id)}
                  disabled={deleteId === card.id}
                  className="text-red-600 dark:text-red-400 hover:text-red-500 font-medium text-sm disabled:opacity-50"
                >
                  {deleteId === card.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      <div className="flex flex-col sm:flex-row gap-2 justify-center mt-6">
        <Link
          href={`/decks/${deckId}/cards/new`}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          Add New Card
        </Link>
        <Link
          href={`/decks/${deckId}/generate`}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-600"
        >
          Generate with AI
        </Link>
      </div>
    </div>
  );
} 