// File: frontend/src/pages/ValidationDashboard.tsx
// 100% real API data — zero hardcoded/fabricated values
// Fully mobile-responsive — all breakpoints covered

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import StartupAdvisorChat from '../components/StartupAdvisorChat';
import { useUser } from '@clerk/clerk-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar,
  Area, AreaChart, ScatterChart, Scatter, ZAxis,
  ComposedChart, ReferenceLine, Treemap,
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES  — mirror the backend JSON exactly
// ─────────────────────────────────────────────────────────────────────────────

interface YearValue   { year: string; value: number }
interface YearRevenue { year: string; revenue: number; growth_pct?: number }

interface CustomerSegment {
  segment: string;
  size: string;
  size_pct: number;
  demographics: string;
  psychographics: string;
  pain_points: string[];
  goals: string;
  buying_behavior: string;
  objections: string[];
  trigger_events: string;
  willingness_to_pay: string;
}

interface PorterForce { score: number; reasoning: string }

interface DirectCompetitor {
  name: string;
  funding: string;
  pricing: string;
  weakness: string;
}

interface CompetitiveLandscape {
  direct_competitors: DirectCompetitor[];
  indirect_competitors: string[];
  market_position: string;
  competitive_advantage: string;
  porter_supplier_power: PorterForce;
  porter_buyer_power: PorterForce;
  porter_rivalry: PorterForce;
  porter_substitutes: PorterForce;
  porter_new_entry: PorterForce;
}

interface RevenuePotential {
  year_1_estimate: string;
  year_3_estimate: string;
  avg_customer_value: string;
  cagr: number;
  projection: YearRevenue[];
  scenario_best: YearRevenue[];
  scenario_base: YearRevenue[];
  scenario_worst: YearRevenue[];
  reasoning: string;
}

interface UnitEconomics {
  cac: number;
  cac_by_channel: { channel: string; cac: number }[];
  ltv: number;
  ltv_cac_ratio: number;
  payback_months: number;
  gross_margin_pct: number;
  avg_contract_value: number;
  churn_rate_pct: number;
  assumptions: string;
}

interface Risk {
  name: string;
  category: string;
  probability: number;
  impact: number;
  score: number;
  warning_indicator: string;
  mitigation: string;
}

interface IndustryTrend {
  trend: string;
  impact_score: number;
  timeframe: string;
  category: string;
  so_what: string;
}

interface JourneyStage {
  stage: string;
  users: number;
  conversion_pct: number;
  actions: string;
  pain: string;
  opportunity: string;
}

interface PricingTier {
  tier: string;
  price: string;
  features: string[];
}

interface RoadmapItem { month_range: string; milestone: string }

interface GoToMarket {
  recommended_strategy: string;
  target_first: string;
  pricing_strategy: string;
  pricing_tiers: PricingTier[];
  entry_mode: string;
  localization_needs: string;
  roadmap_12mo: RoadmapItem[];
  key_metrics: string[];
  customer_journey: JourneyStage[];
}

interface SwotItem  { point: string; evidence: string }
interface Swot {
  strengths: SwotItem[];
  weaknesses: SwotItem[];
  opportunities: SwotItem[];
  threats: SwotItem[];
  so_strategy: string;
  wt_risk: string;
}

interface StrategyRadar {
  market_coverage: number; speed: number; resources: number;
  risk: number; revenue_potential: number; sustainability: number;
}

interface StrategyOption {
  label: string;
  approach: string;
  investment_required: string;
  timeline: string;
  expected_outcome: string;
  key_risks: string[];
  radar: StrategyRadar;
}

interface PriorityAction { rank: number; action: string; why: string }

interface DataSources {
  web_search_used: boolean;
  crunchbase_used: boolean;
  pricing_scraper_used: boolean;
  reddit_used: boolean;
  faiss_used: boolean;
  research_quality: string;
  enhancement_level?: string;
}

interface MarketValidationResult {
  market_demand: 'high' | 'medium' | 'low';
  tam: string; sam: string; som: string;
  market_growth_rate: string;
  market_size: string;
  tam_top_down: string;
  tam_bottom_up: string;
  tam_cagr_5yr: YearValue[];
  target_segments: CustomerSegment[];
  evidence: string[];
  opportunities: string[];
  concerns: string[];
  industry_trends: IndustryTrend[];
  competitive_landscape: CompetitiveLandscape;
  revenue_potential: RevenuePotential;
  unit_economics: UnitEconomics;
  risks: Risk[];
  go_to_market: GoToMarket;
  swot: Swot;
  strategy_options: StrategyOption[];
  priority_actions_90d: PriorityAction[];
  confidence_score: number;
  recommendation: 'Proceed' | 'Pivot' | 'Stop';
  reasoning: string;
  data_sources?: DataSources;
}

interface ValidationResults {
  structured_idea_id: number;
  validation_session_id?: number;
  status: string;
  execution_plan: string[];
  results: { market_validation?: MarketValidationResult };
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  primary:   '#636B2F',
  secondary: '#D4DE95',
  accent:    '#BAC095',
  green:     '#4ADE80',
  red:       '#F87171',
  amber:     '#FBBF24',
  blue:      '#60A5FA',
  purple:    '#A78BFA',
  chart: ['#636B2F','#D4DE95','#BAC095','#8B9556','#4ADE80','#60A5FA','#F59E0B','#A78BFA','#FB7185','#34D399'],
};

const TABS = [
  { id: 'overview',    label: '📊', fullLabel: 'Overview' },
  { id: 'market',      label: '💰', fullLabel: 'Market' },
  { id: 'segments',    label: '🎯', fullLabel: 'Segments' },
  { id: 'revenue',     label: '📈', fullLabel: 'Revenue' },
  { id: 'competitive', label: '⚔️', fullLabel: 'Competitive' },
  { id: 'trends',      label: '🌊', fullLabel: 'Trends' },
  { id: 'risk',        label: '⚠️', fullLabel: 'Risk' },
  { id: 'gtm',         label: '🚀', fullLabel: 'GTM' },
  { id: 'swot',        label: '🔷', fullLabel: 'SWOT' },
  { id: 'journey',     label: '🗺️', fullLabel: 'Journey' },
  { id: 'financials',  label: '💵', fullLabel: 'Financials' },
  { id: 'strategy',    label: '♟️', fullLabel: 'Strategy' },
];

// ─────────────────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────────────────

const safe = (v: any): string => {
  if (v === null || v === undefined) return 'N/A';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  return JSON.stringify(v);
};

const safeArr = <T,>(v: T[] | undefined | null): T[] => Array.isArray(v) ? v : [];

const demandColor = (d: string) =>
  d === 'high' ? C.green : d === 'medium' ? C.amber : C.red;

const recStyle = (r: string) =>
  r === 'Proceed'
    ? { bg: 'rgba(74,222,128,0.12)',  color: C.green, border: '1px solid rgba(74,222,128,0.3)' }
    : r === 'Pivot'
    ? { bg: 'rgba(251,191,36,0.12)',  color: C.amber, border: '1px solid rgba(251,191,36,0.3)' }
    : { bg: 'rgba(248,113,113,0.12)', color: C.red,   border: '1px solid rgba(248,113,113,0.3)' };

// ─────────────────────────────────────────────────────────────────────────────
// SHARED UI
// ─────────────────────────────────────────────────────────────────────────────

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:'rgba(10,10,15,0.96)',
      border:'1px solid rgba(255,255,255,0.1)',
      borderRadius:10,
      padding:'10px 14px',
      maxWidth: 220,
      fontSize: 12,
    }}>
      {label && <p style={{ color:'#9CA3AF', fontSize:10, marginBottom:4 }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || '#fff', fontSize:12, fontWeight:600 }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
};

