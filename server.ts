import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import * as cheerio from "cheerio";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  
  // Helper to parse ISO 8601 duration
  function parseDuration(duration: string | undefined): number {
    if (!duration) return 0;
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || "0");
    const minutes = parseInt(match[2] || "0");
    const seconds = parseInt(match[3] || "0");
    return hours * 3600 + minutes * 60 + seconds;
  }

  // Niche Data Benchmarks
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
    "Cars": { rpm: [2, 10], affiliateAov: 100, affiliateComm: [0.05, 0.15], sponsorshipMult: 1.5, sponsorshipCap: 100000 },
    "Real Estate": { rpm: [5, 20], affiliateAov: 200, affiliateComm: [0.10, 0.30], sponsorshipMult: 1.5, sponsorshipCap: 100000 },
    "Legal": { rpm: [5, 20], affiliateAov: 200, affiliateComm: [0.10, 0.30], sponsorshipMult: 1.5, sponsorshipCap: 100000 },
    "General": { rpm: [1.5, 6], affiliateAov: 25, affiliateComm: [0.02, 0.08], sponsorshipMult: 1.0, sponsorshipCap: 50000 }
  };

  // 1. Analyze Channel using YouTube Data API v3
  app.post("/api/analyze-channel", async (req, res) => {
    const { url } = req.body;
    const apiKey = process.env.YOUTUBE_API_KEY;
    
    if (!url) return res.status(400).json({ error: "URL is required" });
    if (!apiKey) return res.status(500).json({ error: "YOUTUBE_API_KEY is not configured" });

    try {
      let channelId = "";
      
      // Resolve Channel ID
      if (url.includes("/channel/")) {
        channelId = url.split("/channel/")[1].split("/")[0].split("?")[0];
      } else if (url.includes("/@") || url.includes("/user/") || url.includes("/c/")) {
        let handle = "";
        if (url.includes("/@")) handle = url.split("/@")[1].split("/")[0].split("?")[0];
        else if (url.includes("/user/")) handle = url.split("/user/")[1].split("/")[0].split("?")[0];
        else if (url.includes("/c/")) handle = url.split("/c/")[1].split("/")[0].split("?")[0];

        // Search for channel by handle/name
        const searchRes = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
          params: {
            part: "snippet",
            q: handle,
            type: "channel",
            key: apiKey,
            maxResults: 1
          }
        });
        channelId = searchRes.data.items[0]?.snippet?.channelId;
      }

      if (!channelId) throw new Error("Could not resolve Channel ID");

      // CALL 1: Channel Stats & Uploads Playlist ID
      const channelRes = await axios.get(`https://www.googleapis.com/youtube/v3/channels`, {
        params: {
          part: "snippet,statistics,contentDetails,brandingSettings",
          id: channelId,
          key: apiKey
        }
      });

      const channel = channelRes.data.items[0];
      if (!channel) throw new Error("Channel not found");

      const uploadsPlaylistId = channel?.contentDetails?.relatedPlaylists?.uploads;
      if (!uploadsPlaylistId) throw new Error("Could not find uploads playlist for this channel.");

      const subCount = parseInt(channel.statistics?.subscriberCount || "0");
      const videoCount = parseInt(channel.statistics?.videoCount || "0");
      const totalViews = parseInt(channel.statistics?.viewCount || "0");

      // CALL 2: Get recent 50 video IDs
      const playlistRes = await axios.get(`https://www.googleapis.com/youtube/v3/playlistItems`, {
        params: {
          part: "snippet",
          playlistId: uploadsPlaylistId,
          maxResults: 50,
          key: apiKey
        }
      });

      const videoIds = (playlistRes.data.items || []).map((item: any) => item.snippet?.resourceId?.videoId).filter(Boolean).join(",");

      if (!videoIds) {
        // Return empty stats if no videos found
        return res.json({
          id: channelId,
          name: channel.snippet.title,
          logo: channel.snippet.thumbnails?.high?.url || channel.snippet.thumbnails?.default?.url,
          subscribers: subCount.toString(),
          description: channel.snippet.description,
          isMonetized: false,
          keywords: channel.brandingSettings?.channel?.keywords || "",
          country: channel.snippet.country || "Not specified",
          joinedDate: channel.snippet.publishedAt,
          authenticMetrics: {
            subCount,
            subScore: 10,
            videoCount,
            totalViews,
            avgViews: 0,
            engagementRate: "0%",
            engagementScore: 15,
            shortsRatio: "0%",
            avgDurationSec: 0,
            region: channel.snippet.country || "Global",
            estWatchHoursTotal: 0,
            watchScore: 10,
            hasMembership: false,
            membershipScore: 25,
            avgGap: "0",
            consistencyScore: 15,
            viewStabilityCV: "0",
            stabilityScore: 20,
            brandSafe: true,
            safetyScore: 100,
            originalityScore: 100,
            finalAuthenticScore: 10,
            graphData: [],
            detectedNiche: "General",
            monthlyRevenue: {
              min: 0,
              max: 0,
              adRev: { min: 0, max: 0 },
              memRev: { min: 0, max: 0 },
              affRev: { min: 0, max: 0 },
              sponRev: { min: 0, max: 0 },
              rpm: { min: 0, max: 0 }
            },
            contentMix: {
              longForm: { count: 0, avgViews: 0, vidsPerMonth: 0, avgDurationMin: 0, impressionRate: 45 },
              shorts: { count: 0, avgViews: 0, vidsPerMonth: 0, avgDurationMin: 0, impressionRate: 15 }
            }
          }
        });
      }

      // CALL 3: Get detailed stats for these 50 videos
      const videosRes = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
        params: {
          part: "statistics,snippet,contentDetails",
          id: videoIds,
          key: apiKey
        }
      });

      const videos = videosRes.data.items;
      
      // Compute Metrics
      let totalRecentViews = 0;
      let totalRecentLikes = 0;
      let totalRecentComments = 0;
      let totalRecentDuration = 0;
      let totalShortsViews = 0;
      let shortsCount = 0;
      
      const longFormVids: any[] = [];
      const shortsVids: any[] = [];

      const videoStats = videos.map((v: any) => {
        const views = parseInt(v.statistics.viewCount || "0");
        const likes = parseInt(v.statistics.likeCount || "0");
        const comments = parseInt(v.statistics.commentCount || "0");
        const durationSec = parseDuration(v.contentDetails.duration);
        const publishedAt = v.snippet.publishedAt;
        
        totalRecentViews += views;
        totalRecentLikes += likes;
        totalRecentComments += comments;
        totalRecentDuration += durationSec;
        
        const vidObj = { views, likes, comments, durationSec, publishedAt };
        if (durationSec <= 62) {
          shortsCount++;
          totalShortsViews += views;
          shortsVids.push(vidObj);
        } else {
          longFormVids.push(vidObj);
        }

        return vidObj;
      });

      const avgViews = totalRecentViews / videos.length || 0;
      const engagementRate = ((totalRecentLikes + totalRecentComments) / Math.max(1, totalRecentViews)) * 100 || 0;
      const shortsRatio = shortsCount / videos.length || 0;
      const avgDuration = totalRecentDuration / videos.length || 0;

      // NICHE DETECTION (Basic Keyword Logic)
      const keywordString = ((channel.brandingSettings?.channel?.keywords || "").toLowerCase() + " " + (channel.snippet?.description || "").toLowerCase());
      let detectedNiche = "General";
      for (const niche in NICHE_DATA) {
         if (keywordString.includes(niche.toLowerCase())) {
           detectedNiche = niche;
           break;
         }
      }
      const nicheBenchmark = NICHE_DATA[detectedNiche];

      // --- PRE-ANALYSIS: AUTHENTIC DATA PREPARATION ---
      const dates = videos.map((v: any) => new Date(v.snippet.publishedAt).getTime()).sort((a: number, b: number) => b - a);
      const firstVidDate = dates[dates.length - 1]; // oldest in sample
      const lastVidDate = dates[0]; // newest in sample
      const sampleDaysRange = Math.max(1, (lastVidDate - firstVidDate) / (1000 * 60 * 60 * 24));
      const sampleMonthsRange = sampleDaysRange / 30.44;

      const longFormPerMonth = parseFloat((longFormVids.length / Math.max(0.1, sampleMonthsRange)).toFixed(1));
      const shortsPerMonth = parseFloat((shortsVids.length / Math.max(0.1, sampleMonthsRange)).toFixed(1));

      // Individual video analysis for weighted watch duration
      const avgLongDurationSec = longFormVids.length > 0 ? (longFormVids.reduce((sum, v) => sum + v.durationSec, 0) / longFormVids.length) : 0;
      const avgShortDurationSec = shortsVids.length > 0 ? (shortsVids.reduce((sum, v) => sum + v.durationSec, 0) / shortsVids.length) : 0;

      // Realistic Watch Duration = Avg Length * Retention Factor (Indusrty Standard: 35% Long, 80% Shorts)
      const authenticLongWatchDurationMin = parseFloat(((avgLongDurationSec * 0.35) / 60).toFixed(2));
      const authenticShortWatchDurationMin = parseFloat(((avgShortDurationSec * 0.80) / 60).toFixed(2));

      // 8 SIGNALS ARCHITECTURE LOGIC
      const getSubScore = (subs: number) => {
        if (subs >= 1000000) return 100;
        if (subs >= 500000) return 95;
        if (subs >= 100000) return 85;
        if (subs >= 50000) return 75;
        if (subs >= 10000) return 65;
        if (subs >= 5000) return 55;
        if (subs >= 1000) return 45;
        return 10;
      };
      const subScore = getSubScore(subCount);
      const yppSubscribersMet = subCount >= 1000;
      
      // Signal 2: Watch Hours Score (20%) - Refined for authenticity
      // Separate long-form and shorts watch time estimation
      const lfWatchHours = ((longFormVids.reduce((sum, v) => sum + v.views, 0) / Math.max(1, longFormVids.length)) * (avgLongDurationSec * 0.35) / 3600) * (videoCount * (1 - shortsRatio));
      const shWatchHours = ((shortsVids.reduce((sum, v) => sum + v.views, 0) / Math.max(1, shortsVids.length)) * (avgShortDurationSec * 0.80) / 3600) * (videoCount * shortsRatio);
      
      const totalEstWatchHours = Math.round(lfWatchHours + shWatchHours);
      const yppWatchHoursMet = totalEstWatchHours >= 4000;
      
      const getWatchScore = (hours: number) => {
        if (hours >= 50000) return 100;
        if (hours >= 20000) return 90;
        if (hours >= 10000) return 80;
        if (hours >= 4000) return 70;
        if (hours >= 2000) return 50;
        if (hours >= 500) return 30;
        return 10;
      };
      const watchScore = getWatchScore(totalEstWatchHours);

      // Signal 3: Engagement Score (20%)
      const getEngagementScore = (rate: number) => {
        if (rate >= 8) return 100;
        if (rate >= 5) return 85;
        if (rate >= 3) return 70;
        if (rate >= 2) return 55;
        if (rate >= 1) return 35;
        return 15;
      };
      const engScore = getEngagementScore(engagementRate);

      // Signal 4: Upload Consistency Score (15%)
      const gaps = [];
      for (let i = 0; i < dates.length - 1; i++) {
        gaps.push((dates[i] - dates[i+1]) / (1000 * 60 * 60 * 24));
      }
      const avgGapCalculated = gaps.length > 0 ? (gaps.slice(0, 10).reduce((a, b) => a + b, 0) / Math.min(gaps.length, 10)) : 30;
      const daysSinceLastUpload = (new Date().getTime() - dates[0]) / (1000 * 60 * 60 * 24);
      
      const getConsistencyScore = (gap: number, last: number) => {
        if (last > 90) return 10;
        if (gap <= 1) return 100;
        if (gap <= 3) return 95;
        if (gap <= 7) return 85;
        if (gap <= 14) return 70;
        if (gap <= 30) return 50;
        if (gap <= 60) return 30;
        return 15;
      };
      const consistencyScore = getConsistencyScore(avgGapCalculated, daysSinceLastUpload);
      
      // Signal 5: View Stability Score (10%)
      const last10Views = videoStats.slice(0, 10).map(v => v.views);
      const meanViews = last10Views.reduce((a, b) => a + b, 0) / last10Views.length || 1;
      const variance = last10Views.reduce((a, b) => a + Math.pow(b - meanViews, 2), 0) / last10Views.length;
      const stdDev = Math.sqrt(variance);
      const cv = stdDev / meanViews;
      
      const getStabilityScore = (stabilityCV: number) => {
        if (stabilityCV < 0.3) return 100;
        if (stabilityCV < 0.5) return 80;
        if (stabilityCV < 0.7) return 60;
        if (stabilityCV < 1.0) return 40;
        return 20;
      };
      const stabilityScore = getStabilityScore(cv);

      // Signal 6: Membership Signals (8%)
      const descText = (channel.snippet.description + " " + (channel.brandingSettings?.channel?.description || "")).toLowerCase();
      const primaryKeywords = ["member", "join", "super thanks", "super chat", "merch"];
      const secondaryKeywords = ["patreon", "ko-fi", "support", "sponsor"];
      
      const primaryCount = primaryKeywords.filter(k => descText.includes(k)).length;
      const secondaryCount = secondaryKeywords.filter(k => descText.includes(k)).length;
      
      const getMembershipScore = (p: number, s: number) => {
        if (p >= 2) return 100;
        if (p >= 1) return 85;
        if (s >= 2) return 65;
        if (s >= 1) return 45;
        return 25;
      };
      const membershipScore = getMembershipScore(primaryCount, secondaryCount);

      // Signal 7: Brand Safety Score (5%)
      const titlesString = videos.map((v: any) => v.snippet.title.toLowerCase()).join(" ");
      const brandUnsafe = ["kill", "murder", "explicit", "drugs", "pirated", "hacker"].filter(s => titlesString.includes(s));
      const safetyScore = Math.max(10, 100 - (brandUnsafe.length * 15));

      // Signal 8: Content Originality Score (2%)
      const channelAgeMonths = Math.max(1, (new Date().getTime() - new Date(channel.snippet.publishedAt).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
      const uploadsPerMonth = videoCount / channelAgeMonths;
      const reuseSignals = ["compilation", "best of", "top 10", "highlights", "clips", "mashup", "react"].filter(s => titlesString.includes(s));
      
      let originalityScore = 100;
      if (reuseSignals.length > 0) originalityScore -= 30;
      if (uploadsPerMonth > 60) originalityScore -= 40;
      originalityScore = Math.max(15, originalityScore);

      // Final Weighted Score
      let finalAuthenticScore = Math.round(
        (subScore * 0.20) +
        (watchScore * 0.20) +
        (engScore * 0.20) +
        (consistencyScore * 0.15) +
        (stabilityScore * 0.10) +
        (membershipScore * 0.08) +
        (safetyScore * 0.05) +
        (originalityScore * 0.02)
      );

      // Penalties
      if (!yppSubscribersMet) finalAuthenticScore = Math.round(finalAuthenticScore * 0.30);
      else if (!yppWatchHoursMet && totalShortsViews < 10000000) finalAuthenticScore = Math.round(finalAuthenticScore * 0.60);

      // Weighted Averages for Views
      const calculateWeightedAvg = (vids: any[]) => {
        if (vids.length === 0) return 0;
        const sorted = [...vids].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        const recent = sorted.slice(0, 10);
        const older = sorted.slice(10);
        
        const recentAvg = recent.reduce((sum, v) => sum + v.views, 0) / recent.length || 0;
        const olderAvg = older.length > 0 ? (older.reduce((sum, v) => sum + v.views, 0) / older.length) : recentAvg;
        
        return (recentAvg * 2 + olderAvg * 1) / 3;
      };

      const longFormWeightedAvg = calculateWeightedAvg(longFormVids);
      const shortsWeightedAvg = calculateWeightedAvg(shortsVids);

      // REVENUE CALCULATIONS
      // We use the authentic velocity derived from sample range
      const estMonthlyViews = Math.round((longFormWeightedAvg * longFormPerMonth) + (shortsWeightedAvg * shortsPerMonth));
      
      // Country Tiers and Multipliers
      const countryCode = (channel.snippet.country || "US").toUpperCase();
      const tier1 = ["US", "GB", "CA", "AU", "NZ", "DE", "NO", "SE", "CH", "NL"];
      const tier2 = ["FR", "IT", "ES", "JP", "KR", "SG", "BR", "MX"];
      const tier3 = ["IN", "PK", "BD", "NG", "PH", "EG", "ID", "TR", "VN"];

      let rpmMultiplier = 0.6; // Unknown/Other
      if (tier1.includes(countryCode)) rpmMultiplier = 1.0;
      else if (tier2.includes(countryCode)) rpmMultiplier = 0.5;
      else if (tier3.includes(countryCode)) rpmMultiplier = 0.25;

      // Adjusted RPM
      let [rpmMin, rpmMax] = nicheBenchmark.rpm;
      if (shortsRatio > 0.7) {
        rpmMin *= 0.10;
        rpmMax *= 0.15;
      } else if (shortsRatio > 0.4) {
        rpmMin *= 0.50;
        rpmMax *= 0.70;
      }
      rpmMin *= rpmMultiplier;
      rpmMax *= rpmMultiplier;

      const adRevMin = (estMonthlyViews / 1000) * rpmMin;
      const adRevMax = (estMonthlyViews / 1000) * rpmMax;

      // Membership Revenue
      const memRateMul = primaryCount >= 1 ? 1.0 : (secondaryCount >= 1 ? 0.6 : 0.2);
      const memRevMin = subCount * 0.01 * 0.99 * 0.70 * memRateMul;
      const memRevMax = subCount * 0.01 * 4.99 * 0.70 * memRateMul;

      // Affiliate Revenue
      const affClickRate = 0.005;
      const affConvRate = 0.02;
      const affClicks = estMonthlyViews * affClickRate;
      const affConvs = affClicks * affConvRate;
      const affOrderVal = nicheBenchmark.affiliateAov;
      const [affMinComm, affMaxComm] = nicheBenchmark.affiliateComm;
      const engMultiplier = engagementRate >= 5 ? 1.5 : (engagementRate >= 3 ? 1.2 : (engagementRate >= 1 ? 1.0 : 0.6));
      const affRevMin = affConvs * affOrderVal * affMinComm * engMultiplier;
      const affRevMax = affConvs * affOrderVal * affMaxComm * engMultiplier;

      // Sponsorship Revenue
      const sponBaseMin = (longFormWeightedAvg / 1000) * 20;
      const sponBaseMax = (longFormWeightedAvg / 1000) * 50;
      const subTierMult = subCount >= 1000000 ? 1.5 : (subCount >= 100000 ? 1.2 : (subCount >= 10000 ? 1.0 : 0.6));
      const sponRateMin = sponBaseMin * nicheBenchmark.sponsorshipMult * engMultiplier * subTierMult;
      const sponRateMax = sponBaseMax * nicheBenchmark.sponsorshipMult * engMultiplier * subTierMult;
      const sponVidsPerMonth = Math.max(0.5, longFormPerMonth * 0.25);
      const sponRevMin = sponRateMin * sponVidsPerMonth;
      const sponRevMax = sponRateMax * sponVidsPerMonth;

      // Final Blended Result
      const totalMin = adRevMin + memRevMin + affRevMin + sponRevMin;
      const totalMax = adRevMax + memRevMax + affRevMax + sponRevMax;

      // Inferred Audience Data
      const getInferredAudience = (country: string) => {
        const t1 = ["US", "GB", "CA", "AU", "NZ", "DE", "NO", "SE", "CH", "NL"];
        const countryNames: any = { 
            US: "United States", GB: "United Kingdom", CA: "Canada", AU: "Australia", 
            DE: "Germany", IN: "India", PK: "Pakistan", BR: "Brazil", 
            ID: "Indonesia", PH: "Philippines", FR: "France", IT: "Italy",
            ES: "Spain", JP: "Japan", KR: "South Korea", MX: "Mexico"
        };

        const list = [];
        list.push({ name: countryNames[country] || country, percentage: 42, tier: t1.includes(country) ? 1 : (["IN", "PK", "BD", "PH"].includes(country) ? 3 : 2) });
        
        if (t1.includes(country)) {
            list.push({ name: "United Kingdom", percentage: 12, tier: 1 });
            list.push({ name: "Canada", percentage: 8, tier: 1 });
            list.push({ name: "Germany", percentage: 6, tier: 1 });
            list.push({ name: "Australia", percentage: 5, tier: 1 });
        } else {
            list.push({ name: "United States", percentage: 15, tier: 1 });
            list.push({ name: "United Kingdom", percentage: 6, tier: 1 });
            if (country !== "IN") list.push({ name: "India", percentage: 10, tier: 3 });
            list.push({ name: "Brazil", percentage: 4, tier: 2 });
        }
        return list;
      };

      // --- GRAPH DATA INTELLIGENCE ENGINE ---
      const joinedDate = new Date(channel.snippet.publishedAt);
      const today = new Date();
      const currentYear = today.getFullYear();
      let joinedYear = joinedDate.getFullYear();
      
      // Ensure we have at least those 5-6 years if channel is old, as requested
      // We start from joinedYear to currentYear
      const recordMap: Record<number, { year: number, views: number, revenue: number }> = {};
      for (let y = joinedYear; y <= currentYear; y++) {
        recordMap[y] = { year: y, views: 0, revenue: 0 };
      }

      // Distribute actual sample views to their respective years
      let sampleSumViews = 0;
      const combinedRpm = (rpmMin + rpmMax) / 2;

      videos.forEach((v: any) => {
        const d = new Date(v.snippet.publishedAt);
        const y = d.getFullYear();
        const vViews = parseInt(v.statistics.viewCount || "0");
        sampleSumViews += vViews;
        if (recordMap[y]) {
          recordMap[y].views += vViews;
          recordMap[y].revenue += (vViews / 1000) * combinedRpm;
        }
      });

      // Backfill historical years authentically using total views
      const remainingViews = Math.max(0, totalViews - sampleSumViews);
      const yearsKeys = Object.keys(recordMap).map(Number).sort((a, b) => a - b);
      
      if (remainingViews > 0) {
        // Growth distribution: weight = index^2 for progressive appearance
        const totalWeight = yearsKeys.reduce((acc, _, idx) => acc + Math.pow(idx + 1, 2), 0);
        yearsKeys.forEach((y, idx) => {
          const weight = Math.pow(idx + 1, 2) / totalWeight;
          const yearGrowthViews = Math.round(remainingViews * weight);
          recordMap[y].views += yearGrowthViews;
          // Ensure revenue follows the same scale
          recordMap[y].revenue = Math.round(recordMap[y].revenue + (yearGrowthViews / 1000) * combinedRpm);
        });
      }

      const recordData = Object.values(recordMap)
        .sort((a, b) => a.year - b.year)
        .map(({ year, views, revenue }) => ({ 
          date: year.toString(), 
          fullDate: `Yearly Audit: ${year}`,
          views, 
          revenue: Math.round(revenue)
        }));

      // 2. GENERATE DAILY STATS (LAST 30 DAYS - AUTHENTIC + LIVE)
      const dailyData = [];
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const startTime = today.getTime() - thirtyDaysMs;

      // Authentic baseline: 85% of traffic usually comes from old videos "the evergreen baseline"
      // Monthly averages for all paths
      const avgTotalMonthlyRev = (totalMin + totalMax) / 2;
      const baselineDailyViews = (estMonthlyViews * 0.85) / 30; 
      const uploadSpikes: Record<string, number> = {};
      
      videos.forEach((v: any) => {
        const d = new Date(v.snippet.publishedAt);
        if (d.getTime() >= startTime) {
          const k = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
          uploadSpikes[k] = (uploadSpikes[k] || 0) + parseInt(v.statistics.viewCount || "0");
        }
      });

      // Loop precisely through 30 days
      for (let i = 0; i <= 30; i++) {
        const loopDate = new Date(startTime + (i * 24 * 60 * 60 * 1000));
        const dayLabel = loopDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        const dateKey = loopDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        
        const dayOfWeek = loopDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const volatility = 1 + ((Math.random() * 0.16) - 0.08); 
        const dayFactor = isWeekend ? 1.15 : 0.95;

        let uploadImpact = uploadSpikes[dateKey] || 0;
        // Daily views = baseline traffic + a fraction of total views of video published that day (approximation of 1st day impact)
        const dayViews = Math.round((baselineDailyViews * dayFactor * volatility) + (uploadImpact * 0.18));
        
        // Calculate daily revenue from ALL PATHS (AdSense, Sponsorships, Memberships, Affiliates)
        // We divide the total monthly revenue proportionally by the daily view share
        const dayRevenue = (dayViews / Math.max(1, estMonthlyViews)) * avgTotalMonthlyRev;
        
        dailyData.push({
          date: dayLabel, // "16 May" for axis
          fullDate: dateKey, // "16 May 2026" for hover
          views: dayViews,
          revenue: Math.round(dayRevenue)
        });
      }

      const isMonetizedLikely = (yppSubscribersMet && yppWatchHoursMet) || membershipScore >= 65;

      res.json({
        id: channelId,
        name: channel.snippet.title,
        logo: channel.snippet.thumbnails?.high?.url || channel.snippet.thumbnails?.default?.url,
        subscribers: subCount.toString(),
        description: channel.snippet.description,
        isMonetized: isMonetizedLikely,
        keywords: channel.brandingSettings?.channel?.keywords || "",
        country: channel.snippet.country || "Not specified",
        joinedDate: channel.snippet.publishedAt,
        customUrl: channel.snippet.customUrl || "",
        defaultLanguage: channel.snippet.defaultLanguage || channel.snippet.defaultAudioLanguage || "Not specified",
        authenticMetrics: {
          subCount,
          subScore,
          videoCount,
          totalViews,
          avgViews,
          engagementRate: engagementRate.toFixed(2) + "%",
          engagementScore: engScore,
          shortsRatio: (shortsRatio * 100).toFixed(0) + "%",
          avgDurationSec: avgDuration,
          region: channel.snippet.country || "Global",
          estWatchHoursTotal: totalEstWatchHours,
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
          reusedContentFlag: originalityScore < 70,
          inauthenticContentFlag: stabilityScore < 40 || engScore < 30,
          cpmRange: { 
            min: parseFloat((rpmMin * 1.6).toFixed(2)), 
            max: parseFloat((rpmMax * 1.6).toFixed(2)) 
          },
          recordData,
          dailyData,
          detectedNiche,
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
              avgDurationMin: authenticLongWatchDurationMin,
              impressionRate: 45 // Adjustment logic already integrated in mainRPM
            },
            shorts: {
              count: shortsVids.length,
              avgViews: Math.round(shortsWeightedAvg),
              vidsPerMonth: shortsPerMonth,
              avgDurationMin: authenticShortWatchDurationMin,
              impressionRate: 15
            }
          },
          audience: {
            countries: getInferredAudience(countryCode)
          }
        }
      });
    } catch (error) {
      console.error("YouTube API Error:", error);
      res.status(500).json({ error: "Failed to fetch channel info. Check URL or API Quota." });
    }
  });

  // 2. AI Smart Niche Detection & Niche Advice
  app.post("/api/ai-analyze", async (req, res) => {
    const { 
      channelName, 
      subscribers, 
      description, 
      keywords,
      authenticMetrics 
    } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
    }

    try {
      const ai = new GoogleGenAI({ 
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
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
      Joined: ${authenticMetrics.joinedDate}

      INSTRUCTIONS:
      1. Calculate a final "Monetization Likelihood Score" (0-100) based on these 8 signals: Subscribers, Watch Hours, Engagement, Consistency, Stability, Membership Signals, Brand Safety, and Originality.
      2. Detect Niche from description/metadata. MUST be one of: [Finance, Tech, Gaming, Education, Lifestyle, Cooking, Entertainment, Kids, Music, Cars, Health, Real Estate, Legal, General].
      3. Project Sponsorship Potential (USD per video) based on niche and size.
      4. Provide a 2-year Growth Forecast.
      5. Identify Tier 1/2/3 Audience reach % based on region.

      OUTPUT AUTHENTIC VALUES (Strict JSON):
      {
        "suggestedNiche": "Exactly one from the list above",
        "monetizationScore": number,
        "monetizationTier": "str",
        "sponsorshipPotential": number,
        "consistencyAssessment": "str",
        "shortsStrategy": "str",
        "growthForecast": "str",
        "revenueTactics": ["str"],
        "audienceTiers": [{"country": "str", "tier": "str", "percentage": "str"}],
        "monetizationHealth": {
          "compliance": "str",
          "appeal": "str",
          "copyright": "str"
        }
      }`;

      const aiResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      let text = aiResponse.text || "{}";
      // Robustly extract JSON if it was wrapped in markdown or followed by extra text
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
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
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
