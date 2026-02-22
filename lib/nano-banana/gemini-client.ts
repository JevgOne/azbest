import { GoogleGenerativeAI } from '@google/generative-ai';

export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
  return new GoogleGenerativeAI(apiKey);
}

export async function generateImage(prompt: string, style?: string) {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });
  const fullPrompt = style ? `${style}: ${prompt}` : prompt;
  const result = await model.generateContent(fullPrompt);
  return { text: result.response.text(), prompt: fullPrompt };
}

export async function generateContentSuggestion(context: string) {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });
  const result = await model.generateContent(`As a marketing expert for a Czech sports e-shop (qsport.cz) selling brands like ON Running, POC, Maloja, Kjus, Mizuno, provide suggestions in Czech: ${context}`);
  return result.response.text();
}
