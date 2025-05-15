'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Deck, getDecks } from '../lib/api';
import { supabase } from '../lib/supabase';

export function DeckList() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Auth session error:', error.message);
          return null;
        }
        return data.session?.user || null;
      } catch (err) {
        console.error('Error getting user session:', err);
        return null;
      }
    };

    async function fetchDecks() {
      try {
        const currentUser = await getUser();
        if (!currentUser) {
          setIsLoading(false);
          return;
        }
        
        setUser(currentUser);
        setIsLoading(true);
        const fetchedDecks = await getDecks(currentUser.id);
        setDecks(fetchedDecks);
        setError(null);
      } catch (err) {
        console.error('Error in DeckList fetchDecks:', err);
        setError('Failed to load decks. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDecks();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mx-auto max-w-md">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Authentication Required</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Please log in to view your flashcard decks.</p>
          <Link
            href="/auth/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            Log In
          </Link>
        </div>
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

  if (decks.length === 0) {
    return (
      <div className="text-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mx-auto max-w-md">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">No decks yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">You haven't created any flashcard decks yet. Create your first deck to start learning!</p>
          <Link
            href="/decks/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            Create First Deck
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {decks.map((deck) => (
        <Link
          key={deck.id}
          href={`/decks/${deck.id}`}
          className="block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
        >
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
              {deck.name}
            </h3>
            <div className="mt-4 flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(deck.created_at).toLocaleDateString()}
              </span>
              <div className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 text-sm font-medium">
                View Cards →
              </div>
            </div>
          </div>
        </Link>
      ))}
      
      <Link
        href="/decks/new"
        className="block border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
      >
        <div className="h-full flex flex-col items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
            Create New Deck
          </span>
        </div>
      </Link>
    </div>
  );
} 