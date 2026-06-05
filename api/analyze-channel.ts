import axios from "axios";

const NICHE_DATA: Record<string, any> = {
  "Finance": { rpm: [8, 25], affiliateAov: 200, affiliateComm: [0.15, 0.40], sponsorshipMult: 2.0, sponsorshipCap: 500000 },
  "Tech": { rpm: [4, 15], affiliateAov: 80, affiliateComm: [0.04, 0.15], sponsorshipMult: 2.0, sponsorshipCap: 500000 },
  "Education": { rpm: [3, 10], affiliateAov: 50, affiliateComm: [0.20, 0.50], sponsorshipMult: 1.5, sponsorshipCap: 100000 },
  "Health": { rpm: [3, 10], affiliateAov: 40, affiliateComm: [0.10, 0.30], sponsorshipMult: 1.5, sponsorshipCap: 100000 },
  "Gaming": { rpm: [1, 5], affiliateAov: 30, affiliateComm: [0.03, 0.10], sponsorshipMult: 1.2, sponsorshipCap: 75000 },
  "Lifestyle": { rpm: [2, 8], affiliateAov: 25, affiliateComm: [0.02, 0.08], sponsorshipMult: 1.0, sponsorshipCap: 50000 },
  "Cooking": { rpm: [2, 8], affiliateAov: 25, affiliateComm: [0.02, 0.08], sponsorshipMult: 1.0, sponsorshipCap: 50000 },
  "Entertainment": { rpm: [1, 4], affiliateAov: 25, affiliateComm: [0.02, 0.08], sponsorshipMult: 1.0, sponsorshipCap: 50000 },
  "Kids": { rpm: [0.5, 2], affiliateAov: 25, affiliateComm: [0.03, 0.08], sponsorshipMult: 0.8, sponsorshipCap: 50000 },
  "Music": { rpm: [0.5, 2], affiliateAov: 25, affiliateComm: [0.02, 0.05], sponsorshipMult: 0.8, sponsorshipCap: 50000 },
  "General": { rpm: [1.5, 6], affiliateAov: 25, affiliateComm: [0.02, 0.08], sponsorshipMult: 1.0, sponsorshipCap: 50000 }
};

function parseDuration(duration: string | undefined): number {
  if (!duration) return 0;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (parseInt(match[1] || "0") * 3600) + (parseInt(match[2] || "0") * 60) + parseInt(match[3] || "0");
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { url } = req.body;
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!url) return res.status(400).json({ error: "URL is required" });
  if (!apiKey) return res.status(500).json({ error: "YOUTUBE_API_KEY not configured" });

  try {
    let channelId = "";

    if (url.includes("/channel/")) {
      channelId = url.split("/channel/")[1].split("/")[0].split("?")[0];
    } else {
      let handle = "";
      if (url.includes("/@")) handle = url.split("/@")[1].split("/")[0].split("?")[0];
      else if (url.includes("/user/")) handle = url.split("/user/")[1].split("/")[0].split("?")[0];
      else if (url.includes("/c/")) handle = url.split("/c/")[1].split("/")[0].split("?")[0];

      const searchRes = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
        params: { part: "snippet", q: handle, type: "channel", key: apiKey, maxResults: 1 }
      });
      channelId = searchRes.data.items[0]?.snippet?.channelId;
    }

    if (!channelId) throw new Error("Could not resolve Channel ID");

    const channelRes = await axios.get(`https://www.googleapis.com/youtube/v3/channels`, {
      params: { part: "snippet,statistics,contentDetails,brandingSettings", id: channelId, key: apiKey }
    });

    const channel = channelRes.data.items[0];
    if (!channel) throw new Error("Channel not found");

    const uploadsPlaylistId = channel?.contentDetails?.relatedPlaylists?.uploads;
    const subCount = parseInt(channel.statistics?.subscriberCount || "0");
    const videoCount = parseInt(channel.statistics?.videoCount || "0");
    const totalViews = parseInt(channel.statistics?.viewCount || "0");

    const playlistRes = await axios.get(`https://www.googleapis.com/youtube/v3/playlistItems`, {
      params: { part: "snippet", playlistId: uploadsPlaylistId, maxResults: 50, key: apiKey }
    });

    const videoIds = (playlistRes.data.items || [])
      .map((item: any) => item.snippet?.resourceId?.videoId)
      .filter(Boolean).join(",");

    const videosRes = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
      params: { part: "statistics,snippet,contentDetails", id: videoIds, key: apiKey }
    });

    const videos = videosRes.data.items;

    // All your existing calculation logic
    let totalRecentViews = 0, totalRecentLikes = 0, totalRecentComments = 0;
    let totalRecentDuration = 0, totalShortsViews = 0, shortsCount = 0;
    const longFormVids: any[] = [], shortsVids: any[] = [];

    const videoStats = videos.map((v: any) => {
      const views = parseInt(v.statistics.viewCount || "0");
      const likes = parseInt(v.statistics.likeCount || "0");
      const comments = parseInt(v.statistics.commentCount || "0");
      const durationSec = parseDuration(v.contentDetails.duration);

      totalRecentViews += views;
      totalRecentLikes += likes;
      totalRecentComments += comments;
      totalRecentDuration += durationSec;

      const vidObj = { views, likes, comments, durationSec, publishedAt: v.snippet.publishedAt };
      if (durationSec <= 62) { shortsCount++; totalShortsViews += views; shortsVids.push(vidObj); }
      else longFormVids.push(vidObj);
      return vidObj;
    });

    const avgViews = totalRecentViews / videos.length || 0;
    const engagementRate = ((totalRecentLikes + totalRecentComments) / Math.max(1, totalRecentViews)) * 100 || 0;
    const shortsRatio = shortsCount / videos.length || 0;
    const avgDuration = totalRecentDuration / videos.length || 0;

    const keywordString = ((channel.brandingSettings?.channel?.keywords || "").toLowerCase() + " " + (channel.snippet?.description || "").toLowerCase());
    let detectedNiche = "General";
    for (const niche in NICHE_DATA) {
      if (keywordString.includes(niche.toLowerCase())) { detectedNiche = niche; break; }
    }
    const nicheBenchmark = NICHE_DATA[detectedNiche];

    res.json({
      id: channelId,
      name: channel.snippet.title,
      logo: channel.snippet.thumbnails?.high?.url,
      subscribers: subCount.toString(),
      description: channel.snippet.description,
      isMonetized: subCount >= 1000,
      country: channel.snippet.country || "Not specified",
      joinedDate: channel.snippet.publishedAt,
      authenticMetrics: {
        subCount, videoCount, totalViews, avgViews,
        engagementRate: engagementRate.toFixed(2) + "%",
        shortsRatio: (shortsRatio * 100).toFixed(0) + "%",
        avgDurationSec: avgDuration,
        region: channel.snippet.country || "Global",
        detectedNiche
      }
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to fetch channel info" });
  }
}