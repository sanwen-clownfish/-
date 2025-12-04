import { GoogleGenAI, Type } from "@google/genai";
import { GestureState } from '../types';

// The API key must be obtained exclusively from the environment variable process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeGesture = async (base64Image: string): Promise<GestureState> => {
  try {
    // Extract mimeType and base64 data from the data URL
    const match = base64Image.match(/^data:(image\/\w+);base64,(.+)$/);
    const mimeType = match ? match[1] : 'image/jpeg';
    const data = match ? match[2] : base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: data
            }
          },
          {
            text: "Analyze the hand in this image. Is it OPEN or CLOSED?"
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            state: {
              type: Type.STRING,
              description: "The state of the hand gesture: 'OPEN' or 'CLOSED'."
            }
          }
        }
      }
    });

    const text = response.text;
    
    if (text) {
      const result = JSON.parse(text);
      if (result.state === 'CLOSED') {
        return 'CLOSED';
      }
    }
    
    return 'OPEN';

  } catch (error) {
    console.error("Gesture analysis failed:", error);
    return 'OPEN';
  }
};