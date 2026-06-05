import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { channelName, subscribers, description, keywords, authenticMetrics } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } }
    });

    const prompt = `You are a YouTube Monetization Intelligence System. Use the following REAL metrics to infer monetization probability and provide a logic-based strategy.
      
RAW CHANNEL DATA:
Name: "${channelName}"
Subscribers: ${authenticMetrics.subCount}
Lifetime Views: ${authenticMetrics.totalViews}
Uploads: ${authenticMetrics.videoCount}
Recent Avg Views: ${authenticMetrics.avgViews}
Engagement Rate: ${authenticMetrics.engagementRate}
Shorts Ratio: ${authenticMetrics.shortsRatio}
Upload Consistency (Gap): ${authenticMetrics.avgGap} days
View Stability (CV): ${authenticMetrics.viewStabilityCV}
Region: ${authenticMetrics.region}

INSTRUCTIONS:
1. Calculate a final "Monetization Likelihood Score" (0-100) based on these 8 signals: Subscribers, Watch Hours, Engagement, Consistency, Stability, Membership Signals, Brand Safety, and Originality.
2. Detect Niche from description/metadata. MUST be one of: [Finance, Tech, Gaming, Education, Lifestyle, Cooking, Entertainment, Kids, Music, Cars, Health, Real Estate, Legal, General].
3. Project Sponsorship Potential (USD per video) based on niche and size.
4. Provide a 2-year Growth Forecast.
5. Identify Tier 1/2/3 Audience reach % based on region.

OUTPUT AUTHENTIC VALUES (Strict JSON only, no markdown):
{
  "suggestedNiche": "Exactly one from the list above",
  "monetizationScore": 0,
  "monetizationTier": "string",
  "sponsorshipPotential": 0,
  "consistencyAssessment": "string",
  "shortsStrategy": "string",
  "growthForecast": "string",
  "revenueTactics": ["string"],
  "audienceTiers": [{"country": "string", "tier": "string", "percentage": "string"}],
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
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1) {
      text = text.substring(jsonStart, jsonEnd + 1);
    }

    try {
      res.json(JSON.parse(text));
    } catch (parseError) {
      console.error("Failed to parse AI JSON:", text);
      throw parseError;
    }
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "AI analysis failed" });
  }
}