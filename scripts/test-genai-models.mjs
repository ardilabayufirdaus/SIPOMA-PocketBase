import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = 'AIzaSyC5LHQWQTTq4qCMXiT90wR8WFxzJxLy_Z4';

async function listModels() {
  try {
    console.log('Fetching available models via REST API...');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    if (data.models) {
        const fs = await import('fs');
        fs.writeFileSync('available_models.json', JSON.stringify(data.models, null, 2));
        console.log("Models saved to available_models.json");
    } else {
        console.log("No models found or error:", data);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

listModels();
