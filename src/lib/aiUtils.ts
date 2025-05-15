import { OPENROUTER_API_KEY, OPENROUTER_API_URL, SAFE_CONTENT_LENGTH } from './config';

/**
 * Interface for flashcard generation
 */
export interface GeneratedFlashcard {
  question: string;
  answer: string;
}

/**
 * Generates flashcards from content using OpenRouter API
 * @param content The content to generate flashcards from
 * @returns Array of generated flashcards
 */
export async function generateFlashcards(content: string): Promise<GeneratedFlashcard[]> {
  // Prepare content - trim to avoid excessive whitespace
  const trimmedContent = content.trim();
  
  // Limit content length if it's still too long
  const truncatedContent = trimmedContent.length > SAFE_CONTENT_LENGTH 
    ? trimmedContent.substring(0, SAFE_CONTENT_LENGTH) + "..." 
    : trimmedContent;
  
  // Call OpenRouter API to generate flashcards
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://ai-flashcards-app.vercel.app',
      'X-Title': 'AI Flashcards App'
    },
    body: JSON.stringify({
      model: 'mistral/mixtral-8x7b-instruct',
      messages: [
        {
          role: 'system',
          content: `You are an expert educational assistant that creates high-quality flashcards.
Your task is to create exactly 5 question-answer pairs from the provided content.
Focus on the most important concepts, definitions, and facts.
Each flashcard should have a clear question and a concise, accurate answer.`
        },
        {
          role: 'user',
          content: `Create 5 flashcards from the following content.
Format your response as a valid JSON array with objects containing 'question' and 'answer' fields.
The response should be ONLY the JSON array, with no additional text.
Example format:
[
  {"question": "What is photosynthesis?", "answer": "The process by which plants convert light energy into chemical energy"},
  {"question": "Who wrote Hamlet?", "answer": "William Shakespeare"}
]

Here's the content to create flashcards from:
${truncatedContent}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 1500
    })
  });
  
  if (!response.ok) {
    // Try to get more detailed error information
    try {
      const errorData = await response.json();
      console.error('API Error Details:', errorData);
      
      if (response.status === 400) {
        throw new Error(`API request failed: ${errorData.error?.message || 'Bad request. Try with shorter or simpler content.'}`);
      } else if (response.status === 401) {
        throw new Error('API authentication failed. Please check your OpenRouter API key.');
      } else {
        throw new Error(`API request failed with status ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
      }
    } catch (parseError) {
      // If we can't parse the error response
      if (response.status === 400) {
        throw new Error('API request failed: Bad request. Try with shorter or simpler content.');
      } else if (response.status === 401) {
        throw new Error('API authentication failed. Please check your OpenRouter API key.');
      } else {
        throw new Error(`API request failed with status: ${response.status}`);
      }
    }
  }
  
  const result = await response.json();
  console.log('API Response:', result);
  
  // Parse the AI response to extract flashcards
  let flashcards: GeneratedFlashcard[] = [];
  try {
    const content = result.choices[0].message.content;
    let parsedContent;
    
    try {
      parsedContent = JSON.parse(content);
    } catch (initialParseError) {
      // Try to extract JSON if it's wrapped in markdown code blocks or has extra text
      const jsonMatch = content.match(/```(?:json)?([\s\S]*?)```/) || content.match(/(\[[\s\S]*\])/);
      if (jsonMatch && jsonMatch[1]) {
        parsedContent = JSON.parse(jsonMatch[1].trim());
      } else {
        throw initialParseError;
      }
    }
    
    // Handle different response formats
    if (Array.isArray(parsedContent.flashcards)) {
      flashcards = parsedContent.flashcards;
    } else if (Array.isArray(parsedContent)) {
      flashcards = parsedContent;
    } else if (parsedContent.cards && Array.isArray(parsedContent.cards)) {
      flashcards = parsedContent.cards.map((card: any) => ({
        question: card.question || card.front || card.q || '',
        answer: card.answer || card.back || card.a || ''
      }));
    } else {
      throw new Error('Unexpected response format');
    }
    
    // Validate each flashcard has required fields
    flashcards = flashcards.filter(card => 
      card.question && card.question.trim() !== '' && 
      card.answer && card.answer.trim() !== ''
    );
  } catch (parseError) {
    console.error('Error parsing AI response:', parseError);
    console.error('Raw response:', result.choices[0].message.content);
    throw new Error('Failed to parse generated flashcards. Please try again with different content.');
  }
  
  if (flashcards.length === 0) {
    throw new Error('No valid flashcards were generated. Please try with different content.');
  }
  
  return flashcards;
} 