import { GoogleGenAI } from "@google/genai";
import { GestureState } from '../types';

// 手动声明 process 类型，解决 TypeScript 编译报错
declare const process: {
  env: {
    API_KEY?: string;
  }
};

export const analyzeGesture = async (base64Image: string): Promise<GestureState> => {
  try {
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      console.warn("API Key is missing.");
      return 'OPEN';
    }

    // 初始化 Google GenAI 客户端
    const ai = new GoogleGenAI({ apiKey: apiKey });

    // 去掉 base64 前缀 (data:image/jpeg;base64,)，Gemini SDK 需要纯 base64 字符串
    const base64Data = base64Image.split(',')[1];

    if (!base64Data) {
        return 'OPEN';
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
            {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Data
                }
            },
            {
                text: `Analyze the hand gesture in this image strictly. 
                - If the fingers are extended or spread out (palm visible), return "OPEN". 
                - If the fingers are curled into a fist or pinching (closed hand), return "CLOSED".
                - If no hand is clearly visible, return "OPEN".
                
                Return ONLY a valid JSON object: { "state": "OPEN" | "CLOSED" }`
            }
        ]
      },
      config: {
        responseMimeType: "application/json",
        temperature: 0.1, // 低温度以获得确定性结果
      }
    });

    const text = response.text;
    if (!text) return 'OPEN';

    try {
        const result = JSON.parse(text);
        return (result.state === 'CLOSED') ? 'CLOSED' : 'OPEN';
    } catch (e) {
        console.error("Failed to parse Gemini response:", text);
        return 'OPEN';
    }

  } catch (error) {
    console.error("Gesture analysis failed:", error);
    return 'OPEN';
  }
};