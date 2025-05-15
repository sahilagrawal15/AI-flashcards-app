'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
      setIsLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        setIsLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">AI Flashcards</h1>
          
          {!isLoading && (
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/dashboard"
                    className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/decks"
                    className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  >
                    My Decks
                  </Link>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link 
                    href="/auth/login" 
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:text-indigo-400 dark:bg-gray-800 dark:hover:bg-gray-700"
                  >
                    Log In
                  </Link>
                  <Link 
                    href="/auth/signup" 
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            <span className="block">Master Any Subject With</span>
            <span className="block text-indigo-600 dark:text-indigo-400">AI Flashcards</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Use spaced repetition to enhance your learning. Create decks, add flashcards, and study efficiently.
          </p>
          <div className="mt-10 flex justify-center gap-3 sm:gap-5">
            {!isLoading && (
              user ? (
                <Link 
                  href="/dashboard" 
                  className="px-8 py-3 rounded-md shadow text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-medium dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link 
                    href="/auth/signup" 
                    className="px-8 py-3 rounded-md shadow text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-medium dark:bg-indigo-500 dark:hover:bg-indigo-600"
                  >
                    Get Started
                  </Link>
                  <Link 
                    href="/auth/login" 
                    className="px-8 py-3 rounded-md border border-gray-300 dark:border-gray-700 shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-medium"
                  >
                    Log In
                  </Link>
                </>
              )
            )}
          </div>
        </div>

        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="w-12 h-12 rounded-md flex items-center justify-center bg-indigo-100 dark:bg-indigo-900">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Create Custom Decks</h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Organize your learning by creating custom decks for different subjects or topics.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="w-12 h-12 rounded-md flex items-center justify-center bg-indigo-100 dark:bg-indigo-900">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Spaced Repetition</h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Our algorithm schedules review sessions at optimal intervals to maximize retention.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="w-12 h-12 rounded-md flex items-center justify-center bg-indigo-100 dark:bg-indigo-900">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Track Progress</h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Monitor your learning with detailed statistics and track your performance over time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
