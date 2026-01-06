/**
 * Service to handle x.AI API interactions.
 *
 * In production (Vercel), requests are sent to /api/xai (Serverless Function).
 * In development (Vite), requests are proxied to https://api.x.ai/v1/chat/completions via vite.config.ts
 */

const API_ENDPOINT = '/api/xai';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  id: string;
  choices: {
    message: ChatMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export const xaiService = {
  /**
   * Send a chat completion request to x.AI
   * @param messages Array of chat messages
   * @param model Model to use (default: grok-beta)
   * @returns Promise resolving to the chat completion response
   */
  async chatCompletion(
    messages: ChatMessage[],
    model: string = 'grok-beta'
  ): Promise<ChatResponse> {
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Note: Host headers are handled by the browser/proxy
        },
        body: JSON.stringify({
          messages,
          model,
          stream: false,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `API Error: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('x.AI Service Error:', error);
      throw error;
    }
  },
};
