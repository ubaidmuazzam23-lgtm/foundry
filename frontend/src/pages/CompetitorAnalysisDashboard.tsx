// // File: frontend/src/pages/CompetitorAnalysisDashboard.tsx
// // COMPLETE ENHANCED VERSION with Migration Analysis + Positioning Map + Multi-source Reviews + AI CHATBOT

// import { useState, useEffect } from 'react';
// import { useNavigate, useSearchParams } from 'react-router-dom';
// import { motion } from 'framer-motion';
// import { useUser } from '@clerk/clerk-react';
// import {
//   ScatterChart,
//   Scatter,
//   Cell,
//   ResponsiveContainer,
//   CartesianGrid,
//   XAxis,
//   YAxis,
//   Tooltip,
//   Legend
// } from 'recharts';
// import StartupAdvisorChat from '../components/StartupAdvisorChat';

// export default function CompetitorAnalysisDashboard() {
//   const navigate = useNavigate();
//   const { user } = useUser();
//   const [searchParams] = useSearchParams();
//   const ideaId = searchParams.get('ideaId');

//   const [isLoading, setIsLoading] = useState(false);
//   const [isAnalyzing, setIsAnalyzing] = useState(false);
//   const [analysis, setAnalysis] = useState<any>(null);
//   const [error, setError] = useState<string | null>(null);

//   const executeAnalysis = async () => {
//     if (!ideaId) return;
//     setIsAnalyzing(true);
//     setError(null);

//     try {
//       const response = await fetch(
//         `http://localhost:8000/api/v1/competitor-analysis/analyze/${ideaId}`,
//         { method: 'POST' }
//       );

//       if (!response.ok) {
//         const data = await response.json();
//         throw new Error(data.detail || 'Analysis failed');
//       }

//       await fetchResults();
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setIsAnalyzing(false);
//     }
//   };

//   const fetchResults = async () => {
//     if (!ideaId) return;
//     setIsLoading(true);

//     try {
//       const response = await fetch(
//         `http://localhost:8000/api/v1/competitor-analysis/results/${ideaId}`
//       );

//       const data = await response.json();
//       console.log('📊 Competitor Analysis Response:', data);
//       console.log('📊 Analysis data:', data.analysis);
      
//       if (data.status === 'success') {
//         setAnalysis(data.analysis);
//         console.log('✅ Analysis set successfully');
//       } else {
//         console.log('❌ Status not success:', data.status);
//       }
//     } catch (err) {
//       console.error('❌ Fetch error:', err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchResults();
//   }, [ideaId]);

//   const getPriorityColor = (priority: string) => {
//     switch (priority) {
//       case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
//       case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
//       case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
//       default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
//     }
//   };

//   const getImpactColor = (impact: string) => {
//     switch (impact) {
//       case 'high': return 'text-green-400';
//       case 'medium': return 'text-yellow-400';
//       case 'low': return 'text-gray-400';
//       default: return 'text-gray-400';
//     }
//   };

//   const CustomTooltip = ({ active, payload }: any) => {
//     if (active && payload && payload.length) {
//       const data = payload[0].payload;
//       return (
//         <div className="glass p-3 rounded-lg border border-white/10">
//           <p className="text-white font-semibold text-sm">{data.name}</p>
//           <p className="text-xs text-gray-400">Price Score: {data.price_score}/10</p>
//           <p className="text-xs text-gray-400">Feature Score: {data.feature_score}/10</p>
//           <p className="text-xs text-gray-400">Market Share: ~{data.market_share_estimate}%</p>
//           <p className="text-xs text-purple-400 mt-1 capitalize">{data.positioning}</p>
//         </div>
//       );
//     }
//     return null;
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
//         <div className="text-center">
//           <div className="w-16 h-16 border-4 border-[#636B2F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
//           <p className="text-gray-400">Loading analysis...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-[#0A0A0B]">
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
//         * { font-family: 'Inter', sans-serif; }
//         .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.08); }
//         .gradient-primary { background: linear-gradient(135deg, #636B2F 0%, #3D4127 100%); }
//       `}</style>

//       <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
//         <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#636B2F] opacity-5 rounded-full blur-3xl"></div>
//         <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#D4DE95] opacity-5 rounded-full blur-3xl"></div>
//       </div>

//       <nav className="glass sticky top-0 z-50 relative">
//         <div className="max-w-7xl mx-auto px-6 lg:px-8">
//           <div className="flex justify-between h-16 items-center">
//             <button 
//               onClick={() => navigate('/dashboard')}
//               className="flex items-center gap-2 text-gray-400 hover:text-white transition-all"
//             >
//               <span>←</span>
//               <span className="text-sm font-medium">Dashboard</span>
//             </button>
//             {user && (
//               <div className="flex items-center gap-2 text-sm text-gray-400">
//                 <div className="w-8 h-8 rounded-full bg-[#636B2F] flex items-center justify-center text-white font-semibold">
//                   {user.firstName?.charAt(0) || user.emailAddresses[0]?.emailAddress.charAt(0).toUpperCase()}
//                 </div>
//                 <span>{user.firstName || user.emailAddresses[0]?.emailAddress.split('@')[0]}</span>
//               </div>
//             )}
//           </div>
//         </div>
//       </nav>

//       <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 relative z-10">
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
//           <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-6">
//             <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
//             <span className="text-sm font-semibold text-white">Competitive Intelligence</span>
//           </div>
//           <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
//             Competitor
//             <span className="block bg-gradient-to-r from-[#D4DE95] to-[#636B2F] bg-clip-text text-transparent">
//               Analysis
//             </span>
//           </h1>
//         </motion.div>

//         {error && (
//           <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass border-red-500/20 p-4 rounded-xl mb-6">
//             <p className="text-red-400 text-sm">{error}</p>
//           </motion.div>
//         )}

//         {!analysis && !isAnalyzing && (
//           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass p-12 rounded-3xl text-center">
//             <div className="w-20 h-20 rounded-full gradient-primary mx-auto mb-6 flex items-center justify-center">
//               <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
//               </svg>
//             </div>
//             <h2 className="text-2xl font-bold text-white mb-4">Ready to Analyze Competitors</h2>
//             <p className="text-gray-400 mb-8">Deep-dive into competitors with migration analysis, positioning map, and multi-source reviews</p>
//             <button
//               onClick={executeAnalysis}
//               className="gradient-primary text-white px-8 py-4 rounded-xl font-semibold hover:scale-105 transition-all"
//             >
//               Start Competitor Analysis
//             </button>
//           </motion.div>
//         )}

