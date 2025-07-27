
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userMessage } = req.body;

  const openaiApiKey = process.env.OPENAI_API_KEY;
  const weatherApiKey = process.env.OPENWEATHER_API_KEY;

  if (!openaiApiKey || !weatherApiKey) {
    return res.status(500).json({ error: 'Missing API keys' });
  }

  const city = 'Tuscaloosa';
  const weatherResponse = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${weatherApiKey}&units=imperial`
  );

  const weatherData = await weatherResponse.json();

  if (!weatherData || weatherData.cod !== 200) {
    return res.status(500).json({ error: 'Failed to fetch weather data' });
  }

  const { temp, humidity } = weatherData.main;
  const condition = weatherData.weather[0].description;

  const contextMessage = \`
Today in \${city}, it's \${temp}°F with \${humidity}% humidity and \${condition}.
User asked: "\${userMessage}"
Based on the weather, skin health, and daily care, give a helpful skincare suggestion in a warm, friendly tone. Keep it under 100 words.
\`;

  const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${openaiApiKey}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: contextMessage }],
      temperature: 0.7
    })
  });

  const result = await openaiResponse.json();
  const aiMessage = result?.choices?.[0]?.message?.content;

  if (!aiMessage) {
    return res.status(500).json({ error: 'Failed to get response from AI' });
  }

  res.status(200).json({ reply: aiMessage });
}
