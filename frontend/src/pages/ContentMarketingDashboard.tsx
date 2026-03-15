// File: frontend/src/pages/ContentMarketingDashboard.tsx
// Fixed: localhost → env var, 404 silent, safe JSON, mobile-responsive

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';

interface BlogIdea {
  id: number;
  title: string;
  pillar: string;
  type: string;
  seo_focus: string;
  estimated_word_count: number;
  difficulty: string;
}

interface SEOKeyword {
  keyword: string;
  search_volume: number;
  competition: string;
  related_keywords: string[];
  content_angle: string;
}

interface CalendarItem {
  id: number;
  month: string;
  week: number;
  publish_date: string;
  title: string;
  pillar: string;
  type: string;
  word_count: number;
  seo_keyword: string;
  status: string;
  social_posts: number;
}

interface SocialTemplate {
  blog_title: string;
  platform: string;
  post_text: string;
  hashtags: string[];
  best_time_to_post: string;
  character_count: number;
}

interface EmailTemplate {
  name: string;
  subject: string;
  body: string;
  use_case: string;
  recipients: string;
}

interface GoogleSync {
  connected: boolean;
  calendar: { created: any[]; failed: any[]; total: number } | null;
  gmail:    { created: any[]; failed: any[]; total: number } | null;
}

interface ContentStrategy {
  startup_name: string;
  analysis: {
    business_model: string;
    target_audience: string;
    content_pillars: string[];
    industry: string;
  };
  blog_ideas:           BlogIdea[];
  seo_keywords:         SEOKeyword[];
  content_calendar:     CalendarItem[];
  social_templates:     SocialTemplate[];
  trending_topics:      Array<{ topic: string; why_trending: string; content_angle: string }>;
  mcp_enabled:          boolean;
  email_templates:      EmailTemplate[];
  calendar_events:      any[];
  total_content_pieces: number;
}