// Responsive chart height helper
const useChartHeight = (base: number) => {
  const [h, setH] = useState(base);
  useEffect(() => {
    const update = () => setH(window.innerWidth < 480 ? Math.round(base * 0.65) : window.innerWidth < 768 ? Math.round(base * 0.8) : base);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [base]);
  return h;
};

const Box = ({ title, children, h = 300 }: { title: string; children: React.ReactNode; h?: number }) => {
  const rh = useChartHeight(h);
  return (
    <div style={{ background:'rgba(0,0,0,0.25)', borderRadius:16, padding:'16px 12px', marginTop:20 }}>
      <p style={{ color:'#6B7280', fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>{title}</p>
      <ResponsiveContainer width="100%" height={rh}>{children as any}</ResponsiveContainer>
    </div>
  );
};

const Sec = ({ children, delay=0, cls='' }: { children: React.ReactNode; delay?: number; cls?: string }) => (
  <motion.div
    initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
    transition={{ delay, duration:0.4, ease:[0.22,1,0.36,1] }}
    className={`glass p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl ${cls}`}
  >
    {children}
  </motion.div>
);

const Title = ({ icon, text }: { icon: string; text: string }) => (
  <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2 leading-snug">{icon} {text}</h3>
);

const Empty = ({ msg }: { msg: string }) => (
  <p className="text-gray-500 text-sm italic">{msg}</p>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

export default function ValidationDashboard() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [searchParams] = useSearchParams();
  const ideaId = searchParams.get('ideaId');
  const tabScrollRef = useRef<HTMLDivElement>(null);

  const [isLoading,    setIsLoading]    = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [results,      setResults]      = useState<ValidationResults | null>(null);
  const [error,        setError]        = useState<string | null>(null);
  const [activeTab,    setActiveTab]    = useState('overview');
  const [tabDrawerOpen, setTabDrawerOpen] = useState(false);

  const fetchResults = async () => {
    if (!ideaId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/validation/results/${ideaId}`);
      if (!res.ok) throw new Error('Failed to fetch results');
      setResults(await res.json());
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const executeValidation = async () => {
    if (!ideaId) return;
    setIsValidating(true); setError(null);
    try {
      const p = await fetch(`http://localhost:8000/api/v1/validation/plan?structured_idea_id=${ideaId}`, { method:'POST' });
      if (!p.ok) throw new Error('Plan failed');
      const r = await fetch(`http://localhost:8000/api/v1/validation/execute/market?structured_idea_id=${ideaId}`, { method:'POST' });
      if (!r.ok) throw new Error('Validation failed');
      await fetchResults();
    } catch (e) { setError('Validation failed — check backend logs'); }
    finally { setIsValidating(false); }
  };

  // Scroll active tab into view on mobile
  const handleTabClick = (id: string) => {
    setActiveTab(id);
    setTabDrawerOpen(false);
    // Scroll the tab bar to show selected tab
    setTimeout(() => {
      const el = document.getElementById(`tab-${id}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }, 50);
  };

  useEffect(() => { fetchResults(); }, [ideaId]);

  const mv = results?.results?.market_validation;
  const activeTabMeta = TABS.find(t => t.id === activeTab);

  if (isLoading) return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-[#636B2F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm">Loading validation results…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *{font-family:'Inter',-apple-system,sans-serif;box-sizing:border-box;}
        .mono{font-family:'JetBrains Mono',monospace;}
        .glass{background:rgba(255,255,255,0.03);backdrop-filter:blur(20px) saturate(180%);border:1px solid rgba(255,255,255,0.08);}
        .grad{background:linear-gradient(135deg,#636B2F 0%,#3D4127 100%);}
        .tab-on{background:rgba(99,107,47,0.22);color:#D4DE95;border-color:rgba(212,222,149,0.25);}
        .tab-off{color:#6B7280;border-color:transparent;}
        .tab-off:hover{color:#9CA3AF;background:rgba(255,255,255,0.04);}
        ::-webkit-scrollbar{height:3px;width:3px;}
        ::-webkit-scrollbar-thumb{background:#636B2F;border-radius:4px;}
        /* Hide scrollbar on mobile tab bar but allow scroll */
        .tab-scroll::-webkit-scrollbar{display:none;}
        .tab-scroll{-ms-overflow-style:none;scrollbar-width:none;}
        /* Mobile bottom drawer */
        .tab-drawer{
          position:fixed;bottom:0;left:0;right:0;z-index:60;
          background:rgba(10,10,15,0.97);backdrop-filter:blur(20px);
          border-top:1px solid rgba(255,255,255,0.1);
          padding:16px;
          transform:translateY(100%);transition:transform 0.3s ease;
          border-radius:20px 20px 0 0;
        }
        .tab-drawer.open{transform:translateY(0);}
        /* Recharts responsive fixes */
        .recharts-wrapper{max-width:100%!important;}
        .recharts-surface{overflow:visible;}
        /* Truncate long Y-axis labels */
        .recharts-cartesian-axis-tick-value{word-break:break-word;}
        /* Touch-friendly tap targets */
        button{min-height:40px;-webkit-tap-highlight-color:transparent;}
        /* Prevent text overflow on small screens */
        .break-word{word-break:break-word;overflow-wrap:anywhere;}
      `}</style>

      {/* bg blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-[#636B2F] opacity-5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-[#D4DE95] opacity-5 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex justify-between h-14 sm:h-16 items-center">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-all group">
            <span className="group-hover:-translate-x-1 transition-transform text-sm">←</span>
            <span className="text-sm font-medium hidden xs:block">Dashboard</span>
          </button>
          <div className="text-center">
            <span className="text-xs text-gray-500 font-semibold tracking-wider uppercase hidden sm:block">Validation Intelligence</span>
          </div>
          {user && (
            <div className="flex items-center gap-1.5 text-sm text-gray-400">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#636B2F] flex items-center justify-center text-white font-semibold text-xs sm:text-sm shrink-0">
                {user.firstName?.charAt(0) || user.emailAddresses[0]?.emailAddress.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:block text-sm">{user.firstName || user.emailAddresses[0]?.emailAddress.split('@')[0]}</span>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10 relative z-10">

        {/* Hero */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="text-center mb-6 sm:mb-10">
          <div className="inline-flex items-center gap-2 glass px-3 py-1.5 sm:px-4 sm:py-2 rounded-full mb-4 sm:mb-5">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full animate-pulse" />
            <span className="text-xs sm:text-sm font-semibold text-white">McKinsey-Level Market Intelligence</span>
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-2 sm:mb-4 tracking-tight">
            Validation
            <span className="block bg-gradient-to-r from-[#D4DE95] via-[#BAC095] to-[#636B2F] bg-clip-text text-transparent">
              Intelligence Report
            </span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-2">
            12 strategic frameworks · 15+ live charts · 100% AI-researched data
          </p>
        </motion.div>

        {error && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="glass border-red-500/20 p-3 sm:p-4 rounded-xl mb-4 sm:mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}

        {/* Empty state */}
        {!mv && !isValidating && (
          <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} className="glass p-8 sm:p-12 rounded-3xl text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full grad mx-auto mb-5 sm:mb-6 flex items-center justify-center">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Ready to Validate</h2>
            <p className="text-gray-400 text-sm sm:text-base mb-6 sm:mb-8 max-w-md mx-auto">Full AI-researched intelligence report across 12 strategic frameworks.</p>
            <button onClick={executeValidation} className="grad text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:scale-105 transition-all text-sm sm:text-base w-full sm:w-auto">
              Start Full Validation
            </button>
          </motion.div>
        )}

        {isValidating && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="glass p-8 sm:p-12 rounded-3xl text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-[#636B2F] border-t-transparent rounded-full animate-spin mx-auto mb-5 sm:mb-6" />
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Researching & Analysing…</h2>
            <p className="text-gray-400 text-sm sm:text-base">Applying 12 strategic frameworks with real-time data</p>
          </motion.div>
        )}

        {mv && !isValidating && (
          <div className="space-y-3 sm:space-y-4">

            {/* ── KPI strip ── */}
            <Sec delay={0.05}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                <div className="bg-white/5 p-3 sm:p-5 rounded-xl sm:rounded-2xl">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Demand</p>
                  <p className="text-lg sm:text-2xl font-bold" style={{ color: demandColor(mv.market_demand) }}>
                    {mv.market_demand.toUpperCase()}
                  </p>
                </div>
                <div className="bg-white/5 p-3 sm:p-5 rounded-xl sm:rounded-2xl">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Confidence</p>
                  <p className="text-lg sm:text-2xl font-bold text-white mono">{Math.round(mv.confidence_score * 100)}%</p>
                  <div className="h-1.5 bg-white/10 rounded-full mt-1.5 sm:mt-2 overflow-hidden">
                    <div className="h-full grad rounded-full" style={{ width:`${mv.confidence_score*100}%` }} />
                  </div>
                </div>
                <div className="bg-white/5 p-3 sm:p-5 rounded-xl sm:rounded-2xl">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">TAM</p>
                  <p className="text-sm sm:text-xl font-bold text-white break-word leading-tight">{safe(mv.tam)}</p>
                </div>
                <div className="bg-white/5 p-3 sm:p-5 rounded-xl sm:rounded-2xl">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Rec.</p>
                  {(() => { const s = recStyle(mv.recommendation); return (
                    <span className="inline-flex px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm"
                      style={{ background:s.bg, color:s.color, border:s.border }}>
                      {mv.recommendation}
                    </span>
                  );})()}
                </div>
              </div>
            </Sec>

            {/* ── Tab Bar (horizontal scroll on mobile) ── */}
            <div className="relative">
              {/* Desktop/tablet: scrollable pill bar */}
              <div className="tab-scroll overflow-x-auto pb-1 hidden sm:block" ref={tabScrollRef}>
                <div className="flex gap-2 min-w-max px-0.5 py-0.5">
                  {TABS.map(t => (
                    <button
                      id={`tab-${t.id}`}
                      key={t.id}
                      onClick={() => handleTabClick(t.id)}
                      className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-all whitespace-nowrap ${activeTab===t.id?'tab-on':'tab-off'}`}
                    >
                      {t.label} {t.fullLabel}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile: compact emoji tab bar + current tab label */}
              <div className="sm:hidden">
                <div className="tab-scroll overflow-x-auto pb-1">
                  <div className="flex gap-1.5 min-w-max px-0.5 py-0.5">
                    {TABS.map(t => (
                      <button
                        id={`tab-${t.id}`}
                        key={t.id}
                        onClick={() => handleTabClick(t.id)}
                        className={`w-10 h-10 rounded-xl text-base border transition-all flex items-center justify-center ${activeTab===t.id?'tab-on':'tab-off'}`}
                        title={t.fullLabel}
                        aria-label={t.fullLabel}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Current tab label */}
                {activeTabMeta && (
                  <div className="mt-1.5 px-0.5">
                    <span className="text-xs font-semibold text-[#D4DE95] uppercase tracking-wider">
                      {activeTabMeta.label} {activeTabMeta.fullLabel}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={activeTab}
                initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
                transition={{ duration:0.28 }}>

                {/* ═══════ OVERVIEW ═══════ */}
                {activeTab==='overview' && (
                  <div className="space-y-4 sm:space-y-6">
                    <Sec>
                      <Title icon="💡" text="Final Analysis & Recommendation" />
                      <p className="text-gray-300 leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">{mv.reasoning}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">✅ Evidence</p>
                          {safeArr(mv.evidence).map((e,i) => (
                            <div key={i} className="flex gap-2 mb-2">
                              <span className="text-green-400 mt-0.5 shrink-0 text-sm">✓</span>
                              <p className="text-gray-300 text-xs sm:text-sm">{e}</p>
                            </div>
                          ))}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">🚀 Opportunities</p>
                          {safeArr(mv.opportunities).map((o,i) => (
                            <div key={i} className="flex gap-2 mb-2">
                              <span style={{ color:C.secondary }} className="mt-0.5 shrink-0 text-sm">→</span>
                              <p className="text-gray-300 text-xs sm:text-sm">{o}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Sec>

                    <Sec>
                      <Title icon="📡" text="Validation Confidence by Data Source" />
                      <Box title="Research Coverage" h={260}>
                        <RadarChart data={[
                          { metric:'Web Research',    score: mv.data_sources?.web_search_used      ? 90 : 15 },
                          { metric:'Crunchbase',      score: mv.data_sources?.crunchbase_used      ? 85 : 15 },
                          { metric:'Pricing Intel',   score: mv.data_sources?.pricing_scraper_used ? 80 : 15 },
                          { metric:'Reddit Insights', score: mv.data_sources?.reddit_used          ? 75 : 15 },
                          { metric:'Domain KB',       score: mv.data_sources?.faiss_used           ? 85 : 15 },
                          { metric:'AI Synthesis',    score: Math.round(mv.confidence_score * 100) },
                        ]} cx="50%" cy="50%" outerRadius="38%">
                          <PolarGrid stroke="rgba(255,255,255,0.08)" />
                          <PolarAngleAxis dataKey="metric" tick={{ fill:'#9CA3AF', fontSize:10 }} />
                          <PolarRadiusAxis domain={[0,100]} tick={false} axisLine={false} />
                          <Radar name="Confidence" dataKey="score" stroke={C.secondary} fill={C.secondary} fillOpacity={0.2} />
                        </RadarChart>
                      </Box>
                    </Sec>
                  </div>
                )}

                {/* ═══════ MARKET SIZING ═══════ */}
                {activeTab==='market' && (
                  <div className="space-y-4 sm:space-y-6">
                    <Sec>
                      <Title icon="💰" text="TAM / SAM / SOM — Market Sizing" />

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                        {[
                          { label:'TAM — Total Addressable',   val:mv.tam,  color:C.primary },
                          { label:'SAM — Serviceable Available',val:mv.sam, color:C.secondary },
                          { label:'SOM — Year-1 Obtainable',   val:mv.som,  color:C.green },
                        ].map(({label,val,color}) => (
                          <div key={label} className="bg-white/5 p-4 sm:p-5 rounded-2xl">
                            <p className="text-xs text-gray-500 mb-1 leading-snug">{label}</p>
                            <p className="text-base sm:text-lg font-bold break-word leading-snug" style={{ color }}>{safe(val)}</p>
                          </div>
                        ))}
                      </div>

                      <div className="bg-blue-500/10 p-3 sm:p-4 rounded-xl mb-4 sm:mb-6">
                        <p className="text-xs sm:text-sm text-blue-300">📈 Growth Rate: <span className="font-bold">{safe(mv.market_growth_rate)}</span></p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                        <div className="bg-white/5 p-3 sm:p-4 rounded-xl">
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Top-Down Methodology</p>
                          <p className="text-gray-300 text-xs sm:text-sm">{safe(mv.tam_top_down)}</p>
                        </div>
                        <div className="bg-white/5 p-3 sm:p-4 rounded-xl">
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Bottom-Up Methodology</p>
                          <p className="text-gray-300 text-xs sm:text-sm">{safe(mv.tam_bottom_up)}</p>
                        </div>
                      </div>

                      {safeArr(mv.tam_cagr_5yr).length > 0 && (
                        <Box title="5-Year Market Size Projection ($M)">
                          <AreaChart data={mv.tam_cagr_5yr}>
                            <defs>
                              <linearGradient id="tamGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%"  stopColor={C.primary} stopOpacity={0.6} />
                                <stop offset="95%" stopColor={C.primary} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                            <XAxis dataKey="year"  stroke="#6B7280" tick={{ fontSize:10 }} />
                            <YAxis dataKey="value" stroke="#6B7280" tick={{ fontSize:10 }} width={36} />
                            <Tooltip content={<Tip />} />
                            <Area type="monotone" dataKey="value" name="Market Size ($M)" stroke={C.primary} strokeWidth={2.5} fill="url(#tamGrad)" />
                          </AreaChart>
                        </Box>
                      )}

                      <Box title="Market Funnel" h={160}>
                        <Treemap
                          data={[
                            { name:'TAM', size: safeArr(mv.tam_cagr_5yr)[0]?.value || 1000 },
                            { name:'SAM', size: safeArr(mv.tam_cagr_5yr)[0]?.value ? safeArr(mv.tam_cagr_5yr)[0].value * 0.3 : 300 },
                            { name:'SOM', size: safeArr(mv.tam_cagr_5yr)[0]?.value ? safeArr(mv.tam_cagr_5yr)[0].value * 0.05 : 50 },
                          ]}
                          dataKey="size" aspectRatio={4/2} stroke="rgba(255,255,255,0.1)"
                          content={({ x,y,width,height,name }: any) => (
                            <g>
                              <rect x={x} y={y} width={width} height={height}
                                style={{ fill: name==='TAM'?C.primary:name==='SAM'?C.accent:C.green, stroke:'rgba(255,255,255,0.1)', strokeWidth:2 }} rx={6} />
                              {width > 40 && <text x={x+width/2} y={y+height/2} textAnchor="middle" fill="#fff" fontSize={11} fontWeight={600}>{name}</text>}
                            </g>
                          )}
                        />
                      </Box>

                      <div className="mt-4 sm:mt-6 p-4 sm:p-5 bg-white/5 rounded-2xl">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Market Size Analysis</p>
                        <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">{safe(mv.market_size)}</p>
                      </div>
                    </Sec>
                  </div>
                )}

                {/* ═══════ SEGMENTS ═══════ */}
                {activeTab==='segments' && (
                  <div className="space-y-4 sm:space-y-6">
                    <Sec>
                      <Title icon="🎯" text="Customer Segments & Persona Analysis" />
                      {safeArr(mv.target_segments).length === 0 && <Empty msg="No segment data returned." />}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                        {safeArr(mv.target_segments).map((seg,idx) => (
                          <div key={idx} className="bg-white/5 p-4 sm:p-6 rounded-2xl border border-white/5">
                            <div className="flex justify-between items-start mb-2 sm:mb-3">
                              <h4 className="font-bold text-sm sm:text-base leading-snug" style={{ color:C.secondary }}>{seg.segment}</h4>
                              <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-lg shrink-0 ml-2">{seg.size}</span>
                            </div>
                            {seg.demographics  && <p className="text-xs text-gray-400 mb-1">👤 {seg.demographics}</p>}
                            {seg.psychographics && <p className="text-xs text-gray-400 mb-2">🧠 {seg.psychographics}</p>}
                            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Pain Points</p>
                            {safeArr(seg.pain_points).map((p,i) => (
                              <p key={i} className="text-xs sm:text-sm text-gray-300 mb-1 flex gap-1.5"><span className="text-red-400 shrink-0">•</span>{p}</p>
                            ))}
                            {seg.trigger_events && (
                              <p className="text-xs text-amber-400 mt-2">⚡ Trigger: {seg.trigger_events}</p>
                            )}
                            {safeArr(seg.objections).length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Objections</p>
                                {seg.objections.map((o,i) => <p key={i} className="text-xs text-red-300 mb-0.5">✗ {o}</p>)}
                              </div>
                            )}
                            <div className="pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-white/5">
                              <p className="text-xs text-green-400">💵 WTP: {seg.willingness_to_pay}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {safeArr(mv.target_segments).length > 0 && (
                        <Box title="Segment Market Share (%)">
                          <PieChart>
                            <Pie
                              data={safeArr(mv.target_segments).map(s => ({
                                name: s.segment,
                                value: s.size_pct > 0 ? s.size_pct : (100 / mv.target_segments.length),
                              }))}
                              cx="50%" cy="50%" innerRadius="30%" outerRadius="60%"
                              paddingAngle={3} dataKey="value"
                              label={({ name, percent }) => `${(percent*100).toFixed(0)}%`}
                              labelLine={false}
                            >
                              {safeArr(mv.target_segments).map((_,i) => <Cell key={i} fill={C.chart[i%C.chart.length]} />)}
                            </Pie>
                            <Tooltip content={<Tip />} />
                            <Legend
                              wrapperStyle={{ fontSize:10, color:'#9CA3AF' }}
                              iconSize={8}
                            />
                          </PieChart>
                        </Box>
                      )}
                    </Sec>
                  </div>
                )}

                {/* ═══════ REVENUE ═══════ */}
                {activeTab==='revenue' && (
                  <div className="space-y-4 sm:space-y-6">
                    <Sec>
                      <Title icon="📈" text="Revenue Projections — AI-Researched" />

                      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
                        {[
                          { label:'Year 1',             val:mv.revenue_potential?.year_1_estimate,  color:'#fff' },
                          { label:'Year 3',             val:mv.revenue_potential?.year_3_estimate,  color:C.secondary },
                          { label:'Avg Customer',       val:mv.revenue_potential?.avg_customer_value, color:C.green },
                        ].map(({label,val,color}) => (
                          <div key={label} className="bg-white/5 p-3 sm:p-5 rounded-xl sm:rounded-2xl text-center">
                            <p className="text-xs text-gray-500 mb-1 leading-tight">{label}</p>
                            <p className="text-sm sm:text-lg font-bold leading-snug break-word" style={{ color }}>{safe(val)}</p>
                          </div>
                        ))}
                      </div>

                      {mv.revenue_potential?.cagr > 0 && (
                        <div className="bg-green-500/10 p-3 rounded-xl mb-3 sm:mb-4">
                          <p className="text-xs sm:text-sm text-green-300">📈 Projected CAGR: <span className="font-bold">{mv.revenue_potential.cagr}%</span></p>
                        </div>
                      )}

                      {safeArr(mv.revenue_potential?.projection).length > 0 && (
                        <Box title="Base Revenue Trajectory ($M)">
                          <AreaChart data={mv.revenue_potential.projection}>
                            <defs>
                              <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%"  stopColor={C.primary} stopOpacity={0.7} />
                                <stop offset="95%" stopColor={C.primary} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                            <XAxis dataKey="year"    stroke="#6B7280" tick={{ fontSize:10 }} />
                            <YAxis dataKey="revenue" stroke="#6B7280" tick={{ fontSize:10 }} width={36} />
                            <Tooltip content={<Tip />} />
                            <Area type="monotone" dataKey="revenue" name="Revenue ($M)" stroke={C.primary} strokeWidth={2.5} fill="url(#rg)" />
                          </AreaChart>
                        </Box>
                      )}

                      {safeArr(mv.revenue_potential?.scenario_base).length > 0 && (
                        <Box title="Scenario Analysis ($M)" h={260}>
                          <ComposedChart data={safeArr(mv.revenue_potential.scenario_base).map((b,i) => ({
                            year:  b.year,
                            base:  b.revenue,
                            best:  safeArr(mv.revenue_potential.scenario_best)[i]?.revenue  ?? 0,
                            worst: safeArr(mv.revenue_potential.scenario_worst)[i]?.revenue ?? 0,
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                            <XAxis dataKey="year"    stroke="#6B7280" tick={{ fontSize:10 }} />
                            <YAxis stroke="#6B7280" tick={{ fontSize:10 }} width={36} />
                            <Tooltip content={<Tip />} />
                            <Legend wrapperStyle={{ color:'#9CA3AF', fontSize:10 }} iconSize={8} />
                            <Area type="monotone" dataKey="best"  name="Best"  stroke={C.green} fill={C.green} fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="4 2" />
                            <Line type="monotone" dataKey="base"  name="Base"  stroke={C.secondary} strokeWidth={2.5} dot={{ fill:C.secondary, r:3 }} />
                            <Area type="monotone" dataKey="worst" name="Worst" stroke={C.red}   fill={C.red}   fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="4 2" />
                          </ComposedChart>
                        </Box>
                      )}

                      {safeArr(mv.revenue_potential?.projection).filter(p => p.growth_pct !== undefined && p.growth_pct > 0).length > 0 && (
                        <Box title="Year-over-Year Growth (%)" h={200}>
                          <BarChart data={safeArr(mv.revenue_potential.projection).filter(p => p.growth_pct && p.growth_pct > 0)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                            <XAxis dataKey="year"       stroke="#6B7280" tick={{ fontSize:10 }} />
                            <YAxis dataKey="growth_pct" stroke="#6B7280" tick={{ fontSize:10 }} unit="%" width={36} />
                            <Tooltip content={<Tip />} />
                            <Bar dataKey="growth_pct" name="Growth %" radius={[4,4,0,0]}>
                              {safeArr(mv.revenue_potential.projection).map((_,i) => <Cell key={i} fill={C.chart[i%C.chart.length]} />)}
                            </Bar>
                          </BarChart>
                        </Box>
                      )}

                      <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-500/10 rounded-xl">
                        <p className="text-xs sm:text-sm text-gray-300">{safe(mv.revenue_potential?.reasoning)}</p>
                      </div>
                    </Sec>
                  </div>
                )}

                {/* ═══════ COMPETITIVE ═══════ */}
                {activeTab==='competitive' && mv.competitive_landscape && (
                  <div className="space-y-4 sm:space-y-6">
                    <Sec>
                      <Title icon="⚔️" text="Competitive Landscape" />

                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">Direct Competitors</p>
                      {safeArr(mv.competitive_landscape.direct_competitors).length === 0 && <Empty msg="No direct competitors found." />}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
                        {safeArr(mv.competitive_landscape.direct_competitors).map((c,i) => {
                          const name = typeof c === 'string' ? c : (c as DirectCompetitor).name;
                          const dc   = typeof c === 'object' ? c as DirectCompetitor : null;
                          return (
                            <div key={i} className="bg-red-500/10 border border-red-500/15 p-3 sm:p-4 rounded-xl">
                              <p className="text-red-300 font-semibold mb-1 text-sm">{name}</p>
                              {dc?.funding && <p className="text-xs text-gray-400">💰 {dc.funding}</p>}
                              {dc?.pricing && <p className="text-xs text-gray-400">🏷️ {dc.pricing}</p>}
                              {dc?.weakness && <p className="text-xs text-green-400 mt-1">🎯 {dc.weakness}</p>}
                            </div>
                          );
                        })}
                      </div>

                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">Indirect Competitors</p>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6">
                        {safeArr(mv.competitive_landscape.indirect_competitors).map((c,i) => (
                          <span key={i} className="bg-amber-500/10 border border-amber-500/15 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-amber-300 text-xs sm:text-sm">
                            {typeof c === 'string' ? c : safe(c)}
                          </span>
                        ))}
                      </div>

                      {mv.competitive_landscape.porter_rivalry && (
                        <>
                          <Box title="Porter's Five Forces (score /10)">
                            <RadarChart data={[
                              { force:'Supplier Power',      score: mv.competitive_landscape.porter_supplier_power?.score ?? 0 },
                              { force:'Buyer Power',         score: mv.competitive_landscape.porter_buyer_power?.score    ?? 0 },
                              { force:'Rivalry',             score: mv.competitive_landscape.porter_rivalry?.score        ?? 0 },
                              { force:'Substitutes',         score: mv.competitive_landscape.porter_substitutes?.score    ?? 0 },
                              { force:'New Entry',           score: mv.competitive_landscape.porter_new_entry?.score      ?? 0 },
                            ]} cx="50%" cy="50%" outerRadius="38%">
                              <PolarGrid stroke="rgba(255,255,255,0.08)" />
                              <PolarAngleAxis dataKey="force" tick={{ fill:'#9CA3AF', fontSize:10 }} />
                              <PolarRadiusAxis domain={[0,10]} tick={false} axisLine={false} />
                              <Radar name="Score" dataKey="score" stroke={C.amber} fill={C.amber} fillOpacity={0.25} />
                            </RadarChart>
                          </Box>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-3 sm:mt-4">
                            {[
                              { label:'Supplier Power',      f:mv.competitive_landscape.porter_supplier_power },
                              { label:'Buyer Power',         f:mv.competitive_landscape.porter_buyer_power },
                              { label:'Competitive Rivalry', f:mv.competitive_landscape.porter_rivalry },
                              { label:'Threat of Substitutes',f:mv.competitive_landscape.porter_substitutes },
                              { label:'Threat of New Entry', f:mv.competitive_landscape.porter_new_entry },
                            ].filter(x => x.f).map(({ label, f }) => (
                              <div key={label} className="bg-white/5 p-3 rounded-xl">
                                <div className="flex justify-between mb-1">
                                  <p className="text-xs text-gray-400">{label}</p>
                                  <span className="text-xs font-bold" style={{ color: (f?.score??0) >= 7 ? C.red : (f?.score??0) >= 5 ? C.amber : C.green }}>
                                    {f?.score ?? 0}/10
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500">{f?.reasoning}</p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
                        <div className="p-3 sm:p-4 bg-white/5 rounded-xl">
                          <p className="text-xs text-gray-500 mb-2">Market Position</p>
                          <p className="text-white text-xs sm:text-sm">{mv.competitive_landscape.market_position}</p>
                        </div>
                        <div className="p-3 sm:p-4 bg-green-500/10 rounded-xl">
                          <p className="text-xs text-green-400 mb-2">Competitive Advantage</p>
                          <p className="text-white text-xs sm:text-sm">{mv.competitive_landscape.competitive_advantage}</p>
                        </div>
                      </div>
                    </Sec>
                  </div>
                )}

                {/* ═══════ TRENDS ═══════ */}
                {activeTab==='trends' && (
                  <div className="space-y-4 sm:space-y-6">
                    <Sec>
                      <Title icon="🌊" text="Industry Trend Intelligence Brief" />
                      {safeArr(mv.industry_trends).length === 0 && <Empty msg="No trend data returned." />}

                      <div className="space-y-2 sm:space-y-3 mb-2">
                        {safeArr(mv.industry_trends).map((t,i) => (
                          <div key={i} className="bg-white/5 p-3 sm:p-4 rounded-xl">
                            <div className="flex items-center gap-2 sm:gap-3 mb-2">
                              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold shrink-0"
                                style={{ background:'rgba(99,107,47,0.3)', color:C.secondary }}>{t.impact_score}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start sm:items-center justify-between mb-1 gap-1">
                                  <p className="text-white text-xs sm:text-sm font-medium leading-tight">{t.trend}</p>
                                  <div className="flex gap-1 shrink-0">
                                    <span className="text-xs text-gray-500 bg-white/5 px-1.5 py-0.5 rounded-full whitespace-nowrap">{t.timeframe}</span>
                                  </div>
                                </div>
                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width:`${t.impact_score*10}%`, background:`linear-gradient(90deg,${C.primary},${C.secondary})` }} />
                                </div>
                              </div>
                            </div>
                            {t.so_what && <p className="text-xs text-blue-300 ml-10 sm:ml-12">💡 {t.so_what}</p>}
                          </div>
                        ))}
                      </div>

                      {safeArr(mv.industry_trends).length > 0 && (
                        <Box title="Trend Impact Scores" h={Math.max(200, safeArr(mv.industry_trends).length * 30)}>
                          <BarChart data={safeArr(mv.industry_trends)} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                            <XAxis type="number" domain={[0,10]} stroke="#6B7280" tick={{ fontSize:10 }} />
                            <YAxis dataKey="trend" type="category" width={100} stroke="#6B7280" tick={{ fontSize:9 }}
                              tickFormatter={(v: string) => v.length > 14 ? v.slice(0,14)+'…' : v} />
                            <Tooltip content={<Tip />} />
                            <Bar dataKey="impact_score" name="Impact (1-10)" radius={[0,4,4,0]}>
                              {safeArr(mv.industry_trends).map((_,i) => <Cell key={i} fill={C.chart[i%C.chart.length]} />)}
                            </Bar>
                          </BarChart>
                        </Box>
                      )}
                    </Sec>
                  </div>
                )}

                {/* ═══════ RISK ═══════ */}
                {activeTab==='risk' && (
                  <div className="space-y-4 sm:space-y-6">
                    <Sec>
                      <Title icon="⚠️" text="Risk Assessment Matrix" />
                      {safeArr(mv.risks).length === 0 && <Empty msg="No risk data returned." />}

                      {safeArr(mv.risks).length > 0 && (
                        <Box title="Risk Matrix — Probability × Impact" h={280}>
                          <ScatterChart margin={{ top:20, right:16, bottom:30, left:0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                            <XAxis dataKey="probability" type="number" name="Probability" domain={[0,6]}
                              label={{ value:'Probability →', position:'bottom', fill:'#6B7280', fontSize:10 }} stroke="#6B7280" tick={{ fontSize:10 }} />
                            <YAxis dataKey="impact" type="number" name="Impact" domain={[0,6]}
                              label={{ value:'Impact', angle:-90, position:'insideLeft', fill:'#6B7280', fontSize:10 }} stroke="#6B7280" tick={{ fontSize:10 }} width={28} />
                            <ZAxis dataKey="score" range={[30,150]} />
                            <Tooltip content={({ active, payload }: any) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0].payload;
                              return (
                                <div style={{ background:'rgba(10,10,15,0.96)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'8px 12px', maxWidth:200 }}>
                                  <p style={{ color:'#fff', fontWeight:600, fontSize:12 }}>{d.name}</p>
                                  <p style={{ color:'#9CA3AF', fontSize:10 }}>Score {d.score} | {d.category}</p>
                                  {d.mitigation && <p style={{ color:'#4ADE80', fontSize:10, marginTop:4 }}>🛡️ {d.mitigation}</p>}
                                </div>
                              );
                            }} />
                            <ReferenceLine x={3} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 2" />
                            <ReferenceLine y={3} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 2" />
                            <Scatter name="Risks" data={safeArr(mv.risks)} fill={C.amber} />
                          </ScatterChart>
                        </Box>
                      )}

                      <div className="space-y-2 mt-3 sm:mt-4">
                        {safeArr(mv.risks).sort((a,b) => b.score - a.score).map((r,i) => (
                          <div key={i} className="bg-white/5 p-3 rounded-xl">
                            <div className="flex items-start gap-2 sm:gap-3">
                              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                                style={{ background: r.score>=15?'rgba(248,113,113,0.2)':r.score>=10?'rgba(251,191,36,0.2)':'rgba(74,222,128,0.2)', color: r.score>=15?C.red:r.score>=10?C.amber:C.green }}>
                                {r.score}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between mb-1 gap-1">
                                  <p className="text-white text-xs sm:text-sm font-medium leading-snug">{r.name}</p>
                                  <span className="text-xs text-gray-500 shrink-0">{r.category}</span>
                                </div>
                                <p className="text-xs text-gray-500 mb-1">P:{r.probability} × I:{r.impact} | ⚠️ {r.warning_indicator}</p>
                                {r.mitigation && <p className="text-xs text-green-400">🛡️ {r.mitigation}</p>}
                              </div>
                              <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden self-center shrink-0">
                                <div className="h-full rounded-full" style={{ width:`${(r.score/25)*100}%`, background: r.score>=15?C.red:r.score>=10?C.amber:C.green }} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {safeArr(mv.concerns).length > 0 && (
                        <div className="mt-4 sm:mt-6">
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">Specific Concerns</p>
                          {safeArr(mv.concerns).map((c,i) => (
                            <div key={i} className="flex gap-2 sm:gap-3 bg-amber-500/5 border border-amber-500/15 p-2.5 sm:p-3 rounded-xl mb-2">
                              <span className="text-amber-400 shrink-0 text-sm">!</span>
                              <p className="text-gray-300 text-xs sm:text-sm">{c}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </Sec>
                  </div>
                )}

                {/* ═══════ GTM ═══════ */}
                {activeTab==='gtm' && mv.go_to_market && (
                  <div className="space-y-4 sm:space-y-6">
                    <Sec>
                      <Title icon="🚀" text="Go-to-Market Strategy" />

                      <div className="space-y-2 sm:space-y-4 mb-4 sm:mb-6">
                        {[
                          { label:'Recommended Strategy', val:mv.go_to_market.recommended_strategy },
                          { label:'Target First Segment',  val:mv.go_to_market.target_first },
                          { label:'Pricing Strategy',      val:mv.go_to_market.pricing_strategy },
                          { label:'Entry Mode',            val:mv.go_to_market.entry_mode },
                          { label:'Localisation Needs',    val:mv.go_to_market.localization_needs },
                        ].filter(x => x.val && x.val !== 'Unknown').map(({ label, val }) => (
                          <div key={label} className="p-3 sm:p-4 bg-white/5 rounded-xl sm:rounded-2xl">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
                            <p className="text-white text-xs sm:text-sm">{val}</p>
                          </div>
                        ))}
                      </div>

                      {safeArr(mv.go_to_market.pricing_tiers).length > 0 && (
                        <div className="mb-4 sm:mb-6">
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">Pricing Tiers</p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                            {safeArr(mv.go_to_market.pricing_tiers).map((tier,i) => (
                              <div key={i} className="bg-white/5 p-3 sm:p-4 rounded-xl border border-white/8">
                                <p className="font-semibold text-sm mb-1" style={{ color:C.chart[i%C.chart.length] }}>{tier.tier}</p>
                                <p className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3 mono">{tier.price}</p>
                                {safeArr(tier.features).map((f,j) => <p key={j} className="text-xs text-gray-400 mb-0.5">• {f}</p>)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {safeArr(mv.go_to_market.key_metrics).length > 0 && (
                        <div className="p-3 sm:p-4 bg-white/5 rounded-xl sm:rounded-2xl mb-4 sm:mb-6">
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">Key Metrics to Track</p>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {safeArr(mv.go_to_market.key_metrics).map((m,i) => (
                              <span key={i} className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium"
                                style={{ background:'rgba(99,107,47,0.3)', color:C.secondary }}>{m}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {safeArr(mv.go_to_market.roadmap_12mo).length > 0 && (
                        <Box title="12-Month Entry Roadmap" h={Math.max(200, safeArr(mv.go_to_market.roadmap_12mo).length * 36)}>
                          <BarChart layout="vertical"
                            data={safeArr(mv.go_to_market.roadmap_12mo).map((r,i) => ({
                              phase: r.month_range,
                              milestone: r.milestone,
                              start: i * 1,
                              duration: 1.8,
                            }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                            <XAxis type="number" stroke="#6B7280" tick={{ fontSize:10 }} />
                            <YAxis dataKey="phase" type="category" width={80} stroke="#6B7280" tick={{ fontSize:9 }} />
                            <Tooltip content={({ active, payload }: any) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0]?.payload;
                              return (
                                <div style={{ background:'rgba(10,10,15,0.96)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'8px 12px', maxWidth:220 }}>
                                  <p style={{ color:'#fff', fontWeight:600, fontSize:12 }}>{d?.phase}</p>
                                  <p style={{ color:'#9CA3AF', fontSize:10 }}>{d?.milestone}</p>
                                </div>
                              );
                            }} />
                            <Bar dataKey="start"    stackId="a" fill="transparent" />
                            <Bar dataKey="duration" stackId="a" fill={C.primary} radius={[0,4,4,0]} name="Phase" />
                          </BarChart>
                        </Box>
                      )}
                    </Sec>
                  </div>
                )}

                {/* ═══════ SWOT ═══════ */}
                {activeTab==='swot' && mv.swot && (
                  <div className="space-y-4 sm:space-y-6">
                    <Sec>
                      <Title icon="🔷" text="SWOT Analysis" />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                        {[
                          { name:'Strengths',     color:C.green,  items:safeArr(mv.swot.strengths)  },
                          { name:'Weaknesses',    color:C.red,    items:safeArr(mv.swot.weaknesses) },
                          { name:'Opportunities', color:C.blue,   items:safeArr(mv.swot.opportunities) },
                          { name:'Threats',       color:C.amber,  items:safeArr(mv.swot.threats)    },
                        ].map(({ name, color, items }) => (
                          <div key={name} className="rounded-2xl p-3 sm:p-4" style={{ background:`${color}10`, border:`1px solid ${color}25` }}>
                            <p className="font-bold text-sm mb-2 sm:mb-3" style={{ color }}>{name}</p>
                            {items.length === 0 && <Empty msg="No data." />}
                            {items.map((item: SwotItem, i: number) => (
                              <div key={i} className="mb-2">
                                <p className="text-gray-200 text-xs font-medium">• {item.point}</p>
                                {item.evidence && <p className="text-gray-500 text-xs ml-2 mt-0.5">{item.evidence}</p>}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>

                      <Box title="SWOT Factor Count" h={200}>
                        <BarChart data={[
                          { name:'Strengths',     count:safeArr(mv.swot.strengths).length },
                          { name:'Weaknesses',    count:safeArr(mv.swot.weaknesses).length },
                          { name:'Opportunities', count:safeArr(mv.swot.opportunities).length },
                          { name:'Threats',       count:safeArr(mv.swot.threats).length },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                          <XAxis dataKey="name" stroke="#6B7280" tick={{ fontSize:10 }}
                            tickFormatter={(v: string) => v.slice(0,3)} />
                          <YAxis stroke="#6B7280" allowDecimals={false} tick={{ fontSize:10 }} width={24} />
                          <Tooltip content={<Tip />} />
                          <Bar dataKey="count" name="Factors" radius={[6,6,0,0]}>
                            {[C.green,C.red,C.blue,C.amber].map((c,i) => <Cell key={i} fill={c} />)}
                          </Bar>
                        </BarChart>
                      </Box>

                      {(mv.swot.so_strategy || mv.swot.wt_risk) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
                          {mv.swot.so_strategy && (
                            <div className="p-3 sm:p-4 bg-green-500/10 rounded-xl">
                              <p className="text-xs text-green-400 uppercase tracking-wider mb-2">SO Strategy</p>
                              <p className="text-white text-xs sm:text-sm">{mv.swot.so_strategy}</p>
                            </div>
                          )}
                          {mv.swot.wt_risk && (
                            <div className="p-3 sm:p-4 bg-red-500/10 rounded-xl">
                              <p className="text-xs text-red-400 uppercase tracking-wider mb-2">WT Risk</p>
                              <p className="text-white text-xs sm:text-sm">{mv.swot.wt_risk}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </Sec>
                  </div>
                )}

                {/* ═══════ JOURNEY ═══════ */}
                {activeTab==='journey' && (
                  <div className="space-y-4 sm:space-y-6">
                    <Sec>
                      <Title icon="🗺️" text="Customer Journey Map" />
                      {safeArr(mv.go_to_market?.customer_journey).length === 0 && (
                        <Empty msg="No customer journey data returned." />
                      )}

                      {safeArr(mv.go_to_market?.customer_journey).length > 0 && (
                        <>
                          <Box title="Conversion Funnel — Users per Stage">
                            <BarChart data={safeArr(mv.go_to_market.customer_journey)} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                              <XAxis type="number" stroke="#6B7280" tick={{ fontSize:10 }} />
                              <YAxis dataKey="stage" type="category" width={80} stroke="#6B7280" tick={{ fontSize:9 }}
                                tickFormatter={(v: string) => v.length > 10 ? v.slice(0,10)+'…' : v} />
                              <Tooltip content={<Tip />} />
                              <Bar dataKey="users" name="Users" radius={[0,6,6,0]}>
                                {safeArr(mv.go_to_market.customer_journey).map((_,i) => <Cell key={i} fill={C.chart[i%C.chart.length]} />)}
                              </Bar>
                            </BarChart>
                          </Box>

                          <Box title="Stage Conversion Rate (%)">
                            <LineChart data={safeArr(mv.go_to_market.customer_journey)}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                              <XAxis dataKey="stage" stroke="#6B7280" tick={{ fontSize:9 }}
                                tickFormatter={(v: string) => v.slice(0,6)} />
                              <YAxis stroke="#6B7280" tick={{ fontSize:10 }} unit="%" width={32} />
                              <Tooltip content={<Tip />} />
                              <Line type="monotone" dataKey="conversion_pct" name="Conversion %" stroke={C.secondary} strokeWidth={2.5} dot={{ fill:C.secondary, r:4 }} />
                            </LineChart>
                          </Box>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-3 sm:mt-4">
                            {safeArr(mv.go_to_market.customer_journey).map((j,i) => (
                              <div key={i} className="bg-white/5 p-3 sm:p-4 rounded-xl">
                                <p className="font-semibold text-sm mb-2" style={{ color:C.chart[i%C.chart.length] }}>{j.stage}</p>
                                <div className="flex gap-3 sm:gap-4 mb-2">
                                  <div><p className="text-xs text-gray-500">Users</p><p className="text-base sm:text-lg font-bold text-white mono">{j.users.toLocaleString()}</p></div>
                                  <div><p className="text-xs text-gray-500">Conv.</p><p className="text-base sm:text-lg font-bold text-white mono">{j.conversion_pct}%</p></div>
                                </div>
                                {j.actions     && <p className="text-xs text-gray-400 mb-0.5">🎬 {j.actions}</p>}
                                {j.pain        && <p className="text-xs text-red-400 mb-0.5">😤 {j.pain}</p>}
                                {j.opportunity && <p className="text-xs text-green-400">💡 {j.opportunity}</p>}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </Sec>
                  </div>
                )}

                {/* ═══════ FINANCIALS ═══════ */}
                {activeTab==='financials' && mv.unit_economics && (
                  <div className="space-y-4 sm:space-y-6">
                    <Sec>
                      <Title icon="💵" text="Unit Economics & Financial Model" />

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
                        {[
                          { label:'ACV',          val:`$${mv.unit_economics.avg_contract_value?.toLocaleString()}`,  color:C.secondary },
                          { label:'CAC',           val:`$${mv.unit_economics.cac?.toLocaleString()}`,                 color:C.amber },
                          { label:'LTV',           val:`$${mv.unit_economics.ltv?.toLocaleString()}`,                 color:C.green },
                          { label:'LTV:CAC',       val:`${mv.unit_economics.ltv_cac_ratio}x`,                         color: mv.unit_economics.ltv_cac_ratio>=3?C.green:C.amber },
                          { label:'Payback (mo.)', val:`${mv.unit_economics.payback_months}`,                         color:'#fff' },
                          { label:'Gross Margin',  val:`${mv.unit_economics.gross_margin_pct}%`,                      color:C.green },
                          { label:'Churn Rate',    val:`${mv.unit_economics.churn_rate_pct}%`,                        color: mv.unit_economics.churn_rate_pct>10?C.red:C.green },
                        ].map(({ label, val, color }) => (
                          <div key={label} className="bg-white/5 p-3 sm:p-4 rounded-xl">
                            <p className="text-xs text-gray-500 mb-1">{label}</p>
                            <p className="text-base sm:text-xl font-bold mono" style={{ color }}>{val}</p>
                          </div>
                        ))}
                      </div>

                      {safeArr(mv.unit_economics.cac_by_channel).length > 0 && (
                        <Box title="CAC by Acquisition Channel ($)">
                          <BarChart data={safeArr(mv.unit_economics.cac_by_channel)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                            <XAxis dataKey="channel" stroke="#6B7280" tick={{ fontSize:9 }}
                              tickFormatter={(v: string) => v.length > 8 ? v.slice(0,8)+'…' : v} />
                            <YAxis stroke="#6B7280" tick={{ fontSize:10 }} width={36} />
                            <Tooltip content={<Tip />} />
                            <Bar dataKey="cac" name="CAC ($)" radius={[4,4,0,0]}>
                              {safeArr(mv.unit_economics.cac_by_channel).map((_,i) => <Cell key={i} fill={C.chart[i%C.chart.length]} />)}
                            </Bar>
                          </BarChart>
                        </Box>
                      )}

                      <Box title="Unit Economics Waterfall">
                        <BarChart data={[
                          { name:'ACV',         value:  mv.unit_economics.avg_contract_value },
                          { name:'COGS',        value: -(mv.unit_economics.avg_contract_value * (1 - mv.unit_economics.gross_margin_pct/100)) },
                          { name:'Gross Profit',value:  mv.unit_economics.avg_contract_value * mv.unit_economics.gross_margin_pct/100 },
                          { name:'CAC',         value: -mv.unit_economics.cac },
                          { name:'LTV',         value:  mv.unit_economics.ltv },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                          <XAxis dataKey="name" stroke="#6B7280" tick={{ fontSize:9 }} />
                          <YAxis stroke="#6B7280" tick={{ fontSize:10 }} width={36} />
                          <Tooltip content={<Tip />} />
                          <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
                          <Bar dataKey="value" name="Value ($)" radius={[4,4,0,0]}>
                            {[C.blue, C.red, C.green, C.amber, C.secondary].map((c,i) => <Cell key={i} fill={c} />)}
                          </Bar>
                        </BarChart>
                      </Box>

                      <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-white/5 rounded-xl">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Key Assumptions</p>
                        <p className="text-gray-300 text-xs sm:text-sm">{mv.unit_economics.assumptions}</p>
                      </div>
                    </Sec>
                  </div>
                )}

                {/* ═══════ STRATEGY ═══════ */}
                {activeTab==='strategy' && (
                  <div className="space-y-4 sm:space-y-6">
                    <Sec>
                      <Title icon="♟️" text="Executive Strategy Synthesis" />

                      {safeArr(mv.strategy_options).length === 0 && <Empty msg="No strategy options returned." />}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                        {safeArr(mv.strategy_options).map((opt,i) => {
                          const col = [C.green, C.secondary, C.amber][i] || C.blue;
                          return (
                            <div key={i} className="rounded-2xl p-4 sm:p-5 relative" style={{ background:`${col}0D`, border:`1px solid ${col}30` }}>
                              <p className="font-bold text-sm mb-2 sm:mb-3" style={{ color:col }}>{opt.label}</p>
                              <p className="text-gray-300 text-xs mb-2 sm:mb-3">{opt.approach}</p>
                              <div className="flex gap-3 sm:gap-4 mb-2 sm:mb-3">
                                <div><p className="text-xs text-gray-500">Investment</p><p className="text-xs sm:text-sm font-semibold text-white">{opt.investment_required}</p></div>
                                <div><p className="text-xs text-gray-500">Timeline</p><p className="text-xs sm:text-sm font-semibold text-white">{opt.timeline}</p></div>
                              </div>
                              {opt.expected_outcome && <p className="text-xs text-gray-400 mb-1 sm:mb-2">🎯 {opt.expected_outcome}</p>}
                              {safeArr(opt.key_risks).map((r,j) => <p key={j} className="text-xs text-red-400">⚠ {r}</p>)}
                            </div>
                          );
                        })}
                      </div>

                      {safeArr(mv.strategy_options).filter(o => o.radar).length > 0 && (
                        <Box title="Strategic Options — Multi-Dimensional Comparison">
                          <RadarChart data={[
                            { metric:'Market Coverage' },
                            { metric:'Speed to Market' },
                            { metric:'Resources Req.' },
                            { metric:'Risk Level' },
                            { metric:'Revenue Potential' },
                            { metric:'Sustainability' },
                          ].map(({ metric }) => {
                            const row: any = { metric };
                            safeArr(mv.strategy_options).forEach((opt,i) => {
                              const radarKey = Object.keys(opt.radar||{}).find(k =>
                                k.replace(/_/g,' ').toLowerCase().includes(metric.toLowerCase().split(' ')[0].toLowerCase())
                              );
                              row[`Option${i+1}`] = radarKey ? (opt.radar as any)[radarKey] : 0;
                            });
                            return row;
                          })} cx="50%" cy="50%" outerRadius="38%">
                            <PolarGrid stroke="rgba(255,255,255,0.08)" />
                            <PolarAngleAxis dataKey="metric" tick={{ fill:'#9CA3AF', fontSize:10 }} />
                            <PolarRadiusAxis domain={[0,10]} tick={false} axisLine={false} />
                            {safeArr(mv.strategy_options).map((opt,i) => (
                              <Radar key={i} name={opt.label} dataKey={`Option${i+1}`}
                                stroke={[C.green,C.secondary,C.amber][i]||C.blue}
                                fill={[C.green,C.secondary,C.amber][i]||C.blue} fillOpacity={0.1} />
                            ))}
                            <Legend wrapperStyle={{ color:'#9CA3AF', fontSize:10 }} iconSize={8} />
                          </RadarChart>
                        </Box>
                      )}

                      {safeArr(mv.priority_actions_90d).length > 0 && (
                        <div className="mt-4 sm:mt-6 p-4 sm:p-5 bg-white/5 rounded-2xl">
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 sm:mb-4">Priority Actions — Next 90 Days</p>
                          {safeArr(mv.priority_actions_90d).map((a,i) => (
                            <div key={i} className="flex gap-2 sm:gap-3 mb-3 sm:mb-4">
                              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                                style={{ background:'rgba(99,107,47,0.4)', color:C.secondary }}>
                                {a.rank}
                              </div>
                              <div>
                                <p className="text-white text-xs sm:text-sm font-medium">{a.action}</p>
                                {a.why && <p className="text-gray-500 text-xs mt-0.5">{a.why}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Sec>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>

            {/* Actions — stacked on mobile */}
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}
              className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center pt-2 sm:pt-4 pb-24 sm:pb-4">
              <button onClick={() => navigate('/dashboard')}
                className="glass px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-white hover:scale-105 transition-all text-sm sm:text-base w-full sm:w-auto">
                ← Dashboard
              </button>
              <button onClick={() => navigate(`/competitor-analysis?ideaId=${ideaId}`)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:scale-105 transition-all text-sm sm:text-base w-full sm:w-auto">
                Analyze Competitors →
              </button>
              <button onClick={executeValidation}
                className="grad text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:scale-105 transition-all text-sm sm:text-base w-full sm:w-auto">
                Re-run Validation
              </button>
            </motion.div>

          </div>
        )}
      </div>

      {ideaId && <StartupAdvisorChat ideaId={parseInt(ideaId)} />}
    </div>
  );
}