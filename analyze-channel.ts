import axios from "axios";

const NICHE_DATA: Record<string, any> = {
  "Finance": { rpm: [8, 25], affiliateAov: 200, affiliateComm: [0.15, 0.40], sponsorshipMult: 2.0 },
  "Tech": { rpm: [4, 15], affiliateAov: 80, affiliateComm: [0.04, 0.15], sponsorshipMult: 2.0 },
  "Education": { rpm: [3, 10], affiliateAov: 50, affiliateComm: [0.20, 0.50], sponsorshipMult: 1.5 },
  "Health": { rpm: [3, 10], affiliateAov: 40, affiliateComm: [0.10, 0.30], sponsorshipMult: 1.5 },
  "Gaming": { rpm: [1, 5], affiliateAov: 30, affiliateComm: [0.03, 0.10], sponsorshipMult: 1.2 },
  "Lifestyle": { rpm: [2, 8], affiliateAov: 25, affiliateComm: [0.02, 0.08], sponsorshipMult: 1.0 },
  "Cooking": { rpm: [2, 8], affiliateAov: 25, affiliateComm: [0.02, 0.08], sponsorshipMult: 1.0 },
  "Entertainment": { rpm: [1, 4], affiliateAov: 25, affiliateComm: [0.02, 0.08], sponsorshipMult: 1.0 },
  "Kids": { rpm: [0.5, 2], affiliateAov: 25, affiliateComm: [0.03, 0.08], sponsorshipMult: 0.8 },
  "Music": { rpm: [0.5, 2], affiliateAov: 25, affiliateComm: [0.02, 0.05], sponsorshipMult: 0.8 },
  "Cars": { rpm: [2, 10], affiliateAov: 100, affiliateComm: [0.05, 0.15], sponsorshipMult: 1.5 },
  "Real Estate": { rpm: [5, 20], affiliateAov: 200, affiliateComm: [0.10, 0.30], sponsorshipMult: 1.5 },
  "Legal": { rpm: [5, 20], affiliateAov: 200, affiliateComm: [0.10, 0.30], sponsorshipMult: 1.5 },
  "General": { rpm: [1.5, 6], affiliateAov: 25, affiliateComm: [0.02, 0.08], sponsorshipMult: 1.0 }
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
    let totalRecentViews = 0, totalRecentLikes = 0, totalRecentComments = 0;
    let totalRecentDuration = 0, totalShortsViews = 0, shortsCount = 0;
    const longFormVids: any[] = [], shortsVids: any[] = [];

    const videoStats = videos.map((v: any) => {
      const views = parseInt(v.statistics.viewCount || "0");
      const likes = parseInt(v.statistics.likeCount || "0");
      const comments = parseInt(v.statistics.commentCount || "0");
      const durationSec = parseDuration(v.contentDetails.duration);
      totalRecentViews += views; totalRecentLikes += likes;
      totalRecentComments += comments; totalRecentDuration += durationSec;
      const vidObj = { views, likes, comments, durationSec, publishedAt: v.snippet.publishedAt };
      if (durationSec <= 62) { shortsCount++; totalShortsViews += views; shortsVids.push(vidObj); }
      else longFormVids.push(vidObj);
      return vidObj;
    });

    const avgViews = totalRecentViews / videos.length || 0;
    const engagementRate = ((totalRecentLikes + totalRecentComments) / Math.max(1, totalRecentViews)) * 100 || 0;
    const shortsRatio = shortsCount / videos.length || 0;
    const avgDuration = totalRecentDuration / videos.length || 0;

    // Niche Detection
    const keywordString = ((channel.brandingSettings?.channel?.keywords || "").toLowerCase() + " " + (channel.snippet?.description || "").toLowerCase());
    let detectedNiche = "General";
    for (const niche in NICHE_DATA) {
      if (keywordString.includes(niche.toLowerCase())) { detectedNiche = niche; break; }
    }
    const nicheBenchmark = NICHE_DATA[detectedNiche];

    // Country RPM Multiplier
    const countryCode = (channel.snippet.country || "US").toUpperCase();
    const tier1 = ["US","GB","CA","AU","NZ","DE","NO","SE","CH","NL"];
    const tier2 = ["FR","IT","ES","JP","KR","SG","BR","MX"];
    const tier3 = ["IN","PK","BD","NG","PH","EG","ID","TR","VN"];
    let rpmMultiplier = 0.6;
    if (tier1.includes(countryCode)) rpmMultiplier = 1.0;
    else if (tier2.includes(countryCode)) rpmMultiplier = 0.5;
    else if (tier3.includes(countryCode)) rpmMultiplier = 0.25;

    let [rpmMin, rpmMax] = nicheBenchmark.rpm;
    if (shortsRatio > 0.7) { rpmMin *= 0.10; rpmMax *= 0.15; }
    else if (shortsRatio > 0.4) { rpmMin *= 0.50; rpmMax *= 0.70; }
    rpmMin *= rpmMultiplier; rpmMax *= rpmMultiplier;

    // Scores
    const getSubScore = (s: number) => s >= 1000000 ? 100 : s >= 100000 ? 85 : s >= 10000 ? 65 : s >= 1000 ? 45 : 10;
    const subScore = getSubScore(subCount);

    const dates = videos.map((v: any) => new Date(v.snippet.publishedAt).getTime()).sort((a: number, b: number) => b - a);
    const gaps: number[] = [];
    for (let i = 0; i < dates.length - 1; i++) gaps.push((dates[i] - dates[i+1]) / (1000 * 60 * 60 * 24));
    const avgGapCalculated = gaps.length > 0 ? (gaps.slice(0, 10).reduce((a: number, b: number) => a + b, 0) / Math.min(gaps.length, 10)) : 30;
    const daysSinceLastUpload = (new Date().getTime() - dates[0]) / (1000 * 60 * 60 * 24);
    const consistencyScore = daysSinceLastUpload > 90 ? 10 : avgGapCalculated <= 7 ? 85 : avgGapCalculated <= 14 ? 70 : avgGapCalculated <= 30 ? 50 : 30;

    const last10Views = videoStats.slice(0, 10).map((v: any) => v.views);
    const meanViews = last10Views.reduce((a: number, b: number) => a + b, 0) / last10Views.length || 1;
    const variance = last10Views.reduce((a: number, b: number) => a + Math.pow(b - meanViews, 2), 0) / last10Views.length;
    const cv = Math.sqrt(variance) / meanViews;
    const stabilityScore = cv < 0.3 ? 100 : cv < 0.5 ? 80 : cv < 0.7 ? 60 : 40;

    const descText = (channel.snippet.description || "").toLowerCase();
    const primaryCount = ["member","join","super thanks","super chat","merch"].filter((k: string) => descText.includes(k)).length;
    const secondaryCount = ["patreon","ko-fi","support","sponsor"].filter((k: string) => descText.includes(k)).length;
    const membershipScore = primaryCount >= 2 ? 100 : primaryCount >= 1 ? 85 : secondaryCount >= 1 ? 45 : 25;

    const titlesString = videos.map((v: any) => v.snippet.title.toLowerCase()).join(" ");
    const brandUnsafe = ["kill","murder","explicit","drugs"].filter((s: string) => titlesString.includes(s));
    const safetyScore = Math.max(10, 100 - (brandUnsafe.length * 15));

    const engScore = engagementRate >= 5 ? 85 : engagementRate >= 3 ? 70 : engagementRate >= 1 ? 35 : 15;
    const watchScore = 70;
    const originalityScore = 100;

    const finalAuthenticScore = Math.round(
      (subScore * 0.20) + (watchScore * 0.20) + (engScore * 0.20) +
      (consistencyScore * 0.15) + (stabilityScore * 0.10) +
      (membershipScore * 0.08) + (safetyScore * 0.05) + (originalityScore * 0.02)
    );

    // Content Mix
    const sampleDaysRange = Math.max(1, dates.length > 1 ? (dates[0] - dates[dates.length-1]) / (1000*60*60*24) : 30);
    const sampleMonthsRange = sampleDaysRange / 30.44;
    const longFormPerMonth = parseFloat((longFormVids.length / Math.max(0.1, sampleMonthsRange)).toFixed(1));
    const shortsPerMonth = parseFloat((shortsVids.length / Math.max(0.1, sampleMonthsRange)).toFixed(1));
    const avgLongDurationSec = longFormVids.length > 0 ? (longFormVids.reduce((sum: number, v: any) => sum + v.durationSec, 0) / longFormVids.length) : 0;
    const avgShortDurationSec = shortsVids.length > 0 ? (shortsVids.reduce((sum: number, v: any) => sum + v.durationSec, 0) / shortsVids.length) : 0;

    const calculateWeightedAvg = (vids: any[]) => {
      if (vids.length === 0) return 0;
      const sorted = [...vids].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      const recent = sorted.slice(0, 10);
      const older = sorted.slice(10);
      const recentAvg = recent.reduce((sum: number, v: any) => sum + v.views, 0) / recent.length || 0;
      const olderAvg = older.length > 0 ? older.reduce((sum: number, v: any) => sum + v.views, 0) / older.length : recentAvg;
      return (recentAvg * 2 + olderAvg * 1) / 3;
    };

    const longFormWeightedAvg = calculateWeightedAvg(longFormVids);
    const shortsWeightedAvg = calculateWeightedAvg(shortsVids);
    const estMonthlyViews = Math.round((longFormWeightedAvg * longFormPerMonth) + (shortsWeightedAvg * shortsPerMonth));

    // Revenue Calculations
    const adRevMin = (estMonthlyViews / 1000) * rpmMin;
    const adRevMax = (estMonthlyViews / 1000) * rpmMax;
    const memRateMul = primaryCount >= 1 ? 1.0 : 0.2;
    const memRevMin = subCount * 0.01 * 0.99 * 0.70 * memRateMul;
    const memRevMax = subCount * 0.01 * 4.99 * 0.70 * memRateMul;
    const engMultiplier = engagementRate >= 5 ? 1.5 : engagementRate >= 3 ? 1.2 : 1.0;
    const affClicks = estMonthlyViews * 0.005;
    const affConvs = affClicks * 0.02;
    const affRevMin = affConvs * nicheBenchmark.affiliateAov * nicheBenchmark.affiliateComm[0] * engMultiplier;
    const affRevMax = affConvs * nicheBenchmark.affiliateAov * nicheBenchmark.affiliateComm[1] * engMultiplier;
    const subTierMult = subCount >= 1000000 ? 1.5 : subCount >= 100000 ? 1.2 : subCount >= 10000 ? 1.0 : 0.6;
    const sponRateMin = (longFormWeightedAvg / 1000) * 20 * nicheBenchmark.sponsorshipMult * engMultiplier * subTierMult;
    const sponRateMax = (longFormWeightedAvg / 1000) * 50 * nicheBenchmark.sponsorshipMult * engMultiplier * subTierMult;
    const sponVidsPerMonth = Math.max(0.5, longFormPerMonth * 0.25);
    const sponRevMin = sponRateMin * sponVidsPerMonth;
    const sponRevMax = sponRateMax * sponVidsPerMonth;
    const totalMin = adRevMin + memRevMin + affRevMin + sponRevMin;
    const totalMax = adRevMax + memRevMax + affRevMax + sponRevMax;

    // Record Data (yearly)
    const joinedYear = new Date(channel.snippet.publishedAt).getFullYear();
    const currentYear = new Date().getFullYear();
    const recordMap: Record<number, any> = {};
    for (let y = joinedYear; y <= currentYear; y++) recordMap[y] = { year: y, views: 0, revenue: 0 };
    const combinedRpm = (rpmMin + rpmMax) / 2;
    let sampleSumViews = 0;
    videos.forEach((v: any) => {
      const y = new Date(v.snippet.publishedAt).getFullYear();
      const vViews = parseInt(v.statistics.viewCount || "0");
      sampleSumViews += vViews;
      if (recordMap[y]) { recordMap[y].views += vViews; recordMap[y].revenue += (vViews / 1000) * combinedRpm; }
    });
    const remainingViews = Math.max(0, totalViews - sampleSumViews);
    const yearsKeys = Object.keys(recordMap).map(Number).sort((a, b) => a - b);
    if (remainingViews > 0) {
      const totalWeight = yearsKeys.reduce((acc, _, idx) => acc + Math.pow(idx + 1, 2), 0);
      yearsKeys.forEach((y, idx) => {
        const weight = Math.pow(idx + 1, 2) / totalWeight;
        const yearViews = Math.round(remainingViews * weight);
        recordMap[y].views += yearViews;
        recordMap[y].revenue = Math.round(recordMap[y].revenue + (yearViews / 1000) * combinedRpm);
      });
    }
    const recordData = Object.values(recordMap)
      .sort((a: any, b: any) => a.year - b.year)
      .map(({ year, views, revenue }: any) => ({
        date: year.toString(), fullDate: `Yearly Audit: ${year}`, views, revenue: Math.round(revenue)
      }));

    // Daily Data (last 30 days)
    const today = new Date();
    const dailyData = [];
    const avgTotalMonthlyRev = (totalMin + totalMax) / 2;
    const baselineDailyViews = (estMonthlyViews * 0.85) / 30;
    for (let i = 0; i <= 30; i++) {
      const loopDate = new Date(today.getTime() - ((30 - i) * 24 * 60 * 60 * 1000));
      const dayLabel = loopDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      const dateKey = loopDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      const isWeekend = loopDate.getDay() === 0 || loopDate.getDay() === 6;
      const volatility = 1 + ((Math.random() * 0.16) - 0.08);
      const dayFactor = isWeekend ? 1.15 : 0.95;
      const dayViews = Math.round(baselineDailyViews * dayFactor * volatility);
      const dayRevenue = (dayViews / Math.max(1, estMonthlyViews)) * avgTotalMonthlyRev;
      dailyData.push({ date: dayLabel, fullDate: dateKey, views: dayViews, revenue: Math.round(dayRevenue) });
    }

    // Audience
    const getInferredAudience = (country: string) => {
      const t1 = ["US","GB","CA","AU","NZ","DE","NO","SE","CH","NL"];
      const countryNames: any = { US:"United States",GB:"United Kingdom",CA:"Canada",AU:"Australia",DE:"Germany",IN:"India",PK:"Pakistan",BR:"Brazil",FR:"France",JP:"Japan" };
      const list = [{ name: countryNames[country] || country, percentage: 42, tier: t1.includes(country) ? 1 : 3 }];
      if (t1.includes(country)) {
        list.push({ name:"United Kingdom", percentage:12, tier:1 });
        list.push({ name:"Canada", percentage:8, tier:1 });
        list.push({ name:"Germany", percentage:6, tier:1 });
      } else {
        list.push({ name:"United States", percentage:15, tier:1 });
        list.push({ name:"United Kingdom", percentage:6, tier:1 });
        list.push({ name:"India", percentage:10, tier:3 });
      }
      return list;
    };

    const yppSubscribersMet = subCount >= 1000;
    const estWatchHoursTotal = Math.round(
      ((longFormVids.reduce((sum: number, v: any) => sum + v.views, 0) / Math.max(1, longFormVids.length)) * (avgLongDurationSec * 0.35) / 3600) * videoCount * (1 - shortsRatio) +
      ((shortsVids.reduce((sum: number, v: any) => sum + v.views, 0) / Math.max(1, shortsVids.length)) * (avgShortDurationSec * 0.80) / 3600) * videoCount * shortsRatio
    );

    res.json({
      id: channelId,
      name: channel.snippet.title,
      logo: channel.snippet.thumbnails?.high?.url || channel.snippet.thumbnails?.default?.url,
      subscribers: subCount.toString(),
      description: channel.snippet.description,
      isMonetized: yppSubscribersMet || membershipScore >= 65,
      keywords: channel.brandingSettings?.channel?.keywords || "",
      country: channel.snippet.country || "Not specified",
      joinedDate: channel.snippet.publishedAt,
      customUrl: channel.snippet.customUrl || "",
      defaultLanguage: channel.snippet.defaultLanguage || "Not specified",
      authenticMetrics: {
        subCount, subScore, videoCount, totalViews, avgViews,
        engagementRate: engagementRate.toFixed(2) + "%",
        engagementScore: engScore,
        shortsRatio: (shortsRatio * 100).toFixed(0) + "%",
        avgDurationSec: avgDuration,
        region: channel.snippet.country || "Global",
        estWatchHoursTotal,
        watchScore,
        hasMembership: membershipScore >= 65,
        membershipScore,
        avgGap: avgGapCalculated.toFixed(1),
        consistencyScore,
        viewStabilityCV: cv.toFixed(2),
        stabilityScore,
        brandSafe: brandUnsafe.length === 0,
        safetyScore,
        originalityScore,
        finalAuthenticScore,
        recordData,
        dailyData,
        detectedNiche,
        cpmRange: {
          min: parseFloat((rpmMin * 1.6).toFixed(2)),
          max: parseFloat((rpmMax * 1.6).toFixed(2))
        },
        monthlyRevenue: {
          min: totalMin,
          max: totalMax,
          adRev: { min: adRevMin, max: adRevMax },
          memRev: { min: memRevMin, max: memRevMax },
          affRev: { min: affRevMin, max: affRevMax },
          sponRev: { min: sponRevMin, max: sponRevMax },
          rpm: { min: rpmMin, max: rpmMax }
        },
        contentMix: {
          longForm: {
            count: longFormVids.length,
            avgViews: Math.round(longFormWeightedAvg),
            vidsPerMonth: longFormPerMonth,
            avgDurationMin: parseFloat(((avgLongDurationSec * 0.35) / 60).toFixed(2)),
            impressionRate: 45
          },
          shorts: {
            count: shortsVids.length,
            avgViews: Math.round(shortsWeightedAvg),
            vidsPerMonth: shortsPerMonth,
            avgDurationMin: parseFloat(((avgShortDurationSec * 0.80) / 60).toFixed(2)),
            impressionRate: 15
          }
        },
        audience: {
          countries: getInferredAudience(countryCode)
        }
      }
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to fetch channel info. Check URL or API Quota." });
  }
}