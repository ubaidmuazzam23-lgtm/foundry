// File: frontend/src/pages/HiringPlanDashboard.tsx
// Fixed: localhost → env var, 404 silent, safe JSON, mobile-responsive

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';

interface Role {
  role_title: string;
  month: number;
  why_needed: string;
  priority: string;
  job_description: string;
  salary_range: {
    min: number;
    max: number;
    currency: string;
    note: string;
    sources?: string[];
  };
  interview_questions: string[];
  hiring_trigger: string;
  equity_range: {
    percentage: number;
    vesting: string;
    note: string;
  };
  research_backed?: boolean;
  data_sources?: string[];
}

interface GmailDraft {
  role: string;
  subject: string;
  body: string;
  status: string;
  ready_to_send: boolean;
}

interface CalendarEvent {
  title: string;
  date: string;
  description: string;
  reminder: string;
  status: string;
}

interface HiringPlan {
  startup_name: string;
  analysis: {
    business_model: string;
    stage: string;
    location: string;
    monthly_budget: number;
    complexity: string;
  };
  hiring_timeline: Role[];
  budget_summary: {
    year1_salaries: number;
    overhead_costs: number;
    total_year1_cost: number;
    monthly_breakdown: number[];
    avg_monthly_burn: number;
    recommended_funding: number;
    headcount_eoy: number;
  };
  hiring_triggers: Array<{
    role: string;
    month: number;
    trigger: string;
    priority: string;
  }>;
  mistakes_to_avoid: string[];
  mcp_enabled?: boolean;
  gmail_drafts?: GmailDraft[];
  calendar_events?: CalendarEvent[];
  data_sources?: string[];
}

interface GoogleSync {
  connected: boolean;
  calendar: number;
  gmail: number;
}

