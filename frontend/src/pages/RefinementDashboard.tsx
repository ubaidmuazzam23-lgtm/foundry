// File: frontend/src/pages/RefinementDashboard.tsx
// Feature 10: Refinement Dashboard - Hybrid output refinement

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';

export default function RefinementDashboard() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [searchParams] = useSearchParams();
  const ideaId = searchParams.get('ideaId');

  const [isLoading, setIsLoading] = useState(true);
  const [isRefining, setIsRefining] = useState(false);
  const [statusData, setStatusData] = useState<any>(null);
  const [refinementResult, setRefinementResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    if (!ideaId) return;
    setIsLoading(true);

    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/refinement/status/${ideaId}`
      );
      const data = await response.json();

      if (data.status === 'success') {
        setStatusData(data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const startRefinement = async () => {
    if (!ideaId) return;
    setIsRefining(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/refinement/refine/${ideaId}`,
        { method: 'POST' }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Refinement failed');
      }

      setRefinementResult(data);
      // Refresh status data
      await fetchStatus();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRefining(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [ideaId]);

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 7) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#636B2F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading refinement data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; }
        .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.08); }
        .gradient-primary { background: linear-gradient(135deg, #636B2F 0%, #3D4127 100%); }
      `}</style>

      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#636B2F] opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#D4DE95] opacity-5 rounded-full blur-3xl"></div>
      </div>

      <nav className="glass sticky top-0 z-50 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <button
              onClick={() => navigate(`/quality-check?ideaId=${ideaId}`)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-all"
            >
              <span>←</span>
              <span className="text-sm font-medium">Quality Check</span>
            </button>
            {user && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-8 h-8 rounded-full bg-[#636B2F] flex items-center justify-center text-white font-semibold">
                  {user.firstName?.charAt(0) || user.emailAddresses[0]?.emailAddress.charAt(0).toUpperCase()}
                </div>
                <span>{user.firstName || user.emailAddresses[0]?.emailAddress.split('@')[0]}</span>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-6">
            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
            <span className="text-sm font-semibold text-white">Output Refinement</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Refine
            <span className="block bg-gradient-to-r from-[#D4DE95] to-[#636B2F] bg-clip-text text-transparent">
              Outputs
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            AI-powered hybrid refinement: LLM rewrites weak sections, then re-gathers missing data
          </p>
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass border-red-500/20 p-4 rounded-xl mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}

        {/* Issues Summary — what failed and why */}
        {statusData && !refinementResult && !isRefining && (
          <div className="space-y-6">
            {/* Market Validation Issues */}
            {statusData.original_issues?.market_validation?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 rounded-3xl border-2 border-red-500/20">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">📊 Market Validation Issues</h3>
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${getScoreColor(statusData.original_scores?.market_validation || 0)}`}>
                      {statusData.original_scores?.market_validation || '?'}/10
                    </div>
                    <div className="text-sm text-red-400">Failed</div>
                  </div>
                </div>

                <div className="space-y-2">
                  {statusData.original_issues.market_validation.map((issue: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 bg-red-500/10 p-3 rounded-lg">
                      <span className="text-red-400 mt-0.5">⚠</span>
                      <p className="text-sm text-gray-300">{issue}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Competitor Analysis Issues */}
            {statusData.original_issues?.competitor_analysis?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 rounded-3xl border-2 border-red-500/20">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">⚔️ Competitor Analysis Issues</h3>
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${getScoreColor(statusData.original_scores?.competitor_analysis || 0)}`}>
                      {statusData.original_scores?.competitor_analysis || '?'}/10
                    </div>
                    <div className="text-sm text-red-400">Failed</div>
                  </div>
                </div>

                <div className="space-y-2">
                  {statusData.original_issues.competitor_analysis.map((issue: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 bg-red-500/10 p-3 rounded-lg">
                      <span className="text-red-400 mt-0.5">⚠</span>
                      <p className="text-sm text-gray-300">{issue}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* No issues to show — already passed */}
            {(!statusData.original_issues?.market_validation?.length && !statusData.original_issues?.competitor_analysis?.length) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass p-12 rounded-3xl text-center border-2 border-green-500/20">
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-2xl font-bold text-white mb-4">All Outputs Already Pass!</h2>
                <p className="text-gray-400 mb-6">No refinement needed. Your outputs meet quality standards.</p>
                <button
                  onClick={() => navigate(`/quality-check?ideaId=${ideaId}`)}
                  className="gradient-primary text-white px-8 py-4 rounded-xl font-semibold hover:scale-105 transition-all"
                >
                  Back to Quality Check
                </button>
              </motion.div>
            )}

            {/* Start Refinement Button */}
            {(statusData.original_issues?.market_validation?.length > 0 || statusData.original_issues?.competitor_analysis?.length > 0) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                <button
                  onClick={startRefinement}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black px-12 py-5 rounded-xl font-bold text-lg hover:scale-105 transition-all"
                >
                  🔧 Start Refinement
                </button>
                <p className="text-gray-500 text-sm mt-3">
                  This will rewrite weak sections with AI and re-gather missing data
                </p>
              </motion.div>
            )}
          </div>
        )}

        {/* Refining State */}
        {isRefining && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass p-12 rounded-3xl text-center">
            <div className="w-20 h-20 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-white mb-4">Refining Outputs...</h2>
            <div className="space-y-3 text-sm text-gray-400 max-w-md mx-auto">
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0 }}>
                🔍 Analyzing critic feedback...
              </motion.p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}>
                ✍️ Rewriting weak sections with AI...
              </motion.p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 5 }}>
                🌐 Re-gathering missing data from web...
              </motion.p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 8 }}>
                🔧 Applying programmatic fixes...
              </motion.p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 12 }}>
                ✅ Merging improvements...
              </motion.p>
            </div>
          </motion.div>
        )}

        {/* Refinement Complete */}
        {refinementResult && !isRefining && (
          <div className="space-y-6">
            {/* Success Banner */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass p-8 rounded-3xl border-2 border-green-500/30 bg-green-500/5"
            >
              <div className="text-center">
                <div className="text-6xl mb-4">🔧</div>
                <h2 className="text-3xl font-bold text-white mb-2">Refinement Complete!</h2>
                <p className="text-gray-400 mb-2">{refinementResult.message}</p>
                <p className="text-sm text-gray-500">Iteration: {refinementResult.iteration}</p>
              </div>
            </motion.div>

            {/* Refinement Details */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 rounded-3xl">
              <h3 className="text-xl font-bold text-white mb-6">Refinement Summary</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Market Validation */}
                <div className={`p-6 rounded-xl ${
                  refinementResult.refinement_log?.market_validation?.refined
                    ? 'bg-green-500/10 border border-green-500/30'
                    : 'bg-gray-500/10 border border-gray-500/30'
                }`}>
                  <h4 className="text-lg font-semibold text-white mb-3">📊 Market Validation</h4>
                  {refinementResult.refinement_log?.market_validation?.refined ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Original Score:</span>
                        <span className={getScoreColor(refinementResult.refinement_log.market_validation.original_score || 0)}>
                          {refinementResult.refinement_log.market_validation.original_score}/10
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Issues Addressed:</span>
                        <span className="text-green-400">
                          {refinementResult.refinement_log.market_validation.issues_addressed}
                        </span>
                      </div>
                      <div className="mt-3 bg-green-500/10 p-2 rounded-lg text-center">
                        <span className="text-green-400 text-sm font-semibold">✅ Refined</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">Already passed — no changes needed</p>
                  )}
                </div>

                {/* Competitor Analysis */}
                <div className={`p-6 rounded-xl ${
                  refinementResult.refinement_log?.competitor_analysis?.refined
                    ? 'bg-green-500/10 border border-green-500/30'
                    : 'bg-gray-500/10 border border-gray-500/30'
                }`}>
                  <h4 className="text-lg font-semibold text-white mb-3">⚔️ Competitor Analysis</h4>
                  {refinementResult.refinement_log?.competitor_analysis?.refined ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Original Score:</span>
                        <span className={getScoreColor(refinementResult.refinement_log.competitor_analysis.original_score || 0)}>
                          {refinementResult.refinement_log.competitor_analysis.original_score}/10
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Issues Addressed:</span>
                        <span className="text-green-400">
                          {refinementResult.refinement_log.competitor_analysis.issues_addressed}
                        </span>
                      </div>
                      <div className="mt-3 bg-green-500/10 p-2 rounded-lg text-center">
                        <span className="text-green-400 text-sm font-semibold">✅ Refined</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">Already passed — no changes needed</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* NEXT STEP: Financial Projections Button */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center pt-6">
              <button
                onClick={() => navigate(`/financial-projections?ideaId=${ideaId}`)}
                className="bg-green-500 hover:bg-green-600 text-white px-12 py-5 rounded-xl font-bold text-lg hover:scale-105 transition-all flex items-center gap-3 mx-auto"
              >
                <span className="text-2xl">💰</span>
                <span>Next: Generate Financial Projections</span>
                <span>→</span>
              </button>
              <p className="text-gray-500 text-sm mt-3">
                Create 3-year revenue model with CAC/LTV analysis
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4 justify-center pt-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="glass px-8 py-4 rounded-xl font-semibold text-white hover:scale-105 transition-all"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => navigate(`/quality-check?ideaId=${ideaId}`)}
                className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:scale-105 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Re-evaluate Quality
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}