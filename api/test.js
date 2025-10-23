// API Test untuk memverifikasi apakah proxy API berfungsi dengan baik
// File: api/test.js

export default async function handler(req, res) {
  try {
    // Kirim respon untuk menunjukkan bahwa API endpoint berfungsi
    res.status(200).json({
      status: 'success',
      message: 'API test endpoint is working',
      environment: {
        isVercel: process.env.VERCEL === '1',
        nodeEnv: process.env.NODE_ENV,
        url: req.url,
        headers: req.headers,
      },
    });
  } catch (error) {
    console.error('Error in API test endpoint:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message,
    });
  }
}

