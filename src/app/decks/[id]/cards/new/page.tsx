'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '../../../../../components/Navbar';
import { useAuth } from '../../../../../context/AuthContext';
import { getDeck, createFlashcard } from '../../../../../lib/api';

export default function NewCardPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deckName, setDeckName] = useState('');
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const deckId = resolvedParams.id;

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login');
    }
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    async function fetchDeckName() {
      try {
        const deck = await getDeck(deckId);
        if (deck) {
          setDeckName(deck.name);
        }
      } catch (err) {
        console.error('Error fetching deck:', err);
      }
    }

    if (user) {
      fetchDeckName();
    }
  }, [deckId, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!frontText.trim() || !backText.trim()) {
      setError('Please fill out both front and back of the flashcard');
      return;
    }
    
    if (!user) {
      setError('You must be logged in to create a flashcard');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Get a date for tomorrow as the first review date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      await createFlashcard({
        deck_id: deckId,
        front_text: frontText.trim(),
        back_text: backText.trim(),
        interval: 0, // Start with interval of 0
        next_review: tomorrow.toISOString(),
      });
      
      // Redirect back to deck page
      router.push(`/decks/${deckId}`);
    } catch (err) {
      console.error('Error creating flashcard:', err);
      setError('Failed to create flashcard. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAnother = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!frontText.trim() || !backText.trim()) {
      setError('Please fill out both front and back of the flashcard');
      return;
    }
    
    if (!user) {
      setError('You must be logged in to create a flashcard');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Get a date for tomorrow as the first review date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      await createFlashcard({
        deck_id: deckId,
        front_text: frontText.trim(),
        back_text: backText.trim(),
        interval: 0, // Start with interval of 0
        next_review: tomorrow.toISOString(),
      });
      
      // Clear the form
      setFrontText('');
      setBackText('');
      setError(null);
    } catch (err) {
      console.error('Error creating flashcard:', err);
      setError('Failed to create flashcard. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading) {
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

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
              Add Card to {deckName}
            </h1>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
          <form className="p-6">
            <div className="mb-6">
              <label htmlFor="front-text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Front
              </label>
              <textarea
                id="front-text"
                name="front-text"
                rows={3}
                value={frontText}
                onChange={(e) => setFrontText(e.target.value)}
                className="shadow-sm block w-full focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter the question or prompt"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="back-text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Back
              </label>
              <textarea
                id="back-text"
                name="back-text"
                rows={3}
                value={backText}
                onChange={(e) => setBackText(e.target.value)}
                className="shadow-sm block w-full focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter the answer"
              />
            </div>
            
            {error && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <Link
                href={`/decks/${deckId}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={handleAddAnother}
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save & Add Another'}
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save & Done'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
} 