// File: frontend/src/pages/FinancialProjectionsDashboard.tsx
// Fixed: localhost → env var, 404 handled silently, double-parse bug fixed, mobile-responsive

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import StartupAdvisorChat from '../components/StartupAdvisorChat';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart, PieChart, Pie, Cell
} from 'recharts';

export default function FinancialProjectionsDashboard() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [searchParams] = useSearchParams();
  const ideaId = searchParams.get('ideaId');

  const [isLoading,    setIsLoading]    = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [projections,  setProjections]  = useState<any>(null);
  const [error,        setError]        = useState<string | null>(null);

  // Prevents fetchProjections from running while generate is in progress
  const isGeneratingRef = useRef(false);

  const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // ── safe JSON helper — reads body once, never throws silently ─────────────
  const safeJson = async (res: Response) => {
    const text = await res.text();
    if (!text || text.trim() === '') {
      throw new Error(`Empty response from server (status ${res.status})`);
    }
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Invalid JSON from server: ${text.slice(0, 150)}`);
    }
  };

  // ── fetch existing results on mount ──────────────────────────────────────
  const fetchProjections = async () => {
    if (!ideaId || isGeneratingRef.current) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API}/api/v1/financial-projections/results/${ideaId}`
      );

      // 404 = not generated yet — totally normal, just show empty state
      if (response.status === 404) return;

      // Any other non-OK is a real server problem
      if (!response.ok) {
        console.error(`Results fetch failed: ${response.status}`);
        return;
      }

      const data = await safeJson(response);
      if (data.status === 'success' && data.projections) {
        setProjections(data.projections);
      }
    } catch (err: any) {
      console.error('Fetch error:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ── generate new projections ──────────────────────────────────────────────
  const generateProjections = async () => {
    if (!ideaId) return;
    isGeneratingRef.current = true;
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(
        `${API}/api/v1/financial-projections/generate/${ideaId}`,
        { method: 'POST' }
      );

      // Read body ONCE — never call both res.json() and res.text()
      const data = await safeJson(response);

      if (!response.ok) {
        throw new Error(data?.detail || `Server error ${response.status}`);
      }

      // Handle both response shapes the backend might return
      if (data.projections) {
        setProjections(data.projections);
      } else if (data.domain_analysis) {
        // Backend returned projections at root level
        setProjections(data);
      } else {
        throw new Error('No projections found in server response');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Generate error:', err.message);
    } finally {
      isGeneratingRef.current = false;
      setIsGenerating(false);
    }
  };

  // Only runs on mount — generateProjections sets state directly, no re-fetch needed
  useEffect(() => {
    fetchProjections();
  }, [ideaId]);

  // ── currency formatter ────────────────────────────────────────────────────
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000)    return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  // ── loading screen ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-[#636B2F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">Loading financial projections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; box-sizing: border-box; }
        .glass { background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); }
        .gradient-primary { background: linear-gradient(135deg, #636B2F 0%, #3D4127 100%); }
        .gradient-death    { background: linear-gradient(135deg, #DC2626 0%, #7F1D1D 100%); }
        .metric-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
          border: 1px solid rgba(255,255,255,0.1);
          transition: all 0.3s ease;
        }
        .metric-card:hover {
          transform: translateY(-4px);
          border-color: rgba(212,222,149,0.3);
          box-shadow: 0 12px 24px rgba(0,0,0,0.4);
        }
        .segment-badge {
          background: linear-gradient(135deg, rgba(99,107,47,0.2), rgba(99,107,47,0.1));
          border: 1px solid rgba(212,222,149,0.3);
        }
        button { -webkit-tap-highlight-color: transparent; min-height: 40px; }
        ::-webkit-scrollbar { height: 3px; width: 3px; }
        ::-webkit-scrollbar-thumb { background: #636B2F; border-radius: 4px; }
        p, h1, h2, h3, h4, span { word-break: break-word; overflow-wrap: anywhere; }
      `}</style>

      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-[#636B2F] opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-[#D4DE95] opacity-5 rounded-full blur-3xl"></div>
      </div>

      {/* Nav */}
      <nav className="glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16 items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-all"
            >
              <span className="text-sm">←</span>
              <span className="text-sm font-medium hidden xs:block">Dashboard</span>
            </button>
            <span className="text-xs text-gray-500 font-semibold tracking-wider uppercase hidden sm:block">
              Financial Projections
            </span>
            {user && (
              <div className="flex items-center gap-1.5 text-sm text-gray-400">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#636B2F] flex items-center justify-center text-white font-semibold text-xs shrink-0">
                  {user.firstName?.charAt(0) || user.emailAddresses[0]?.emailAddress.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:block">
                  {user.firstName || user.emailAddresses[0]?.emailAddress.split('@')[0]}
                </span>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 relative z-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 glass px-3 py-1.5 sm:px-4 sm:py-2 rounded-full mb-4 sm:mb-6">
            <span className="text-lg sm:text-2xl">💰</span>
            <span className="text-xs sm:text-sm font-semibold text-white">Financial Projections</span>
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-3 sm:mb-6 tracking-tight">
            Domain-Aware
            <span className="block bg-gradient-to-r from-[#D4DE95] to-[#636B2F] bg-clip-text text-transparent">
              Financial Model
            </span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-lg max-w-2xl mx-auto px-2">
            Investor-grade projections with real market data and domain-specific insights
          </p>
        </motion.div>

        {/* Error banner */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass border-red-500/20 p-3 sm:p-4 rounded-xl mb-4 sm:mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}

        {/* Empty state */}
        {!projections && !isGenerating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6">
            <button
              onClick={generateProjections}
              className="gradient-primary text-white px-8 sm:px-12 py-4 sm:py-5 rounded-xl font-bold text-base sm:text-lg hover:scale-105 transition-all w-full sm:w-auto"
            >
              💰 Generate Financial Projections
            </button>
            <p className="text-gray-500 text-xs sm:text-sm mt-3">
              AI-powered with live market data from SerpAPI
            </p>
          </motion.div>
        )}

        {/* Generating state */}
        {isGenerating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass p-8 sm:p-12 rounded-3xl text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-5 sm:mb-6"></div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Generating Financial Model...</h2>
            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-400 max-w-xs mx-auto text-left">
              <p>🔍 Detecting domain...</p>
              <p>🌐 Fetching live market data...</p>
              <p>📊 Building revenue model...</p>
              <p>💰 Calculating unit economics...</p>
              <p>📈 Computing SaaS metrics...</p>
              <p className="text-xs text-gray-500 mt-3">This takes 15–20 seconds for REAL data</p>
            </div>
          </motion.div>
        )}

        {/* Projections Display */}
        {projections && !isGenerating && (
          <div className="space-y-5 sm:space-y-8">

            {/* Domain Analysis Badge */}
            {projections.domain_analysis && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="glass p-4 sm:p-6 rounded-2xl text-center">
                  <div className="inline-flex items-center gap-2 sm:gap-3 segment-badge px-4 sm:px-6 py-2 sm:py-3 rounded-full">
                    <span className="text-xl sm:text-2xl">
                      {projections.domain_analysis.domain === 'edtech'     && '🎓'}
                      {projections.domain_analysis.domain === 'fintech'    && '💳'}
                      {projections.domain_analysis.domain === 'healthtech' && '🏥'}
                      {projections.domain_analysis.domain === 'hrtech'     && '👔'}
                      {projections.domain_analysis.domain === 'ecommerce'  && '🛒'}
                      {projections.domain_analysis.domain === 'saas'       && '💻'}
                    </span>
                    <div className="text-left">
                      <div className="text-white font-bold text-base sm:text-lg uppercase">
                        {projections.domain_analysis.domain}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {projections.domain_analysis.confidence}% confidence • {projections.domain_analysis.description}
                      </div>
                    </div>
                  </div>
                  {projections.domain_analysis.keywords?.length > 0 && (
                    <div className="mt-3 sm:mt-4 flex flex-wrap gap-1.5 sm:gap-2 justify-center">
                      {projections.domain_analysis.keywords.slice(0, 6).map((kw: string, idx: number) => (
                        <span key={idx} className="px-2.5 sm:px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Executive Summary Cards */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-lg sm:text-2xl font-bold text-white mb-3 sm:mb-6">📊 Executive Summary</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">

                <div className="metric-card p-4 sm:p-6 rounded-2xl">
                  <div className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">Year 1 ARR</div>
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">
                    {formatCurrency(projections.executive_summary?.headline_metrics?.year_1_arr || 0)}
                  </div>
                  <div className="text-xs text-green-400">Annual Recurring Revenue</div>
                </div>

                <div className="metric-card p-4 sm:p-6 rounded-2xl">
                  <div className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">Year 3 ARR</div>
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">
                    {formatCurrency(projections.executive_summary?.headline_metrics?.year_3_arr || 0)}
                  </div>
                  <div className="text-xs text-green-400">Target Revenue</div>
                </div>

                <div className="metric-card p-4 sm:p-6 rounded-2xl">
                  <div className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">LTV:CAC Ratio</div>
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">
                    {projections.executive_summary?.headline_metrics?.ltv_cac_ratio?.toFixed(1) || '0'}x
                  </div>
                  <div className={`text-xs ${
                    (projections.executive_summary?.headline_metrics?.ltv_cac_ratio || 0) >= 3
                      ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {(projections.executive_summary?.headline_metrics?.ltv_cac_ratio || 0) >= 3
                      ? '✓ Healthy' : '⚠ Needs Improvement'}
                  </div>
                </div>

                <div className="metric-card p-4 sm:p-6 rounded-2xl">
                  <div className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">CAC Payback</div>
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">
                    {projections.executive_summary?.headline_metrics?.cac_payback_months?.toFixed(1) || '0'} mo
                  </div>
                  <div className={`text-xs ${
                    (projections.executive_summary?.headline_metrics?.cac_payback_months || 0) <= 12
                      ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    Target: &lt;12 months
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Customer Segments */}
            {projections.customer_segments && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl">
                <h3 className="text-lg sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex flex-wrap items-center gap-2 sm:gap-3">
                  <span>👥</span>
                  <span>Customer Segments</span>
                  <span className="text-xs sm:text-sm font-normal text-gray-400">
                    ({projections.domain_analysis?.domain || 'Domain'}-specific)
                  </span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
                  {Object.entries(projections.customer_segments).map(([segId, segment]: [string, any]) => (
                    <div key={segId} className="bg-white/5 border border-white/10 p-4 sm:p-6 rounded-xl hover:border-[#D4DE95]/30 transition-all">
                      <div className="flex items-start justify-between mb-3 sm:mb-4">
                        <div>
                          <h4 className="text-sm sm:text-lg font-bold text-white mb-1">{segment.name}</h4>
                          <div className="text-2xl sm:text-3xl font-bold text-[#D4DE95]">{segment.percentage}%</div>
                        </div>
                        <div className="text-3xl sm:text-4xl opacity-50">
                          {segId === 'segment_1' && '👤'}
                          {segId === 'segment_2' && '👥'}
                          {segId === 'segment_3' && '🏢'}
                        </div>
                      </div>

                      <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Price/mo:</span>
                          <span className="text-white font-semibold">
                            ${segment.price_monthly?.toFixed(2) || '0'}
                            {segment.transaction_revenue_per_user && (
                              <span className="text-gray-500 text-xs ml-1">
                                + ${segment.transaction_revenue_per_user.toFixed(2)} fees
                              </span>
                            )}
                          </span>
                        </div>

                        {segment.churn_monthly !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Churn:</span>
                            <span className={`font-semibold ${
                              segment.churn_monthly < 4 ? 'text-green-400' :
                              segment.churn_monthly < 6 ? 'text-yellow-400' : 'text-orange-400'
                            }`}>
                              {segment.churn_monthly.toFixed(1)}%/mo
                            </span>
                          </div>
                        )}

                        {segment.conversion_to_paid && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Converts to paid:</span>
                            <span className="text-white font-semibold">{segment.conversion_to_paid}%</span>
                          </div>
                        )}

                        <div className="pt-2 sm:pt-3 border-t border-white/10">
                          <div className="text-xs text-gray-400 mb-1">Channel:</div>
                          <div className="text-xs text-white">{segment.acquisition_channel}</div>
                        </div>

                        <div className="pt-1 sm:pt-2">
                          <div className="text-xs text-gray-400 mb-1">Profile:</div>
                          <div className="text-xs text-gray-300">{segment.characteristics}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Pricing Model */}
            {projections.pricing_model && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl">
                <h3 className="text-lg sm:text-2xl font-bold text-white mb-4 sm:mb-6">💎 Pricing Strategy</h3>

                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-white/5 rounded-lg">
                  <div className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">Strategy:</div>
                  <div className="text-white font-semibold text-sm sm:text-base">{projections.pricing_model.pricing_strategy}</div>
                  <div className="text-xs text-gray-500 mt-1">Source: {projections.pricing_model.source}</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {Object.entries(projections.pricing_model)
                    .filter(([key]) => key.startsWith('tier_'))
                    .map(([key, tier]: [string, any]) => (
                      <div key={key} className="bg-gradient-to-br from-[#636B2F]/20 to-[#636B2F]/5 border border-[#636B2F]/30 p-4 sm:p-5 rounded-xl">
                        <div className="text-xs sm:text-sm text-[#D4DE95] font-semibold mb-1 sm:mb-2">{tier.name}</div>
                        <div className="text-2xl sm:text-3xl font-bold text-white mb-2 sm:mb-3">
                          ${tier.price_monthly?.toFixed(2) || '0'}
                          <span className="text-sm sm:text-lg text-gray-400">/mo</span>
                        </div>
                        {tier.revenue_model && (
                          <div className="text-xs text-gray-400 mb-2 sm:mb-3 italic">{tier.revenue_model}</div>
                        )}
                        <div className="text-xs text-gray-400 mb-2">Target: {tier.target}</div>
                        <ul className="space-y-1">
                          {tier.features?.slice(0, 3).map((feature: string, idx: number) => (
                            <li key={idx} className="text-xs text-gray-300 flex items-start gap-1.5">
                              <span className="text-[#D4DE95] shrink-0">✓</span>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                </div>
              </motion.div>
            )}

            {/* Revenue Growth Chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl">
              <h3 className="text-base sm:text-xl font-bold text-white mb-4 sm:mb-6">📈 Revenue & Cost Projection (36 Months)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart
                  data={projections.revenue_model?.monthly_data?.slice(0, 36) || []}
                  margin={{ top: 8, right: 8, bottom: 24, left: 8 }}
                >
                  <defs>
                    <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#636B2F" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#636B2F" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCosts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#D4DE95" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#D4DE95" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis
                    dataKey="month"
                    stroke="#666"
                    tick={{ fill: '#999', fontSize: 10 }}
                    label={{ value: 'Month', position: 'insideBottom', offset: -2, fill: '#999', fontSize: 10 }}
                  />
                  <YAxis
                    stroke="#666"
                    tick={{ fill: '#999', fontSize: 10 }}
                    tickFormatter={formatCurrency}
                    width={48}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(10,10,11,0.95)', border: '1px solid rgba(99,107,47,0.3)', borderRadius: '8px', fontSize: 12 }}
                    labelStyle={{ color: '#fff' }}
                    formatter={(value: any) => [formatCurrency(value), '']}
                  />
                  <Legend wrapperStyle={{ color: '#999', fontSize: 11 }} />
                  <Area
                    type="monotone"
                    dataKey="mrr"
                    name="Monthly Recurring Revenue"
                    stroke="#636B2F"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorMrr)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Pie + Bar — stacked on mobile, side by side on lg */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

              {projections.charts?.customer_segments && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl">
                  <h3 className="text-base sm:text-xl font-bold text-white mb-4 sm:mb-6">👥 Customer Distribution</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={projections.charts.customer_segments.labels.map((label: string, idx: number) => ({
                          name: label,
                          value: projections.charts.customer_segments.data[idx]
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius="55%"
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {projections.charts.customer_segments.colors.map((color: string, index: number) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(10,10,11,0.95)', border: '1px solid rgba(99,107,47,0.3)', borderRadius: '8px', fontSize: 12 }}
                        formatter={(value: any) => [`${value}%`, '']}
                      />
                      <Legend wrapperStyle={{ color: '#999', fontSize: 10 }} iconSize={8} />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {projections.charts?.arr_progression && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl">
                  <h3 className="text-base sm:text-xl font-bold text-white mb-4 sm:mb-6">💰 ARR Growth (Annual)</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={[
                        { year: 'Year 1', arr: projections.charts.arr_progression.year_1 },
                        { year: 'Year 2', arr: projections.charts.arr_progression.year_2 },
                        { year: 'Year 3', arr: projections.charts.arr_progression.year_3 },
                      ]}
                      margin={{ top: 8, right: 8, bottom: 4, left: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="year" stroke="#666" tick={{ fill: '#999', fontSize: 11 }} />
                      <YAxis stroke="#666" tick={{ fill: '#999', fontSize: 10 }} tickFormatter={formatCurrency} width={44} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(10,10,11,0.95)', border: '1px solid rgba(99,107,47,0.3)', borderRadius: '8px', fontSize: 12 }}
                        labelStyle={{ color: '#fff' }}
                        formatter={(value: any) => [formatCurrency(value), 'ARR']}
                      />
                      <Bar dataKey="arr" fill="#636B2F" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="mt-3 sm:mt-4 grid grid-cols-3 gap-2 sm:gap-4 text-center">
                    {[
                      { label: 'Year 1', val: projections.charts.arr_progression.year_1 },
                      { label: 'Year 2', val: projections.charts.arr_progression.year_2 },
                      { label: 'Year 3', val: projections.charts.arr_progression.year_3 },
                    ].map(({ label, val }) => (
                      <div key={label} className="bg-white/5 p-2 sm:p-3 rounded-xl">
                        <div className="text-xs text-gray-400">{label}</div>
                        <div className="text-sm sm:text-lg font-bold text-white">{formatCurrency(val)}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Data Sources */}
            {projections.data_sources && projections.data_sources.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-4 sm:p-6 rounded-2xl">
                <h4 className="text-xs sm:text-sm font-semibold text-gray-400 mb-2 sm:mb-3">📚 Data Sources</h4>
                <div className="space-y-1.5 sm:space-y-2">
                  {projections.data_sources.map((source: string, idx: number) => (
                    <div key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                      <span className="text-[#D4DE95] shrink-0">•</span>
                      <span>{source}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 justify-center pt-2 sm:pt-4 pb-24 sm:pb-4"
            >
              <button
                onClick={() => navigate('/dashboard')}
                className="glass px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-white hover:scale-105 transition-all text-sm sm:text-base w-full sm:w-auto"
              >
                Back to Dashboard
              </button>
              <button
                onClick={generateProjections}
                className="gradient-primary text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:scale-105 transition-all text-sm sm:text-base w-full sm:w-auto"
              >
                Regenerate
              </button>
              <button
                onClick={() => navigate(`/hiring-plan?ideaId=${ideaId}`)}
                className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:scale-105 transition-all text-sm sm:text-base flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <span>👥</span>
                <span>Hiring Plan</span>
              </button>
            </motion.div>

          </div>
        )}
      </div>

      {ideaId && <StartupAdvisorChat ideaId={parseInt(ideaId)} />}
    </div>
  );
}