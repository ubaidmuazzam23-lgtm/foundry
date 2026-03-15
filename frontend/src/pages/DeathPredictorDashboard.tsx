// File: frontend/src/pages/DeathPredictorDashboard.tsx
// 💀 STARTUP DEATH PREDICTOR - Visually stunning risk analysis

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import StartupAdvisorChat from '../components/StartupAdvisorChat';

export default function DeathPredictorDashboard() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [searchParams] = useSearchParams();
  const ideaId = searchParams.get('ideaId');

  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const executeAnalysis = async () => {
    if (!ideaId) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/death-predictor/analyze/${ideaId}`,
        { method: 'POST' }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Analysis failed');
      }

      await fetchResults();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fetchResults = async () => {
    if (!ideaId) return;
    setIsLoading(true);

    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/death-predictor/results/${ideaId}`
      );

      const data = await response.json();
      
      if (data.status === 'success') {
        setAnalysis(data.analysis);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [ideaId]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'from-red-600 to-red-800';
      case 'HIGH': return 'from-orange-600 to-orange-800';
      case 'MEDIUM': return 'from-yellow-600 to-yellow-800';
      case 'LOW': return 'from-green-600 to-green-800';
      default: return 'from-gray-600 to-gray-800';
    }
  };

  const getRiskEmoji = (level: string) => {
    switch (level) {
      case 'CRITICAL': return '🔴';
      case 'HIGH': return '🟠';
      case 'MEDIUM': return '🟡';
      case 'LOW': return '🟢';
      default: return '⚪';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'LOW': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading death analysis...</p>
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
        .gradient-death { background: linear-gradient(135deg, #DC2626 0%, #7F1D1D 100%); }
        .skull-shadow { text-shadow: 0 0 30px rgba(220, 38, 38, 0.5); }
        @keyframes pulse-red {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .pulse-red { animation: pulse-red 2s ease-in-out infinite; }
      `}</style>

      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600 opacity-10 rounded-full blur-3xl pulse-red"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-600 opacity-10 rounded-full blur-3xl pulse-red" style={{animationDelay: '1s'}}></div>
      </div>

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
                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-semibold">
                  {user.firstName?.charAt(0) || user.emailAddresses[0]?.emailAddress.charAt(0).toUpperCase()}
                </div>
                <span>{user.firstName || user.emailAddresses[0]?.emailAddress.split('@')[0]}</span>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-6">
            <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
            <span className="text-sm font-semibold text-white">Death Risk Analysis</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 skull-shadow">
            💀 Startup
            <span className="block bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
              Death Predictor
            </span>
          </h1>
          <p className="text-gray-400 text-lg">Identify fatal flaws before they kill you</p>
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass border-red-500/20 p-4 rounded-xl mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}

        {!analysis && !isAnalyzing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass p-12 rounded-3xl text-center">
            <div className="w-20 h-20 rounded-full gradient-death mx-auto mb-6 flex items-center justify-center text-4xl">
              💀
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Ready to Face the Truth?</h2>
            <p className="text-gray-400 mb-8">Analyze your startup against 50,000+ failure patterns</p>
            <button
              onClick={executeAnalysis}
              className="gradient-death text-white px-8 py-4 rounded-xl font-semibold hover:scale-105 transition-all"
            >
              Predict My Startup's Death 💀
            </button>
          </motion.div>
        )}

        {isAnalyzing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass p-12 rounded-3xl text-center">
            <div className="w-20 h-20 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-white mb-4">Analyzing Death Risks...</h2>
            <div className="space-y-2 text-sm text-gray-400">
              <p>💀 Checking for fatal flaws</p>
              <p>📊 Comparing to 50K+ failed startups</p>
              <p>⚠️ Identifying warning signs</p>
              <p>💊 Generating survival strategies</p>
            </div>
          </motion.div>
        )}

        {analysis && !isAnalyzing && (
          <div className="space-y-6">
            {/* Overall Risk Score */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }}
              className={`glass p-8 rounded-3xl border-2 bg-gradient-to-br ${getRiskColor(analysis.risk_level)}`}
            >
              <div className="text-center">
                <div className="text-8xl mb-4 skull-shadow">{getRiskEmoji(analysis.risk_level)}</div>
                <h2 className="text-4xl font-bold text-white mb-2">
                  Risk Level: {analysis.risk_level}
                </h2>
                <div className="text-7xl font-black text-white mb-4">
                  {analysis.overall_risk_score}/100
                </div>
                <p className="text-white/90 text-xl mb-4">
                  Estimated Time to Death: <span className="font-bold">{analysis.estimated_time_to_death}</span>
                </p>
                <p className="text-white/80 text-lg">
                  Success Probability: <span className="font-bold">{analysis.success_probability}%</span>
                </p>
              </div>
            </motion.div>

            {/* Executive Summary */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 rounded-3xl border-2 border-red-500/30">
              <h3 className="text-2xl font-bold text-white mb-4">⚠️ Executive Summary</h3>
              <p className="text-gray-300 text-lg leading-relaxed">{analysis.executive_summary}</p>
            </motion.div>

            {/* Death Causes */}
            {analysis.predicted_death_causes && analysis.predicted_death_causes.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 rounded-3xl">
                <h3 className="text-2xl font-bold text-white mb-6">💀 Predicted Death Causes</h3>
                
                <div className="space-y-6">
                  {analysis.predicted_death_causes.map((cause: any, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="border border-red-500/20 rounded-2xl p-6 bg-red-500/5 hover:bg-red-500/10 transition-all"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-xl font-bold text-red-400">#{idx + 1} {cause.cause}</h4>
                          <p className="text-sm text-gray-400 mt-1">{cause.description}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-4 py-2 rounded-full text-sm font-bold border ${getSeverityColor(cause.severity)}`}>
                            {cause.severity}
                          </span>
                          <p className="text-3xl font-bold text-white mt-2">{cause.probability}%</p>
                          <p className="text-xs text-gray-500">probability</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl">
                          <p className="text-xs text-orange-400 font-semibold mb-2 uppercase">⚠️ Warning Signs</p>
                          <ul className="space-y-1">
                            {cause.warning_signs.map((warning: string, i: number) => (
                              <li key={i} className="text-sm text-gray-300">• {warning}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl">
                          <p className="text-xs text-green-400 font-semibold mb-2 uppercase">💊 How to Fix</p>
                          <ul className="space-y-1">
                            {cause.how_to_fix.map((fix: string, i: number) => (
                              <li key={i} className="text-sm text-gray-300">✓ {fix}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {cause.famous_deaths && cause.famous_deaths.length > 0 && (
                        <div className="bg-purple-500/10 border border-purple-500/30 p-3 rounded-lg">
                          <p className="text-xs text-purple-400 font-semibold mb-1">Companies that died this way:</p>
                          <p className="text-sm text-gray-300">{cause.famous_deaths.join(', ')}</p>
                        </div>
                      )}

                      <p className="text-xs text-gray-500 mt-3 italic">
                        Average time to death: {cause.avg_time_to_death}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Survival Strategies */}
            {analysis.survival_strategies && analysis.survival_strategies.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 rounded-3xl border-2 border-green-500/30">
                <h3 className="text-2xl font-bold text-white mb-6">💊 Survival Strategies</h3>
                
                <div className="space-y-4">
                  {analysis.survival_strategies.map((strategy: any, idx: number) => (
                    <div key={idx} className="bg-green-500/10 border border-green-500/20 p-5 rounded-xl hover:bg-green-500/15 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {strategy.priority}
                          </span>
                          <div>
                            <p className="text-white font-semibold">{strategy.strategy}</p>
                            <p className="text-xs text-gray-500">Addresses: {strategy.addresses}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs px-3 py-1 bg-green-500/20 text-green-400 rounded-full font-semibold">
                            {strategy.impact}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">{strategy.timeframe}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Similar Deaths */}
            {analysis.similar_failed_startups && analysis.similar_failed_startups.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 rounded-3xl">
                <h3 className="text-2xl font-bold text-white mb-6">⚰️ Learn from These Deaths</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.similar_failed_startups.map((death: any, idx: number) => (
                    <div key={idx} className="bg-red-500/10 border border-red-500/20 p-5 rounded-xl">
                      <h4 className="text-lg font-bold text-red-400 mb-2">{death.company}</h4>
                      <p className="text-sm text-gray-400 mb-3">Cause: {death.cause_of_death}</p>
                      <div className="bg-black/20 p-3 rounded-lg">
                        <p className="text-xs text-yellow-400 font-semibold mb-1">💡 Lesson:</p>
                        <p className="text-sm text-gray-300">{death.lesson}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {death.probability_match}% probability match
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4 justify-center pt-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="glass px-8 py-4 rounded-xl font-semibold text-white hover:scale-105 transition-all"
              >
                Back to Dashboard
              </button>
              <button
                onClick={executeAnalysis}
                className="gradient-death text-white px-8 py-4 rounded-xl font-semibold hover:scale-105 transition-all"
              >
                Re-run Analysis
              </button>
            </motion.div>
          </div>
        )}
      </div>

      {/* AI Startup Advisor Chatbot */}
      {ideaId && <StartupAdvisorChat ideaId={parseInt(ideaId)} />}
    </div>
  );
}