export default function HiringPlanDashboard() {
  const navigate       = useNavigate();
  const { user }       = useUser();
  const [searchParams] = useSearchParams();
  const ideaId         = searchParams.get('ideaId');

  const effectiveIdeaId = ideaId || localStorage.getItem('foundry_idea_id');

  const [isLoading,    setIsLoading]    = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [plan,         setPlan]         = useState<HiringPlan | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedDraft,setSelectedDraft]= useState<GmailDraft | null>(null);
  const [error,        setError]        = useState<string | null>(null);

  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleSync,      setGoogleSync]      = useState<GoogleSync | null>(null);
  const [googleMessage,   setGoogleMessage]   = useState('');

  const isGeneratingRef = useRef(false);

  const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // ── safe JSON helper ──────────────────────────────────────────────────────
  const safeJson = async (res: Response) => {
    const text = await res.text();
    if (!text || text.trim() === '')
      throw new Error(`Empty response (status ${res.status})`);
    try { return JSON.parse(text); }
    catch { throw new Error(`Invalid JSON: ${text.slice(0, 150)}`); }
  };

  // ── fetch existing plan ───────────────────────────────────────────────────
  const fetchPlan = async () => {
    if (!effectiveIdeaId || isGeneratingRef.current) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/hiring-plan/results/${effectiveIdeaId}`);
      if (res.status === 404) return;          // not generated yet — show empty state
      if (!res.ok) { console.error(`Fetch failed: ${res.status}`); return; }
      const data = await safeJson(res);
      if (data.status === 'success' && data.hiring_plan) setPlan(data.hiring_plan);
    } catch (err: any) { console.error('Fetch error:', err.message); }
    finally { setIsLoading(false); }
  };

  const checkGoogleStatus = async () => {
    if (!user?.id) return;
    try {
      const res  = await fetch(`${API}/api/v1/google/status/${user.id}`);
      const data = await safeJson(res);
      setGoogleConnected(data.connected);
    } catch { setGoogleConnected(false); }
  };

  const connectGoogle = () => {
    if (!user?.id) return;
    if (effectiveIdeaId) localStorage.setItem('foundry_idea_id', effectiveIdeaId);
    window.location.href = `${API}/api/v1/google/auth/${user.id}?idea_id=${effectiveIdeaId}&page=hiring-plan`;
  };

  const disconnectGoogle = async () => {
    if (!user?.id) return;
    await fetch(`${API}/api/v1/google/disconnect/${user.id}`, { method: 'DELETE' });
    setGoogleConnected(false);
    setGoogleSync(null);
    setGoogleMessage('');
  };

  // ── generate plan ─────────────────────────────────────────────────────────
  const generatePlan = async () => {
    if (!effectiveIdeaId) return;
    isGeneratingRef.current = true;
    setIsGenerating(true);
    setError(null);
    setGoogleSync(null);
    setGoogleMessage('');

    try {
      const url = `${API}/api/v1/hiring-plan/generate/${effectiveIdeaId}?clerk_user_id=${user?.id || ''}`;
      const res = await fetch(url, { method: 'POST' });
      const data = await safeJson(res);

      if (data.status === 'insufficient_data') {
        setError(`Missing required data: ${data.required.join(', ')}`);
        return;
      }
      if (!res.ok) throw new Error(data?.detail || `Server error ${res.status}`);

      setPlan(data.hiring_plan);
      if (data.google_sync) {
        setGoogleSync(data.google_sync);
        setGoogleMessage(data.google_message || '');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Generate error:', err.message);
    } finally {
      isGeneratingRef.current = false;
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (ideaId) localStorage.setItem('foundry_idea_id', ideaId);
    if (!ideaId && effectiveIdeaId)
      window.history.replaceState({}, '', `${window.location.pathname}?ideaId=${effectiveIdeaId}`);
    if (!effectiveIdeaId) { navigate('/dashboard'); return; }

    const params = new URLSearchParams(window.location.search);
    if (params.get('google_connected') === 'true') {
      setGoogleConnected(true);
      window.history.replaceState({}, '', `${window.location.pathname}?ideaId=${effectiveIdeaId}`);
    }

    fetchPlan();
    checkGoogleStatus();
  }, []);

  // ── helpers ───────────────────────────────────────────────────────────────
  const fmt = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v.toFixed(0)}`;
  };

  const priorityColor = (p: string) => {
    if (p === 'critical') return 'bg-red-500/20 border-red-500/50 text-red-400';
    if (p === 'high')     return 'bg-orange-500/20 border-orange-500/50 text-orange-400';
    return 'bg-blue-500/20 border-blue-500/50 text-blue-400';
  };

  const priorityIcon = (p: string) =>
    p === 'critical' ? '🔴' : p === 'high' ? '🟠' : '🔵';

  const copy = (text: string) => navigator.clipboard.writeText(text);

  // ── loading ───────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400 text-sm">Loading hiring plan...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        *{font-family:'Inter',sans-serif;box-sizing:border-box;}
        .glass{background:rgba(255,255,255,0.03);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08);}
        .gradient-hiring  {background:linear-gradient(135deg,#8B5CF6 0%,#6366F1 100%);}
        .gradient-gmail   {background:linear-gradient(135deg,#EA4335 0%,#FBBC04 100%);}
        .gradient-calendar{background:linear-gradient(135deg,#4285F4 0%,#34A853 100%);}
        .role-card{background:linear-gradient(135deg,rgba(139,92,246,0.1) 0%,rgba(99,102,241,0.05) 100%);border:1px solid rgba(139,92,246,0.2);transition:all 0.3s ease;}
        .role-card:hover{transform:translateY(-2px);border-color:rgba(139,92,246,0.4);box-shadow:0 8px 20px rgba(139,92,246,0.15);}
        .timeline-dot{width:14px;height:14px;border-radius:50%;background:linear-gradient(135deg,#8B5CF6,#6366F1);box-shadow:0 0 12px rgba(139,92,246,0.5);}
        button{-webkit-tap-highlight-color:transparent;min-height:40px;}
        ::-webkit-scrollbar{height:3px;width:3px;}
        ::-webkit-scrollbar-thumb{background:#8B5CF6;border-radius:4px;}
        p,h1,h2,h3,h4,span,div{word-break:break-word;overflow-wrap:anywhere;}
      `}</style>

      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-purple-600 opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-blue-600 opacity-10 rounded-full blur-3xl"></div>
      </div>

      {/* Nav */}
      <nav className="glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16 items-center">
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-all">
              <span className="text-sm">←</span>
              <span className="text-sm font-medium hidden xs:block">Dashboard</span>
            </button>
            <span className="text-xs text-gray-500 font-semibold tracking-wider uppercase hidden sm:block">Hiring Plan</span>
            {user && (
              <div className="flex items-center gap-1.5 text-sm text-gray-400">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold text-xs shrink-0">
                  {user.firstName?.charAt(0) || user.emailAddresses[0]?.emailAddress.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:block">{user.firstName || user.emailAddresses[0]?.emailAddress.split('@')[0]}</span>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 relative z-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6 sm:mb-12">
          <div className="inline-flex items-center gap-2 glass px-3 py-1.5 sm:px-4 sm:py-2 rounded-full mb-4 sm:mb-6">
            <span className="text-lg sm:text-2xl">👥</span>
            <span className="text-xs sm:text-sm font-semibold text-white">MCP-Enhanced Hiring Plan</span>
            {plan?.mcp_enabled && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">MCP Active</span>}
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-3 sm:mb-6 tracking-tight">
            Build Your
            <span className="block bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Dream Team
            </span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-lg max-w-2xl mx-auto px-2">
            AI-powered hiring roadmap with real salary data, Gmail drafts & calendar reminders
          </p>
        </motion.div>

        {/* Google Connect Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-4 sm:p-6 rounded-2xl mb-5 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl shrink-0 ${googleConnected ? 'bg-green-500/20' : 'bg-blue-500/20'}`}>
                {googleConnected ? '✅' : '🔗'}
              </div>
              <div>
                <h3 className="text-white font-bold text-sm sm:text-base">{googleConnected ? 'Google Connected' : 'Connect Google'}</h3>
                <p className="text-xs sm:text-sm text-gray-400">
                  {googleConnected
                    ? 'Gmail drafts & Calendar events sync automatically'
                    : 'Auto-save job posting drafts & hiring reminders'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {googleSync?.connected && (
                <div className="flex gap-3 sm:gap-4 mr-1 sm:mr-2">
                  <div className="text-center">
                    <div className="text-lg sm:text-xl font-bold text-red-400">{googleSync.gmail}</div>
                    <div className="text-xs text-gray-500">Gmail</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-xl font-bold text-blue-400">{googleSync.calendar}</div>
                    <div className="text-xs text-gray-500">Calendar</div>
                  </div>
                </div>
              )}
              {googleConnected ? (
                <button onClick={disconnectGoogle} className="glass px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm text-red-400 hover:bg-red-500/10 transition-all border border-red-500/20">
                  Disconnect
                </button>
              ) : (
                <button onClick={connectGoogle} className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5">
                  🔗 Connect Google
                </button>
              )}
            </div>
          </div>
          {googleMessage && (
            <div className={`mt-3 p-2.5 sm:p-3 rounded-xl text-xs sm:text-sm ${googleSync?.connected ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-500/10 text-gray-400'}`}>
              {googleMessage}
            </div>
          )}
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div className="glass border-red-500/20 p-3 sm:p-4 rounded-xl mb-4 sm:mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}

        {/* Empty state */}
        {!plan && !isGenerating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6">
            <button onClick={generatePlan} className="gradient-hiring text-white px-8 sm:px-12 py-4 sm:py-5 rounded-xl font-bold text-base sm:text-lg hover:scale-105 transition-all w-full sm:w-auto">
              🚀 Generate MCP-Enhanced Hiring Plan
            </button>
            <p className="text-gray-500 text-xs sm:text-sm mt-3">
              Real salary data + Gmail drafts + Calendar events
              {googleConnected && ' + Auto-sync to Google'}
            </p>
          </motion.div>
        )}

        {/* Generating state */}
        {isGenerating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass p-8 sm:p-12 rounded-3xl text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-5 sm:mb-6"></div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Generating MCP-Enhanced Plan...</h2>
            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-400 max-w-xs mx-auto text-left">
              <p>🔍 Analyzing startup...</p>
              <p>🌐 Researching salary data...</p>
              <p>📊 Studying job posting patterns...</p>
              <p>🎯 Finding interview best practices...</p>
              <p>📧 Creating Gmail drafts...</p>
              <p>📅 Scheduling calendar events...</p>
              {googleConnected && <p className="text-green-400">🔗 Syncing to your Google account...</p>}
              <p className="text-xs text-gray-500 mt-3">This takes 25–30 seconds</p>
            </div>
          </motion.div>
        )}

        {/* ── Plan Display ── */}
        {plan && !isGenerating && (
          <div className="space-y-5 sm:space-y-8">

            {/* MCP Badge */}
            {plan.mcp_enabled && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-4 sm:p-6 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white mb-1 sm:mb-2">🚀 MCP Features Active</h3>
                    <p className="text-xs sm:text-sm text-gray-400">Real data, Gmail drafts, and Calendar events included</p>
                  </div>
                  <div className="flex gap-4 sm:gap-6 flex-wrap">
                    <div className="text-center"><div className="text-xl sm:text-2xl font-bold text-red-400">{plan.gmail_drafts?.length || 0}</div><div className="text-xs text-gray-500">Email Drafts</div></div>
                    <div className="text-center"><div className="text-xl sm:text-2xl font-bold text-blue-400">{plan.calendar_events?.length || 0}</div><div className="text-xs text-gray-500">Calendar Events</div></div>
                    {googleSync?.connected && (
                      <>
                        <div className="text-center"><div className="text-xl sm:text-2xl font-bold text-green-400">{googleSync.gmail}</div><div className="text-xs text-gray-500">Synced Gmail</div></div>
                        <div className="text-center"><div className="text-xl sm:text-2xl font-bold text-green-400">{googleSync.calendar}</div><div className="text-xs text-gray-500">Synced Cal.</div></div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Startup Overview */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl">
              <h2 className="text-lg sm:text-2xl font-bold text-white mb-4 sm:mb-6">📋 {plan.startup_name}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
                {[
                  { label: 'Business Model', val: plan.analysis.business_model },
                  { label: 'Stage',          val: plan.analysis.stage },
                  { label: 'Location',       val: plan.analysis.location },
                  { label: 'Monthly Budget', val: fmt(plan.analysis.monthly_budget) },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <div className="text-xs sm:text-sm text-gray-400 mb-1">{label}</div>
                    <div className="text-sm sm:text-lg font-semibold text-white">{val}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Gmail Drafts */}
            {plan.gmail_drafts && plan.gmail_drafts.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-red-500/20">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-2xl sm:text-3xl">📧</span>
                    <div>
                      <h2 className="text-lg sm:text-2xl font-bold text-white">Gmail Drafts Ready</h2>
                      <p className="text-xs sm:text-sm text-gray-400">
                        {googleSync?.gmail ? `✅ ${googleSync.gmail} drafts saved to your Gmail` : 'Connect Google to auto-save drafts'}
                      </p>
                    </div>
                  </div>
                  {!googleConnected && (
                    <button onClick={connectGoogle} className="bg-red-600/80 hover:bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 self-start sm:self-auto">
                      📧 Save to Gmail
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {plan.gmail_drafts.map((draft, idx) => (
                    <button key={idx} onClick={() => setSelectedDraft(draft)} className="glass p-4 sm:p-6 rounded-xl hover:bg-white/10 transition-all text-left border border-white/10 hover:border-red-400/30">
                      <div className="flex items-start justify-between mb-2 sm:mb-3">
                        <span className="text-xl sm:text-2xl">✉️</span>
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Ready</span>
                      </div>
                      <div className="font-semibold text-white text-sm mb-1.5">{draft.role}</div>
                      <div className="text-xs text-gray-400 truncate">{draft.subject}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Calendar Events */}
            {plan.calendar_events && plan.calendar_events.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-blue-500/20">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-2xl sm:text-3xl">📅</span>
                    <div>
                      <h2 className="text-lg sm:text-2xl font-bold text-white">Calendar Events Scheduled</h2>
                      <p className="text-xs sm:text-sm text-gray-400">
                        {googleSync?.calendar ? `✅ ${googleSync.calendar} events added to Google Calendar` : 'Connect Google to add to your Calendar'}
                      </p>
                    </div>
                  </div>
                  {!googleConnected && (
                    <button onClick={connectGoogle} className="bg-blue-600/80 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 self-start sm:self-auto">
                      📅 Add to Calendar
                    </button>
                  )}
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {plan.calendar_events.map((event, idx) => {
                    const isObj = typeof event === 'object' && event !== null;
                    const title    = isObj ? event.title       : String(event);
                    const date     = isObj ? event.date        : '';
                    const desc     = isObj ? event.description : '';
                    const reminder = isObj ? event.reminder    : '';
                    const d = date ? new Date(date) : null;
                    return (
                      <div key={idx} className="glass p-3 sm:p-4 rounded-xl border border-white/10">
                        <div className="flex items-start gap-3 sm:gap-4">
                          {d && (
                            <div className="text-center min-w-[52px] sm:min-w-[80px] shrink-0">
                              <div className="text-xs text-gray-500">{d.toLocaleDateString('en-US', { month: 'short' })}</div>
                              <div className="text-xl sm:text-2xl font-bold text-blue-400">{d.getDate()}</div>
                              <div className="text-xs text-gray-500">{d.getFullYear()}</div>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-white text-xs sm:text-sm mb-1">{title}</div>
                            {desc && <div className="text-xs text-gray-400 truncate">{desc.split('\n')[0]}</div>}
                            {reminder && <div className="text-xs text-blue-400 mt-1.5">🔔 {reminder}</div>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Hiring Timeline */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl">
              <h2 className="text-lg sm:text-2xl font-bold text-white mb-5 sm:mb-8">📅 Hiring Timeline (12 Months)</h2>

              {/* Month dots — scrollable on mobile */}
              <div className="overflow-x-auto -mx-5 sm:mx-0 px-5 sm:px-0 mb-4 sm:mb-8">
                <div className="relative min-w-[520px]">
                  <div className="absolute top-6 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600/20 to-blue-600/20"></div>
                  <div className="grid grid-cols-13 gap-0">
                    {[0,1,2,3,4,5,6,7,8,9,10,11,12].map((month) => (
                      <div key={month} className="text-center relative">
                        <div className="text-xs text-gray-500 mb-2">M{month}</div>
                        {plan.hiring_timeline.filter(r => r.month === month).length > 0 &&
                          <div className="timeline-dot mx-auto"></div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {plan.hiring_timeline.map((role, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.08 }} className="flex items-start gap-2 sm:gap-4">
                    <div className="w-12 sm:w-16 text-center shrink-0 mt-1">
                      <span className={`inline-block px-1.5 sm:px-2 py-1 rounded text-xs font-semibold border ${priorityColor(role.priority)}`}>
                        M{role.month}
                      </span>
                    </div>
                    <button onClick={() => setSelectedRole(role)} className="role-card flex-1 p-3 sm:p-4 rounded-xl text-left">
                      <div className="flex items-start sm:items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <div className="font-semibold text-white text-sm sm:text-base">{role.role_title}</div>
                            {role.research_backed && <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">Research-backed</span>}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-400 line-clamp-2">{role.why_needed}</div>
                          {role.salary_range.sources && role.salary_range.sources.length > 0 && (
                            <div className="text-xs text-purple-400 mt-1">📊 {role.salary_range.sources.join(', ')}</div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-purple-400 font-semibold text-xs sm:text-sm whitespace-nowrap">{fmt(role.salary_range.min)}–{fmt(role.salary_range.max)}</div>
                          <div className="text-xs text-gray-500">{role.equity_range.percentage}% equity</div>
                        </div>
                      </div>
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Budget */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl">
              <h2 className="text-lg sm:text-2xl font-bold text-white mb-4 sm:mb-6">💰 Budget Planning</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mb-5 sm:mb-8">
                {[
                  { label: 'Year 1 Salaries',   val: fmt(plan.budget_summary.year1_salaries),      sub: '',                     color: 'text-white' },
                  { label: 'Overhead (25%)',     val: fmt(plan.budget_summary.overhead_costs),      sub: 'Benefits, taxes, equip', color: 'text-white' },
                  { label: 'Total Year 1 Cost',  val: fmt(plan.budget_summary.total_year1_cost),    sub: '',                     color: 'text-purple-400' },
                  { label: 'Recommended Raise',  val: fmt(plan.budget_summary.recommended_funding), sub: '18 month runway',       color: 'text-green-400' },
                ].map(({ label, val, sub, color }) => (
                  <div key={label} className="bg-white/5 p-3 sm:p-6 rounded-xl">
                    <div className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">{label}</div>
                    <div className={`text-xl sm:text-3xl font-bold ${color}`}>{val}</div>
                    {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
                  </div>
                ))}
              </div>

              {/* Burn rate bar chart */}
              <div className="bg-white/5 p-4 sm:p-6 rounded-xl">
                <div className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">Monthly Burn Rate</div>
                <div className="flex items-end gap-0.5 sm:gap-1 h-24 sm:h-32">
                  {plan.budget_summary.monthly_breakdown.map((amount, idx) => (
                    <div
                      key={idx}
                      className="flex-1 bg-gradient-to-t from-purple-600 to-blue-600 rounded-t min-w-0"
                      style={{ height: `${(amount / Math.max(...plan.budget_summary.monthly_breakdown)) * 100}%` }}
                      title={`Month ${idx}: ${fmt(amount)}`}
                    ></div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Month 0</span><span>Month 12</span>
                </div>
              </div>
            </motion.div>

            {/* Hiring Triggers */}
            {plan.hiring_triggers.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl">
                <h2 className="text-lg sm:text-2xl font-bold text-white mb-4 sm:mb-6">🎯 When to Hire (Triggers)</h2>
                <div className="space-y-2 sm:space-y-4">
                  {plan.hiring_triggers.map((trigger, idx) => (
                    <div key={idx} className="flex items-start gap-2 sm:gap-4 bg-white/5 p-3 sm:p-4 rounded-xl">
                      <div className="text-lg sm:text-2xl shrink-0">{priorityIcon(trigger.priority)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white text-sm sm:text-base mb-1">{trigger.role}</div>
                        <div className="text-xs sm:text-sm text-gray-400">{trigger.trigger}</div>
                      </div>
                      <div className="text-purple-400 font-semibold text-xs sm:text-sm shrink-0">M{trigger.month}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Mistakes to Avoid */}
            {plan.mistakes_to_avoid && plan.mistakes_to_avoid.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-red-500/20">
                <h2 className="text-lg sm:text-2xl font-bold text-white mb-4 sm:mb-6">⚠️ Common Mistakes to Avoid</h2>
                <div className="space-y-2 sm:space-y-3">
                  {plan.mistakes_to_avoid.map((mistake, idx) => (
                    <div key={idx} className="flex items-start gap-2 sm:gap-3">
                      <span className="text-red-400 mt-0.5 shrink-0 text-sm">❌</span>
                      <p className="text-gray-300 text-xs sm:text-sm">{mistake}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Data Sources */}
            {plan.data_sources && plan.data_sources.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-4 sm:p-6 rounded-2xl">
                <h4 className="text-xs sm:text-sm font-semibold text-gray-400 mb-2 sm:mb-3">📚 Data Sources</h4>
                <div className="space-y-1.5 sm:space-y-2">
                  {plan.data_sources.map((source, idx) => (
                    <div key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                      <span className="text-purple-400 shrink-0">•</span><span>{source}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 justify-center pb-24 sm:pb-4">
              <button onClick={() => navigate('/dashboard')} className="glass px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-white hover:scale-105 transition-all text-sm sm:text-base w-full sm:w-auto">
                Back to Dashboard
              </button>
              <button onClick={generatePlan} className="gradient-hiring text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:scale-105 transition-all text-sm sm:text-base w-full sm:w-auto">
                Regenerate Plan
              </button>
              <button onClick={() => navigate(`/content-marketing?ideaId=${effectiveIdeaId}`)}
                className="bg-gradient-to-r from-green-600 to-green-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:scale-105 transition-all text-sm sm:text-base flex items-center justify-center gap-2 w-full sm:w-auto">
                <span>📝</span><span>Content Strategy</span>
              </button>
            </motion.div>

          </div>
        )}
      </div>

      {/* ── Role Modal ── */}
      {selectedRole && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 p-0 sm:p-6" onClick={() => setSelectedRole(null)}>
          <motion.div
            initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }}
            className="glass w-full sm:max-w-3xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto p-5 sm:p-8 rounded-t-3xl sm:rounded-3xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4 sm:mb-6 gap-3">
              <div className="min-w-0">
                <h2 className="text-xl sm:text-3xl font-bold text-white mb-2 leading-tight">{selectedRole.role_title}</h2>
                {selectedRole.research_backed && (
                  <div className="inline-flex items-center gap-1.5 bg-green-500/20 text-green-400 px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                    <span>✅</span><span>Research-backed with real data</span>
                  </div>
                )}
              </div>
              <button onClick={() => setSelectedRole(null)} className="text-gray-400 hover:text-white text-2xl shrink-0 mt-1">×</button>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-purple-400 mb-2">WHY THIS ROLE</h3>
                <p className="text-gray-300 text-xs sm:text-sm">{selectedRole.why_needed}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-white/5 p-3 sm:p-4 rounded-xl">
                  <h3 className="text-xs sm:text-sm font-semibold text-purple-400 mb-2">SALARY RANGE</h3>
                  <p className="text-lg sm:text-2xl font-bold text-white">{fmt(selectedRole.salary_range.min)} – {fmt(selectedRole.salary_range.max)}</p>
                  <p className="text-xs text-gray-500 mt-1">{selectedRole.salary_range.note}</p>
                  {selectedRole.salary_range.sources && selectedRole.salary_range.sources.length > 0 && (
                    <p className="text-xs text-green-400 mt-2">📊 {selectedRole.salary_range.sources.join(', ')}</p>
                  )}
                </div>
                <div className="bg-white/5 p-3 sm:p-4 rounded-xl">
                  <h3 className="text-xs sm:text-sm font-semibold text-purple-400 mb-2">EQUITY</h3>
                  <p className="text-lg sm:text-2xl font-bold text-white">{selectedRole.equity_range.percentage}%</p>
                  <p className="text-xs text-gray-500 mt-1">{selectedRole.equity_range.vesting}</p>
                </div>
              </div>

              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-purple-400 mb-2">WHEN TO HIRE</h3>
                <p className="text-gray-300 text-xs sm:text-sm">{selectedRole.hiring_trigger}</p>
              </div>

              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-purple-400 mb-2">JOB DESCRIPTION</h3>
                <p className="text-gray-300 text-xs sm:text-sm whitespace-pre-line">{selectedRole.job_description}</p>
              </div>

              {selectedRole.interview_questions.length > 0 && (
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-purple-400 mb-2 sm:mb-3">INTERVIEW QUESTIONS</h3>
                  <div className="space-y-2">
                    {selectedRole.interview_questions.map((q, idx) => (
                      <div key={idx} className="bg-white/5 p-2.5 sm:p-3 rounded-lg">
                        <p className="text-gray-300 text-xs sm:text-sm">{q}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Gmail Draft Modal ── */}
      {selectedDraft && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 p-0 sm:p-6" onClick={() => setSelectedDraft(null)}>
          <motion.div
            initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }}
            className="glass w-full sm:max-w-3xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto p-5 sm:p-8 rounded-t-3xl sm:rounded-3xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6 gap-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <span className="text-2xl sm:text-3xl shrink-0">📧</span>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-2xl font-bold text-white">Gmail Draft</h2>
                  <p className="text-xs sm:text-sm text-gray-400">{selectedDraft.role}</p>
                </div>
              </div>
              <button onClick={() => setSelectedDraft(null)} className="text-gray-400 hover:text-white text-2xl shrink-0">×</button>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white/5 p-3 sm:p-4 rounded-xl">
                <div className="text-xs sm:text-sm text-gray-400 mb-2">Subject:</div>
                <div className="text-white font-semibold text-sm sm:text-base">{selectedDraft.subject}</div>
              </div>
              <div className="bg-white/5 p-3 sm:p-4 rounded-xl">
                <div className="text-xs sm:text-sm text-gray-400 mb-2 sm:mb-3">Body:</div>
                <div className="text-gray-300 whitespace-pre-line font-mono text-xs sm:text-sm">{selectedDraft.body}</div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <button onClick={() => copy(selectedDraft.body)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all text-sm">
                  📋 Copy to Clipboard
                </button>
                {!googleConnected ? (
                  <button onClick={connectGoogle} className="flex-1 gradient-gmail text-white px-4 sm:px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all text-sm">
                    ✉️ Connect Gmail to Save
                  </button>
                ) : (
                  <div className="flex-1 bg-green-600/20 border border-green-500/30 text-green-400 px-4 sm:px-6 py-3 rounded-xl font-semibold text-center text-sm">
                    ✅ Saved to Gmail automatically
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}