//         {isAnalyzing && (
//           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass p-12 rounded-3xl text-center">
//             <div className="w-20 h-20 border-4 border-[#636B2F] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
//             <h2 className="text-2xl font-bold text-white mb-4">Analyzing Competitors...</h2>
//             <div className="space-y-2 text-sm text-gray-400">
//               <p>🔍 Gathering competitor intelligence</p>
//               <p>⭐ Scraping reviews from 5 sources</p>
//               <p>💰 Analyzing pricing strategies</p>
//               <p>🔄 Identifying migration patterns</p>
//               <p>🎯 Generating positioning map</p>
//             </div>
//           </motion.div>
//         )}

//         {analysis && !isAnalyzing && (
//           <div className="space-y-6">
//             {/* Executive Summary */}
//             {analysis.executive_summary && (
//               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 rounded-3xl border-2 border-[#636B2F]/30">
//                 <h3 className="text-2xl font-bold text-white mb-4">📋 Executive Summary</h3>
//                 <p className="text-gray-300 text-lg leading-relaxed">{analysis.executive_summary}</p>
//               </motion.div>
//             )}

//             {/* Market Positioning Map */}
//             {analysis.positioning_map && analysis.positioning_map.positions && analysis.positioning_map.positions.length > 0 && (
//               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 rounded-3xl border-2 border-blue-500/30">
//                 <h3 className="text-xl font-bold text-white mb-2">📊 Market Positioning Map</h3>
//                 <p className="text-sm text-gray-400 mb-6">2D Analysis: Price vs Features</p>
                
//                 <div className="bg-black/20 p-6 rounded-xl mb-6">
//                   <ResponsiveContainer width="100%" height={400}>
//                     <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 60 }}>
//                       <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
//                       <XAxis 
//                         type="number" 
//                         dataKey="price_score" 
//                         name="Price" 
//                         domain={[0, 10]}
//                         stroke="#9CA3AF"
//                         label={{ value: 'Price (Low → High)', position: 'bottom', fill: '#9CA3AF', offset: 0 }}
//                       />
//                       <YAxis 
//                         type="number" 
//                         dataKey="feature_score" 
//                         name="Features" 
//                         domain={[0, 10]}
//                         stroke="#9CA3AF"
//                         label={{ value: 'Features (Basic → Advanced)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
//                       />
//                       <Tooltip content={<CustomTooltip />} />
//                       <Scatter data={analysis.positioning_map.positions} fill="#8884d8">
//                         {analysis.positioning_map.positions.map((entry: any, index: number) => {
//                           let fillColor = '#F59E0B';
//                           if (entry.is_you) {
//                             fillColor = '#4ADE80';
//                           } else if (entry.positioning === 'premium') {
//                             fillColor = '#EF4444';
//                           } else if (entry.positioning === 'premium_value') {
//                             fillColor = '#3B82F6';
//                           } else if (entry.positioning === 'overpriced') {
//                             fillColor = '#9CA3AF';
//                           }
                          
//                           return (
//                             <Cell 
//                               key={`cell-${index}`} 
//                               fill={fillColor}
//                             />
//                           );
//                         })}
//                       </Scatter>
//                     </ScatterChart>
//                   </ResponsiveContainer>
//                 </div>
                
//                 <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
//                   <div className="flex items-center gap-2">
//                     <div className="w-4 h-4 rounded-full bg-green-400"></div>
//                     <span className="text-xs text-gray-400">Your Product</span>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <div className="w-4 h-4 rounded-full bg-red-400"></div>
//                     <span className="text-xs text-gray-400">Premium</span>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <div className="w-4 h-4 rounded-full bg-blue-400"></div>
//                     <span className="text-xs text-gray-400">Premium Value</span>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
//                     <span className="text-xs text-gray-400">Budget</span>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <div className="w-4 h-4 rounded-full bg-gray-400"></div>
//                     <span className="text-xs text-gray-400">Overpriced</span>
//                   </div>
//                 </div>
                
//                 {analysis.positioning_map.quadrants && (
//                   <div className="grid grid-cols-2 gap-4 mb-6">
//                     {Object.entries(analysis.positioning_map.quadrants).map(([key, quad]: [string, any]) => (
//                       <div key={key} className="bg-white/5 p-4 rounded-xl">
//                         <p className="text-sm font-semibold text-white mb-1">{quad.label}</p>
//                         <p className="text-xs text-gray-400">{quad.description}</p>
//                       </div>
//                     ))}
//                   </div>
//                 )}
                
//                 {analysis.positioning_map.rationale && (
//                   <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
//                     <p className="text-sm text-blue-400 font-semibold mb-2">💡 Strategic Recommendation:</p>
//                     <p className="text-white">{analysis.positioning_map.rationale}</p>
//                   </div>
//                 )}
//               </motion.div>
//             )}

//             {/* Competitor Comparison */}
//             {analysis.competitor_comparison && analysis.competitor_comparison.length > 0 && (
//               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 rounded-3xl">
//                 <h3 className="text-xl font-bold text-white mb-6">⚔️ Competitor Comparison</h3>
                
//                 <div className="space-y-4">
//                   {analysis.competitor_comparison.map((comp: any, idx: number) => (
//                     <div key={idx} className="border border-white/10 rounded-2xl p-6 bg-white/5 hover:bg-white/10 transition-all">
//                       <div className="flex justify-between items-start mb-4">
//                         <div>
//                           <h4 className="text-2xl font-bold text-[#D4DE95]">{comp.name}</h4>
//                           {comp.market_position && (
//                             <p className="text-sm text-gray-400 mt-1">{comp.market_position}</p>
//                           )}
//                         </div>
//                         <div className="text-right">
//                           {comp.customer_sentiment && (
//                             <span className={`px-3 py-1 rounded-full text-xs font-bold ${
//                               comp.customer_sentiment === 'positive' ? 'bg-green-500/20 text-green-400' :
//                               comp.customer_sentiment === 'mixed' ? 'bg-yellow-500/20 text-yellow-400' :
//                               'bg-red-500/20 text-red-400'
//                             }`}>
//                               {comp.customer_sentiment}
//                             </span>
//                           )}
//                         </div>
//                       </div>

//                       {comp.overview && (
//                         <p className="text-gray-300 mb-4 text-sm">{comp.overview}</p>
//                       )}

