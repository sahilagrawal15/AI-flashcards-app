'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../../lib/supabase';
import { createFlashcard, getDeck, NewFlashcard } from '../../../../lib/api';
import { OPENROUTER_API_KEY, OPENROUTER_API_URL, hasValidOpenRouterKey, MAX_CONTENT_LENGTH, WARNING_CONTENT_LENGTH, SAFE_CONTENT_LENGTH } from '../../../../lib/config';
import { ApiKeySetup } from '../../../../components/ApiKeySetup';
import { generateFlashcards, GeneratedFlashcard } from '../../../../lib/aiUtils';

export default function GenerateFlashcardsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAddingMore, setIsAddingMore] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deckName, setDeckName] = useState('');
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [generatedFlashcards, setGeneratedFlashcards] = useState<GeneratedFlashcard[]>([]);
  const [cardCount, setCardCount] = useState<number>(5);
  const router = useRouter();
  const deckId = resolvedParams.id;

  useEffect(() => {
    // Check if user is logged in and fetch deck data
    const init = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error || !data.session) {
        router.push('/auth/login');
        return;
      }
      
      setUser(data.session.user);
      
      try {
        const deck = await getDeck(deckId);
        if (deck) {
          setDeckName(deck.name);
        } else {
          setError('Deck not found or you do not have permission to view it.');
        }
      } catch (err) {
        console.error('Error in GenerateFlashcardsPage init:', err);
        setError('Failed to load deck information.');
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [deckId, router]);

  const handleGenerateFlashcards = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Please enter some content to generate flashcards from.');
      return;
    }
    
    // Check content length - OpenRouter has limits
    if (content.length > MAX_CONTENT_LENGTH) {
      setError(`Content is too long. Please limit your text to ${MAX_CONTENT_LENGTH.toLocaleString()} characters or less.`);
      return;
    }
    
    // Check if API key is available
    if (!hasValidOpenRouterKey()) {
      setError('OpenRouter API key is missing. Please add it to your environment variables.');
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setSuccess(null);
    setGeneratedFlashcards([]);
    
    try {
      // Generate flashcards using the utility function with the specified count
      const flashcards = await generateFlashcards(content, cardCount);
      
      // Show the generated flashcards
      setGeneratedFlashcards(flashcards);
      
    } catch (err) {
      console.error('Error generating flashcards:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate flashcards. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleAddMoreFlashcards = async () => {
    if (!content.trim()) {
      setError('Please enter some content to generate flashcards from.');
      return;
    }
    
    // Check if API key is available
    if (!hasValidOpenRouterKey()) {
      setError('OpenRouter API key is missing. Please add it to your environment variables.');
      return;
    }
    
    setIsAddingMore(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Generate additional flashcards using the utility function
      const newFlashcards = await generateFlashcards(content, cardCount);
      
      // Append the new flashcards to the existing ones
      setGeneratedFlashcards(prevCards => [...prevCards, ...newFlashcards]);
      
      // Show success message
      setSuccess(`${newFlashcards.length} new cards added!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (err) {
      console.error('Error generating additional flashcards:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate additional flashcards. Please try again.');
    } finally {
      setIsAddingMore(false);
    }
  };
  
  const handleSaveFlashcards = async () => {
    if (generatedFlashcards.length === 0) {
      setError('No flashcards to save.');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Save flashcards to the database
      const today = new Date().toISOString();
      let savedCount = 0;
      let failedCount = 0;
      
      // Process each flashcard sequentially to avoid race conditions
      for (const card of generatedFlashcards) {
        try {
          const newCard: NewFlashcard = {
            deck_id: deckId,
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
            console.error('Failed to save flashcard: Permission denied or invalid data');
          }
        } catch (err) {
          failedCount++;
          console.error('Error saving flashcard:', err);
        }
      }
      
      if (savedCount === 0) {
        throw new Error('Failed to save any flashcards. Please verify you have permission to add to this deck.');
      }
      
      let successMessage = `Successfully saved ${savedCount} flashcards!`;
      if (failedCount > 0) {
        successMessage += ` (${failedCount} failed to save)`;
      }
      
      setSuccess(successMessage);
      setContent('');
      setGeneratedFlashcards([]);
    } catch (err) {
      console.error('Error saving flashcards:', err);
      setError(err instanceof Error ? err.message : 'Failed to save flashcards. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900">
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
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Link href={`/decks/${deckId}`} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
            ← Back to {deckName}
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            Generate Flashcards with AI
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Paste notes, articles, or any text to automatically generate flashcards for your deck.
          </p>
        </div>
        
        <ApiKeySetup />
        
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleGenerateFlashcards}>
              <div className="mb-4">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Paste your content
                </label>
                <textarea
                  id="content"
                  rows={10}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-md"
                  placeholder="Paste your notes, text, or any content you want to create flashcards from..."
                  maxLength={MAX_CONTENT_LENGTH}
                />
                <p className={`mt-1 text-xs ${content.length > WARNING_CONTENT_LENGTH ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {content.length}/{MAX_CONTENT_LENGTH.toLocaleString()} characters
                </p>
              </div>
              
              <div className="mb-4">
                <label htmlFor="card-count" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  How many cards to generate?
                </label>
                <select
                  id="card-count"
                  value={cardCount}
                  onChange={(e) => setCardCount(Number(e.target.value))}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value={5}>5 cards</option>
                  <option value={10}>10 cards</option>
                  <option value={15}>15 cards</option>
                  <option value={20}>20 cards</option>
                </select>
              </div>
              
              {error && (
                <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                  <div className="flex">
                    <div className="text-sm text-red-700 dark:text-red-400">
                      {error}
                    </div>
                  </div>
                </div>
              )}
              
              {success && (
                <div className="mb-4 rounded-md bg-green-50 dark:bg-green-900/20 p-4">
                  <div className="flex">
                    <div className="text-sm text-green-700 dark:text-green-400">
                      {success}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isGenerating || !content.trim() || isSaving || isAddingMore}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50"
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
                
                {generatedFlashcards.length > 0 && (
                  <button
                    type="button"
                    onClick={handleAddMoreFlashcards}
                    disabled={isAddingMore || !content.trim() || isSaving || isGenerating}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:bg-purple-500 dark:hover:bg-purple-600 disabled:opacity-50"
                  >
                    {isAddingMore ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Adding More Cards...
                      </>
                    ) : (
                      'Add More Cards'
                    )}
                  </button>
                )}
              </div>
            </form>
            
            {/* Generated Flashcards Preview */}
            {generatedFlashcards.length > 0 && (
              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Generated Flashcards ({generatedFlashcards.length})
                </h3>
                <div className="space-y-4">
                  {generatedFlashcards.map((card, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <p className="font-medium text-gray-900 dark:text-white">Q: {card.question}</p>
                      <p className="mt-2 text-gray-700 dark:text-gray-300">A: {card.answer}</p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveFlashcards}
                    disabled={isSaving || isGenerating || isAddingMore}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-600 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving Flashcards...
                      </>
                    ) : (
                      'Save These Flashcards'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          <p>Tips:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Paste well-structured content for better quality flashcards</li>
            <li>Include definitions, concepts, and key points</li>
            <li>The AI works best with clear, factual information</li>
            <li>Generated flashcards will be automatically added to this deck</li>
          </ul>
        </div>
      </main>
    </div>
  );
} 