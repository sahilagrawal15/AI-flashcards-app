// Simple script to test OpenRouter API key
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

const API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

console.log('Testing OpenRouter API connection...');
console.log('API Key available:', API_KEY ? `Yes (starts with ${API_KEY.substring(0, 5)}...)` : 'No');

if (!API_KEY) {
  console.error('ERROR: No API key found in .env.local file');
  console.log('Please create a .env.local file with NEXT_PUBLIC_OPENROUTER_API_KEY=your_key_here');
  process.exit(1);
}

async function testApi() {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'HTTP-Referer': 'https://ai-flashcards-app.vercel.app',
        'X-Title': 'AI Flashcards App'
      },
      body: JSON.stringify({
        model: 'mistralai/mixtral-8x7b-instruct',
        messages: [
          {
            role: 'user',
            content: 'Say hello in JSON format'
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 50
      })
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      console.error('API request failed with status:', response.status);
      return;
    }

    const result = await response.json();
    console.log('API Response:', result);
    console.log('SUCCESS: API connection working correctly!');
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testApi(); 