export default function ContentMarketingDashboard() {
  const navigate       = useNavigate();
  const { user }       = useUser();
  const [searchParams] = useSearchParams();
  const ideaId         = searchParams.get('ideaId');

  const effectiveId = ideaId || localStorage.getItem('foundry_idea_id');

  const [isLoading,    setIsLoading]    = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [strategy,     setStrategy]     = useState<ContentStrategy | null>(null);
  const [selectedBlog,   setSelectedBlog]   = useState<BlogIdea | null>(null);
  const [selectedSocial, setSelectedSocial] = useState<SocialTemplate | null>(null);
  const [selectedEmail,  setSelectedEmail]  = useState<EmailTemplate | null>(null);
  const [activeTab, setActiveTab]           = useState<'calendar'|'blog'|'social'|'seo'>('calendar');
  const [error,     setError]               = useState<string | null>(null);

  const [googleConnected,   setGoogleConnected]   = useState(false);
  const [googleLoading,     setGoogleLoading]     = useState(true);
  const [googleSyncResult,  setGoogleSyncResult]  = useState<GoogleSync | null>(null);
  const [googleMessage,     setGoogleMessage]     = useState<string | null>(null);

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

  // ── google ────────────────────────────────────────────────────────────────
  const checkGoogleStatus = async () => {
    if (!user) return;
    try {
      const res  = await fetch(`${API}/api/v1/google/status/${user.id}`);
      const data = await safeJson(res);
      setGoogleConnected(data.connected);
    } catch { setGoogleConnected(false); }
    finally  { setGoogleLoading(false); }
  };

  const connectGoogle = () => {
    if (!user) return;
    const eid = effectiveId;
    if (eid) localStorage.setItem('foundry_idea_id', eid);
    window.location.href = `${API}/api/v1/google/auth/${user.id}?idea_id=${eid}&page=content-marketing`;
  };

  const disconnectGoogle = async () => {
    if (!user) return;
    await fetch(`${API}/api/v1/google/disconnect/${user.id}`, { method: 'DELETE' });
    setGoogleConnected(false);
    setGoogleSyncResult(null);
    setGoogleMessage(null);
  };

  // ── fetch existing strategy ───────────────────────────────────────────────
  const fetchStrategy = async () => {
    if (!effectiveId || isGeneratingRef.current) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/content-marketing/results/${effectiveId}`);
      if (res.status === 404) return;
      if (!res.ok) { console.error(`Fetch failed: ${res.status}`); return; }
      const data = await safeJson(res);
      if (data.status === 'success' && data.content_strategy) setStrategy(data.content_strategy);
    } catch (err: any) { console.error('Fetch error:', err.message); }
    finally { setIsLoading(false); }
  };

  // ── generate strategy ─────────────────────────────────────────────────────
  const generateStrategy = async () => {
    if (!effectiveId) return;
    isGeneratingRef.current = true;
    setIsGenerating(true);
    setError(null);
    setGoogleSyncResult(null);
    setGoogleMessage(null);
    try {
      const res  = await fetch(
        `${API}/api/v1/content-marketing/generate/${effectiveId}?clerk_user_id=${user?.id || ''}`,
        { method: 'POST' }
      );
      const data = await safeJson(res);
      if (data.status === 'insufficient_data') {
        setError(`Missing required data: ${data.required?.join(', ')}`);
        return;
      }
      if (!res.ok) throw new Error(data?.detail || `Server error ${res.status}`);
      setStrategy(data.content_strategy);
      if (data.google_sync) {
        setGoogleSyncResult(data.google_sync);
        setGoogleMessage(data.google_message);
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
    if (!ideaId && effectiveId)
      window.history.replaceState({}, '', `${window.location.pathname}?ideaId=${effectiveId}`);
    if (!effectiveId) { navigate('/dashboard'); return; }

    const params = new URLSearchParams(window.location.search);
    if (params.get('google_connected') === 'true') {
      setGoogleConnected(true);
      setGoogleLoading(false);
      window.history.replaceState({}, '', `${window.location.pathname}?ideaId=${effectiveId}`);
    }

    fetchStrategy();
    checkGoogleStatus();
  }, []);

  // ── helpers ───────────────────────────────────────────────────────────────
  const copy = (text: string) => navigator.clipboard.writeText(text);

  const diffColor = (d: string) => {
    switch (d?.toLowerCase()) {
      case 'easy':   return 'text-green-400 bg-green-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'hard':   return 'text-red-400 bg-red-500/20';
      default:       return 'text-gray-400 bg-gray-500/20';
    }
  };

  const compColor = (c: string) => {
    switch (c?.toLowerCase()) {
      case 'low':    return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high':   return 'text-red-400';
      default:       return 'text-gray-400';
    }
  };

  const TABS = [
    { id: 'calendar', label: '📅', full: 'Calendar' },
    { id: 'blog',     label: '📝', full: 'Blog Ideas' },
    { id: 'social',   label: '📱', full: 'Social' },
    { id: 'seo',      label: '🔍', full: 'SEO' },
  ] as const;

  // ── loading ───────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400 text-sm">Loading content strategy...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        *{font-family:'Inter',sans-serif;box-sizing:border-box;}
        .glass{background:rgba(255,255,255,0.03);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08);}
        .gradient-content {background:linear-gradient(135deg,#10B981 0%,#059669 100%);}
        .gradient-landing {background:linear-gradient(135deg,#8B5CF6 0%,#6D28D9 100%);}
        .gradient-google  {background:linear-gradient(135deg,#4285F4 0%,#0F62FE 100%);}
        .content-card{background:linear-gradient(135deg,rgba(16,185,129,0.1) 0%,rgba(5,150,105,0.05) 100%);border:1px solid rgba(16,185,129,0.2);transition:all 0.3s ease;}
        .content-card:hover{transform:translateY(-2px);border-color:rgba(16,185,129,0.4);box-shadow:0 8px 20px rgba(16,185,129,0.15);}
        .landing-card{background:linear-gradient(135deg,rgba(139,92,246,0.15) 0%,rgba(109,40,217,0.08) 100%);border:1px solid rgba(139,92,246,0.3);transition:all 0.3s ease;}
        .landing-card:hover{transform:translateY(-2px);border-color:rgba(139,92,246,0.6);}
        .google-card{background:linear-gradient(135deg,rgba(66,133,244,0.1) 0%,rgba(15,98,254,0.05) 100%);border:1px solid rgba(66,133,244,0.2);}
        .tab-btn{padding:8px 14px;border-radius:8px;transition:all 0.3s ease;font-size:13px;white-space:nowrap;}
        .tab-btn.active{background:linear-gradient(135deg,#10B981,#059669);color:#fff;}
        .tab-scroll::-webkit-scrollbar{display:none;}
        .tab-scroll{-ms-overflow-style:none;scrollbar-width:none;}
        @keyframes pulse-glow{0%,100%{box-shadow:0 0 20px rgba(139,92,246,0.4);}50%{box-shadow:0 0 40px rgba(139,92,246,0.7);}}
        .landing-cta{animation:pulse-glow 2.5s ease-in-out infinite;}
        button{-webkit-tap-highlight-color:transparent;min-height:40px;}
        ::-webkit-scrollbar{height:3px;width:3px;}
        ::-webkit-scrollbar-thumb{background:#10B981;border-radius:4px;}
        p,h1,h2,h3,h4,span,div{word-break:break-word;overflow-wrap:anywhere;}
      `}</style>

      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-green-600 opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-emerald-600 opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-0 w-64 sm:w-80 h-64 sm:h-80 bg-purple-600 opacity-8 rounded-full blur-3xl"></div>
      </div>

      {/* Nav */}
      <nav className="glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16 items-center">
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-all">
              <span className="text-sm">←</span>
              <span className="text-sm font-medium hidden xs:block">Dashboard</span>
            </button>
            <span className="text-xs text-gray-500 font-semibold tracking-wider uppercase hidden sm:block">Content Marketing</span>
            {user && (
              <div className="flex items-center gap-1.5 text-sm text-gray-400">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold text-xs shrink-0">
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
            <span className="text-lg sm:text-2xl">📝</span>
            <span className="text-xs sm:text-sm font-semibold text-white">Content Marketing Engine</span>
            {strategy?.mcp_enabled && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">MCP Active</span>}
            {googleConnected && <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded hidden sm:inline">🔗 Google</span>}
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-3 sm:mb-6 tracking-tight">
            Your Complete
            <span className="block bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Content Strategy
            </span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-lg max-w-2xl mx-auto px-2">
            24 blog ideas, SEO keywords, 12-month calendar, social posts & more
          </p>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div className="glass border-red-500/20 p-3 sm:p-4 rounded-xl mb-4 sm:mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}

        {/* Google Connect Card */}
        {!googleLoading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="google-card p-4 sm:p-6 rounded-2xl mb-4 sm:mb-6">
            {googleConnected ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl gradient-google flex items-center justify-center text-xl sm:text-2xl shrink-0">🔗</div>
                  <div>
                    <p className="text-white font-semibold text-sm sm:text-base">Google Connected</p>
                    <p className="text-xs sm:text-sm text-gray-400">Calendar events + Gmail drafts sync on generate</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  {googleSyncResult?.connected && (
                    <div className="flex gap-2 sm:gap-3 text-xs sm:text-sm">
                      {googleSyncResult.calendar && (
                        <span className="text-green-400">📅 {googleSyncResult.calendar.created?.length || 0} events</span>
                      )}
                      {googleSyncResult.gmail && (
                        <span className="text-blue-400">📧 {googleSyncResult.gmail.created?.length || 0} drafts</span>
                      )}
                    </div>
                  )}
                  <button onClick={disconnectGoogle} className="text-xs text-gray-400 hover:text-red-400 border border-white/10 hover:border-red-400/30 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all">
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm sm:text-base">Connect Google</p>
                    <p className="text-xs sm:text-sm text-gray-400">Auto-sync Calendar + Gmail drafts on generate</p>
                  </div>
                </div>
                <button onClick={connectGoogle} className="gradient-google text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold hover:scale-105 transition-all text-sm w-full sm:w-auto">
                  Connect Google →
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Google sync message */}
        {googleMessage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass p-3 sm:p-4 rounded-xl mb-4 sm:mb-6 border border-blue-500/20">
            <p className="text-blue-400 text-xs sm:text-sm">🔗 {googleMessage}</p>
          </motion.div>
        )}

        {/* Empty state */}
        {!strategy && !isGenerating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6">
            <button onClick={generateStrategy} className="gradient-content text-white px-8 sm:px-12 py-4 sm:py-5 rounded-xl font-bold text-base sm:text-lg hover:scale-105 transition-all w-full sm:w-auto">
              📝 Generate Content Strategy
            </button>
            <p className="text-gray-500 text-xs sm:text-sm mt-3">
              SEO research + Content calendar + Social templates
              {googleConnected && <span className="text-blue-400 ml-2">+ Google sync</span>}
            </p>
          </motion.div>
        )}

        {/* Generating state */}
        {isGenerating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass p-8 sm:p-12 rounded-3xl text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-5 sm:mb-6"></div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Crafting Your Content Strategy...</h2>
            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-400 max-w-xs mx-auto text-left">
              <p>🔍 Analyzing your startup...</p>
              <p>💡 Generating blog ideas...</p>
              <p>🌐 Researching SEO keywords...</p>
              <p>📅 Building content calendar...</p>
              <p>📱 Creating social templates...</p>
              <p>🔥 Finding trending topics...</p>
              {googleConnected && <p className="text-blue-400">🔗 Syncing to Google Calendar + Gmail...</p>}
              <p className="text-xs text-gray-500 mt-3">This takes 30–40 seconds</p>
            </div>
          </motion.div>
        )}

        {/* Strategy Display */}
        {strategy && !isGenerating && (
          <div className="space-y-4 sm:space-y-8">

            {/* Landing Page CTA */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="landing-card landing-cta p-5 sm:p-8 rounded-2xl sm:rounded-3xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
                <div className="flex items-start sm:items-center gap-3 sm:gap-5">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl gradient-landing flex items-center justify-center text-2xl sm:text-3xl shrink-0">🚀</div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-base sm:text-xl font-bold text-white">Launch Your Landing Page</h3>
                      <span className="text-xs bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/40">AI-Powered</span>
                    </div>
                    <p className="text-gray-400 text-xs sm:text-sm max-w-md">Turn your content strategy into a beautiful, live landing page — generated and auto-deployed to GitHub Pages in seconds.</p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-3">
                      {['AI-generated HTML', 'Auto-deployed', 'Free hosting'].map(f => (
                        <span key={f} className="flex items-center gap-1 text-xs text-purple-300">
                          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full shrink-0"></span>{f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/landing-page?ideaId=${effectiveId}`)}
                  className="gradient-landing text-white px-5 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base hover:scale-105 transition-all flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto"
                >
                  <span>🌐</span><span>Build Landing Page</span><span className="text-purple-200">→</span>
                </button>
              </div>
            </motion.div>

            {/* MCP Stats */}
            {strategy.mcp_enabled && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-4 sm:p-6 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white mb-1 sm:mb-2">🚀 MCP-Enhanced Strategy</h3>
                    <p className="text-xs sm:text-sm text-gray-400">SEO research, email templates & calendar included</p>
                  </div>
                  <div className="flex gap-4 sm:gap-6 flex-wrap">
                    <div className="text-center"><div className="text-xl sm:text-2xl font-bold text-green-400">{strategy.blog_ideas.length}</div><div className="text-xs text-gray-500">Blog Ideas</div></div>
                    <div className="text-center"><div className="text-xl sm:text-2xl font-bold text-blue-400">{strategy.content_calendar.length}</div><div className="text-xs text-gray-500">Calendar</div></div>
                    <div className="text-center"><div className="text-xl sm:text-2xl font-bold text-purple-400">{strategy.social_templates.length}</div><div className="text-xs text-gray-500">Social</div></div>
                    {googleConnected && googleSyncResult?.connected && (
                      <div className="text-center"><div className="text-xl sm:text-2xl font-bold text-cyan-400">✓</div><div className="text-xs text-gray-500">Synced</div></div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Overview */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl">
              <h2 className="text-lg sm:text-2xl font-bold text-white mb-4 sm:mb-6">📋 Content Overview</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
                {[
                  { label: 'Business Model',   val: strategy.analysis.business_model },
                  { label: 'Target Audience',  val: strategy.analysis.target_audience },
                  { label: 'Industry',         val: strategy.analysis.industry },
                  { label: 'Content Pillars',  val: `${strategy.analysis.content_pillars.length} Topics` },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <div className="text-xs sm:text-sm text-gray-400 mb-1">{label}</div>
                    <div className="text-sm sm:text-lg font-semibold text-white">{val}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 sm:mt-6 flex flex-wrap gap-1.5 sm:gap-2">
                {strategy.analysis.content_pillars.map((p, i) => (
                  <span key={i} className="px-2.5 sm:px-4 py-1 sm:py-2 bg-green-500/20 border border-green-500/30 rounded-full text-xs sm:text-sm text-green-400">{p}</span>
                ))}
              </div>
            </motion.div>

            {/* Trending Topics */}
            {strategy.trending_topics?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-orange-500/20">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <span className="text-2xl sm:text-3xl">🔥</span>
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-white">Trending Topics</h2>
                    <p className="text-xs sm:text-sm text-gray-400">Hot discussions in your industry</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {strategy.trending_topics.map((t, i) => (
                    <div key={i} className="glass p-3 sm:p-4 rounded-xl">
                      <div className="font-semibold text-white text-sm sm:text-base mb-1.5 sm:mb-2">{t.topic}</div>
                      <div className="text-xs sm:text-sm text-gray-400 mb-2 sm:mb-3">{t.why_trending}</div>
                      <div className="text-xs text-green-400">💡 {t.content_angle}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Tab Bar — scrollable on mobile */}
            <div className="tab-scroll overflow-x-auto">
              <div className="glass p-1.5 sm:p-2 rounded-xl inline-flex gap-1 sm:gap-2 min-w-max">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`tab-btn ${activeTab === tab.id ? 'active' : 'text-gray-400'}`}
                  >
                    <span className="sm:hidden">{tab.label} {tab.full}</span>
                    <span className="hidden sm:inline">{tab.label} {tab.full}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Calendar Tab */}
            {activeTab === 'calendar' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-2xl font-bold text-white">📅 12-Month Content Calendar</h2>
                  {googleConnected && googleSyncResult?.calendar && (
                    <span className="text-xs sm:text-sm text-green-400 bg-green-500/10 px-2.5 sm:px-3 py-1 rounded-full self-start sm:self-auto">
                      ✓ {googleSyncResult.calendar.created?.length || 0} in Google Calendar
                    </span>
                  )}
                </div>
                <div className="space-y-3 sm:space-y-4">
                  {strategy.content_calendar.map((item) => (
                    <div key={item.id} className="content-card p-3 sm:p-4 rounded-xl">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 mb-1.5 sm:mb-2">
                            <div className="text-xs sm:text-sm font-semibold text-green-400">{item.publish_date}</div>
                            <span className="text-xs bg-white/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">{item.pillar}</span>
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">{item.type}</span>
                          </div>
                          <div className="font-semibold text-white text-xs sm:text-sm mb-1">{item.title}</div>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-400">
                            <span>📝 {item.word_count}w</span>
                            <span className="hidden sm:inline">🔍 {item.seo_keyword}</span>
                            <span>📱 {item.social_posts} posts</span>
                          </div>
                        </div>
                        <div className="text-center shrink-0">
                          <div className="text-xs text-gray-500">Wk {item.week}</div>
                          <div className="text-sm sm:text-base font-bold text-white">{item.month}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Blog Ideas Tab */}
            {activeTab === 'blog' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl">
                <h2 className="text-lg sm:text-2xl font-bold text-white mb-4 sm:mb-6">📝 Blog Post Ideas ({strategy.blog_ideas.length})</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {strategy.blog_ideas.map((blog) => (
                    <button key={blog.id} onClick={() => setSelectedBlog(blog)} className="content-card p-4 sm:p-6 rounded-xl text-left">
                      <div className="flex items-start justify-between mb-2 sm:mb-3">
                        <span className="text-xs bg-white/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">{blog.pillar}</span>
                        <span className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded ${diffColor(blog.difficulty)}`}>{blog.difficulty}</span>
                      </div>
                      <h3 className="font-semibold text-white text-xs sm:text-sm mb-2 sm:mb-3 leading-snug">{blog.title}</h3>
                      <div className="flex items-center gap-2 sm:gap-4 text-xs text-gray-400">
                        <span>📝 {blog.estimated_word_count}w</span>
                        <span>📊 {blog.type}</span>
                      </div>
                      {blog.seo_focus && <div className="text-xs text-green-400 mt-1.5">🔍 {blog.seo_focus}</div>}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Social Templates Tab */}
            {activeTab === 'social' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 sm:space-y-6">
                {(['LinkedIn','Twitter','Facebook'] as const).map((platform) => {
                  const posts = strategy.social_templates.filter(t => t.platform === platform);
                  if (!posts.length) return null;
                  return (
                    <div key={platform} className="glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl">
                      <h2 className="text-lg sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                        <span>{platform === 'LinkedIn' ? '💼' : platform === 'Twitter' ? '🐦' : '👥'}</span>
                        <span>{platform} Posts ({posts.length})</span>
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {posts.map((post, idx) => (
                          <button key={idx} onClick={() => setSelectedSocial(post)} className="content-card p-4 sm:p-6 rounded-xl text-left">
                            <div className="text-xs text-gray-400 mb-1.5 sm:mb-2 truncate">{post.blog_title}</div>
                            <p className="text-xs sm:text-sm text-gray-300 mb-2 sm:mb-3 line-clamp-3">{post.post_text}</p>
                            <div className="flex flex-wrap gap-1 mb-1.5 sm:mb-2">
                              {post.hashtags.slice(0, 3).map((tag, i) => <span key={i} className="text-xs text-blue-400">{tag}</span>)}
                            </div>
                            <div className="text-xs text-gray-500">⏰ {post.best_time_to_post}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* SEO Tab */}
            {activeTab === 'seo' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl">
                <h2 className="text-lg sm:text-2xl font-bold text-white mb-4 sm:mb-6">🔍 SEO Keywords ({strategy.seo_keywords.length})</h2>
                <div className="space-y-3 sm:space-y-4">
                  {strategy.seo_keywords.map((kw, idx) => (
                    <div key={idx} className="content-card p-4 sm:p-6 rounded-xl">
                      <div className="flex items-start justify-between mb-2 sm:mb-4 gap-3">
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-xl font-bold text-white mb-1">{kw.keyword}</h3>
                          <div className="text-xs sm:text-sm text-gray-400">{kw.content_angle}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-lg sm:text-2xl font-bold text-green-400">{kw.search_volume.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">searches/mo</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
                        <span className="text-xs sm:text-sm">Competition: <span className={compColor(kw.competition)}>{kw.competition}</span></span>
                      </div>
                      {kw.related_keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {kw.related_keywords.map((r, i) => <span key={i} className="text-xs bg-white/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-gray-300">{r}</span>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Email Templates */}
            {strategy.email_templates?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-blue-500/20">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-2xl sm:text-3xl">📧</span>
                    <div>
                      <h2 className="text-lg sm:text-2xl font-bold text-white">Email Distribution Templates</h2>
                      <p className="text-xs sm:text-sm text-gray-400">Ready-to-use email templates</p>
                    </div>
                  </div>
                  {googleConnected && googleSyncResult?.gmail && (
                    <span className="text-xs sm:text-sm text-blue-400 bg-blue-500/10 px-2.5 sm:px-3 py-1 rounded-full self-start sm:self-auto">
                      ✓ {googleSyncResult.gmail.created?.length || 0} drafts in Gmail
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {strategy.email_templates.map((t, idx) => (
                    <button key={idx} onClick={() => setSelectedEmail(t)} className="glass p-4 sm:p-6 rounded-xl hover:bg-white/10 transition-all text-left border border-white/10 hover:border-blue-400/30">
                      <div className="text-xl sm:text-2xl mb-2 sm:mb-3">✉️</div>
                      <div className="font-semibold text-white text-sm mb-1.5 sm:mb-2">{t.name}</div>
                      <div className="text-xs text-gray-400 mb-1.5 sm:mb-2">{t.use_case}</div>
                      <div className="text-xs text-blue-400">To: {t.recipients}</div>
                    </button>
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
              <button onClick={generateStrategy} className="gradient-content text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:scale-105 transition-all text-sm sm:text-base w-full sm:w-auto">
                Regenerate Strategy
              </button>
              <button onClick={() => navigate(`/landing-page?ideaId=${effectiveId}`)} className="gradient-landing text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:scale-105 transition-all text-sm sm:text-base flex items-center justify-center gap-2 w-full sm:w-auto">
                🌐 Build Landing Page
              </button>
            </motion.div>

          </div>
        )}
      </div>

      {/* ── Blog Modal ── */}
      {selectedBlog && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 p-0 sm:p-6" onClick={() => setSelectedBlog(null)}>
          <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }}
            className="glass w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto p-5 sm:p-8 rounded-t-3xl sm:rounded-3xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-2xl font-bold text-white">Blog Post Details</h2>
              <button onClick={() => setSelectedBlog(null)} className="text-gray-400 hover:text-white text-2xl shrink-0">×</button>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <div className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">Title:</div>
                <div className="text-sm sm:text-lg font-semibold text-white">{selectedBlog.title}</div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div><div className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">Pillar:</div><div className="text-white text-sm">{selectedBlog.pillar}</div></div>
                <div><div className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">Type:</div><div className="text-white text-sm">{selectedBlog.type}</div></div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div><div className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">Word Count:</div><div className="text-white text-sm">{selectedBlog.estimated_word_count} words</div></div>
                <div><div className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">Difficulty:</div><span className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm ${diffColor(selectedBlog.difficulty)}`}>{selectedBlog.difficulty}</span></div>
              </div>
              <div><div className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">SEO Keyword:</div><div className="text-green-400 text-sm">{selectedBlog.seo_focus}</div></div>
              <button onClick={() => copy(selectedBlog.title)} className="w-full bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all text-sm">
                📋 Copy Title
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Social Modal ── */}
      {selectedSocial && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 p-0 sm:p-6" onClick={() => setSelectedSocial(null)}>
          <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }}
            className="glass w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto p-5 sm:p-8 rounded-t-3xl sm:rounded-3xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 sm:mb-6 gap-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <span className="text-2xl sm:text-3xl shrink-0">{selectedSocial.platform === 'LinkedIn' ? '💼' : selectedSocial.platform === 'Twitter' ? '🐦' : '👥'}</span>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-2xl font-bold text-white">{selectedSocial.platform} Post</h2>
                  <p className="text-xs sm:text-sm text-gray-400 truncate">{selectedSocial.blog_title}</p>
                </div>
              </div>
              <button onClick={() => setSelectedSocial(null)} className="text-gray-400 hover:text-white text-2xl shrink-0">×</button>
            </div>
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white/5 p-3 sm:p-4 rounded-xl">
                <div className="text-xs sm:text-sm text-gray-400 mb-2 sm:mb-3">Post Text:</div>
                <div className="text-white text-xs sm:text-sm whitespace-pre-line">{selectedSocial.post_text}</div>
                <div className="text-xs text-gray-500 mt-2">{selectedSocial.character_count} chars</div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-gray-400 mb-2">Hashtags:</div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">{selectedSocial.hashtags.map((t, i) => <span key={i} className="text-blue-400 text-xs sm:text-sm">{t}</span>)}</div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-gray-400 mb-2">Best Time:</div>
                <div className="text-white text-xs sm:text-sm">⏰ {selectedSocial.best_time_to_post}</div>
              </div>
              <button onClick={() => copy(selectedSocial.post_text + '\n\n' + selectedSocial.hashtags.join(' '))} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all text-sm">
                📋 Copy Post
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Email Modal ── */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 p-0 sm:p-6" onClick={() => setSelectedEmail(null)}>
          <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }}
            className="glass w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto p-5 sm:p-8 rounded-t-3xl sm:rounded-3xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 sm:mb-6 gap-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <span className="text-2xl sm:text-3xl shrink-0">📧</span>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-2xl font-bold text-white">{selectedEmail.name}</h2>
                  <p className="text-xs sm:text-sm text-gray-400">{selectedEmail.use_case}</p>
                </div>
              </div>
              <button onClick={() => setSelectedEmail(null)} className="text-gray-400 hover:text-white text-2xl shrink-0">×</button>
            </div>
            <div className="space-y-3 sm:space-y-6">
              <div className="bg-white/5 p-3 sm:p-4 rounded-xl"><div className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">To:</div><div className="text-white text-xs sm:text-sm">{selectedEmail.recipients}</div></div>
              <div className="bg-white/5 p-3 sm:p-4 rounded-xl"><div className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">Subject:</div><div className="text-white font-semibold text-xs sm:text-sm">{selectedEmail.subject}</div></div>
              <div className="bg-white/5 p-3 sm:p-4 rounded-xl"><div className="text-xs sm:text-sm text-gray-400 mb-2 sm:mb-3">Body:</div><div className="text-gray-300 whitespace-pre-line font-mono text-xs">{selectedEmail.body}</div></div>
              <button onClick={() => copy(selectedEmail.body)} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all text-sm">
                📋 Copy Email Template
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}