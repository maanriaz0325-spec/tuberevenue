
export enum NicheType {
  FINANCE = 'Finance',
  TECH = 'Tech',
  GAMING = 'Gaming',
  EDUCATION = 'Education',
  LIFESTYLE = 'Lifestyle',
  COOKING = 'Cooking',
  ENTERTAINMENT = 'Entertainment',
  KIDS = 'Kids',
  MUSIC = 'Music',
  CARS = 'Cars',
  HEALTH = 'Health',
  REAL_ESTATE = 'Real Estate',
  LEGAL = 'Legal',
  GENERAL = 'General'
}

export interface NicheBenchmark {
  min: number;
  avg: number;
  max: number;
}

export const NICHE_BENCHMARKS: Record<NicheType, NicheBenchmark> = {
  [NicheType.FINANCE]: { min: 12, avg: 22, max: 45 },
  [NicheType.LEGAL]: { min: 10, avg: 18, max: 40 },
  [NicheType.REAL_ESTATE]: { min: 8, avg: 15, max: 35 },
  [NicheType.TECH]: { min: 8, avg: 14, max: 30 },
  [NicheType.HEALTH]: { min: 5, avg: 10, max: 25 },
  [NicheType.EDUCATION]: { min: 4, avg: 8, max: 18 },
  [NicheType.CARS]: { min: 4, avg: 7, max: 16 },
  [NicheType.COOKING]: { min: 3, avg: 5, max: 12 },
  [NicheType.LIFESTYLE]: { min: 2, avg: 4, max: 10 },
  [NicheType.GAMING]: { min: 1.5, avg: 3, max: 8 },
  [NicheType.ENTERTAINMENT]: { min: 1, avg: 2.5, max: 6 },
  [NicheType.KIDS]: { min: 1, avg: 2, max: 5 },
  [NicheType.MUSIC]: { min: 0.5, avg: 1.5, max: 4 },
  [NicheType.GENERAL]: { min: 1, avg: 3, max: 10 }
};

export const GEO_TIER_MULTIPLIERS = {
  tier1: 1.0,  // US, UK, CA, AU, NZ
  tier2: 0.60, // DE, FR, JP, SG, UAE
  tier3: 0.15, // IN, PK, BR, MX, NG
  tier4: 0.08  // Rest of World
};

export const SEASONAL_FACTORS = {
  q4: 1.40, // Oct-Dec
  q1: 0.75, // Jan-Feb
  standard: 1.00
};

export interface CalculatorState {
  inputs: {
    url: string;
    views: number;
    subscribers: number;
    niche: NicheType;
    manualCpm: number | null;
    watchTime: number;
    videosPerMonth: number;
    avgViewsPerVideo: number;
    tier1Pct: number;
    tier2Pct: number;
    tier3Pct: number;
    adImpressionRate: number;
    taxRate: number;
    growthRate: number;
    horizon: number;
    // Advanced streams
    sponsorshipPerVideo: number;
    members: number;
    memberPrice: number;
    superChat: number;
    merch: number;
    affiliate: number;
    isShorts: boolean;
  };
  channelInfo: {
    name: string;
    logo: string;
    detectedSubs: string;
    region: string;
    joinedDate: string;
    isMonetized: boolean;
    isAnalyzed: boolean;
    engagementRate?: string;
    shortsRatio?: string;
  };
}

export interface CalculatorResults {
  adsense: number;
  sponsorship: number;
  memberships: number;
  superChat: number;
  merch: number;
  affiliate: number;
  grossTotal: number;
  netTotal: number;
  rpm: number;
  ecpm: number;
  lowEst: number;
  highEst: number;
  confidence: number;
  projection: { month: number; revenue: number; views: number }[];
  yppEligible: boolean;
  yearlyGross: number;
  yearlyNet: number;
}
