// File: frontend/src/pages/QualityEvaluationDashboard.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import OriginalityScore from '../components/OriginalityScore';

export default function QualityEvaluationDashboard() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [searchParams] = useSearchParams();
  const ideaId = searchParams.get('ideaId');

  const [isLoading, setIsLoading]     = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation]   = useState<any>(null);
  const [error, setError]             = useState<string | null>(null);
  const [ideaText, setIdeaText]       = useState<string>('');

  const runEvaluation = async () => {
    if (!ideaId) return;
    setIsEvaluating(true);
    setError(null);
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/quality-evaluation/evaluate/${ideaId}`,
        { method: 'POST' }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Evaluation failed');
      setEvaluation(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsEvaluating(false);
    }
  };

  const fetchResults = async () => {
    if (!ideaId) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/quality-evaluation/results/${ideaId}`
      );
      const data = await response.json();
      if (data.status === 'success') setEvaluation(data.evaluation);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch idea text for originality scorer
  
  const fetchIdeaText = async () => {
    if (!ideaId) return;
    try {
      const response = await fetch(`http://localhost:8000/api/v1/questioning/structured/${ideaId}`);
      if (!response.ok) return;
      const data = await response.json();
      const sd = data.structured_data || {};
      const text = [
        sd.problem_statement,
        sd.solution_description,
        sd.unique_value_proposition,
        sd.target_audience,
      ].filter(Boolean).join('. ');
      setIdeaText(text);
    } catch (err) {
      console.error('Could not fetch idea text:', err);
    }
  };
  useEffect(() => {
    fetchResults();
    fetchIdeaText();
  }, [ideaId]);

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 7) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 8) return 'bg-green-500/20 border-green-500/30';
    if (score >= 7) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  const renderRubricScore = (rubricName: string, rubricData: any) => {
    const score      = rubricData.score || 0;
    const maxScore   = 2;
    const percentage = (score / maxScore) * 100;
    return (
      <div className="bg-white/5 p-4 rounded-xl">
        <div className="flex justify-between items-center mb-2">
          <h5 className="text-sm font-semibold text-white capitalize">
            {rubricName.replace(/_/g, ' ')}
          </h5>
          <span className={`text-lg font-bold ${getScoreColor(score * 5)}`}>
            {score}/{maxScore}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
          <div
            className={`h-2 rounded-full transition-all ${
              score >= 1.5 ? 'bg-green-500' : score >= 1 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-xs text-gray-400">{rubricData.feedback}</p>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#636B2F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading evaluation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; }
        .glass { background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); }
        .gradient-primary { background: linear-gradient(135deg, #636B2F 0%, #3D4127 100%); }
      `}</style>

      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#636B2F] opacity-5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#D4DE95] opacity-5 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="glass sticky top-0 z-50 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-all"
            >
              <span>←</span>
              <span className="text-sm font-medium">Dashboard</span>
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
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-white">Quality Assurance</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Quality
            <span className="block bg-gradient-to-r from-[#D4DE95] to-[#636B2F] bg-clip-text text-transparent">
              Evaluation
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            AI-powered quality checks ensure your market validation and competitor analysis meet the highest standards
          </p>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass border-red-500/20 p-4 rounded-xl mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}

        {/* Empty state */}
        {!evaluation && !isEvaluating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="glass p-12 rounded-3xl text-center">
              <div className="w-20 h-20 rounded-full gradient-primary mx-auto mb-6 flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Ready for Quality Check</h2>
              <p className="text-gray-400 mb-8">Evaluate your market validation and competitor analysis using AI-powered quality rubrics</p>
              <button
                onClick={runEvaluation}
                className="gradient-primary text-white px-8 py-4 rounded-xl font-semibold hover:scale-105 transition-all"
              >
                Run Quality Evaluation
              </button>
            </div>

            {/* Originality score shown even before quality eval */}
            <OriginalityScore
              ideaId={ideaId ? parseInt(ideaId) : undefined}
              ideaText={ideaText}
            />
          </motion.div>
        )}

        {/* Evaluating spinner */}
        {isEvaluating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass p-12 rounded-3xl text-center">
            <div className="w-20 h-20 border-4 border-[#636B2F] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Evaluating Quality...</h2>
            <div className="space-y-2 text-sm text-gray-400">
              <p>🔍 Checking evidence quality</p>
              <p>📊 Verifying specificity</p>
              <p>✓ Assessing completeness</p>
              <p>🎯 Measuring actionability</p>
              <p>💡 Scoring outputs</p>
            </div>
          </motion.div>
        )}

        {/* Results */}
        {evaluation && !isEvaluating && (
          <div className="space-y-6">

            {/* Overall Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`glass p-8 rounded-3xl border-2 ${
                evaluation.overall_passed
                  ? 'border-green-500/30 bg-green-500/5'
                  : 'border-red-500/30 bg-red-500/5'
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-3xl font-bold text-white mb-2">
                    {evaluation.overall_passed ? '✅ Quality Check Passed!' : '❌ Needs Improvement'}
                  </h3>
                  <p className="text-gray-400">
                    {evaluation.overall_passed
                      ? 'All outputs meet quality standards'
                      : 'Some outputs need refinement before proceeding'}
                  </p>
                </div>
                <div className="text-center">
                  <div className={`text-6xl font-bold ${getScoreColor(evaluation.average_score)}`}>
                    {evaluation.average_score}
                  </div>
                  <div className="text-sm text-gray-400">Average Score</div>
                </div>
              </div>
              {evaluation.message && (
                <div className={`p-4 rounded-xl ${
                  evaluation.overall_passed
                    ? 'bg-green-500/10 border border-green-500/30'
                    : 'bg-yellow-500/10 border border-yellow-500/30'
                }`}>
                  <p className="text-white">{evaluation.message}</p>
                </div>
              )}
            </motion.div>

            {/* ✅ Originality Score — sits right after overall status */}
            <OriginalityScore
              ideaId={ideaId ? parseInt(ideaId) : undefined}
              ideaText={ideaText}
            />

            {/* Required Improvements */}
            {evaluation.required_improvements && evaluation.required_improvements.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 rounded-3xl border-2 border-yellow-500/30">
                <h3 className="text-xl font-bold text-white mb-4">⚠️ Required Improvements</h3>
                <p className="text-gray-400 mb-6 text-sm">Address these issues before finalizing your startup validation</p>
                <div className="space-y-3">
                  {evaluation.required_improvements.map((item: any, idx: number) => (
                    <div key={idx} className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl">
                      <div className="flex items-start gap-3">
                        <span className="text-yellow-400 text-xl">⚡</span>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 uppercase mb-1">{item.type.replace(/_/g, ' ')}</p>
                          <p className="text-white font-semibold">{item.improvement}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate(`/refine?ideaId=${ideaId}`)}
                  className="w-full mt-6 bg-yellow-500 text-black px-6 py-4 rounded-xl font-semibold hover:bg-yellow-400 transition-all"
                >
                  Start Refinement Process →
                </button>
              </motion.div>
            )}

            {/* Market Validation Evaluation */}
            {evaluation.evaluations?.market_validation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass p-8 rounded-3xl border-2 ${getScoreBg(evaluation.evaluations.market_validation.overall_score)}`}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">📊 Market Validation Quality</h3>
                  <div className="text-right">
                    <div className={`text-4xl font-bold ${getScoreColor(evaluation.evaluations.market_validation.overall_score)}`}>
                      {evaluation.evaluations.market_validation.overall_score}/10
                    </div>
                    <div className="text-sm text-gray-400">
                      {evaluation.evaluations.market_validation.passed ? 'PASSED' : 'NEEDS WORK'}
                    </div>
                  </div>
                </div>
                {evaluation.evaluations.market_validation.rubric_scores && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-400 mb-4 uppercase">Detailed Scores</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(evaluation.evaluations.market_validation.rubric_scores).map(([key, value]: [string, any]) => (
                        <div key={key}>{renderRubricScore(key, value)}</div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {evaluation.evaluations.market_validation.strengths?.length > 0 && (
                    <div className="bg-green-500/10 p-4 rounded-xl">
                      <h5 className="text-sm font-semibold text-green-400 mb-3">✓ Strengths</h5>
                      <div className="space-y-2">
                        {evaluation.evaluations.market_validation.strengths.map((s: string, i: number) => (
                          <p key={i} className="text-xs text-gray-300">• {s}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  {evaluation.evaluations.market_validation.weaknesses?.length > 0 && (
                    <div className="bg-red-500/10 p-4 rounded-xl">
                      <h5 className="text-sm font-semibold text-red-400 mb-3">⚠ Weaknesses</h5>
                      <div className="space-y-2">
                        {evaluation.evaluations.market_validation.weaknesses.map((w: string, i: number) => (
                          <p key={i} className="text-xs text-gray-300">• {w}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Competitor Analysis Evaluation */}
            {evaluation.evaluations?.competitor_analysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass p-8 rounded-3xl border-2 ${getScoreBg(evaluation.evaluations.competitor_analysis.overall_score)}`}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">⚔️ Competitor Analysis Quality</h3>
                  <div className="text-right">
                    <div className={`text-4xl font-bold ${getScoreColor(evaluation.evaluations.competitor_analysis.overall_score)}`}>
                      {evaluation.evaluations.competitor_analysis.overall_score}/10
                    </div>
                    <div className="text-sm text-gray-400">
                      {evaluation.evaluations.competitor_analysis.passed ? 'PASSED' : 'NEEDS WORK'}
                    </div>
                  </div>
                </div>
                {evaluation.evaluations.competitor_analysis.rubric_scores && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-400 mb-4 uppercase">Detailed Scores</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(evaluation.evaluations.competitor_analysis.rubric_scores).map(([key, value]: [string, any]) => (
                        <div key={key}>{renderRubricScore(key, value)}</div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {evaluation.evaluations.competitor_analysis.strengths?.length > 0 && (
                    <div className="bg-green-500/10 p-4 rounded-xl">
                      <h5 className="text-sm font-semibold text-green-400 mb-3">✓ Strengths</h5>
                      <div className="space-y-2">
                        {evaluation.evaluations.competitor_analysis.strengths.map((s: string, i: number) => (
                          <p key={i} className="text-xs text-gray-300">• {s}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  {evaluation.evaluations.competitor_analysis.weaknesses?.length > 0 && (
                    <div className="bg-red-500/10 p-4 rounded-xl">
                      <h5 className="text-sm font-semibold text-red-400 mb-3">⚠ Weaknesses</h5>
                      <div className="space-y-2">
                        {evaluation.evaluations.competitor_analysis.weaknesses.map((w: string, i: number) => (
                          <p key={i} className="text-xs text-gray-300">• {w}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 justify-center pt-4 flex-wrap"
            >
              <button
                onClick={() => navigate('/dashboard')}
                className="glass px-8 py-4 rounded-xl font-semibold text-white hover:scale-105 transition-all"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => navigate(`/financial-projections?ideaId=${ideaId}`)}
                className="bg-gradient-to-r from-green-600 to-green-500 text-white px-8 py-4 rounded-xl font-semibold hover:scale-105 transition-all flex items-center gap-2"
              >
                <span>💰</span>
                <span>Financial Projections</span>
              </button>
              {!evaluation.overall_passed && (
                <button
                  onClick={() => navigate(`/refine?ideaId=${ideaId}`)}
                  className="bg-yellow-500 text-black px-8 py-4 rounded-xl font-semibold hover:bg-yellow-400 transition-all"
                >
                  Refine Outputs
                </button>
              )}
              <button
                onClick={runEvaluation}
                className="gradient-primary text-white px-8 py-4 rounded-xl font-semibold hover:scale-105 transition-all"
              >
                Re-run Analysis
              </button>
              {evaluation.overall_passed && (
                <button
                  onClick={() => navigate(`/final-report?ideaId=${ideaId}`)}
                  className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-8 py-4 rounded-xl font-semibold hover:scale-105 transition-all flex items-center gap-2"
                >
                  <span>Generate Final Report</span>
                  <span>→</span>
                </button>
              )}
            </motion.div>

          </div>
        )}
      </div>
    </div>
  );
}