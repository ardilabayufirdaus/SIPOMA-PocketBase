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

  // Fetch API Key from PocketBase
  let apiKey = '';
  try {
    // Dynamically import PocketBase to avoid build issues if not available in this context
    // Note: Vercel functions support ESM if package.json has "type": "module" or .mjs extension
    // Since this is .js and project is type: module, it should work.
    const PocketBase = (await import('pocketbase')).default;
    const pb = new PocketBase('https://api.sipoma.site');

    // Attempt to fetch without auth (assuming public read or specific API rule)
    // If strict rules apply, we would need admin auth here.
    const record = await pb.collection('api_key').getFirstListItem('provider="xai"');
    apiKey = record.key;
  } catch (error) {
    console.error('Failed to fetch API key from PocketBase:', error);
    return res.status(500).json({
      error: 'Configuration Error',
      details: 'Could not retrieve API key from database.',
    });
  }

  if (!apiKey) {
    return res
      .status(500)
      .json({ error: 'Server configuration error: XAI_API_KEY not found in DB' });
  }

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Error proxying to x.AI:', error);
    res.status(500).json({ error: 'Failed to communicate with x.AI' });
  }
}
