export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // Adjust this to your specific domain in production for better security
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const ollamaUrl = process.env.OLLAMA_API_URL || 'http://127.0.0.1:11434/v1/chat/completions';

  try {
    const payload = {
      ...req.body,
      model: req.body?.model || 'qwen2.5:1.5b',
      options: {
        num_thread: 1,
        ...(req.body?.options || {}),
      },
    };

    const response = await fetch(ollamaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Error proxying to Ollama:', error);
    res.status(500).json({ error: 'Failed to communicate with local Ollama service' });
  }
}
