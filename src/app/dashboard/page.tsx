'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { Deck, getDecks, createDeck } from '../../lib/api';
import { OPENROUTER_API_KEY, OPENROUTER_API_URL, hasValidOpenRouterKey, MAX_CONTENT_LENGTH, WARNING_CONTENT_LENGTH, SAFE_CONTENT_LENGTH } from '../../lib/config';
import { ApiKeySetup } from '../../components/ApiKeySetup';
import { generateFlashcards, GeneratedFlashcard } from '../../lib/aiUtils';
import { createFlashcard } from '../../lib/api';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckName, setDeckName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSuccess, setGenerationSuccess] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const getUser = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error || !data.session) {
        router.push('/auth/login');
        return;
      }
      
      setUser(data.session.user);
      setIsLoading(false);
      
      // Fetch decks after user is confirmed
      fetchDecks(data.session.user.id);
    };

    getUser();
  }, [router]);

  const fetchDecks = async (userId: string) => {
    try {
      setIsLoading(true);
      const data = await getDecks(userId);
      setDecks(data);
      
      // If we have decks, select the first one as default for AI generation
      if (data && data.length > 0) {
        setSelectedDeckId(data[0].id);
      }
    } catch (err) {
      console.error('Error in dashboard fetchDecks:', err);
      setError('Failed to load decks. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deckName.trim()) {
      setError('Please enter a deck name');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Insert new deck
      const newDeck = await createDeck({ 
        name: deckName.trim(), 
        user_id: user.id 
      });
      
      if (!newDeck) {
        setError('Failed to create deck. Please try again.');
        return;
      }
      
      // Reset form and refresh decks
      setDeckName('');
      fetchDecks(user.id);
    } catch (err) {
      console.error('Error in dashboard handleCreateDeck:', err);
      setError('Failed to create deck. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleGenerateFlashcards = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setGenerationError('Please enter some content to generate flashcards from');
      return;
    }
    
    // Check content length - OpenRouter has limits
    if (content.length > MAX_CONTENT_LENGTH) {
      setGenerationError(`Content is too long. Please limit your text to ${MAX_CONTENT_LENGTH.toLocaleString()} characters or less.`);
      return;
    }
    
    if (!selectedDeckId) {
      setGenerationError('Please select a deck');
      return;
    }
    
    // Check if API key is available
    if (!hasValidOpenRouterKey()) {
      setGenerationError('OpenRouter API key is missing. Please add it to your environment variables.');
      return;
    }
    
    setIsGenerating(true);
    setGenerationError(null);
    setGenerationSuccess(null);
    
    try {
      // Generate flashcards using the utility function
      const flashcards = await generateFlashcards(content);
      
      // Save flashcards to the database
      const today = new Date().toISOString();
      let savedCount = 0;
      let failedCount = 0;
      
      // Process each flashcard sequentially to avoid race conditions
      for (const card of flashcards) {
        try {
          const newCard = {
            deck_id: selectedDeckId,
            front_text: card.question,
            back_text: card.answer,
            interval: 1,
            next_review: today
          };
          
          const result = await createFlashcard(newCard);
          
          if (result) {
            savedCount++;
          } else {
            failedCount++;
            console.error('Error inserting flashcard: Permission denied or invalid data');
          }
        } catch (insertError) {
          failedCount++;
          console.error('Error inserting flashcard:', insertError);
        }
      }
      
      if (savedCount === 0) {
        throw new Error('Failed to save any flashcards. Please verify you have permission to add to this deck.');
      }
      
      let successMessage = `Successfully generated and saved ${savedCount} flashcards to the selected deck!`;
      if (failedCount > 0) {
        successMessage += ` (${failedCount} failed to save)`;
      }
      
      setGenerationSuccess(successMessage);
      setContent('');
    } catch (err) {
      console.error('Error generating flashcards:', err);
      setGenerationError(err instanceof Error ? err.message : 'Failed to generate flashcards. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error logging out:', error);
      return;
    }
    
    router.push('/auth/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
            AI Flashcards
          </Link>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Create New Deck
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Add a new flashcard deck to your collection
            </p>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-6">
            <form onSubmit={handleCreateDeck} className="space-y-4">
              <div>
                <label htmlFor="deck-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Deck Name
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    name="deck-name"
                    id="deck-name"
                    value={deckName}
                    onChange={(e) => setDeckName(e.target.value)}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Enter deck name"
                  />
                </div>
              </div>
              
              {error && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                  <div className="flex">
                    <div className="text-sm text-red-700 dark:text-red-400">
                      {error}
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Deck'}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {decks.length > 0 && (
          <div className="mb-10 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Generate Flashcards with AI
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                Paste content and automatically generate flashcards
              </p>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-6">
              <ApiKeySetup />
              
              <form onSubmit={handleGenerateFlashcards} className="space-y-4">
                <div>
                  <label htmlFor="deck-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select Deck
                  </label>
                  <div className="mt-1">
                    <select
                      id="deck-select"
                      value={selectedDeckId}
                      onChange={(e) => setSelectedDeckId(e.target.value)}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      {decks.map((deck) => (
                        <option key={deck.id} value={deck.id}>
                          {deck.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Content for Flashcards
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="content"
                      rows={6}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Paste your notes, text, or any content you want to create flashcards from..."
                      maxLength={MAX_CONTENT_LENGTH}
                    />
                    <p className={`mt-1 text-xs ${content.length > WARNING_CONTENT_LENGTH ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {content.length}/{MAX_CONTENT_LENGTH.toLocaleString()} characters
                    </p>
                  </div>
                </div>
                
                {generationError && (
                  <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                    <div className="flex">
                      <div className="text-sm text-red-700 dark:text-red-400">
                        {generationError}
                      </div>
                    </div>
                  </div>
                )}
                
                {generationSuccess && (
                  <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
                    <div className="flex">
                      <div className="text-sm text-green-700 dark:text-green-400">
                        {generationSuccess}
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <button
                    type="submit"
                    disabled={isGenerating || !selectedDeckId || !content.trim()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-600 disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {content.length > SAFE_CONTENT_LENGTH ? 'Trimming content and generating...' : 'Generating Flashcards...'}
                      </>
                    ) : (
                      'Generate Flashcards'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                My Flashcard Decks
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                {decks.length} {decks.length === 1 ? 'deck' : 'decks'} in your collection
              </p>
            </div>
            <Link
              href="/decks"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              View All Decks
            </Link>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700">
            {decks.length === 0 ? (
              <div className="text-center py-8 px-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">You don't have any flashcard decks yet. Create your first deck above!</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {decks.slice(0, 5).map((deck) => (
                  <li key={deck.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Link href={`/decks/${deck.id}`} className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{deck.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Created: {new Date(deck.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-indigo-600 dark:text-indigo-400 text-sm font-medium">View Cards →</div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 