//                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
//                         {comp.pricing_model && (
//                           <div className="bg-purple-500/10 p-4 rounded-xl">
//                             <p className="text-xs text-gray-400 mb-1">Pricing Model</p>
//                             <p className="text-sm text-white font-semibold">{comp.pricing_model}</p>
//                             {comp.price_range && (
//                               <p className="text-xs text-gray-400 mt-1">{comp.price_range}</p>
//                             )}
//                           </div>
//                         )}
                        
//                         {comp.target_customers && (
//                           <div className="bg-blue-500/10 p-4 rounded-xl">
//                             <p className="text-xs text-gray-400 mb-1">Target Customers</p>
//                             <p className="text-sm text-white font-semibold">{comp.target_customers}</p>
//                           </div>
//                         )}
                        
//                         {comp.funding_stage && (
//                           <div className="bg-green-500/10 p-4 rounded-xl">
//                             <p className="text-xs text-gray-400 mb-1">Funding Stage</p>
//                             <p className="text-sm text-white font-semibold">{comp.funding_stage}</p>
//                           </div>
//                         )}
//                       </div>

//                       {comp.key_features && comp.key_features.length > 0 && (
//                         <div className="mb-4">
//                           <p className="text-xs text-gray-400 mb-2">Key Features:</p>
//                           <div className="flex flex-wrap gap-2">
//                             {comp.key_features.map((feature: string, i: number) => (
//                               <span key={i} className="px-3 py-1 bg-white/5 text-gray-300 rounded-full text-xs">
//                                 {feature}
//                               </span>
//                             ))}
//                           </div>
//                         </div>
//                       )}

//                       {comp.review_summary && (
//                         <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
//                           <h5 className="text-sm font-semibold text-purple-400 mb-3">📝 Customer Reviews</h5>
                          
//                           <div className="grid grid-cols-3 gap-3 mb-3">
//                             <div className="text-center">
//                               <p className="text-2xl font-bold text-white">{comp.review_summary.average_rating || 'N/A'}</p>
//                               <p className="text-xs text-gray-400">Avg Rating</p>
//                             </div>
//                             <div className="text-center">
//                               <p className="text-2xl font-bold text-white">{comp.review_summary.total_reviews || 0}</p>
//                               <p className="text-xs text-gray-400">Reviews</p>
//                             </div>
//                             <div className="text-center p-2">
//                               <p className="text-xs text-gray-400 mb-1">Sentiment</p>
//                               <span className={`px-2 py-1 rounded text-xs ${
//                                 comp.customer_sentiment === 'positive' ? 'bg-green-500/20 text-green-400' :
//                                 comp.customer_sentiment === 'mixed' ? 'bg-yellow-500/20 text-yellow-400' :
//                                 'bg-red-500/20 text-red-400'
//                               }`}>
//                                 {comp.customer_sentiment || 'Unknown'}
//                               </span>
//                             </div>
//                           </div>
                          
//                           <div className="space-y-3">
//                             {comp.review_summary.top_complaints && comp.review_summary.top_complaints.length > 0 && (
//                               <div>
//                                 <p className="text-xs text-gray-500 mb-1">Top Complaints:</p>
//                                 {comp.review_summary.top_complaints.map((complaint: string, i: number) => (
//                                   <p key={i} className="text-xs text-red-300 ml-2">• {complaint}</p>
//                                 ))}
//                               </div>
//                             )}
                            
//                             {comp.review_summary.top_praises && comp.review_summary.top_praises.length > 0 && (
//                               <div>
//                                 <p className="text-xs text-gray-500 mb-1">Top Praises:</p>
//                                 {comp.review_summary.top_praises.map((praise: string, i: number) => (
//                                   <p key={i} className="text-xs text-green-300 ml-2">• {praise}</p>
//                                 ))}
//                               </div>
//                             )}
                            
//                             {comp.review_summary.switching_reasons && comp.review_summary.switching_reasons.length > 0 && (
//                               <div>
//                                 <p className="text-xs text-gray-500 mb-1">Why Customers Leave:</p>
//                                 {comp.review_summary.switching_reasons.map((reason: string, i: number) => (
//                                   <p key={i} className="text-xs text-yellow-300 ml-2">→ {reason}</p>
//                                 ))}
//                               </div>
//                             )}
//                           </div>
//                         </div>
//                       )}

//                       <div className="grid grid-cols-2 gap-4 mt-4">
//                         <div>
//                           <p className="text-sm font-semibold text-green-400 mb-2">Strengths</p>
//                           <div className="space-y-1">
//                             {comp.strengths?.map((strength: string, i: number) => (
//                               <p key={i} className="text-xs text-gray-300">✓ {strength}</p>
//                             ))}
//                           </div>
//                         </div>
                        
//                         <div>
//                           <p className="text-sm font-semibold text-red-400 mb-2">Weaknesses (YOUR Opportunities!)</p>
//                           <div className="space-y-1">
//                             {comp.weaknesses?.map((weakness: string, i: number) => (
//                               <p key={i} className="text-xs text-yellow-300">⚠ {weakness}</p>
//                             ))}
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </motion.div>
//             )}

//             {/* Gap Analysis */}
//             {analysis.gap_analysis && analysis.gap_analysis.length > 0 && (
//               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 rounded-3xl border-2 border-green-500/30 bg-green-500/5">
//                 <h3 className="text-xl font-bold text-white mb-2">🎯 Market Gaps - Where ALL Competitors Are Lacking</h3>
//                 <p className="text-sm text-gray-400 mb-6">These are opportunities where NO competitor is doing well</p>
                
//                 <div className="space-y-4">
//                   {analysis.gap_analysis.map((gap: any, idx: number) => (
//                     <div key={idx} className="bg-white/10 border border-green-500/30 p-6 rounded-xl">
//                       <div className="flex items-start gap-4">
//                         <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getImpactColor(gap.impact)} bg-white/10`}>
//                           {gap.impact} Impact
//                         </span>
//                         <div className="flex-1">
//                           <h4 className="text-lg font-bold text-green-400 mb-2">Gap: {gap.gap}</h4>
//                           <div className="space-y-2">
//                             <div className="bg-black/20 p-4 rounded-lg">
//                               <p className="text-xs text-gray-400 mb-1">YOUR OPPORTUNITY:</p>
//                               <p className="text-white font-semibold">{gap.your_opportunity}</p>
//                             </div>
//                             <div>
//                               <p className="text-xs text-gray-500 italic">Evidence: {gap.evidence}</p>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </motion.div>
//             )}

