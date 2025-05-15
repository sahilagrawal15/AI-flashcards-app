import { useState } from 'react';
import { hasValidOpenRouterKey } from '../lib/config';

export function ApiKeySetup() {
  const [showInstructions, setShowInstructions] = useState(false);
  const hasKey = hasValidOpenRouterKey();

  if (hasKey) return null;

  return (
    <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
            API Key Required
          </h3>
          <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-200">
            <p>
              To generate flashcards with AI, you need to set up an OpenRouter API key.
            </p>
            <button
              type="button"
              className="mt-2 text-sm font-medium text-yellow-800 dark:text-yellow-300 hover:text-yellow-600 dark:hover:text-yellow-400"
              onClick={() => setShowInstructions(!showInstructions)}
            >
              {showInstructions ? 'Hide instructions' : 'Show instructions'}
            </button>
            
            {showInstructions && (
              <div className="mt-3 space-y-2">
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Go to <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="underline">OpenRouter.ai</a> and create an account</li>
                  <li>Generate a new API key from your dashboard</li>
                  <li>Create a <code className="bg-yellow-100 dark:bg-yellow-800/30 px-1 py-0.5 rounded">.env.local</code> file in your project root</li>
                  <li>Add this line: <code className="bg-yellow-100 dark:bg-yellow-800/30 px-1 py-0.5 rounded">NEXT_PUBLIC_OPENROUTER_API_KEY=your_api_key_here</code></li>
                  <li>Restart your development server</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 