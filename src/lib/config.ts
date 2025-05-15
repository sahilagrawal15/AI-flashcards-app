// Configuration settings for the application

// API Keys
export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

// API Endpoints
export const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// AI Generation Settings
export const MAX_CONTENT_LENGTH = 10000; // Maximum allowed in the UI
export const SAFE_CONTENT_LENGTH = 8000; // Maximum to send to API
export const WARNING_CONTENT_LENGTH = 7500; // When to show warning

// Check if OpenRouter API key is available
export const hasValidOpenRouterKey = (): boolean => {
  return OPENROUTER_API_KEY.length > 0;
}; 