//             {/* Differentiation Opportunities */}
//             {analysis.differentiation_opportunities && analysis.differentiation_opportunities.length > 0 && (
//               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 rounded-3xl border-2 border-blue-500/30">
//                 <h3 className="text-xl font-bold text-white mb-2">💡 How to Differentiate & Win</h3>
//                 <p className="text-sm text-gray-400 mb-6">Strategic moves to beat your competitors</p>
                
//                 <div className="space-y-4">
//                   {analysis.differentiation_opportunities.map((opp: any, idx: number) => (
//                     <div key={idx} className="bg-white/5 border border-blue-500/20 p-6 rounded-xl hover:bg-white/10 transition-all">
//                       <div className="flex justify-between items-start mb-4">
//                         <h4 className="text-lg font-bold text-blue-400">{opp.opportunity}</h4>
//                         <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityColor(opp.priority)}`}>
//                           {opp.priority} Priority
//                         </span>
//                       </div>
                      
//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                         <div className="bg-red-500/10 p-4 rounded-lg">
//                           <p className="text-xs text-gray-400 mb-1">Competitor Weakness:</p>
//                           <p className="text-sm text-red-300">{opp.competitor_weakness}</p>
//                         </div>
//                         <div className="bg-green-500/10 p-4 rounded-lg">
//                           <p className="text-xs text-gray-400 mb-1">Your Advantage:</p>
//                           <p className="text-sm text-green-300">{opp.your_advantage}</p>
//                         </div>
//                       </div>
                      
//                       <div className="bg-black/20 p-4 rounded-lg">
//                         <p className="text-xs text-gray-400 mb-1">How to Execute:</p>
//                         <p className="text-sm text-white">{opp.implementation}</p>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </motion.div>
//             )}

//             {/* Customer Migration Analysis */}
//             {analysis.migration_analysis && (
//               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 rounded-3xl border-2 border-yellow-500/30">
//                 <h3 className="text-xl font-bold text-white mb-2">🔄 Customer Migration Analysis</h3>
//                 <p className="text-sm text-gray-400 mb-6">Understanding why customers switch FROM competitors</p>
                
//                 {analysis.migration_analysis.switching_patterns && (
//                   <div className="mb-6">
//                     <h4 className="text-sm font-semibold text-gray-400 mb-4 uppercase">Switching Patterns Detected</h4>
//                     <div className="bg-white/5 p-6 rounded-xl mb-4">
//                       <p className="text-4xl font-bold text-white mb-2">
//                         {analysis.migration_analysis.switching_patterns.total_switches_found || 0}
//                       </p>
//                       <p className="text-sm text-gray-400">Switching mentions found in reviews & research</p>
//                     </div>
                    
//                     {analysis.migration_analysis.switching_patterns.common_reasons && 
//                      analysis.migration_analysis.switching_patterns.common_reasons.length > 0 && (
//                       <div className="space-y-2">
//                         <p className="text-sm font-semibold text-gray-400 mb-2">Common Switching Reasons:</p>
//                         {analysis.migration_analysis.switching_patterns.common_reasons.map((reason: any, idx: number) => (
//                           <div key={idx} className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl">
//                             <p className="text-sm text-yellow-400 font-semibold mb-1">{reason.competitor}</p>
//                             <p className="text-xs text-gray-300">{reason.reason}</p>
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 )}
                
//                 {analysis.migration_analysis.interview_questions && 
//                  analysis.migration_analysis.interview_questions.length > 0 && (
//                   <div className="mb-6">
//                     <h4 className="text-sm font-semibold text-gray-400 mb-4 uppercase">Interview Questions to Ask Switchers</h4>
//                     <div className="space-y-3">
//                       {analysis.migration_analysis.interview_questions.map((q: any, idx: number) => (
//                         <div key={idx} className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
//                           <p className="text-white font-semibold mb-2">❓ {q.question}</p>
//                           <p className="text-xs text-gray-400">Purpose: {q.purpose}</p>
//                           {q.competitor && (
//                             <p className="text-xs text-blue-400 mt-1">Target: {q.competitor}</p>
//                           )}
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}
                
//                 {analysis.migration_analysis.onboarding_improvements && 
//                  analysis.migration_analysis.onboarding_improvements.length > 0 && (
//                   <div>
//                     <h4 className="text-sm font-semibold text-gray-400 mb-4 uppercase">Recommended Onboarding Improvements</h4>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       {analysis.migration_analysis.onboarding_improvements.map((improvement: any, idx: number) => (
//                         <div key={idx} className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl">
//                           <div className="flex justify-between items-start mb-2">
//                             <p className="text-white font-semibold">{improvement.improvement}</p>
//                             <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(improvement.priority)}`}>
//                               {improvement.priority}
//                             </span>
//                           </div>
//                           <p className="text-xs text-gray-400">{improvement.rationale}</p>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}
//               </motion.div>
//             )}

//             {/* Feature Comparison Matrix */}
//             {analysis.feature_comparison_matrix && analysis.feature_comparison_matrix.features && (
//               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 rounded-3xl overflow-x-auto">
//                 <h3 className="text-xl font-bold text-white mb-6">✓ Feature Comparison Matrix</h3>
                
