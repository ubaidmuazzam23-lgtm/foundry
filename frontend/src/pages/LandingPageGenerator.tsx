// File: frontend/src/pages/LandingPageGenerator.tsx
// Fixed: localhost → env var, safe JSON, mobile-responsive

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';

type DeployStatus = 'idle' | 'extracting' | 'generating' | 'deploying' | 'done' | 'error';

interface DeployResult {
  startup_name: string;
  live_url: string;
  html_preview: string;
  html_length: number;
  status: string;
}

const STEPS = [
  { icon: '🔍', label: 'Extracting startup data',   sub: 'Reading your idea details...'  },
  { icon: '🤖', label: 'Generating with GPT-4o',    sub: 'Crafting beautiful HTML...'     },
  { icon: '🚀', label: 'Deploying to GitHub Pages', sub: 'Publishing your live site...'   },
  { icon: '✅', label: 'Live & ready!',             sub: 'Your landing page is online.'   },
];

const PRESET_COLORS = ['#6366f1','#8B5CF6','#EC4899','#10B981','#F59E0B','#EF4444','#0EA5E9'];

export default function LandingPageGenerator() {
  const navigate       = useNavigate();
  const { user }       = useUser();
  const [searchParams] = useSearchParams();
  const ideaId         = searchParams.get('ideaId');

  const [status,     setStatus]     = useState<DeployStatus>('idle');
  const [result,     setResult]     = useState<DeployResult | null>(null);
  const [error,      setError]      = useState<string | null>(null);
  const [brandColor, setBrandColor] = useState('#6366f1');
  const [ctaText,    setCtaText]    = useState('Get Early Access');
  const [activeStep, setActiveStep] = useState(-1);
  const [copied,     setCopied]     = useState(false);

  const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    if (status === 'extracting') setActiveStep(0);
    if (status === 'generating') setActiveStep(1);
    if (status === 'deploying')  setActiveStep(2);
    if (status === 'done')       setActiveStep(3);
  }, [status]);

  // ── safe JSON helper ──────────────────────────────────────────────────────
  const safeJson = async (res: Response) => {
    const text = await res.text();
    if (!text || text.trim() === '')
      throw new Error(`Empty response (status ${res.status})`);
    try { return JSON.parse(text); }
    catch { throw new Error(`Invalid JSON: ${text.slice(0, 150)}`); }
  };

  const generate = async () => {
    if (!ideaId) return;
    setError(null);
    setResult(null);
    try {
      setStatus('extracting');
      await new Promise(r => setTimeout(r, 800));
      setStatus('generating');

      const response = await fetch(`${API}/api/v1/landing-page/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structured_idea_id: parseInt(ideaId),
          brand_color: brandColor,
          cta_text: ctaText || undefined,
        }),
      });

      const data = await safeJson(response);
      if (!response.ok) throw new Error(data?.detail || `Server error ${response.status}`);

      setStatus('deploying');
      await new Promise(r => setTimeout(r, 600));

      setResult(data);
      setStatus('done');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setStatus('error');
    }
  };

  const copyUrl = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.live_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isRunning = ['extracting', 'generating', 'deploying'].includes(status);

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        *{font-family:'Inter',sans-serif;box-sizing:border-box;}
        .glass{background:rgba(255,255,255,0.03);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08);}
        .gradient-landing{background:linear-gradient(135deg,#8B5CF6 0%,#6D28D9 100%);}
        .step-card{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);transition:all 0.4s ease;}
        .step-card.active{background:rgba(139,92,246,0.12);border-color:rgba(139,92,246,0.4);box-shadow:0 0 24px rgba(139,92,246,0.2);}
        .step-card.done{background:rgba(16,185,129,0.08);border-color:rgba(16,185,129,0.3);}
        .result-card{background:linear-gradient(135deg,rgba(139,92,246,0.15) 0%,rgba(109,40,217,0.08) 100%);border:2px solid rgba(139,92,246,0.4);}
        .url-box{background:rgba(0,0,0,0.4);border:1px solid rgba(139,92,246,0.3);font-family:'Courier New',monospace;}
        .color-swatch{width:24px;height:24px;border-radius:5px;border:2px solid rgba(255,255,255,0.2);cursor:pointer;transition:transform 0.15s;}
        .color-swatch:hover{transform:scale(1.15);}
        @keyframes shimmer{0%{background-position:-200% 0;}100%{background-position:200% 0;}}
        .shimmer{background:linear-gradient(90deg,rgba(139,92,246,0.1) 25%,rgba(139,92,246,0.3) 50%,rgba(139,92,246,0.1) 75%);background-size:200% 100%;animation:shimmer 1.8s infinite;}
        @keyframes float{0%,100%{transform:translateY(0px);}50%{transform:translateY(-8px);}}
        .float{animation:float 3s ease-in-out infinite;}
        button{-webkit-tap-highlight-color:transparent;min-height:40px;}
        ::-webkit-scrollbar{height:3px;width:3px;}
        ::-webkit-scrollbar-thumb{background:#8B5CF6;border-radius:4px;}
        p,h1,h2,h3,span,div{word-break:break-word;overflow-wrap:anywhere;}
      `}</style>

      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-purple-700 opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-violet-700 opacity-10 rounded-full blur-3xl"></div>
      </div>

      {/* Nav */}
      <nav className="glass sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-3 sm:px-6">
          <div className="flex justify-between h-14 sm:h-16 items-center">
            <button
              onClick={() => navigate(`/content-marketing?ideaId=${ideaId}`)}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-all"
            >
              <span className="text-sm">←</span>
              <span className="text-xs sm:text-sm font-medium hidden xs:block">Content Strategy</span>
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-purple-500"></div>
              <span className="text-xs sm:text-sm font-semibold text-white">Landing Page Generator</span>
            </div>
            {user && (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold text-xs sm:text-sm shrink-0">
                {user.firstName?.charAt(0) || user.emailAddresses[0]?.emailAddress.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-12 relative z-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8 sm:mb-14">
          <div className="inline-flex items-center gap-2 glass px-3 py-1.5 sm:px-4 sm:py-2 rounded-full mb-4 sm:mb-6">
            <span className="text-lg sm:text-xl float">🚀</span>
            <span className="text-xs sm:text-sm font-semibold text-white">AI-Powered Landing Page</span>
            <span className="text-xs bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/40">GPT-4o</span>
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-3 sm:mb-6 tracking-tight">
            Launch Your
            <span className="block bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
              Landing Page
            </span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-lg max-w-xl mx-auto px-2">
            GPT-4o generates a beautiful, conversion-optimized page from your startup data —
            then auto-deploys it to GitHub Pages for free.
          </p>
        </motion.div>

        {/* ── IDLE ── */}
        {status === 'idle' && (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 sm:space-y-8">

            {/* Customize */}
            <div className="glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl">
              <h2 className="text-base sm:text-xl font-bold text-white mb-4 sm:mb-6">⚙️ Customize Your Page</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

                {/* Brand Color */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2 sm:mb-3">Brand Color</label>
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={e => setBrandColor(e.target.value)}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl cursor-pointer bg-transparent border-0 shrink-0"
                    />
                    <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                      {PRESET_COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => setBrandColor(c)}
                          className="color-swatch"
                          style={{
                            background: c,
                            outline: brandColor === c ? '2px solid white' : 'none',
                            outlineOffset: '2px',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Selected: <span style={{ color: brandColor }}>{brandColor}</span>
                  </p>
                </div>

                {/* CTA Text */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2 sm:mb-3">CTA Button Text</label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={e => setCtaText(e.target.value)}
                    placeholder="Get Early Access"
                    className="w-full glass px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-2">Appears on the main hero button</p>
                </div>
              </div>
            </div>

            {/* What gets generated */}
            <div className="glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl">
              <h2 className="text-base sm:text-xl font-bold text-white mb-4 sm:mb-6">✨ What Gets Generated</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                {[
                  { icon: '🏠', label: 'Hero Section',         sub: 'Headline + CTA'       },
                  { icon: '⚡', label: 'Problem / Solution',   sub: 'Compelling narrative' },
                  { icon: '🎯', label: 'Features Grid',        sub: 'With icons'           },
                  { icon: '💬', label: 'Testimonials',         sub: 'Social proof'         },
                  { icon: '📧', label: 'Email Signup',         sub: 'Lead capture'         },
                  { icon: '📱', label: 'Fully Responsive',     sub: 'Mobile-first'         },
                  { icon: '🎨', label: 'Your Brand Colors',    sub: 'Auto-applied'         },
                  { icon: '🌐', label: 'GitHub Pages',         sub: 'Free hosting'         },
                ].map((item, i) => (
                  <div key={i} className="step-card p-3 sm:p-4 rounded-xl text-center">
                    <div className="text-xl sm:text-2xl mb-1.5 sm:mb-2">{item.icon}</div>
                    <div className="text-xs sm:text-sm font-semibold text-white mb-0.5 sm:mb-1 leading-snug">{item.label}</div>
                    <div className="text-xs text-gray-500 hidden sm:block">{item.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <div className="text-center">
              <button
                onClick={generate}
                className="gradient-landing text-white px-10 sm:px-16 py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-xl hover:scale-105 transition-all shadow-lg shadow-purple-900/40 flex items-center gap-2 sm:gap-3 mx-auto w-full sm:w-auto justify-center"
              >
                <span>🚀</span><span>Generate & Deploy</span>
              </button>
              <p className="text-gray-500 text-xs sm:text-sm mt-3">Takes ~30–60 seconds · Free to deploy</p>
            </div>
          </motion.div>
        )}

        {/* ── RUNNING ── */}
        {isRunning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass p-6 sm:p-10 rounded-3xl">
            <div className="text-center mb-6 sm:mb-10">
              <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Building Your Landing Page...</h2>
              <p className="text-gray-400 text-xs sm:text-sm mt-2">Sit tight, magic is happening ✨</p>
            </div>
            <div className="space-y-3 sm:space-y-4 max-w-lg mx-auto">
              {STEPS.slice(0, 3).map((step, i) => {
                const isDone   = activeStep > i;
                const isActive = activeStep === i;
                return (
                  <div
                    key={i}
                    className={`step-card p-4 sm:p-5 rounded-2xl flex items-center gap-3 sm:gap-4 ${isActive ? 'active shimmer' : isDone ? 'done' : ''}`}
                  >
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-lg sm:text-xl shrink-0 ${
                      isDone   ? 'bg-green-500/20 border border-green-500/40' :
                      isActive ? 'bg-purple-500/20 border border-purple-500/40' :
                                 'bg-white/5 border border-white/10'
                    }`}>
                      {isDone ? '✅' : isActive ? <span className="animate-pulse">{step.icon}</span> : step.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold text-sm sm:text-base ${isDone ? 'text-green-400' : isActive ? 'text-purple-300' : 'text-gray-500'}`}>
                        {step.label}
                      </div>
                      <div className="text-xs text-gray-500">{step.sub}</div>
                    </div>
                    {isActive && (
                      <div className="flex gap-1 shrink-0">
                        {[0,1,2].map(d => (
                          <div key={d} className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${d * 0.15}s` }}></div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── DONE ── */}
        {status === 'done' && result && (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4 sm:space-y-8">

              {/* Main result card */}
              <div className="result-card p-6 sm:p-8 rounded-3xl text-center">
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
                  className="w-16 h-16 sm:w-24 sm:h-24 bg-green-500/20 border-2 border-green-500/40 rounded-full flex items-center justify-center text-3xl sm:text-5xl mx-auto mb-4 sm:mb-6"
                >
                  🎉
                </motion.div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Your page is live!</h2>
                <p className="text-gray-400 text-sm sm:text-base mb-6 sm:mb-8">
                  <span className="text-purple-300 font-semibold">{result.startup_name}</span>'s landing page has been deployed.
                </p>

                {/* URL box */}
                <div className="url-box px-3 sm:px-6 py-3 sm:py-4 rounded-xl text-xs sm:text-sm text-purple-300 mb-4 sm:mb-6 flex items-center justify-between gap-2 sm:gap-4 max-w-xl mx-auto">
                  <span className="truncate">{result.live_url}</span>
                  <button
                    onClick={copyUrl}
                    className="shrink-0 text-xs bg-purple-500/30 hover:bg-purple-500/50 text-purple-200 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all"
                  >
                    {copied ? '✅ Copied!' : '📋 Copy'}
                  </button>
                </div>

                {/* Action buttons — stacked on mobile */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
                  <a
                    href={result.live_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gradient-landing text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold hover:scale-105 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    🌐 Open Live Page
                  </a>
                  <button
                    onClick={generate}
                    className="glass text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:scale-105 transition-all text-sm sm:text-base"
                  >
                    🔄 Regenerate
                  </button>
                  <button
                    onClick={() => navigate(`/content-marketing?ideaId=${ideaId}`)}
                    className="glass text-gray-400 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:text-white transition-all text-sm sm:text-base"
                  >
                    ← Back to Strategy
                  </button>
                </div>
              </div>

              {/* Stats — 3-col on all sizes, just smaller on mobile */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                {[
                  { label: 'HTML Size',     value: `${(result.html_length / 1024).toFixed(1)} KB`, icon: '📄' },
                  { label: 'Deploy Target', value: 'GitHub Pages',                                  icon: '🐙' },
                  { label: 'Status',        value: 'Live ✓',                                        icon: '🟢' },
                ].map((stat, i) => (
                  <div key={i} className="glass p-3 sm:p-6 rounded-2xl text-center">
                    <div className="text-xl sm:text-2xl mb-1 sm:mb-2">{stat.icon}</div>
                    <div className="text-sm sm:text-xl font-bold text-white mb-0.5 sm:mb-1">{stat.value}</div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* HTML preview */}
              <div className="glass p-4 sm:p-6 rounded-2xl">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-400 mb-2 sm:mb-3">👁️ HTML Preview</h3>
                <pre className="text-xs text-gray-500 bg-black/40 p-3 sm:p-4 rounded-xl overflow-x-auto whitespace-pre-wrap max-h-48 sm:max-h-none">
                  {result.html_preview}
                </pre>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── ERROR ── */}
        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="glass p-8 sm:p-10 rounded-3xl text-center border border-red-500/20"
          >
            <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">❌</div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Generation Failed</h2>
            <p className="text-red-400 text-xs sm:text-sm mb-6 sm:mb-8 max-w-md mx-auto">{error}</p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
              <button
                onClick={() => setStatus('idle')}
                className="gradient-landing text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:scale-105 transition-all text-sm sm:text-base"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate(`/content-marketing?ideaId=${ideaId}`)}
                className="glass text-gray-400 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:text-white transition-all text-sm sm:text-base"
              >
                ← Back
              </button>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}