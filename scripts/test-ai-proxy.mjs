// import fetch from 'node-fetch'; // fetch is global in Node 18+

async function testProxy() {
  console.log('Testing AI Proxy at http://localhost:5173/api/xai ...');

  try {
    const response = await fetch('http://localhost:5173/api/xai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are a test bot.' },
          { role: 'user', content: 'Hello' },
        ],
        model: 'grok-4-1-fast-reasoning',
        stream: false,
      }),
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('Success! Response data:', JSON.stringify(data).substring(0, 100) + '...');
    } else {
      const text = await response.text();
      console.log('Error Body:', text);
    }
  } catch (error) {
    console.error('Fetch error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('Is the dev server running?');
    }
  }
}

testProxy();