//                 <div className="min-w-max">
//                   <table className="w-full">
//                     <thead>
//                       <tr className="border-b border-white/10">
//                         <th className="text-left p-4 text-gray-400 font-semibold">Feature</th>
//                         <th className="text-center p-4 text-green-400 font-bold">Your Product</th>
//                         {Object.keys(analysis.feature_comparison_matrix.competitor_coverage || {}).map((comp, idx) => (
//                           comp !== 'YourProduct' && (
//                             <th key={idx} className="text-center p-4 text-gray-400 font-semibold">{comp}</th>
//                           )
//                         ))}
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {analysis.feature_comparison_matrix.features.map((feature: string, idx: number) => (
//                         <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
//                           <td className="p-4 text-gray-300">{feature}</td>
//                           <td className="text-center p-4">
//                             {analysis.feature_comparison_matrix.competitor_coverage?.YourProduct?.[idx] ? (
//                               <span className="text-2xl text-green-400">✓</span>
//                             ) : (
//                               <span className="text-gray-600">—</span>
//                             )}
//                           </td>
//                           {Object.entries(analysis.feature_comparison_matrix.competitor_coverage || {}).map(([comp, features]: [string, any], compIdx) => (
//                             comp !== 'YourProduct' && (
//                               <td key={compIdx} className="text-center p-4">
//                                 {features[idx] ? (
//                                   <span className="text-xl text-gray-400">✓</span>
//                                 ) : (
//                                   <span className="text-gray-700">—</span>
//                                 )}
//                               </td>
//                             )
//                           ))}
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </motion.div>
//             )}

//             {/* Strategic Recommendations */}
//             {analysis.strategic_recommendations && analysis.strategic_recommendations.length > 0 && (
//               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 rounded-3xl">
//                 <h3 className="text-xl font-bold text-white mb-6">🎯 Strategic Recommendations</h3>
                
//                 <div className="space-y-4">
//                   {analysis.strategic_recommendations.map((rec: any, idx: number) => (
//                     <div key={idx} className="bg-white/5 border border-white/10 p-6 rounded-xl">
//                       <div className="flex justify-between items-start mb-4">
//                         <div>
//                           <span className="text-xs text-gray-500 uppercase">{rec.category}</span>
//                           <h4 className="text-lg font-bold text-white mt-1">{rec.recommendation}</h4>
//                         </div>
//                         <div className="text-right">
//                           <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityColor(rec.priority)}`}>
//                             {rec.priority}
//                           </span>
//                           {rec.timeline && (
//                             <p className="text-xs text-gray-500 mt-1">{rec.timeline}</p>
//                           )}
//                         </div>
//                       </div>
                      
//                       <p className="text-sm text-gray-300 mb-3">{rec.rationale}</p>
                      
//                       {rec.competitors_affected && rec.expected_impact && (
//                         <div className="grid grid-cols-2 gap-4">
//                           <div className="bg-orange-500/10 p-3 rounded-lg">
//                             <p className="text-xs text-gray-400 mb-1">Targets:</p>
//                             <p className="text-sm text-orange-300">{rec.competitors_affected.join(', ')}</p>
//                           </div>
//                           <div className="bg-green-500/10 p-3 rounded-lg">
//                             <p className="text-xs text-gray-400 mb-1">Expected Impact:</p>
//                             <p className="text-sm text-green-300">{rec.expected_impact}</p>
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               </motion.div>
//             )}

//             {/* Actions */}
//             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4 justify-center pt-4">
//               <button
//                 onClick={() => navigate('/dashboard')}
//                 className="glass px-8 py-4 rounded-xl font-semibold text-white hover:scale-105 transition-all"
//               >
//                 Back to Dashboard
//               </button>
//               <button
//                 onClick={() => navigate(`/quality-check?ideaId=${ideaId}`)}
//                 className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:scale-105 transition-all flex items-center justify-center gap-2"
//               >
//                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 </svg>
//                 Quality Evaluation →
//               </button>

//               <button
//                 onClick={executeAnalysis}
//                 className="gradient-primary text-white px-8 py-4 rounded-xl font-semibold hover:scale-105 transition-all"
//               >
//                 Re-run Analysis
//               </button>
//             </motion.div>
//           </div>
//         )}
//       </div>

//       {/* AI Startup Advisor Chatbot - Floating Button */}
//       {ideaId && <StartupAdvisorChat ideaId={parseInt(ideaId)} />}
//     </div>
//   );
// }

// File: frontend/src/pages/CompetitorAnalysisDashboard.tsx
// COMPLETE ENHANCED VERSION — fully mobile-responsive

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import {
  ScatterChart,
  Scatter,
  Cell,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import StartupAdvisorChat from '../components/StartupAdvisorChat';

export default function CompetitorAnalysisDashboard() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [searchParams] = useSearchParams();
  const ideaId = searchParams.get('ideaId');

  const [isLoading,   setIsLoading]   = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis,    setAnalysis]    = useState<any>(null);
  const [error,       setError]       = useState<string | null>(null);

  const executeAnalysis = async () => {
    if (!ideaId) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/competitor-analysis/analyze/${ideaId}`,
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
        `http://localhost:8000/api/v1/competitor-analysis/results/${ideaId}`
      );
      const data = await response.json();
      if (data.status === 'success') setAnalysis(data.analysis);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchResults(); }, [ideaId]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':   return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low':    return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:       return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':   return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      default:       return 'text-gray-400';
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="glass p-3 rounded-lg border border-white/10 max-w-[180px]">
          <p className="text-white font-semibold text-xs mb-1">{d.name}</p>
          <p className="text-xs text-gray-400">Price: {d.price_score}/10</p>
          <p className="text-xs text-gray-400">Features: {d.feature_score}/10</p>
          <p className="text-xs text-gray-400">Share: ~{d.market_share_estimate}%</p>
          <p className="text-xs text-purple-400 mt-1 capitalize">{d.positioning}</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-[#636B2F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm">Loading analysis…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        *{font-family:'Inter',sans-serif;box-sizing:border-box;}
        .glass{background:rgba(255,255,255,0.03);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08);}
        .gradient-primary{background:linear-gradient(135deg,#636B2F 0%,#3D4127 100%);}
        button{-webkit-tap-highlight-color:transparent;min-height:40px;}
        ::-webkit-scrollbar{height:3px;width:3px;}
        ::-webkit-scrollbar-thumb{background:#636B2F;border-radius:4px;}
        /* Prevent long words from overflowing on mobile */
        p,h1,h2,h3,h4,h5,span{word-break:break-word;overflow-wrap:anywhere;}
      `}</style>

      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-[#636B2F] opacity-5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-[#D4DE95] opacity-5 rounded-full blur-3xl" />
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
              Competitive Intelligence
            </span>
            {user && (
              <div className="flex items-center gap-1.5 text-sm text-gray-400">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#636B2F] flex items-center justify-center text-white font-semibold text-xs shrink-0">
                  {user.firstName?.charAt(0) || user.emailAddresses[0]?.emailAddress.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:block">{user.firstName || user.emailAddresses[0]?.emailAddress.split('@')[0]}</span>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 relative z-10">

        {/* Hero */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 glass px-3 py-1.5 sm:px-4 sm:py-2 rounded-full mb-4 sm:mb-6">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-400 rounded-full animate-pulse" />
            <span className="text-xs sm:text-sm font-semibold text-white">Competitive Intelligence</span>
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-4 sm:mb-6">
            Competitor
            <span className="block bg-gradient-to-r from-[#D4DE95] to-[#636B2F] bg-clip-text text-transparent">
              Analysis
            </span>
          </h1>
        </motion.div>

        {error && (
          <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="glass border-red-500/20 p-3 sm:p-4 rounded-xl mb-4 sm:mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}

        {/* Empty state */}
        {!analysis && !isAnalyzing && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="glass p-8 sm:p-12 rounded-3xl text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full gradient-primary mx-auto mb-5 sm:mb-6 flex items-center justify-center">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Ready to Analyze Competitors</h2>
            <p className="text-gray-400 text-sm sm:text-base mb-6 sm:mb-8 max-w-md mx-auto">
              Deep-dive into competitors with migration analysis, positioning map, and multi-source reviews
            </p>
            <button
              onClick={executeAnalysis}
              className="gradient-primary text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:scale-105 transition-all text-sm sm:text-base w-full sm:w-auto"
            >
              Start Competitor Analysis
            </button>
          </motion.div>
        )}

        {/* Analyzing state */}
        {isAnalyzing && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="glass p-8 sm:p-12 rounded-3xl text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-[#636B2F] border-t-transparent rounded-full animate-spin mx-auto mb-5 sm:mb-6" />
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Analyzing Competitors…</h2>
            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-400 max-w-xs mx-auto text-left">
              <p>🔍 Gathering competitor intelligence</p>
              <p>⭐ Scraping reviews from 5 sources</p>
              <p>💰 Analyzing pricing strategies</p>
              <p>🔄 Identifying migration patterns</p>
              <p>🎯 Generating positioning map</p>
            </div>
          </motion.div>
        )}

        {analysis && !isAnalyzing && (
          <div className="space-y-4 sm:space-y-6">

            {/* Executive Summary */}
            {analysis.executive_summary && (
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                className="glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-[#636B2F]/30">
                <h3 className="text-lg sm:text-2xl font-bold text-white mb-3 sm:mb-4">📋 Executive Summary</h3>
                <p className="text-gray-300 text-sm sm:text-lg leading-relaxed">{analysis.executive_summary}</p>
              </motion.div>
            )}

            {/* Market Positioning Map */}
            {analysis.positioning_map?.positions?.length > 0 && (
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                className="glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-blue-500/30">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">📊 Market Positioning Map</h3>
                <p className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">2D Analysis: Price vs Features</p>

                <div className="bg-black/20 p-3 sm:p-6 rounded-xl mb-4 sm:mb-6">
                  <ResponsiveContainer width="100%" height={280}>
                    <ScatterChart margin={{ top:16, right:12, bottom:36, left:8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis
                        type="number" dataKey="price_score" name="Price" domain={[0,10]}
                        stroke="#9CA3AF" tick={{ fontSize:10 }}
                        label={{ value:'Price (Low → High)', position:'bottom', fill:'#9CA3AF', fontSize:10, offset:4 }}
                      />
                      <YAxis
                        type="number" dataKey="feature_score" name="Features" domain={[0,10]}
                        stroke="#9CA3AF" tick={{ fontSize:10 }} width={28}
                        label={{ value:'Features', angle:-90, position:'insideLeft', fill:'#9CA3AF', fontSize:10 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Scatter data={analysis.positioning_map.positions} fill="#8884d8">
                        {analysis.positioning_map.positions.map((entry: any, index: number) => {
                          let fillColor = '#F59E0B';
                          if (entry.is_you)                          fillColor = '#4ADE80';
                          else if (entry.positioning === 'premium')  fillColor = '#EF4444';
                          else if (entry.positioning === 'premium_value') fillColor = '#3B82F6';
                          else if (entry.positioning === 'overpriced') fillColor = '#9CA3AF';
                          return <Cell key={`cell-${index}`} fill={fillColor} />;
                        })}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend — 2-col on mobile, 5-col on md */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 mb-4 sm:mb-6">
                  {[
                    { color:'bg-green-400', label:'Your Product' },
                    { color:'bg-red-400',   label:'Premium' },
                    { color:'bg-blue-400',  label:'Premium Value' },
                    { color:'bg-yellow-400',label:'Budget' },
                    { color:'bg-gray-400',  label:'Overpriced' },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full shrink-0 ${color}`} />
                      <span className="text-xs text-gray-400">{label}</span>
                    </div>
                  ))}
                </div>

                {analysis.positioning_map.quadrants && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    {Object.entries(analysis.positioning_map.quadrants).map(([key, quad]: [string, any]) => (
                      <div key={key} className="bg-white/5 p-3 sm:p-4 rounded-xl">
                        <p className="text-xs sm:text-sm font-semibold text-white mb-1">{quad.label}</p>
                        <p className="text-xs text-gray-400">{quad.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {analysis.positioning_map.rationale && (
                  <div className="p-3 sm:p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <p className="text-xs sm:text-sm text-blue-400 font-semibold mb-1 sm:mb-2">💡 Strategic Recommendation:</p>
                    <p className="text-white text-xs sm:text-sm">{analysis.positioning_map.rationale}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Competitor Comparison */}
            {analysis.competitor_comparison?.length > 0 && (
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                className="glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">⚔️ Competitor Comparison</h3>

                <div className="space-y-3 sm:space-y-4">
                  {analysis.competitor_comparison.map((comp: any, idx: number) => (
                    <div key={idx} className="border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 bg-white/5 hover:bg-white/10 transition-all">

                      {/* Header */}
                      <div className="flex justify-between items-start mb-3 sm:mb-4 gap-2">
                        <div className="min-w-0">
                          <h4 className="text-lg sm:text-2xl font-bold text-[#D4DE95] leading-tight">{comp.name}</h4>
                          {comp.market_position && (
                            <p className="text-xs sm:text-sm text-gray-400 mt-0.5 sm:mt-1">{comp.market_position}</p>
                          )}
                        </div>
                        {comp.customer_sentiment && (
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                            comp.customer_sentiment === 'positive' ? 'bg-green-500/20 text-green-400' :
                            comp.customer_sentiment === 'mixed'    ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {comp.customer_sentiment}
                          </span>
                        )}
                      </div>

                      {comp.overview && (
                        <p className="text-gray-300 mb-3 sm:mb-4 text-xs sm:text-sm leading-relaxed">{comp.overview}</p>
                      )}

                      {/* Info grid — single col on mobile */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-4">
                        {comp.pricing_model && (
                          <div className="bg-purple-500/10 p-3 sm:p-4 rounded-xl">
                            <p className="text-xs text-gray-400 mb-1">Pricing Model</p>
                            <p className="text-xs sm:text-sm text-white font-semibold">{comp.pricing_model}</p>
                            {comp.price_range && (
                              <p className="text-xs text-gray-400 mt-1">{comp.price_range}</p>
                            )}
                          </div>
                        )}
                        {comp.target_customers && (
                          <div className="bg-blue-500/10 p-3 sm:p-4 rounded-xl">
                            <p className="text-xs text-gray-400 mb-1">Target Customers</p>
                            <p className="text-xs sm:text-sm text-white font-semibold">{comp.target_customers}</p>
                          </div>
                        )}
                        {comp.funding_stage && (
                          <div className="bg-green-500/10 p-3 sm:p-4 rounded-xl">
                            <p className="text-xs text-gray-400 mb-1">Funding Stage</p>
                            <p className="text-xs sm:text-sm text-white font-semibold">{comp.funding_stage}</p>
                          </div>
                        )}
                      </div>

                      {comp.key_features?.length > 0 && (
                        <div className="mb-3 sm:mb-4">
                          <p className="text-xs text-gray-400 mb-2">Key Features:</p>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {comp.key_features.map((feature: string, i: number) => (
                              <span key={i} className="px-2 sm:px-3 py-1 bg-white/5 text-gray-300 rounded-full text-xs">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Review summary */}
                      {comp.review_summary && (
                        <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                          <h5 className="text-xs sm:text-sm font-semibold text-purple-400 mb-2 sm:mb-3">📝 Customer Reviews</h5>
                          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3">
                            <div className="text-center">
                              <p className="text-xl sm:text-2xl font-bold text-white">{comp.review_summary.average_rating || 'N/A'}</p>
                              <p className="text-xs text-gray-400">Avg Rating</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xl sm:text-2xl font-bold text-white">{comp.review_summary.total_reviews || 0}</p>
                              <p className="text-xs text-gray-400">Reviews</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-400 mb-1">Sentiment</p>
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                comp.customer_sentiment === 'positive' ? 'bg-green-500/20 text-green-400' :
                                comp.customer_sentiment === 'mixed'    ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {comp.customer_sentiment || 'Unknown'}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2 sm:space-y-3">
                            {comp.review_summary.top_complaints?.length > 0 && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Top Complaints:</p>
                                {comp.review_summary.top_complaints.map((c: string, i: number) => (
                                  <p key={i} className="text-xs text-red-300 ml-2">• {c}</p>
                                ))}
                              </div>
                            )}
                            {comp.review_summary.top_praises?.length > 0 && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Top Praises:</p>
                                {comp.review_summary.top_praises.map((p: string, i: number) => (
                                  <p key={i} className="text-xs text-green-300 ml-2">• {p}</p>
                                ))}
                              </div>
                            )}
                            {comp.review_summary.switching_reasons?.length > 0 && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Why Customers Leave:</p>
                                {comp.review_summary.switching_reasons.map((r: string, i: number) => (
                                  <p key={i} className="text-xs text-yellow-300 ml-2">→ {r}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Strengths / Weaknesses */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
                        <div>
                          <p className="text-xs sm:text-sm font-semibold text-green-400 mb-1.5 sm:mb-2">Strengths</p>
                          <div className="space-y-1">
                            {comp.strengths?.map((s: string, i: number) => (
                              <p key={i} className="text-xs text-gray-300">✓ {s}</p>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-semibold text-red-400 mb-1.5 sm:mb-2">Weaknesses (YOUR Opportunities!)</p>
                          <div className="space-y-1">
                            {comp.weaknesses?.map((w: string, i: number) => (
                              <p key={i} className="text-xs text-yellow-300">⚠ {w}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Gap Analysis */}
            {analysis.gap_analysis?.length > 0 && (
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                className="glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-green-500/30 bg-green-500/5">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">🎯 Market Gaps</h3>
                <p className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">Where ALL competitors are lacking</p>

                <div className="space-y-3 sm:space-y-4">
                  {analysis.gap_analysis.map((gap: any, idx: number) => (
                    <div key={idx} className="bg-white/10 border border-green-500/30 p-4 sm:p-6 rounded-xl">
                      <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                        <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold uppercase shrink-0 ${getImpactColor(gap.impact)} bg-white/10`}>
                          {gap.impact} Impact
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm sm:text-lg font-bold text-green-400 mb-2">Gap: {gap.gap}</h4>
                          <div className="space-y-2">
                            <div className="bg-black/20 p-3 sm:p-4 rounded-lg">
                              <p className="text-xs text-gray-400 mb-1">YOUR OPPORTUNITY:</p>
                              <p className="text-white text-xs sm:text-sm font-semibold">{gap.your_opportunity}</p>
                            </div>
                            <p className="text-xs text-gray-500 italic">Evidence: {gap.evidence}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Differentiation Opportunities */}
            {analysis.differentiation_opportunities?.length > 0 && (
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                className="glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-blue-500/30">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">💡 How to Differentiate & Win</h3>
                <p className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">Strategic moves to beat your competitors</p>

                <div className="space-y-3 sm:space-y-4">
                  {analysis.differentiation_opportunities.map((opp: any, idx: number) => (
                    <div key={idx} className="bg-white/5 border border-blue-500/20 p-4 sm:p-6 rounded-xl hover:bg-white/10 transition-all">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3 sm:mb-4">
                        <h4 className="text-sm sm:text-lg font-bold text-blue-400 leading-snug">{opp.opportunity}</h4>
                        <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold border self-start shrink-0 ${getPriorityColor(opp.priority)}`}>
                          {opp.priority} Priority
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
                        <div className="bg-red-500/10 p-3 sm:p-4 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">Competitor Weakness:</p>
                          <p className="text-xs sm:text-sm text-red-300">{opp.competitor_weakness}</p>
                        </div>
                        <div className="bg-green-500/10 p-3 sm:p-4 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">Your Advantage:</p>
                          <p className="text-xs sm:text-sm text-green-300">{opp.your_advantage}</p>
                        </div>
                      </div>
                      <div className="bg-black/20 p-3 sm:p-4 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">How to Execute:</p>
                        <p className="text-xs sm:text-sm text-white">{opp.implementation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Customer Migration Analysis */}
            {analysis.migration_analysis && (
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                className="glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-yellow-500/30">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">🔄 Customer Migration Analysis</h3>
                <p className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">Why customers switch FROM competitors</p>

                {analysis.migration_analysis.switching_patterns && (
                  <div className="mb-4 sm:mb-6">
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-400 mb-3 sm:mb-4 uppercase">Switching Patterns Detected</h4>
                    <div className="bg-white/5 p-4 sm:p-6 rounded-xl mb-3 sm:mb-4">
                      <p className="text-3xl sm:text-4xl font-bold text-white mb-1 sm:mb-2">
                        {analysis.migration_analysis.switching_patterns.total_switches_found || 0}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-400">Switching mentions found in reviews & research</p>
                    </div>

                    {analysis.migration_analysis.switching_patterns.common_reasons?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs sm:text-sm font-semibold text-gray-400 mb-2">Common Switching Reasons:</p>
                        {analysis.migration_analysis.switching_patterns.common_reasons.map((reason: any, idx: number) => (
                          <div key={idx} className="bg-yellow-500/10 border border-yellow-500/30 p-3 sm:p-4 rounded-xl">
                            <p className="text-xs sm:text-sm text-yellow-400 font-semibold mb-1">{reason.competitor}</p>
                            <p className="text-xs text-gray-300">{reason.reason}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {analysis.migration_analysis.interview_questions?.length > 0 && (
                  <div className="mb-4 sm:mb-6">
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-400 mb-3 sm:mb-4 uppercase">Interview Questions to Ask Switchers</h4>
                    <div className="space-y-2 sm:space-y-3">
                      {analysis.migration_analysis.interview_questions.map((q: any, idx: number) => (
                        <div key={idx} className="bg-blue-500/10 border border-blue-500/20 p-3 sm:p-4 rounded-xl">
                          <p className="text-white font-semibold text-xs sm:text-sm mb-1.5 sm:mb-2">❓ {q.question}</p>
                          <p className="text-xs text-gray-400">Purpose: {q.purpose}</p>
                          {q.competitor && (
                            <p className="text-xs text-blue-400 mt-1">Target: {q.competitor}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.migration_analysis.onboarding_improvements?.length > 0 && (
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-400 mb-3 sm:mb-4 uppercase">Recommended Onboarding Improvements</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {analysis.migration_analysis.onboarding_improvements.map((imp: any, idx: number) => (
                        <div key={idx} className="bg-green-500/10 border border-green-500/30 p-3 sm:p-4 rounded-xl">
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <p className="text-white font-semibold text-xs sm:text-sm leading-snug">{imp.improvement}</p>
                            <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${getPriorityColor(imp.priority)}`}>
                              {imp.priority}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">{imp.rationale}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Feature Comparison Matrix — horizontal scroll on mobile */}
            {analysis.feature_comparison_matrix?.features && (
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                className="glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">✓ Feature Comparison Matrix</h3>
                <div className="overflow-x-auto -mx-5 sm:mx-0 px-5 sm:px-0">
                  <div className="min-w-[480px]">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left p-2 sm:p-4 text-gray-400 font-semibold text-xs sm:text-sm">Feature</th>
                          <th className="text-center p-2 sm:p-4 text-green-400 font-bold text-xs sm:text-sm">Your Product</th>
                          {Object.keys(analysis.feature_comparison_matrix.competitor_coverage || {}).map((comp, idx) =>
                            comp !== 'YourProduct' ? (
                              <th key={idx} className="text-center p-2 sm:p-4 text-gray-400 font-semibold text-xs sm:text-sm">{comp}</th>
                            ) : null
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {analysis.feature_comparison_matrix.features.map((feature: string, idx: number) => (
                          <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                            <td className="p-2 sm:p-4 text-gray-300 text-xs sm:text-sm">{feature}</td>
                            <td className="text-center p-2 sm:p-4">
                              {analysis.feature_comparison_matrix.competitor_coverage?.YourProduct?.[idx]
                                ? <span className="text-green-400 text-base sm:text-2xl">✓</span>
                                : <span className="text-gray-600 text-sm">—</span>}
                            </td>
                            {Object.entries(analysis.feature_comparison_matrix.competitor_coverage || {}).map(([comp, features]: [string, any], compIdx) =>
                              comp !== 'YourProduct' ? (
                                <td key={compIdx} className="text-center p-2 sm:p-4">
                                  {features[idx]
                                    ? <span className="text-gray-400 text-sm sm:text-xl">✓</span>
                                    : <span className="text-gray-700 text-sm">—</span>}
                                </td>
                              ) : null
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Strategic Recommendations */}
            {analysis.strategic_recommendations?.length > 0 && (
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                className="glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">🎯 Strategic Recommendations</h3>

                <div className="space-y-3 sm:space-y-4">
                  {analysis.strategic_recommendations.map((rec: any, idx: number) => (
                    <div key={idx} className="bg-white/5 border border-white/10 p-4 sm:p-6 rounded-xl">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3 sm:mb-4">
                        <div className="min-w-0">
                          <span className="text-xs text-gray-500 uppercase">{rec.category}</span>
                          <h4 className="text-sm sm:text-lg font-bold text-white mt-1 leading-snug">{rec.recommendation}</h4>
                        </div>
                        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-1 shrink-0">
                          <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold border ${getPriorityColor(rec.priority)}`}>
                            {rec.priority}
                          </span>
                          {rec.timeline && (
                            <p className="text-xs text-gray-500">{rec.timeline}</p>
                          )}
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-gray-300 mb-2 sm:mb-3">{rec.rationale}</p>

                      {rec.competitors_affected && rec.expected_impact && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                          <div className="bg-orange-500/10 p-2.5 sm:p-3 rounded-lg">
                            <p className="text-xs text-gray-400 mb-1">Targets:</p>
                            <p className="text-xs sm:text-sm text-orange-300">{rec.competitors_affected.join(', ')}</p>
                          </div>
                          <div className="bg-green-500/10 p-2.5 sm:p-3 rounded-lg">
                            <p className="text-xs text-gray-400 mb-1">Expected Impact:</p>
                            <p className="text-xs sm:text-sm text-green-300">{rec.expected_impact}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Actions — stacked on mobile */}
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
              className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center pt-2 sm:pt-4 pb-24 sm:pb-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="glass px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-white hover:scale-105 transition-all text-sm sm:text-base w-full sm:w-auto"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => navigate(`/quality-check?ideaId=${ideaId}`)}
                className="bg-purple-500 hover:bg-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:scale-105 transition-all text-sm sm:text-base flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Quality Evaluation →
              </button>
              <button
                onClick={executeAnalysis}
                className="gradient-primary text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:scale-105 transition-all text-sm sm:text-base w-full sm:w-auto"
              >
                Re-run Analysis
              </button>
            </motion.div>

          </div>
        )}
      </div>

      {ideaId && <StartupAdvisorChat ideaId={parseInt(ideaId)} />}
    </div>
  );
}