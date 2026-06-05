import { useState, useEffect, FormEvent, KeyboardEvent, ClipboardEvent } from "react";
import { 
  Youtube, 
  Search, 
  TrendingUp, 
  DollarSign, 
  Users, 
  ShieldCheck,
  AlertCircle,
  BarChart3,
  Globe,
  Clock,
  PieChart,
  Target,
  ExternalLink,
  ChevronRight,
  Info,
  Calendar,
  Heart,
  Activity,
  Copy,
  Tag,
  AtSign,
  ArrowRight,
  Fingerprint,
  Zap,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Lock,
  Mail,
  Eye,
  EyeOff,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import axios from "axios";
import { 
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from "recharts";

// --- Components ---

const StatCard = ({ icon, label, value, subValue, color }: { icon: any, label: string, value: string, subValue?: string, color: string }) => (
  <div className="card-style">
    <div className="flex items-center gap-3 mb-4">
      <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
        {icon}
      </div>
      <span className="text-[13px] font-semibold text-slate-500 uppercase tracking-tight">{label}</span>
    </div>
    <div className="space-y-1">
      <div className="text-2xl font-bold text-slate-900 jetbrains-number">{value}</div>
      {subValue && <div className="text-xs text-slate-500 font-medium">{subValue}</div>}
    </div>
  </div>
);

const SignalBar = ({ label, score, assessment }: { label: string, score: number, assessment: string }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center text-xs">
      <span className="font-semibold text-slate-600">{label}</span>
      <span className={`font-bold ${score >= 70 ? 'text-green-600' : score >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
        {assessment}
      </span>
    </div>
    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        className={`h-full ${score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
      />
    </div>
  </div>
);

export default function App() {
  const [url, setUrl] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [contentMode, setContentMode] = useState<'long-form' | 'shorts'>('long-form');
  const [graphMode, setGraphMode] = useState<'record' | 'last-month'>('record');

  const handleAnalyze = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      const response = await axios.post("/api/analyze-channel", { url });
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to analyze channel. Please check the URL or try again later.");
    } finally {
      setIsSearching(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toLocaleString();
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Search Header */}
      <div className="bg-white border-b border-slate-200 pt-16 pb-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
              Youtube <span className="text-red-600">Monetization</span> checker
            </h1>
          </motion.div>

          <form onSubmit={handleAnalyze} className="max-w-2xl mx-auto relative group">
            <div className="flex items-center gap-3 bg-white border-2 border-slate-200 hover:border-red-600/30 rounded-2xl p-2.5 transition-all shadow-xl shadow-slate-200/50 focus-within:border-red-600 focus-within:ring-4 focus-within:ring-red-600/5">
              <div className="pl-4">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input 
                type="text" 
                placeholder="Enter YouTube Channel URL or @handle..."
                className="flex-1 bg-transparent border-none outline-none py-3 px-2 font-medium text-slate-900 placeholder:text-slate-400"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <button 
                type="submit"
                disabled={isSearching}
                className="btn-primary flex items-center gap-2 whitespace-nowrap"
              >
                {isSearching ? "Analyzing Signal..." : "Run Intelligence Audit"}
                {!isSearching && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </form>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 inline-flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-xl text-sm font-semibold border border-red-100"
            >
              <AlertCircle className="h-4 w-4" /> {error}
            </motion.div>
          )}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 mt-12">
        <AnimatePresence mode="wait">
          {isSearching ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 space-y-6"
            >
              <div className="flex gap-2">
                {[0, 1, 2].map(i => (
                  <motion.div 
                    key={i}
                    animate={{ y: [0, -10, 0], opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
                    className="w-3 h-3 bg-red-600 rounded-full"
                  />
                ))}
              </div>
              <div className="text-center space-y-2">
                <p className="text-slate-900 font-bold tracking-tight">Processing YouTube Signals</p>
                <p className="text-slate-500 text-sm max-w-sm">Fetching 50 recent videos, calculating engagement, and auditing content safety...</p>
              </div>
            </motion.div>
          ) : data && (
            <motion.div 
              key="report"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Header Info */}
              <div className="card-style flex flex-col md:flex-row items-center gap-8 py-8">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-red-600/10 p-1">
                    <img 
                      src={data.logo} 
                      alt={data.name} 
                      className="w-full h-full rounded-full object-cover shadow-lg"
                    />
                  </div>
                  <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${data.isMonetized ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                    {data.isMonetized ? "Monetized" : "Unmonetized"}
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2 truncate max-w-md">{data.name}</h2>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm font-medium text-slate-500">
                    <span className="flex items-center gap-1.5"><Globe className="h-4 w-4 text-slate-400" /> {data.country}</span>
                    <span className="flex items-center gap-1.5"><Tag className="h-4 w-4 text-slate-400" /> {data.authenticMetrics.detectedNiche}</span>
                    <span className="flex items-center gap-1.5"><AtSign className="h-4 w-4 text-slate-400" /> {data.keywords ? "Optimized" : "No Keywords"}</span>
                  </div>
                  <p className="mt-4 text-slate-500 text-sm leading-relaxed line-clamp-2 italic">
                    "{data.description || "No description available."}"
                  </p>
                </div>
                <div className="flex flex-col gap-3 min-w-[200px]">
                  <a 
                    href={`https://youtube.com/channel/${data.id}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:border-red-600 hover:text-red-600 transition-all flex items-center justify-center gap-2"
                  >
                    View on YouTube <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* Main Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<Users className="text-blue-600" />} label="Subscribers" value={formatNumber(parseInt(data.subscribers))} subValue={`${data.authenticMetrics.subScore}/100 score`} color="bg-blue-600" />
                <StatCard icon={<TrendingUp className="text-green-600" />} label="Total Views" value={formatNumber(data.authenticMetrics.totalViews)} subValue="Lifetime channel total" color="bg-green-600" />
                <StatCard icon={<Heart className="text-red-600" />} label="Engagement" value={data.authenticMetrics.engagementRate} subValue={`${data.authenticMetrics.engagementScore}% confidence`} color="bg-red-600" />
                <StatCard icon={<Activity className="text-purple-600" />} label="Intelligence" value={`${data.authenticMetrics.finalAuthenticScore}/100`} subValue="Overall health score" color="bg-purple-600" />
              </div>

              {/* Middle Section: Revenue & Signals */}
              <div className="grid grid-cols-1 lg:grid-cols-[45%_55%] gap-8">
                {/* Left Area: Additional Revenue Streams */}
                <div className="card-style bg-white border-slate-200">
                  <div className="mb-8">
                    <h3 className="font-serif text-xl font-bold text-slate-900 mb-1">Revenue Stream Paths</h3>
                    <p className="font-roboto text-sm text-slate-500">Logical & authentic revenue breakdown</p>
                  </div>

                  <div className="space-y-6">
                    {[
                      { 
                        title: "AdSense (YouTube Ads)", 
                        key: "adRev", 
                        icon: <DollarSign className="h-4 w-4 text-green-600" />,
                        desc: "Monetized views through video playbacks"
                      },
                      { 
                        title: "Channel Memberships", 
                        key: "memRev", 
                        icon: <Users className="h-4 w-4 text-blue-600" />,
                        desc: "Direct support from loyal community members"
                      },
                      { 
                        title: "Affiliate Marketing", 
                        key: "affRev", 
                        icon: <Target className="h-4 w-4 text-amber-600" />,
                        desc: "Revenue from product referrals and links"
                      },
                      { 
                        title: "Brand Sponsorships", 
                        key: "sponRev", 
                        icon: <Heart className="h-4 w-4 text-red-600" />,
                        desc: "Paid partnerships and brand integrations"
                      }
                    ].map((stream) => {
                      // Adjust based on content mode
                      const multiplier = contentMode === 'shorts' ? 0.3 : 1.0;
                      // Use data from API or fallbacks
                      const baseMin = (data.authenticMetrics.monthlyRevenue as any)[stream.key]?.min || (data.authenticMetrics.monthlyRevenue.min * 0.2);
                      const baseMax = (data.authenticMetrics.monthlyRevenue as any)[stream.key]?.max || (data.authenticMetrics.monthlyRevenue.max * 0.2);
                      
                      const conValue = Math.round(baseMin * multiplier);
                      const optValue = Math.round(baseMax * multiplier);

                      return (
                        <div key={stream.title} className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                          <div className="flex items-start gap-3 mb-4">
                            <div className="p-1.5 bg-slate-100 rounded-lg">
                              {stream.icon}
                            </div>
                            <div>
                              <h4 className="font-serif text-[15px] font-bold text-slate-800 leading-none mb-1">{stream.title}</h4>
                              <p className="font-roboto text-[11px] text-slate-500">{stream.desc}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Conservative</div>
                              <div className="font-sans font-bold text-slate-900 text-sm tracking-tight">${conValue.toLocaleString()}</div>
                            </div>
                            <div className="bg-green-50/50 p-2 rounded-lg border border-green-100">
                              <div className="text-[9px] font-bold text-green-600/70 uppercase tracking-tighter">Optimistic</div>
                              <div className="font-sans font-bold text-green-700 text-sm tracking-tight">${optValue.toLocaleString()}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Area: Main Estimates & Mode Toggle */}
                <div className="space-y-8">
                  <div className="card-style bg-white relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 pb-6 border-b border-slate-100">
                      <div>
                        <h3 className="font-serif text-2xl font-bold text-slate-900">Revenue Audit</h3>
                        <p className="font-roboto text-sm text-slate-500">Industry standards for {data.authenticMetrics.detectedNiche}</p>
                      </div>
                      
                      {/* Mode Toggle */}
                      <div className="flex p-1 bg-slate-100 rounded-xl">
                        <button 
                          onClick={() => setContentMode('long-form')}
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${contentMode === 'long-form' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          Long-Form
                        </button>
                        <button 
                          onClick={() => setContentMode('shorts')}
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${contentMode === 'shorts' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          Shorts
                        </button>
                      </div>
                    </div>

                    {/* Big Numbers */}
                    <div className="grid grid-cols-1 gap-6">
                      {[
                        { 
                          label: "Estimated Daily Revenue", 
                          value: (data.authenticMetrics.monthlyRevenue.min / 30),
                          maxValue: (data.authenticMetrics.monthlyRevenue.max / 30),
                          icon: <Clock className="h-5 w-5 text-red-500" />
                        },
                        { 
                          label: "Estimated Monthly Revenue", 
                          value: data.authenticMetrics.monthlyRevenue.min,
                          maxValue: data.authenticMetrics.monthlyRevenue.max,
                          icon: <Calendar className="h-5 w-5 text-blue-500" />
                        },
                        { 
                          label: "Estimated Yearly Revenue", 
                          value: data.authenticMetrics.monthlyRevenue.min * 12,
                          maxValue: data.authenticMetrics.monthlyRevenue.max * 12,
                          icon: <TrendingUp className="h-5 w-5 text-green-500" />
                        }
                      ].map((item) => {
                        const multiplier = contentMode === 'shorts' ? 0.12 : 1.0;
                        const minVal = Math.round(item.value * multiplier);
                        const maxVal = Math.round(item.maxValue * multiplier);

                        return (
                          <div key={item.label} className="group p-6 rounded-2xl bg-white border border-slate-100 hover:border-red-100 hover:shadow-lg transition-all">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-roboto text-sm font-semibold text-slate-500">{item.label}</span>
                              <div className="p-2 rounded-full bg-white shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                                {item.icon}
                              </div>
                            </div>
                            <div className="font-sans text-3xl font-bold text-slate-900 tracking-tight">
                              ${minVal.toLocaleString()} <span className="text-slate-400 font-light mx-2">–</span> ${maxVal.toLocaleString()}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-8 p-4 bg-red-50/50 rounded-xl border border-red-100/50">
                      <div className="flex gap-3">
                        <Info className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                        <p className="font-roboto text-[11px] text-red-700 leading-relaxed">
                          <span className="font-bold">Authentic Analyze:</span> {contentMode === 'long-form' 
                            ? "Calculations based on 35% retention and Standard RPM for high-quality long-form uploads." 
                            : "Calculations adjusted for Shorts Feed CPM (~$0.07/1k) and viral-potential impressions."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Signals Column (Inline now) */}
                  <div className="card-style">
                     <h3 className="font-serif text-lg font-bold text-slate-900 mb-6">Channel Signals Audit</h3>
                     <div className="space-y-6">
                       <SignalBar label="Consistency" score={data.authenticMetrics.consistencyScore} assessment={data.authenticMetrics.consistencyScore >= 70 ? "Stable" : "Variable"} />
                       <SignalBar label="Engagement" score={data.authenticMetrics.engagementScore} assessment={data.authenticMetrics.engagementScore >= 70 ? "Excellent" : "Average"} />
                       <SignalBar label="View Stability" score={data.authenticMetrics.stabilityScore} assessment={data.authenticMetrics.stabilityScore >= 70 ? "Predictable" : "Unstable"} />
                       <SignalBar label="Originality" score={data.authenticMetrics.originalityScore} assessment={data.authenticMetrics.originalityScore >= 80 ? "Authentic" : "Potential Reuse"} />
                     </div>
                  </div>
                </div>
              </div>

              {/* MOVED: Content Performance Audits */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Long-Form Audit */}
                <div className="card-style bg-white border-slate-200">
                  <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                    <div className="p-2 bg-red-50 rounded-lg text-red-600">
                      <Youtube className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-bold text-slate-900">YouTube Long-Form Audit</h3>
                      <p className="font-roboto text-[11px] text-slate-400">Deep-dive metric analysis</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {[
                      { 
                        label: "Videos Published / Month", 
                        value: `~${(data.authenticMetrics.contentMix.longForm.vidsPerMonth || 0).toFixed(1)}`, 
                        desc: "Upload frequency velocity" 
                      },
                      { 
                        label: "Avg Per Video Views", 
                        value: formatNumber(data.authenticMetrics.contentMix.longForm.avgViews || 0), 
                        desc: "Authentic reach per upload" 
                      },
                      { 
                        label: "Avg Video Watch Duration", 
                        value: `${(data.authenticMetrics.contentMix.longForm.avgDurationMin || 0).toFixed(1)}m`, 
                        desc: "Retention signal (35% avg)" 
                      },
                      { 
                        label: "Video Ad Impression Frequency", 
                        value: `${(() => {
                          let base = 45;
                          if (data.authenticMetrics.contentMix.longForm.avgDurationMin > 20) base += 15;
                          else if (data.authenticMetrics.contentMix.longForm.avgDurationMin > 8) base += 10;
                          return base;
                        })()}%`, 
                        desc: "Monetizable slots available" 
                      },
                      { 
                        label: "Final Ad Impression Rate", 
                        value: `${data.authenticMetrics.contentMix.longForm.impressionRate}%`, 
                        desc: "Geography adjusted yield" 
                      },
                      { 
                        label: "Estimated Video RPM", 
                        value: `$${data.authenticMetrics.monthlyRevenue.rpm.min.toFixed(2)} - $${data.authenticMetrics.monthlyRevenue.rpm.max.toFixed(2)}`, 
                        desc: "Niche performance payout", 
                        highlight: 'text-green-600' 
                      }
                    ].map((row, idx) => (
                      <div key={idx} className="flex items-center justify-between group">
                        <div className="space-y-0.5">
                          <p className="font-roboto text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors uppercase tracking-tight">{row.label}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{row.desc}</p>
                        </div>
                        <div className={`font-sans text-base font-bold ${row.highlight || 'text-slate-900'} font-sans`}>
                          {row.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shorts Audit */}
                <div className="card-style bg-white border-slate-200">
                  <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-bold text-slate-900">YouTube Shorts Audit</h3>
                      <p className="font-roboto text-[11px] text-slate-400">Viral frequency auditing</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {[
                      { 
                        label: "Shorts Published / Month", 
                        value: `~${(data.authenticMetrics.contentMix.shorts.vidsPerMonth || 0).toFixed(1)}`, 
                        desc: "Shorts shelf velocity" 
                      },
                      { 
                        label: "Avg Per Shorts Views", 
                        value: formatNumber(data.authenticMetrics.contentMix.shorts.avgViews || 0), 
                        desc: "Feed discovery reach" 
                      },
                      { 
                        label: "Avg Video Watch Duration", 
                        value: `${(data.authenticMetrics.contentMix.shorts.avgDurationMin || 0).toFixed(1)}m`, 
                        desc: "Retention signal (80% est)" 
                      },
                      { 
                        label: "Shorts Ad Impression Frequency", 
                        value: "15%", 
                        desc: "Avg Feed-Ad occurrence" 
                      },
                      { 
                        label: "Estimated Shorts RPM", 
                        value: "$0.03 - $0.07", 
                        desc: "Global pool standard", 
                        highlight: 'text-blue-600' 
                      }
                    ].map((row, idx) => (
                      <div key={idx} className="flex items-center justify-between group">
                        <div className="space-y-0.5">
                          <p className="font-roboto text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors uppercase tracking-tight">{row.label}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{row.desc}</p>
                        </div>
                        <div className={`font-sans text-base font-bold ${row.highlight || 'text-slate-900'} font-sans`}>
                          {row.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Monetization & Safety Metrics */}
              <div className="card-style">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-slate-900">Monetization & Safety Metrics</h3>
                    <p className="font-roboto text-sm text-slate-500">Advanced channel health audit & risk assessment</p>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* Primary Scores */}
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-roboto">Channel Health Score</span>
                        <span className="text-sm font-bold text-indigo-600">{data.authenticMetrics.finalAuthenticScore}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${data.authenticMetrics.finalAuthenticScore}%` }}
                          className={`h-full rounded-full ${
                            data.authenticMetrics.finalAuthenticScore > 80 ? 'bg-indigo-500' : 
                            data.authenticMetrics.finalAuthenticScore > 50 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-roboto">Watchhour Score</span>
                        <span className="text-sm font-bold text-indigo-600">{data.authenticMetrics.watchScore}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${data.authenticMetrics.watchScore}%` }}
                          className="h-full bg-indigo-400 rounded-full"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-roboto">Engagement Quality</span>
                        <span className="text-sm font-bold text-indigo-600">{data.authenticMetrics.engagementScore}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${data.authenticMetrics.engagementScore}%` }}
                          className="h-full bg-indigo-400 rounded-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Safety & Content */}
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-roboto">Brand Safety</span>
                        <span className="text-sm font-bold text-green-600">{data.authenticMetrics.safetyScore}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${data.authenticMetrics.safetyScore}%` }}
                          className="h-full bg-green-500 rounded-full"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-roboto">Content Originality</span>
                        <span className="text-sm font-bold text-indigo-600">{data.authenticMetrics.originalityScore}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${data.authenticMetrics.originalityScore}%` }}
                          className="h-full bg-indigo-400 rounded-full"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-white border border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">CPM Range</p>
                        <p className="text-xs font-black text-slate-900 font-mono tracking-tighter">
                          ${data.authenticMetrics.cpmRange.min} - ${data.authenticMetrics.cpmRange.max}
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                        <p className="text-[9px] font-bold text-indigo-400 uppercase mb-1">Avg RPM</p>
                        <p className="text-xs font-black text-indigo-600 font-mono tracking-tighter">
                          ${data.authenticMetrics.monthlyRevenue.rpm.min.toFixed(2)} - ${data.authenticMetrics.monthlyRevenue.rpm.max.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Risk Flags */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-100 space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">System Risk Assessment</h4>
                    
                    <div className="space-y-4">
                      <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                        data.authenticMetrics.reusedContentFlag 
                          ? 'bg-red-50 border-red-100 text-red-700' 
                          : 'bg-green-50 border-green-100 text-green-700'
                      }`}>
                        <div className="flex items-center gap-3">
                          {data.authenticMetrics.reusedContentFlag ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                          <span className="text-xs font-bold font-roboto">Reused Content</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-tighter">
                          {data.authenticMetrics.reusedContentFlag ? 'DETECTED' : 'CLEAN'}
                        </span>
                      </div>

                      <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                        data.authenticMetrics.inauthenticContentFlag 
                          ? 'bg-amber-50 border-amber-100 text-amber-700' 
                          : 'bg-green-50 border-green-100 text-green-700'
                      }`}>
                        <div className="flex items-center gap-3">
                          {data.authenticMetrics.inauthenticContentFlag ? <Zap className="h-4 w-4" /> : <Fingerprint className="h-4 w-4" />}
                          <span className="text-xs font-bold font-roboto">Inauthentic Activity</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-tighter">
                          {data.authenticMetrics.inauthenticContentFlag ? 'HIGH RISK' : 'LOW RISK'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200">
                      <p className="text-[10px] text-slate-400 leading-relaxed text-center font-medium italic">
                        Risk assessment is based on upload velocity, view stability, and community engagement variance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Audience Reach Analysis */}
              <div className="space-y-6 mb-12">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-slate-900">Audience Reach Analysis</h3>
                    <p className="font-roboto text-sm text-slate-500">Inferred traffic distribution & regional dominance audit</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-2xl text-red-600">
                    <Globe className="h-6 w-6" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {(data.authenticMetrics.audience?.countries || []).map((country: any, idx: number) => (
                    <div key={idx} className="card-style p-5 border-slate-100 hover:border-red-100 transition-all group">
                      <div className="flex justify-between items-start mb-3">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-roboto">Traffic Segment</div>
                        {country.tier === 1 && (
                          <div className="text-[8px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-tighter border border-green-200">
                            High Traffic
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="text-3xl font-bold text-slate-900 font-sans tracking-tight">
                          {country.percentage}%
                        </div>
                        <div className="text-sm font-bold text-slate-700 font-roboto truncate">
                          {country.name}
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-50">
                        <div className="text-[10px] text-slate-400 font-medium font-roboto">
                          {country.tier === 1 ? 'Tier 1 Revenue Market' : country.tier === 3 ? 'Tier 3 Volume Market' : 'Tier 2 Emerging Market'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Trends */}
              <div className="card-style bg-white border-2 border-slate-100 shadow-xl overflow-hidden">
                <div className="bg-white px-8 py-6 border-b border-slate-100">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="space-y-1">
                       <div className="flex items-center gap-2">
                         <BarChart3 className="h-5 w-5 text-red-600" />
                         <h3 className="font-serif text-2xl font-bold text-slate-900">Performance Intelligence</h3>
                       </div>
                       <p className="font-roboto text-sm text-slate-500">Authentic traffic velocity & revenue trend analysis</p>
                    </div>
                    
                    <div className="flex p-1.5 bg-slate-100 rounded-2xl w-full lg:w-auto shadow-inner">
                      <button
                        onClick={() => setGraphMode('record')}
                        className={`flex-1 lg:px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                          graphMode === 'record' 
                            ? 'bg-white text-red-600 shadow-lg scale-100 translate-y-0' 
                            : 'text-slate-500 hover:text-slate-900 scale-95 opacity-70'
                        }`}
                      >
                        Records (All Time)
                      </button>
                      <button
                        onClick={() => setGraphMode('last-month')}
                        className={`flex-1 lg:px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                          graphMode === 'last-month' 
                            ? 'bg-white text-blue-600 shadow-lg scale-100 translate-y-0' 
                            : 'text-slate-500 hover:text-slate-900 scale-95 opacity-70'
                        }`}
                      >
                        Last Month (Daily)
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-8">
                  <div className="h-[480px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart 
                        data={graphMode === 'record' ? data.authenticMetrics.recordData : data.authenticMetrics.dailyData}
                        margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                      >
                        <defs>
                          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="date" 
                          fontSize={9} 
                          fontWeight={800}
                          tick={{ fill: '#94a3b8' }}
                          axisLine={false}
                          tickLine={false}
                          dy={15}
                          interval={graphMode === 'record' ? 'preserveStartEnd' : 'preserveEnd'}
                          minTickGap={20}
                        />
                        <YAxis 
                           yAxisId="left"
                           fontSize={10} 
                           fontWeight={800} 
                           stroke="#ef4444"
                           tickFormatter={(v) => formatNumber(v)}
                           axisLine={false}
                           tickLine={false}
                           tick={{ fill: '#ef4444' }}
                        />
                        <YAxis 
                           yAxisId="right"
                           orientation="right"
                           fontSize={10} 
                           fontWeight={800} 
                           stroke="#3b82f6"
                           tickFormatter={(v) => `$${formatNumber(v)}`}
                           axisLine={false}
                           tickLine={false}
                           tick={{ fill: '#3b82f6' }}
                        />
                        <Tooltip 
                          cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }}
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const isDaily = graphMode === 'last-month';
                              const fullDateLabel = isDaily ? payload[0].payload.fullDate : label;
                              
                              return (
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="bg-white/90 backdrop-blur-xl border border-slate-200 p-6 rounded-[32px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] space-y-5 min-w-[240px] border-b-4 border-b-red-500"
                                >
                                  <div className="border-b border-slate-100 pb-3">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-roboto mb-1">
                                      {isDaily ? "Daily Intelligence" : "Historical Record"}
                                    </p>
                                    <p className="font-serif text-lg font-bold text-slate-900">{fullDateLabel}</p>
                                  </div>
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between group">
                                      <div className="flex items-center gap-3">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                                        <span className="text-[11px] font-black text-slate-500 uppercase font-roboto tracking-tight">Authentic Views</span>
                                      </div>
                                      <span className="font-sans text-base font-black text-slate-900 jetbrains-number">{payload[0].value.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between group">
                                      <div className="flex items-center gap-3">
                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                        <span className="text-[11px] font-black text-slate-500 uppercase font-roboto tracking-tight">
                                          {isDaily ? "All-Paths Revenue" : "Estimated Revenue"}
                                        </span>
                                      </div>
                                      <span className="font-sans text-base font-black text-blue-600 jetbrains-number">${payload[1].value.toLocaleString()}</span>
                                    </div>
                                  </div>
                                  <div className="pt-3 border-t border-slate-50 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Live Calculation Logic Active</p>
                                  </div>
                                </motion.div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend 
                          verticalAlign="top" 
                          align="center" 
                          height={80}
                          iconType="rect"
                          iconSize={12}
                          wrapperStyle={{ paddingBottom: '30px' }}
                          formatter={(value) => <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.25em] font-roboto mx-4">{value}</span>}
                        />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="views" 
                          name={graphMode === 'record' ? "Lifetime Volume" : "Authentic Daily Traffic"}
                          stroke="#ef4444" 
                          strokeWidth={4} 
                          dot={graphMode === 'record' 
                            ? { r: 5, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' } 
                            : { r: 3, fill: '#ef4444', strokeWidth: 1, stroke: '#fff' }
                          }
                          activeDot={{ r: 7, strokeWidth: 3, stroke: '#fff', fill: '#ef4444' }}
                          animationDuration={2000}
                          strokeLinecap="round"
                          connectNulls
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="revenue" 
                          name={graphMode === 'record' ? "Annual Yield" : "Daily Total Revenue"}
                          stroke="#3b82f6" 
                          strokeWidth={4} 
                          dot={graphMode === 'record' 
                            ? { r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' } 
                            : { r: 3, fill: '#3b82f6', strokeWidth: 1, stroke: '#fff' }
                          }
                          activeDot={{ r: 7, strokeWidth: 3, stroke: '#fff', fill: '#3b82f6' }}
                          animationDuration={2000}
                          strokeLinecap="round"
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-slate-100">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-red-50 rounded-xl text-red-600">
                        <LineChart className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">Growth Forecast</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">Channel momentum suggests a {data.authenticMetrics.stabilityScore > 70 ? 'positive' : 'variable'} growth trajectory based on historical velocity.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                        <Target className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">Target Precision</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">Engagement quality audits confirm {data.authenticMetrics.engagementScore}% audience retention across recent uploads.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-green-50 rounded-xl text-green-600">
                        <Zap className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">Revenue Integrity</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">Revenue estimates are weighted by regional CPM averages and {data.authenticMetrics.detectedNiche} niche benchmarks.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Channel Identity Section (Last Section) */}
              <div className="card-style bg-white border border-slate-200 mt-12 mb-12">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-slate-900">Final Channel Metadata</h3>
                    <p className="font-roboto text-sm text-slate-500">Authentic profile verification & metadata audit</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-2xl text-red-600">
                    <Fingerprint className="h-6 w-6" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-roboto">Section Channel (Name Original)</h4>
                      <p className="text-xl font-bold text-slate-900 font-serif tracking-tight">{data.name}</p>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-roboto">Channel Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {data.keywords ? (data.keywords.match(/(".*?"|[^"\s]+)/g) || []).map((tag: string, i: number) => (
                          <span key={i} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 flex items-center gap-1.5 shadow-sm hover:border-red-200 transition-colors">
                            <Tag className="h-3 w-3 text-red-400" /> {tag.replace(/"/g, '').trim()}
                          </span>
                        )) : <span className="text-slate-400 italic text-sm">No tags found for this channel</span>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-roboto">Country Of Origin</h4>
                        <div className="flex items-center gap-2.5 text-slate-900 font-bold group">
                          <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm group-hover:border-red-100 transition-colors">
                            <Globe className="h-4 w-4 text-red-500" />
                          </div>
                          <span className="text-sm font-black">{data.country}</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-roboto">Broadcast Language</h4>
                        <div className="flex items-center gap-2.5 text-slate-900 font-bold group">
                          <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm group-hover:border-red-100 transition-colors">
                            <MessageSquare className="h-4 w-4 text-blue-500" />
                          </div>
                          <span className="text-sm font-black">{data.defaultLanguage}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-roboto">Official Channel URL</h4>
                      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-red-200 transition-colors group">
                        <a 
                          href={`https://youtube.com/${data.customUrl || (data.name.startsWith('@') ? data.name : '@' + data.name.replace(/\s+/g, ''))}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-black text-red-600 flex items-center gap-2 break-all"
                        >
                          <ExternalLink className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          youtube.com/{data.customUrl || (data.name.startsWith('@') ? data.name : '@' + data.name.replace(/\s+/g, ''))}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-roboto">About Channel (Verified Bio)</h4>
                    <div className="bg-white border border-slate-200 rounded-3xl p-8 flex-1 shadow-inner overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-slate-100 hover:border-slate-300 transition-colors">
                      <p className="text-sm text-slate-600 leading-relaxed font-roboto whitespace-pre-wrap">
                        {data.description || "The channel has not specified a description in the official YouTube About section. This record is based on API metadata retrieval."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="text-center pb-20">
                <p className="text-[11px] text-slate-400 italic max-w-2xl mx-auto mb-4">
                  Intelligence estimates are based on public channel metadata and industry benchmarks. 
                  Actual YouTube Studio revenue may vary by up to 30%. Not an official YouTube product.
                </p>
                <div className="flex items-center justify-center gap-2 opacity-30 grayscale saturate-0">
                  <Youtube className="h-5 w-5" />
                  <span className="font-bold text-[10px] uppercase tracking-widest">YouTube Data API Integrated</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

    </div>
  );
}
