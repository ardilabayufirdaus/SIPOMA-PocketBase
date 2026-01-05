import 'dotenv/config';

const token = process.env.VITE_GITHUB_MODELS_PAT; // Use env var

  console.log("Testing GitHub Models with provided PAT...");
  
  try {
    const response = await fetch("https://models.inference.ai.azure.com/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: "Hello, are you working?" }
            ],
            model: "gpt-4o",
            temperature: 1,
            max_tokens: 100,
            top_p: 1
        })
    });

    if (response.ok) {
        const data = await response.json();
        console.log("Success! Response:");
        console.log(data.choices[0].message.content);
    } else {
        console.error("Error:", response.status, response.statusText);
        const text = await response.text();
        console.error("Details:", text);
    }
  } catch (err) {
      console.error("Exception:", err);
  }
}

testGithubModel();
