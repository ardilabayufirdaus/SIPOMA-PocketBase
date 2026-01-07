import { xaiService } from '../utils/aiService';

export const genAIService = {
  async sendMessage(context: string, userQuery: string) {
    try {
      const modelName = 'grok-4-1-fast-reasoning';

      const messages = [
        {
          role: 'system' as const,
          content: `You are the "Plant Operations Assistant", a Senior Process Engineer AI for a cement plant.\nYour goal is to provide insightful analysis, troubleshooting advice, and operational support.\n\nCONTEXT DATA:\n${context}\n\nINSTRUCTIONS:\n1. Analyze the Context.\n2. Be Insightful.\n3. Handle Missing Data Gracefully.\n4. Tone: Professional (Engineer-to-Engineer).\n5. Language: Indonesian (Bahasa Indonesia).`,
        },
        { role: 'user' as const, content: userQuery },
      ];

      const data = await xaiService.chatCompletion(messages, modelName);
      return data.choices[0].message.content;
    } catch (error: unknown) {
      console.error('GenAI Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown Error';
      return `Maaf, terjadi kesalahan sistem AI: ${errorMessage}`;
    }
  },
};
