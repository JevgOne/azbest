export async function analyzeGoogleAdsCampaigns(campaigns: any[]) {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { recommendations: [] };
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });
    const prompt = `Analyze these Google Ads campaigns for a Czech sports e-shop (qsport.cz) and provide recommendations in Czech:\n${JSON.stringify(campaigns, null, 2)}`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return { recommendations: [{ type: 'ai_analysis', content: text }] };
  } catch (error) {
    console.error('AI analysis error:', error);
    return { recommendations: [] };
  }
}
