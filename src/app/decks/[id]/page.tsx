'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '../../../components/Navbar';
import { FlashcardList } from '../../../components/FlashcardList';
import { useAuth } from '../../../context/AuthContext';
import { getDeck, deleteDeck, Deck } from '../../../lib/api';

export default function DeckDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const deckId = resolvedParams.id;

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login');
    }
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    async function fetchDeck() {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const fetchedDeck = await getDeck(deckId);
        
        if (!fetchedDeck) {
          setError('Deck not found or you do not have permission to view it.');
          return;
        }
        
        setDeck(fetchedDeck);
        setError(null);
      } catch (err) {
        console.error('Error in DeckDetailPage fetchDeck:', err);
        setError('Failed to load deck. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchDeck();
    }
  }, [deckId, user]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this deck? This will delete all flashcards in this deck and cannot be undone.')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      const success = await deleteDeck(deckId);
      
      if (!success) {
        setError('Failed to delete deck. Please try again.');
        setIsDeleting(false);
        return;
      }
      
      router.push('/decks');
    } catch (err) {
      console.error('Error in DeckDetailPage handleDelete:', err);
      setError('Failed to delete deck. Please try again.');
      setIsDeleting(false);
    }
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
  
  if (error || !deck) {
    return (
      <>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
            <p className="text-red-700 dark:text-red-400">{error || 'Deck not found'}</p>
            <Link href="/decks" className="mt-2 inline-block text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
              Return to decks
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
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
              {deck.name}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Created on {new Date(deck.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="mt-4 flex flex-wrap md:mt-0 md:ml-4 gap-3">
            <Link
              href={`/decks/${deckId}/study`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              Study Deck
            </Link>
            <Link
              href={`/decks/${deckId}/review`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:bg-purple-500 dark:hover:bg-purple-600"
            >
              Review Due Cards
            </Link>
            <Link
              href={`/decks/${deckId}/cards/new`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              Add Card
            </Link>
            <Link
              href={`/decks/${deckId}/generate`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-600"
            >
              Generate with AI
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-600 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete Deck'}
            </button>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Flashcards
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Review all flashcards in this deck
            </p>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-6">
            <FlashcardList deckId={deckId} />
          </div>
        </div>
      </div>
    </>
  );
} 