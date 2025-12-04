import { GestureState } from '../types';

// DeepSeek API Configuration
// process.env.API_KEY is injected by the build environment/Netlify
const API_URL = 'https://api.deepseek.com/chat/completions';

export const analyzeGesture = async (base64Image: string): Promise<GestureState> => {
  try {
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      console.warn("API Key is missing. Please check your environment variables.");
      return 'OPEN';
    }

    // Construct the request payload in OpenAI-compatible format for DeepSeek
    const payload = {
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "You are a real-time gesture recognition engine. Analyze the hand gesture and respond with valid JSON only. format: { \"state\": \"OPEN\" | \"CLOSED\" }. 'OPEN' for spread fingers, 'CLOSED' for fist or pinch."
        },
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "Analyze the hand in this image. Is it OPEN or CLOSED? Return JSON." 
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 50,
      temperature: 0.1
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`DeepSeek API Error (${response.status}):`, errorText);
      return 'OPEN';
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) return 'OPEN';

    // Parse the JSON response
    // Handle potential markdown wrapping (e.g. ```json ... ```)
    const cleanJson = content.replace(/```json\n?|```/g, '').trim();
    
    try {
        const result = JSON.parse(cleanJson);
        return (result.state === 'CLOSED') ? 'CLOSED' : 'OPEN';
    } catch (e) {
        console.error("Failed to parse DeepSeek response:", content);
        return 'OPEN';
    }

  } catch (error) {
    console.error("Gesture analysis failed:", error);
    return 'OPEN';
  }
};