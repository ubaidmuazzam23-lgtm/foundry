// File: frontend/src/components/OriginalityScore.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface OriginalityResult {
  originality_score: number;
  verdict: string;
  reasoning: string;
  differentiators: string[];
  risk: string;
  recommendation: string;
  similar_startups: { name: string; field: string; similarity: number; snippet: string }[];
}

export default function OriginalityScore({ ideaId, ideaText }: { ideaId?: number; ideaText?: string }) {
  const [result, setResult]     = useState<OriginalityResult | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const run = async () => {
    if (!ideaText && !ideaId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:8000/api/v1/originality/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea_text: ideaText || '', idea_id: ideaId }),
      });
      if (!res.ok) throw new Error('Scoring failed');
      setResult(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (ideaText || ideaId) run(); }, [ideaId]);

  const scoreColor = (s: number) =>
    s >= 75 ? '#4ADE80' : s >= 50 ? '#D4DE95' : s >= 25 ? '#F59E0B' : '#EF4444';

  const verdictBg = (v: string) => {
    if (v?.includes('Highly'))    return 'bg-green-500/10 border-green-500/20 text-green-400';
    if (v?.includes('Moderately')) return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
    if (v?.includes('Very'))      return 'bg-red-500/10 border-red-500/20 text-red-400';
    return 'bg-orange-500/10 border-orange-500/20 text-orange-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-8 rounded-3xl"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
            AI Powered
          </p>
          <h3 className="text-xl font-bold text-white">🧬 Idea Originality Score</h3>
        </div>
        {result && (
          <button
            onClick={run}
            style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 12px', cursor: 'pointer' }}
          >
            Re-run
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-10">
          <div className="w-12 h-12 border-2 border-[#636B2F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Searching 10,000 startups...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '16px', marginBottom: 16 }}>
          <p style={{ color: '#EF4444', fontSize: 13 }}>{error}</p>
          <button onClick={run} style={{ marginTop: 8, fontSize: 12, color: '#D4DE95', cursor: 'pointer', background: 'none', border: 'none' }}>
            Try again →
          </button>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Score circle + verdict */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {/* Circle */}
            <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke={scoreColor(result.originality_score)}
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - result.originality_score / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: scoreColor(result.originality_score) }}>
                  {result.originality_score}
                </span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>/100</span>
              </div>
            </div>

            <div>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold border ${verdictBg(result.verdict)}`} style={{ marginBottom: 8, display: 'inline-block' }}>
                {result.verdict}
              </span>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.6, maxWidth: '42ch' }}>
                {result.reasoning}
              </p>
            </div>
          </div>

          {/* Similar startups */}
          {result.similar_startups?.length > 0 && (
            <div>
              <p style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>
                Similar Startups Found
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.similar_startups.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 14px' }}>
                    <div>
                      <span style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{s.name}</span>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginLeft: 8 }}>{s.field}</span>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2 }}>{s.snippet}</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: s.similarity > 70 ? '#EF4444' : s.similarity > 50 ? '#F59E0B' : '#4ADE80' }}>
                        {s.similarity}%
                      </span>
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>similar</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Differentiators */}
          {result.differentiators?.length > 0 && (
            <div style={{ background: 'rgba(99,107,47,0.1)', border: '1px solid rgba(99,107,47,0.2)', borderRadius: 12, padding: 16 }}>
              <p style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#D4DE95', marginBottom: 8 }}>
                Your Differentiators
              </p>
              {result.differentiators.map((d, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                  <span style={{ color: '#D4DE95' }}>→</span>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{d}</p>
                </div>
              ))}
            </div>
          )}

          {/* Risk + Recommendation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: 10, padding: 14 }}>
              <p style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#EF4444', marginBottom: 6 }}>Risk</p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 1.5 }}>{result.risk}</p>
            </div>
            <div style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.12)', borderRadius: 10, padding: 14 }}>
              <p style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4ADE80', marginBottom: 6 }}>Recommendation</p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 1.5 }}>{result.recommendation}</p>
            </div>
          </div>

        </div>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="text-center py-8">
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, marginBottom: 12 }}>
            Check how original your idea is against 10,000+ real startups
          </p>
          <button
            onClick={run}
            style={{ background: 'rgba(99,107,47,0.3)', border: '1px solid rgba(99,107,47,0.4)', color: '#D4DE95', padding: '8px 20px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
          >
            Run Originality Check →
          </button>
        </div>
      )}
    </motion.div>
  );
}