export const genAIService = {
  async sendMessage(apiKey: string, context: string, userQuery: string) {
    try {
      if (!apiKey) throw new Error('API Key is missing');

      // Strict enforcement for xAI
      // We assume the key provided is an xAI key (starts with 'xai-')
      // but we will proceed regardless, letting the API reject invalid keys.

      // Using grok-2-latest as a stable, high-performance model
      // fallback to grok-beta if needed
      const modelName = 'grok-2-latest';

      const response = await fetch('/api/xai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are the "Plant Operations Assistant", a Senior Process Engineer AI for a cement plant.\nYour goal is to provide insightful analysis, troubleshooting advice, and operational support.\n\nCONTEXT DATA:\n${context}\n\nINSTRUCTIONS:\n1. Analyze the Context.\n2. Be Insightful.\n3. Handle Missing Data Gracefully.\n4. Tone: Professional (Engineer-to-Engineer).\n5. Language: Indonesian (Bahasa Indonesia).`,
            },
            { role: 'user', content: userQuery },
          ],
          model: modelName,
          stream: false,
          temperature: 0.1, // Low temperature for factual engineering responses
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        let niceError = `xAI Error (${response.status})`;

        if (response.status === 401 || response.status === 403) {
          niceError = 'Akses Ditolak: API Key tidak valid atau saldo habis.';
        } else if (response.status === 429) {
          niceError = 'Rate Limit: Terlalu banyak request. Tunggu sebentar.';
        } else if (response.status === 404) {
          niceError = 'Model xAI tidak ditemukan atau sedang maintenance.';
        } else {
          try {
            const errObj = JSON.parse(errText);
            if (errObj.error?.message) niceError += `: ${errObj.error.message}`;
          } catch (e) {
            niceError += `: ${errText.substring(0, 100)}`;
          }
        }
        throw new Error(niceError);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error: unknown) {
      console.error('GenAI Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown Error';
      return `Maaf, terjadi kesalahan sistem AI: ${errorMessage}`;
    }
  },
};
