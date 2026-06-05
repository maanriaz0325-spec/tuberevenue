import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { channelName, authenticMetrics } = req.body;

  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `You are a YouTube Monetization Intelligence System. Analyze this channel and return JSON only.
    
    Channel: "${channelName}"
    Subscribers: ${authenticMetrics.subCount}
    Views: ${authenticMetrics.totalViews}
    Engagement: ${authenticMetrics.engagementRate}
    Region: ${authenticMetrics.region}
    
    Return ONLY this JSON:
    {
      "suggestedNiche": "Finance|Tech|Gaming|Education|Lifestyle|Entertainment|General",
      "monetizationScore": number,
      "monetizationTier": "string",
      "sponsorshipPotential": number,
      "growthForecast": "string",
      "revenueTactics": ["string"],
      "monetizationHealth": {
        "compliance": "string",
        "appeal": "string",
        "copyright": "string"
      }
    }`;

    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    let text = aiResponse.text || "{}";
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) text = text.substring(jsonStart, jsonEnd + 1);

    res.json(JSON.parse(text));
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "AI analysis failed" });
  }
}