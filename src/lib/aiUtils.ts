import { OPENROUTER_API_KEY, OPENROUTER_API_URL, SAFE_CONTENT_LENGTH } from './config';

/**
 * Helper function for debug logging
 */
function debugLog(message: string, data?: any) {
  const DEBUG = process.env.NODE_ENV !== 'production';
  if (DEBUG) {
    console.log(`[AIUtils Debug] ${message}`);
    if (data !== undefined) {
      try {
        console.log(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('[Stringification failed]', data);
      }
    }
  }
}

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
 * @param count Number of flashcards to generate (default: 5)
 * @returns Array of generated flashcards
 */
export async function generateFlashcards(content: string, count: number = 5): Promise<GeneratedFlashcard[]> {
  // Check if API key is available
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key is not configured. Please add it to your .env.local file.');
  }

  debugLog('Using API key:', OPENROUTER_API_KEY ? `${OPENROUTER_API_KEY.substring(0, 5)}...` : 'Not set');
  debugLog('Using API URL:', OPENROUTER_API_URL);
  debugLog('Requested flashcard count:', count);

  // Prepare content - trim to avoid excessive whitespace
  const trimmedContent = content.trim();
  
  // Limit content length if it's still too long
  const truncatedContent = trimmedContent.length > SAFE_CONTENT_LENGTH 
    ? trimmedContent.substring(0, SAFE_CONTENT_LENGTH) + "..." 
    : trimmedContent;
  
  debugLog('Content length:', `${truncatedContent.length} characters`);
  
  // Prepare request body
  const requestBody = {
    model: 'mistralai/mixtral-8x7b-instruct',
    messages: [
      {
        role: 'system',
        content: `You are an expert educational assistant that creates high-quality flashcards.
Your task is to create exactly ${count} question-answer pairs from the provided content.
Focus on the most important concepts, definitions, and facts.
Each flashcard should have a clear question and a concise, accurate answer.
You MUST format your response as a valid JSON array with objects containing 'question' and 'answer' fields.
Be extremely careful with JSON syntax - use double quotes for strings and property names, avoid trailing commas, and ensure the JSON is valid.
Example of valid JSON format:
[
  {"question": "What is photosynthesis?", "answer": "The process by which plants convert light energy into chemical energy"},
  {"question": "Who wrote Hamlet?", "answer": "William Shakespeare"}
]`
      },
      {
        role: 'user',
        content: `Create ${count} flashcards from the following content.
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
  };

  debugLog('Sending request to OpenRouter API...');
  
  try {
    // Call OpenRouter API to generate flashcards
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://ai-flashcards-app.vercel.app',
        'X-Title': 'AI Flashcards App'
      },
      body: JSON.stringify(requestBody)
    });
    
    debugLog('Response status:', response.status);
    
    if (!response.ok) {
      // Try to get more detailed error information
      try {
        const errorText = await response.text();
        debugLog('Error response text:', errorText);
        
        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (jsonError) {
          debugLog('Failed to parse error response as JSON');
        }
        
        debugLog('API Error Details:', errorData);
        
        if (response.status === 400) {
          throw new Error(`API request failed with status 400: ${errorData?.error?.message || 'Bad request. Try with shorter or simpler content.'}`);
        } else if (response.status === 401) {
          throw new Error(`API authentication failed (401). Please check your OpenRouter API key. Key starts with: ${OPENROUTER_API_KEY.substring(0, 5)}...`);
        } else if (response.status === 403) {
          throw new Error('API access forbidden (403). Your API key may not have permission to use this model.');
        } else if (response.status === 429) {
          throw new Error('API rate limit exceeded (429). Please try again later.');
        } else {
          throw new Error(`API request failed with status ${response.status}: ${errorData?.error?.message || 'Unknown error'}`);
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
    
    const responseText = await response.text();
    debugLog('Raw API response:', responseText);
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (jsonError) {
      debugLog('Failed to parse API response as JSON:', jsonError);
      throw new Error('Invalid JSON response from API');
    }
    
    // Parse the AI response to extract flashcards
    let flashcards: GeneratedFlashcard[] = [];
    try {
      const content = result.choices[0].message.content;
      debugLog('AI generated content:', content);
      let parsedContent;
      
      try {
        // First attempt: direct JSON parsing
        parsedContent = JSON.parse(content);
        debugLog('Successfully parsed JSON directly');
      } catch (initialParseError) {
        debugLog('Initial JSON parse failed, trying to extract and clean JSON', initialParseError);
        
        // Second attempt: Try to extract JSON if it's wrapped in markdown code blocks or has extra text
        const jsonMatch = content.match(/```(?:json)?([\s\S]*?)```/) || content.match(/(\[[\s\S]*\])/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            // Clean up the JSON string - replace common issues that cause parsing errors
            let jsonString = jsonMatch[1].trim();
            
            // Fix trailing commas in arrays and objects (common issue with AI-generated JSON)
            jsonString = jsonString.replace(/,\s*([}\]])/g, '$1');
            
            // Fix missing quotes around property names
            jsonString = jsonString.replace(/(\{|\,)\s*([a-zA-Z0-9_]+)\s*\:/g, '$1"$2":');
            
            // Fix single quotes used instead of double quotes
            jsonString = jsonString.replace(/'/g, '"');
            
            debugLog('Attempting to parse cleaned JSON string');
            parsedContent = JSON.parse(jsonString);
          } catch (cleanupError) {
            debugLog('Failed to parse cleaned JSON:', cleanupError);
            debugLog('Raw JSON string after cleanup:', jsonMatch[1].trim());
            
            // Third attempt: Last resort - try to manually extract flashcard objects
            try {
              debugLog('Attempting manual extraction of flashcards');
              const flashcardsArray = [];
              // Look for question/answer patterns in the content
              const matches = content.match(/["']?question["']?\s*:\s*["']([^"']+)["']\s*,\s*["']?answer["']?\s*:\s*["']([^"']+)["']/g);
              
              if (matches && matches.length > 0) {
                for (const match of matches) {
                  const questionMatch = match.match(/["']?question["']?\s*:\s*["']([^"']+)["']/);
                  const answerMatch = match.match(/["']?answer["']?\s*:\s*["']([^"']+)["']/);
                  
                  if (questionMatch && answerMatch) {
                    flashcardsArray.push({
                      question: questionMatch[1],
                      answer: answerMatch[1]
                    });
                  }
                }
              }
              
              if (flashcardsArray.length > 0) {
                parsedContent = flashcardsArray;
              } else {
                throw new Error('Could not extract valid flashcards from response');
              }
            } catch (manualExtractionError) {
              debugLog('All JSON parsing attempts failed');
              throw new Error('Failed to parse generated flashcards. The AI response was not in a valid format. Please try again.');
            }
          }
        } else {
          debugLog('No JSON-like content found in the response');
          throw new Error('Failed to find JSON content in the AI response. Please try again.');
        }
      }
      
      // Handle different response formats
      if (Array.isArray(parsedContent.flashcards)) {
        flashcards = parsedContent.flashcards;
        debugLog('Found flashcards array in parsed content', flashcards);
      } else if (Array.isArray(parsedContent)) {
        flashcards = parsedContent;
        debugLog('Using parsed content as flashcards array', flashcards);
      } else if (parsedContent.cards && Array.isArray(parsedContent.cards)) {
        flashcards = parsedContent.cards.map((card: any) => ({
          question: card.question || card.front || card.q || '',
          answer: card.answer || card.back || card.a || ''
        }));
        debugLog('Mapped cards array to flashcards', flashcards);
      } else if (typeof parsedContent === 'object') {
        // Try to extract any array property that might contain flashcards
        const possibleArrayProps = Object.keys(parsedContent).filter(key => 
          Array.isArray(parsedContent[key]) && parsedContent[key].length > 0
        );
        
        if (possibleArrayProps.length > 0) {
          // Use the first array property found
          const arrayProp = possibleArrayProps[0];
          const candidateArray = parsedContent[arrayProp];
          
          // Check if array items have question/answer or similar properties
          if (candidateArray[0].question || candidateArray[0].front || candidateArray[0].q) {
            flashcards = candidateArray.map((item: any) => ({
              question: item.question || item.front || item.q || '',
              answer: item.answer || item.back || item.a || ''
            }));
            debugLog(`Extracted flashcards from '${arrayProp}' property`, flashcards);
          } else {
            throw new Error('Found array but items do not have question/answer format');
          }
        } else {
          throw new Error('Unexpected response format');
        }
      } else {
        throw new Error('Unexpected response format');
      }
      
      // Validate each flashcard has required fields
      flashcards = flashcards.filter(card => 
        card.question && card.question.trim() !== '' && 
        card.answer && card.answer.trim() !== ''
      );
    } catch (parseError) {
      debugLog('Error parsing AI response:', parseError);
      debugLog('Raw content:', result.choices?.[0]?.message?.content || 'No content available');
      throw new Error('Failed to parse generated flashcards. Please try again with different content.');
    }
    
    if (flashcards.length === 0) {
      throw new Error('No valid flashcards were generated. Please try with different content.');
    }
    
    return flashcards;
  } catch (fetchError) {
    debugLog('Fetch error:', fetchError);
    throw fetchError;
  }
} 