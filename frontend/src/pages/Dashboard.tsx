// import { useUser, UserButton } from '@clerk/clerk-react';
// import { motion } from 'framer-motion';
// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';

// export default function Dashboard() {
//   const { user } = useUser();
//   const navigate = useNavigate();
//   const [activeTab, setActiveTab] = useState('overview');

//   const stats = [
//     { label: 'Ideas Validated', value: '0', change: '+0%', icon: '💡', trend: 'up' },
//     { label: 'Confidence Score', value: '—', change: '—', icon: '🎯', trend: 'neutral' },
//     { label: 'Market Insights', value: '0', change: '+0', icon: '📊', trend: 'up' },
//     { label: 'Time Saved', value: '0h', change: '+0h', icon: '⚡', trend: 'up' },
//   ];

//   const recentActivity = [
//     // Placeholder for recent validations
//   ];

//   return (
//     <div className="min-h-screen bg-black">
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        
//         * {
//           font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
//           -webkit-font-smoothing: antialiased;
//           -moz-osx-font-smoothing: grayscale;
//         }

//         .mono {
//           font-family: 'JetBrains Mono', monospace;
//         }

//         body {
//           background: #000000;
//         }

//         .glass-panel {
//           background: rgba(255, 255, 255, 0.02);
//           backdrop-filter: blur(40px) saturate(180%);
//           border: 1px solid rgba(255, 255, 255, 0.06);
//         }

//         .glass-panel-hover {
//           transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
//         }

//         .glass-panel-hover:hover {
//           background: rgba(255, 255, 255, 0.04);
//           border-color: rgba(212, 222, 149, 0.3);
//           transform: translateY(-4px);
//           box-shadow: 0 24px 48px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(212, 222, 149, 0.1);
//         }

//         .premium-gradient {
//           background: linear-gradient(135deg, #636B2F 0%, #3D4127 100%);
//         }

//         .premium-gradient-soft {
//           background: linear-gradient(135deg, rgba(99, 107, 47, 0.1) 0%, rgba(61, 65, 39, 0.05) 100%);
//         }

//         .glow-green {
//           box-shadow: 0 0 60px rgba(212, 222, 149, 0.2);
//         }

//         .stat-card {
//           background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);
//           backdrop-filter: blur(20px);
//           border: 1px solid rgba(255, 255, 255, 0.05);
//           transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
//           position: relative;
//           overflow: hidden;
//         }

//         .stat-card::before {
//           content: '';
//           position: absolute;
//           top: 0;
//           left: -100%;
//           width: 100%;
//           height: 2px;
//           background: linear-gradient(90deg, transparent, #D4DE95, transparent);
//           transition: left 0.8s cubic-bezier(0.4, 0, 0.2, 1);
//         }

//         .stat-card:hover::before {
//           left: 100%;
//         }

//         .stat-card:hover {
//           background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
//           border-color: rgba(212, 222, 149, 0.3);
//           transform: translateY(-8px);
//           box-shadow: 
//             0 32px 64px rgba(0, 0, 0, 0.8),
//             0 0 0 1px rgba(212, 222, 149, 0.2),
//             inset 0 1px 0 rgba(255, 255, 255, 0.1);
//         }

//         .ultra-button {
//           background: linear-gradient(135deg, #636B2F 0%, #3D4127 100%);
//           color: white;
//           padding: 20px 48px;
//           border-radius: 16px;
//           font-weight: 700;
//           font-size: 16px;
//           letter-spacing: -0.03em;
//           transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
//           border: none;
//           cursor: pointer;
//           position: relative;
//           overflow: hidden;
//           box-shadow: 
//             0 12px 32px rgba(99, 107, 47, 0.4),
//             inset 0 1px 0 rgba(255, 255, 255, 0.2);
//         }

//         .ultra-button::before {
//           content: '';
//           position: absolute;
//           top: 0;
//           left: -100%;
//           width: 100%;
//           height: 100%;
//           background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
//           transition: left 0.7s cubic-bezier(0.4, 0, 0.2, 1);
//         }

//         .ultra-button:hover::before {
//           left: 100%;
//         }

//         .ultra-button:hover {
//           transform: translateY(-3px);
//           box-shadow: 
//             0 20px 48px rgba(99, 107, 47, 0.6),
//             0 0 0 1px rgba(212, 222, 149, 0.4),
//             inset 0 1px 0 rgba(255, 255, 255, 0.3);
//         }

//         .ultra-button:active {
//           transform: translateY(-1px);
//         }

//         .ultra-button-ghost {
//           background: rgba(255, 255, 255, 0.03);
//           color: rgba(255, 255, 255, 0.95);
//           padding: 20px 48px;
//           border-radius: 16px;
//           font-weight: 600;
//           font-size: 16px;
//           letter-spacing: -0.03em;
//           transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
//           border: 1px solid rgba(255, 255, 255, 0.1);
//           cursor: pointer;
//           position: relative;
//           overflow: hidden;
//         }

//         .ultra-button-ghost:hover {
//           background: rgba(255, 255, 255, 0.06);
//           border-color: rgba(212, 222, 149, 0.4);
//           transform: translateY(-3px);
//           box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
//         }

//         .nav-glass {
//           background: rgba(0, 0, 0, 0.6);
//           backdrop-filter: blur(40px) saturate(180%);
//           border-bottom: 1px solid rgba(255, 255, 255, 0.05);
//         }

//         .orb {
//           position: absolute;
//           border-radius: 50%;
//           filter: blur(120px);
//           opacity: 0.15;
//           pointer-events: none;
//           animation: float 20s ease-in-out infinite;
//         }

//         .orb-1 {
//           top: -20%;
//           right: 10%;
//           width: 800px;
//           height: 800px;
//           background: radial-gradient(circle, #636B2F 0%, transparent 70%);
//           animation-delay: 0s;
//         }

//         .orb-2 {
//           bottom: -30%;
//           left: -10%;
//           width: 700px;
//           height: 700px;
//           background: radial-gradient(circle, #3D4127 0%, transparent 70%);
//           animation-delay: -10s;
//         }

//         .orb-3 {
//           top: 40%;
//           left: 50%;
//           width: 600px;
//           height: 600px;
//           background: radial-gradient(circle, #D4DE95 0%, transparent 70%);
//           animation-delay: -5s;
//         }

//         @keyframes float {
//           0%, 100% {
//             transform: translate(0, 0) scale(1);
//           }
//           33% {
//             transform: translate(30px, -30px) scale(1.05);
//           }
//           66% {
//             transform: translate(-20px, 20px) scale(0.95);
//           }
//         }

//         .grid-pattern {
//           background-image: 
//             linear-gradient(rgba(212, 222, 149, 0.02) 1px, transparent 1px),
//             linear-gradient(90deg, rgba(212, 222, 149, 0.02) 1px, transparent 1px);
//           background-size: 60px 60px;
//         }

//         .glow-text {
//           text-shadow: 0 0 40px rgba(212, 222, 149, 0.3);
//         }

//         .badge-premium {
//           background: linear-gradient(135deg, rgba(212, 222, 149, 0.2) 0%, rgba(212, 222, 149, 0.1) 100%);
//           border: 1px solid rgba(212, 222, 149, 0.3);
//           color: #D4DE95;
//           padding: 6px 16px;
//           border-radius: 8px;
//           font-size: 11px;
//           font-weight: 700;
//           text-transform: uppercase;
//           letter-spacing: 0.08em;
//           box-shadow: 0 4px 12px rgba(212, 222, 149, 0.15);
//         }

//         .tab-ultra {
//           padding: 12px 24px;
//           border-radius: 10px;
//           font-weight: 600;
//           font-size: 14px;
//           transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
//           cursor: pointer;
//           border: none;
//           background: transparent;
//           color: rgba(255, 255, 255, 0.4);
//           letter-spacing: -0.01em;
//         }

//         .tab-ultra.active {
//           background: rgba(255, 255, 255, 0.06);
//           color: rgba(255, 255, 255, 1);
//           box-shadow: 
//             0 4px 16px rgba(0, 0, 0, 0.3),
//             inset 0 1px 0 rgba(255, 255, 255, 0.1);
//         }

//         .tab-ultra:hover:not(.active) {
//           background: rgba(255, 255, 255, 0.03);
//           color: rgba(255, 255, 255, 0.7);
//         }

//         .feature-card-ultra {
//           background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);
//           border: 1px solid rgba(255, 255, 255, 0.05);
//           transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
//           position: relative;
//           overflow: hidden;
//         }

//         .feature-card-ultra::after {
//           content: '';
//           position: absolute;
//           top: -50%;
//           left: -50%;
//           width: 200%;
//           height: 200%;
//           background: radial-gradient(circle, rgba(212, 222, 149, 0.05) 0%, transparent 70%);
//           opacity: 0;
//           transition: opacity 0.6s;
//         }

//         .feature-card-ultra:hover::after {
//           opacity: 1;
//         }

//         .feature-card-ultra:hover {
//           background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
//           border-color: rgba(212, 222, 149, 0.2);
//           transform: translateY(-8px);
//           box-shadow: 
//             0 24px 56px rgba(0, 0, 0, 0.8),
//             0 0 0 1px rgba(212, 222, 149, 0.15);
//         }

//         .hero-card {
//           background: linear-gradient(135deg, rgba(99, 107, 47, 0.15) 0%, rgba(61, 65, 39, 0.08) 100%);
//           border: 1px solid rgba(212, 222, 149, 0.15);
//           box-shadow: 
//             0 32px 64px rgba(0, 0, 0, 0.6),
//             inset 0 1px 0 rgba(255, 255, 255, 0.05);
//         }

//         .pulse-dot-ultra {
//           width: 8px;
//           height: 8px;
//           background: #D4DE95;
//           border-radius: 50%;
//           box-shadow: 0 0 16px rgba(212, 222, 149, 0.8);
//           animation: pulse-ultra 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
//         }

//         @keyframes pulse-ultra {
//           0%, 100% {
//             opacity: 1;
//             transform: scale(1);
//           }
//           50% {
//             opacity: 0.5;
//             transform: scale(1.2);
//           }
//         }

//         .empty-state-ultra {
//           padding: 120px 48px;
//           text-align: center;
//           background: rgba(255, 255, 255, 0.01);
//           border-radius: 32px;
//           border: 2px dashed rgba(255, 255, 255, 0.06);
//         }

//         .icon-float {
//           animation: icon-float 4s ease-in-out infinite;
//         }

//         @keyframes icon-float {
//           0%, 100% { transform: translateY(0px); }
//           50% { transform: translateY(-12px); }
//         }

//         .metric-value {
//           font-variant-numeric: tabular-nums;
//           letter-spacing: -0.05em;
//         }
//       `}</style>

//       {/* Background Effects */}
//       <div className="fixed inset-0 overflow-hidden pointer-events-none">
//         <div className="orb orb-1"></div>
//         <div className="orb orb-2"></div>
//         <div className="orb orb-3"></div>
//         <div className="absolute inset-0 grid-pattern opacity-30"></div>
//       </div>

//       {/* Navigation */}
//       <nav className="nav-glass sticky top-0 z-50">
//         <div className="max-w-7xl mx-auto px-6 lg:px-8">
//           <div className="flex justify-between h-20 items-center">
//             <div className="flex items-center gap-4">
//               <div className="w-11 h-11 premium-gradient rounded-xl flex items-center justify-center text-white font-black text-lg shadow-2xl">
//                 F
//               </div>
//               <div>
//                 <div className="mono font-bold text-base tracking-wider text-white">FOUNDRY</div>
//                 <div className="text-[10px] text-gray-500 uppercase tracking-[0.15em] font-semibold">Command Center</div>
//               </div>
//             </div>
//             <div className="flex items-center gap-6">
//               <div className="badge-premium">BETA ACCESS</div>
//               <div className="hidden md:flex items-center gap-3">
//                 <div className="w-2 h-2 bg-green-400 rounded-full shadow-lg shadow-green-400/50"></div>
//                 <div className="text-sm">
//                   <span className="text-gray-400">Hey,</span>{' '}
//                   <span className="text-white font-semibold">{user?.firstName || 'Founder'}</span>
//                 </div>
//               </div>
//               <UserButton 
//                 afterSignOutUrl="/" 
//                 appearance={{
//                   elements: {
//                     avatarBox: "w-11 h-11 ring-2 ring-[#636B2F]/30 shadow-xl"
//                   }
//                 }} 
//               />
//             </div>
//           </div>
//         </div>
//       </nav>

//       <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-16">
//         {/* Hero Section */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.8 }}
//           className="mb-20"
//         >
//           <div className="flex items-center gap-3 mb-8">
//             <div className="pulse-dot-ultra"></div>
//             <span className="text-sm font-bold text-[#D4DE95] uppercase tracking-[0.12em] mono">Active Session</span>
//           </div>
//           <h1 className="text-7xl md:text-8xl font-black text-white mb-8 tracking-tight leading-none glow-text">
//             Validation
//             <br />
//             <span className="bg-gradient-to-r from-[#D4DE95] via-[#BAC095] to-[#636B2F] bg-clip-text text-transparent">
//               Command Center
//             </span>
//           </h1>
//           <p className="text-2xl text-gray-400 max-w-3xl leading-relaxed font-light">
//             Evidence-backed startup validation powered by precision AI. 
//             <span className="text-white font-medium"> Transform uncertainty into strategy.</span>
//           </p>
//         </motion.div>

//         {/* Stats Grid */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.8, delay: 0.1 }}
//           className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20"
//         >
//           {stats.map((stat, idx) => (
//             <motion.div
//               key={stat.label}
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.6, delay: idx * 0.1 }}
//               className="stat-card p-8 rounded-2xl group"
//             >
//               <div className="flex items-center justify-between mb-6">
//                 <span className="text-4xl group-hover:scale-125 transition-transform duration-500 icon-float">
//                   {stat.icon}
//                 </span>
//                 <div className={`text-xs font-bold mono px-3 py-1 rounded-lg ${
//                   stat.trend === 'up' 
//                     ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
//                     : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
//                 }`}>
//                   {stat.change}
//                 </div>
//               </div>
//               <div className="text-5xl font-black text-white mb-3 tracking-tight metric-value">
//                 {stat.value}
//               </div>
//               <div className="text-sm text-gray-400 font-semibold uppercase tracking-wide">
//                 {stat.label}
//               </div>
//             </motion.div>
//           ))}
//         </motion.div>

//         {/* Hero CTA */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.8, delay: 0.2 }}
//           className="hero-card rounded-[2rem] p-16 mb-20 relative overflow-hidden"
//         >
//           <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#D4DE95] opacity-5 rounded-full blur-[100px]"></div>
//           <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#636B2F] opacity-5 rounded-full blur-[100px]"></div>
          
//           <div className="relative z-10 max-w-4xl">
//             <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-sm px-5 py-3 rounded-xl mb-8 border border-white/10">
//               <span className="w-2.5 h-2.5 bg-green-400 rounded-full shadow-lg shadow-green-400/50 animate-pulse"></span>
//               <span className="text-sm font-bold text-white uppercase tracking-wider">System Ready</span>
//             </div>
            
//             <h2 className="text-6xl font-black text-white mb-6 tracking-tight leading-tight">
//               Launch Your First
//               <br />
//               AI Validation
//             </h2>
            
//             <p className="text-xl text-gray-300 mb-12 max-w-2xl leading-relaxed">
//               Deploy our agent orchestra to analyze market demand, competitive landscape, 
//               and strategic viability—<span className="text-white font-semibold">institutional-grade insights in 15 minutes.</span>
//             </p>
            
//             <div className="flex flex-col sm:flex-row gap-5 mb-10">
//               <button 
//                 onClick={() => navigate('/new-idea')}
//                 className="ultra-button flex items-center justify-center gap-4 text-lg"
//               >
//                 <span className="text-3xl">🎤</span>
//                 <span>Start with Voice</span>
//               </button>
//               <button 
//                 onClick={() => navigate('/new-idea')}
//                 className="ultra-button-ghost flex items-center justify-center gap-4 text-lg"
//               >
//                 <span className="text-3xl">✍️</span>
//                 <span>Start with Text</span>
//               </button>
//             </div>

//             <div className="flex flex-wrap gap-4">
//               <div className="glass-panel px-5 py-3 rounded-xl backdrop-blur-sm border border-white/10">
//                 <span className="text-sm font-semibold text-white">⚡ 15-min analysis</span>
//               </div>
//               <div className="glass-panel px-5 py-3 rounded-xl backdrop-blur-sm border border-white/10">
//                 <span className="text-sm font-semibold text-white">🎯 94% accuracy</span>
//               </div>
//               <div className="glass-panel px-5 py-3 rounded-xl backdrop-blur-sm border border-white/10">
//                 <span className="text-sm font-semibold text-white">📊 Evidence-backed</span>
//               </div>
//               <div className="glass-panel px-5 py-3 rounded-xl backdrop-blur-sm border border-white/10">
//                 <span className="text-sm font-semibold text-white">🔒 Encrypted</span>
//               </div>
//             </div>
//           </div>
//         </motion.div>

//         {/* Tabs */}
//         <div className="mb-10">
//           <div className="flex gap-3 glass-panel p-2.5 rounded-2xl inline-flex backdrop-blur-xl border border-white/10">
//             <button 
//               className={`tab-ultra ${activeTab === 'overview' ? 'active' : ''}`}
//               onClick={() => setActiveTab('overview')}
//             >
//               Overview
//             </button>
//             <button 
//               className={`tab-ultra ${activeTab === 'ideas' ? 'active' : ''}`}
//               onClick={() => setActiveTab('ideas')}
//             >
//               My Ideas
//             </button>
//             <button 
//               className={`tab-ultra ${activeTab === 'capabilities' ? 'active' : ''}`}
//               onClick={() => setActiveTab('capabilities')}
//             >
//               Capabilities
//             </button>
//           </div>
//         </div>

//         {/* Content */}
//         {activeTab === 'overview' && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ duration: 0.5 }}
//             className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
//           >
//             {[
//               { num: '01', title: 'Describe', desc: 'Natural language input via voice or text', icon: '💭', color: 'from-blue-500/20 to-blue-500/5' },
//               { num: '02', title: 'Orchestrate', desc: 'AI agents coordinate validation workflow', icon: '🎯', color: 'from-purple-500/20 to-purple-500/5' },
//               { num: '03', title: 'Validate', desc: 'Evidence-backed quality scoring', icon: '✨', color: 'from-green-500/20 to-green-500/5' },
//               { num: '04', title: 'Execute', desc: 'Investor-ready strategic report', icon: '🚀', color: 'from-orange-500/20 to-orange-500/5' }
//             ].map((step, idx) => (
//               <motion.div
//                 key={step.num}
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.5, delay: idx * 0.1 }}
//                 className="feature-card-ultra p-10 rounded-2xl backdrop-blur-sm"
//               >
//                 <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 border border-white/10`}>
//                   <span className="text-5xl icon-float">{step.icon}</span>
//                 </div>
//                 <div className="mono text-3xl font-black text-[#D4DE95] mb-4 tracking-tight">{step.num}</div>
//                 <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{step.title}</h3>
//                 <p className="text-sm text-gray-400 leading-relaxed font-medium">{step.desc}</p>
//               </motion.div>
//             ))}
//           </motion.div>
//         )}

//         {activeTab === 'ideas' && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ duration: 0.5 }}
//           >
//             <div className="empty-state-ultra">
//               <div className="text-8xl mb-8 icon-float">💡</div>
//               <h3 className="text-4xl font-black text-white mb-5 tracking-tight">No Validations Yet</h3>
//               <p className="text-gray-400 mb-10 text-xl max-w-lg mx-auto leading-relaxed">
//                 Launch your first AI-powered validation to see deep insights appear here
//               </p>
//               <button 
//                 onClick={() => navigate('/new-idea')}
//                 className="ultra-button text-lg"
//               >
//                 Start First Validation
//               </button>
//             </div>
//           </motion.div>
//         )}

//         {activeTab === 'capabilities' && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ duration: 0.5 }}
//             className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
//           >
//             {[
//               { icon: '🎤', title: 'Voice Input', desc: 'Whisper-powered transcription with confidence scoring', status: 'Active', color: 'green' },
//               { icon: '🔍', title: 'RAG Research', desc: 'FAISS-indexed evidence retrieval from curated sources', status: 'Active', color: 'green' },
//               { icon: '⚖️', title: 'Critic Agent', desc: 'Quality validation with automated refinement loops', status: 'Active', color: 'green' },
//               { icon: '🧭', title: 'Orchestrator', desc: 'Adaptive workflow routing via Planner Agent', status: 'Active', color: 'green' },
//               { icon: '📊', title: 'Market Intel', desc: 'Competitive positioning and differentiation mapping', status: 'Active', color: 'green' },
//               { icon: '📄', title: 'Report Gen', desc: 'Professional PDF exports with strategic insights', status: 'Active', color: 'green' },
//             ].map((feature, idx) => (
//               <motion.div
//                 key={feature.title}
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.5, delay: idx * 0.1 }}
//                 className="feature-card-ultra p-10 rounded-2xl backdrop-blur-sm group"
//               >
//                 <div className="flex items-start justify-between mb-8">
//                   <div className="w-16 h-16 glass-panel rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
//                     <span className="text-4xl">{feature.icon}</span>
//                   </div>
//                   <span className={`text-xs font-bold mono px-3 py-1.5 rounded-lg ${
//                     feature.color === 'green' 
//                       ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
//                       : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
//                   }`}>
//                     {feature.status}
//                   </span>
//                 </div>
//                 <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">{feature.title}</h3>
//                 <p className="text-sm text-gray-400 leading-relaxed font-medium">{feature.desc}</p>
//               </motion.div>
//             ))}
//           </motion.div>
//         )}
//       </div>
//     </div>
//   );
// }

// File: frontend/src/pages/Dashboard.tsx
// Mobile-responsive + voice input removed

import { useUser, UserButton } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user }    = useUser();
  const navigate    = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const stats = [
    { label: 'Ideas Validated', value: '0',  change: '+0%', icon: '💡', trend: 'up'      },
    { label: 'Confidence Score', value: '—', change: '—',   icon: '🎯', trend: 'neutral' },
    { label: 'Market Insights',  value: '0',  change: '+0',  icon: '📊', trend: 'up'      },
    { label: 'Time Saved',       value: '0h', change: '+0h', icon: '⚡', trend: 'up'      },
  ];

  return (
    <div className="min-h-screen bg-black">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

        *{font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;-webkit-font-smoothing:antialiased;box-sizing:border-box;}
        .mono{font-family:'JetBrains Mono',monospace;}
        body{background:#000;}

        .glass-panel{background:rgba(255,255,255,0.02);backdrop-filter:blur(40px) saturate(180%);border:1px solid rgba(255,255,255,0.06);}

        .glass-panel-hover{transition:all 0.5s cubic-bezier(0.4,0,0.2,1);}
        .glass-panel-hover:hover{background:rgba(255,255,255,0.04);border-color:rgba(212,222,149,0.3);transform:translateY(-4px);box-shadow:0 24px 48px rgba(0,0,0,0.8),0 0 0 1px rgba(212,222,149,0.1);}

        .premium-gradient{background:linear-gradient(135deg,#636B2F 0%,#3D4127 100%);}

        .stat-card{
          background:linear-gradient(135deg,rgba(255,255,255,0.03) 0%,rgba(255,255,255,0.01) 100%);
          backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.05);
          transition:all 0.6s cubic-bezier(0.4,0,0.2,1);position:relative;overflow:hidden;
        }
        .stat-card::before{
          content:'';position:absolute;top:0;left:-100%;width:100%;height:2px;
          background:linear-gradient(90deg,transparent,#D4DE95,transparent);
          transition:left 0.8s cubic-bezier(0.4,0,0.2,1);
        }
        .stat-card:hover::before{left:100%;}
        .stat-card:hover{
          background:linear-gradient(135deg,rgba(255,255,255,0.05) 0%,rgba(255,255,255,0.02) 100%);
          border-color:rgba(212,222,149,0.3);transform:translateY(-8px);
          box-shadow:0 32px 64px rgba(0,0,0,0.8),0 0 0 1px rgba(212,222,149,0.2),inset 0 1px 0 rgba(255,255,255,0.1);
        }

        .ultra-button{
          background:linear-gradient(135deg,#636B2F 0%,#3D4127 100%);
          color:white;padding:16px 32px;border-radius:14px;
          font-weight:700;font-size:15px;letter-spacing:-0.02em;
          transition:all 0.5s cubic-bezier(0.4,0,0.2,1);border:none;cursor:pointer;
          position:relative;overflow:hidden;
          box-shadow:0 12px 32px rgba(99,107,47,0.4),inset 0 1px 0 rgba(255,255,255,0.2);
          -webkit-tap-highlight-color:transparent;
        }
        .ultra-button::before{
          content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent);
          transition:left 0.7s cubic-bezier(0.4,0,0.2,1);
        }
        .ultra-button:hover::before{left:100%;}
        .ultra-button:hover{transform:translateY(-3px);box-shadow:0 20px 48px rgba(99,107,47,0.6),0 0 0 1px rgba(212,222,149,0.4),inset 0 1px 0 rgba(255,255,255,0.3);}
        .ultra-button:active{transform:translateY(-1px);}

        @media(min-width:640px){
          .ultra-button{padding:20px 48px;font-size:16px;border-radius:16px;}
        }

        .ultra-button-ghost{
          background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.95);
          padding:16px 32px;border-radius:14px;
          font-weight:600;font-size:15px;letter-spacing:-0.02em;
          transition:all 0.5s cubic-bezier(0.4,0,0.2,1);
          border:1px solid rgba(255,255,255,0.1);cursor:pointer;
          position:relative;overflow:hidden;
          -webkit-tap-highlight-color:transparent;
        }
        .ultra-button-ghost:hover{background:rgba(255,255,255,0.06);border-color:rgba(212,222,149,0.4);transform:translateY(-3px);box-shadow:0 12px 32px rgba(0,0,0,0.6);}

        @media(min-width:640px){
          .ultra-button-ghost{padding:20px 48px;font-size:16px;border-radius:16px;}
        }

        .nav-glass{background:rgba(0,0,0,0.6);backdrop-filter:blur(40px) saturate(180%);border-bottom:1px solid rgba(255,255,255,0.05);}

        .orb{position:absolute;border-radius:50%;filter:blur(120px);opacity:0.15;pointer-events:none;animation:float 20s ease-in-out infinite;}
        .orb-1{top:-20%;right:10%;width:clamp(300px,50vw,800px);height:clamp(300px,50vw,800px);background:radial-gradient(circle,#636B2F 0%,transparent 70%);}
        .orb-2{bottom:-30%;left:-10%;width:clamp(250px,45vw,700px);height:clamp(250px,45vw,700px);background:radial-gradient(circle,#3D4127 0%,transparent 70%);animation-delay:-10s;}
        .orb-3{top:40%;left:50%;width:clamp(200px,40vw,600px);height:clamp(200px,40vw,600px);background:radial-gradient(circle,#D4DE95 0%,transparent 70%);animation-delay:-5s;}

        @keyframes float{0%,100%{transform:translate(0,0) scale(1);}33%{transform:translate(30px,-30px) scale(1.05);}66%{transform:translate(-20px,20px) scale(0.95);}}

        .grid-pattern{
          background-image:linear-gradient(rgba(212,222,149,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(212,222,149,0.02) 1px,transparent 1px);
          background-size:60px 60px;
        }

        .glow-text{text-shadow:0 0 40px rgba(212,222,149,0.3);}

        .badge-premium{
          background:linear-gradient(135deg,rgba(212,222,149,0.2) 0%,rgba(212,222,149,0.1) 100%);
          border:1px solid rgba(212,222,149,0.3);color:#D4DE95;
          padding:5px 12px;border-radius:7px;font-size:10px;font-weight:700;
          text-transform:uppercase;letter-spacing:0.08em;
          box-shadow:0 4px 12px rgba(212,222,149,0.15);
          white-space:nowrap;
        }

        @media(min-width:640px){.badge-premium{padding:6px 16px;font-size:11px;border-radius:8px;}}

        .tab-ultra{
          padding:10px 16px;border-radius:10px;font-weight:600;font-size:13px;
          transition:all 0.4s cubic-bezier(0.4,0,0.2,1);cursor:pointer;border:none;
          background:transparent;color:rgba(255,255,255,0.4);letter-spacing:-0.01em;
          white-space:nowrap;-webkit-tap-highlight-color:transparent;
        }
        .tab-ultra.active{background:rgba(255,255,255,0.06);color:rgba(255,255,255,1);box-shadow:0 4px 16px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.1);}
        .tab-ultra:hover:not(.active){background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.7);}

        @media(min-width:640px){.tab-ultra{padding:12px 24px;font-size:14px;}}

        .feature-card-ultra{
          background:linear-gradient(135deg,rgba(255,255,255,0.03) 0%,rgba(255,255,255,0.01) 100%);
          border:1px solid rgba(255,255,255,0.05);
          transition:all 0.6s cubic-bezier(0.4,0,0.2,1);position:relative;overflow:hidden;
        }
        .feature-card-ultra::after{
          content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;
          background:radial-gradient(circle,rgba(212,222,149,0.05) 0%,transparent 70%);
          opacity:0;transition:opacity 0.6s;
        }
        .feature-card-ultra:hover::after{opacity:1;}
        .feature-card-ultra:hover{
          background:linear-gradient(135deg,rgba(255,255,255,0.05) 0%,rgba(255,255,255,0.02) 100%);
          border-color:rgba(212,222,149,0.2);transform:translateY(-8px);
          box-shadow:0 24px 56px rgba(0,0,0,0.8),0 0 0 1px rgba(212,222,149,0.15);
        }

        .hero-card{
          background:linear-gradient(135deg,rgba(99,107,47,0.15) 0%,rgba(61,65,39,0.08) 100%);
          border:1px solid rgba(212,222,149,0.15);
          box-shadow:0 32px 64px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.05);
        }

        .pulse-dot-ultra{
          width:8px;height:8px;background:#D4DE95;border-radius:50%;
          box-shadow:0 0 16px rgba(212,222,149,0.8);
          animation:pulse-ultra 2s cubic-bezier(0.4,0,0.6,1) infinite;
          flex-shrink:0;
        }
        @keyframes pulse-ultra{0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.5;transform:scale(1.2);}}

        .empty-state-ultra{
          padding:60px 24px;text-align:center;
          background:rgba(255,255,255,0.01);border-radius:32px;
          border:2px dashed rgba(255,255,255,0.06);
        }
        @media(min-width:640px){.empty-state-ultra{padding:120px 48px;}}

        .icon-float{animation:icon-float 4s ease-in-out infinite;}
        @keyframes icon-float{0%,100%{transform:translateY(0);}50%{transform:translateY(-12px);}}

        .metric-value{font-variant-numeric:tabular-nums;letter-spacing:-0.05em;}

        /* scrollbar */
        ::-webkit-scrollbar{height:3px;width:3px;}
        ::-webkit-scrollbar-thumb{background:#636B2F;border-radius:4px;}

        /* tab bar scroll on mobile */
        .tab-scroll::-webkit-scrollbar{display:none;}
        .tab-scroll{-ms-overflow-style:none;scrollbar-width:none;}
      `}</style>

      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
        <div className="absolute inset-0 grid-pattern opacity-30"></div>
      </div>

      {/* Navigation */}
      <nav className="nav-glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 sm:h-20 items-center">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-9 h-9 sm:w-11 sm:h-11 premium-gradient rounded-xl flex items-center justify-center text-white font-black text-base sm:text-lg shadow-2xl shrink-0">
                F
              </div>
              <div>
                <div className="mono font-bold text-sm sm:text-base tracking-wider text-white">FOUNDRY</div>
                <div className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-[0.15em] font-semibold hidden xs:block">Command Center</div>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-6">
              <div className="badge-premium hidden sm:block">BETA ACCESS</div>
              <div className="hidden md:flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full shadow-lg shadow-green-400/50"></div>
                <div className="text-sm">
                  <span className="text-gray-400">Hey,</span>{' '}
                  <span className="text-white font-semibold">{user?.firstName || 'Founder'}</span>
                </div>
              </div>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: 'w-9 h-9 sm:w-11 sm:h-11 ring-2 ring-[#636B2F]/30 shadow-xl'
                  }
                }}
              />
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">

        {/* Hero Section */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.8 }} className="mb-12 sm:mb-20">
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <div className="pulse-dot-ultra"></div>
            <span className="text-xs sm:text-sm font-bold text-[#D4DE95] uppercase tracking-[0.12em] mono">Active Session</span>
          </div>
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-white mb-4 sm:mb-8 tracking-tight leading-none glow-text">
            Validation
            <br />
            <span className="bg-gradient-to-r from-[#D4DE95] via-[#BAC095] to-[#636B2F] bg-clip-text text-transparent">
              Command Center
            </span>
          </h1>
          <p className="text-base sm:text-xl md:text-2xl text-gray-400 max-w-3xl leading-relaxed font-light">
            Evidence-backed startup validation powered by precision AI.{' '}
            <span className="text-white font-medium">Transform uncertainty into strategy.</span>
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.8, delay:0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-12 sm:mb-20">
          {stats.map((stat, idx) => (
            <motion.div key={stat.label}
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:idx * 0.1 }}
              className="stat-card p-5 sm:p-8 rounded-2xl group">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <span className="text-2xl sm:text-4xl group-hover:scale-125 transition-transform duration-500 icon-float">
                  {stat.icon}
                </span>
                <div className={`text-xs font-bold mono px-2 sm:px-3 py-1 rounded-lg ${
                  stat.trend === 'up'
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                }`}>
                  {stat.change}
                </div>
              </div>
              <div className="text-3xl sm:text-5xl font-black text-white mb-2 sm:mb-3 tracking-tight metric-value">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm text-gray-400 font-semibold uppercase tracking-wide leading-tight">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Hero CTA Card */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.8, delay:0.2 }}
          className="hero-card rounded-[1.5rem] sm:rounded-[2rem] p-8 sm:p-12 lg:p-16 mb-12 sm:mb-20 relative overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#D4DE95] opacity-5 rounded-full blur-[100px]"></div>
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#636B2F] opacity-5 rounded-full blur-[100px]"></div>

          <div className="relative z-10 max-w-4xl">
            <div className="inline-flex items-center gap-2 sm:gap-3 bg-white/5 backdrop-blur-sm px-4 sm:px-5 py-2 sm:py-3 rounded-xl mb-6 sm:mb-8 border border-white/10">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-400 rounded-full shadow-lg shadow-green-400/50 animate-pulse"></span>
              <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">System Ready</span>
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-4 sm:mb-6 tracking-tight leading-tight">
              Launch Your First
              <br />
              AI Validation
            </h2>

            <p className="text-sm sm:text-lg lg:text-xl text-gray-300 mb-8 sm:mb-12 max-w-2xl leading-relaxed">
              Deploy our agent orchestra to analyze market demand, competitive landscape,
              and strategic viability—
              <span className="text-white font-semibold"> institutional-grade insights in 15 minutes.</span>
            </p>

            {/* ── CTA buttons — voice input REMOVED ── */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 mb-8 sm:mb-10">
              <button
                onClick={() => navigate('/new-idea')}
                className="ultra-button flex items-center justify-center gap-3"
              >
                <span className="text-2xl sm:text-3xl">✍️</span>
                <span>Start Validation</span>
              </button>
              <button
                onClick={() => navigate('/new-idea')}
                className="ultra-button-ghost flex items-center justify-center gap-3"
              >
                <span className="text-2xl sm:text-3xl">💡</span>
                <span>Explore Demo</span>
              </button>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 sm:gap-4">
              {[
                '⚡ 15-min analysis',
                '🎯 94% accuracy',
                '📊 Evidence-backed',
                '🔒 Encrypted',
              ].map(badge => (
                <div key={badge} className="glass-panel px-3 sm:px-5 py-2 sm:py-3 rounded-xl backdrop-blur-sm border border-white/10">
                  <span className="text-xs sm:text-sm font-semibold text-white">{badge}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Tabs — scrollable on mobile */}
        <div className="mb-6 sm:mb-10">
          <div className="tab-scroll overflow-x-auto">
            <div className="flex gap-1 sm:gap-3 glass-panel p-2 sm:p-2.5 rounded-2xl inline-flex backdrop-blur-xl border border-white/10 min-w-max">
              {[
                { id: 'overview',      label: 'Overview'      },
                { id: 'ideas',         label: 'My Ideas'       },
                { id: 'capabilities',  label: 'Capabilities'   },
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`tab-ultra ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.5 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { num:'01', title:'Describe',    desc:'Natural language input via text',              icon:'💭', color:'from-blue-500/20 to-blue-500/5'   },
              { num:'02', title:'Orchestrate', desc:'AI agents coordinate validation workflow',      icon:'🎯', color:'from-purple-500/20 to-purple-500/5'},
              { num:'03', title:'Validate',    desc:'Evidence-backed quality scoring',               icon:'✨', color:'from-green-500/20 to-green-500/5'  },
              { num:'04', title:'Execute',     desc:'Investor-ready strategic report',               icon:'🚀', color:'from-orange-500/20 to-orange-500/5'},
            ].map((step, idx) => (
              <motion.div key={step.num}
                initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:idx * 0.1 }}
                className="feature-card-ultra p-6 sm:p-10 rounded-2xl backdrop-blur-sm">
                <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-4 sm:mb-6 border border-white/10`}>
                  <span className="text-3xl sm:text-5xl icon-float">{step.icon}</span>
                </div>
                <div className="mono text-2xl sm:text-3xl font-black text-[#D4DE95] mb-2 sm:mb-4 tracking-tight">{step.num}</div>
                <h3 className="text-lg sm:text-2xl font-bold text-white mb-2 sm:mb-3 tracking-tight">{step.title}</h3>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-medium">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === 'ideas' && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.5 }}>
            <div className="empty-state-ultra">
              <div className="text-6xl sm:text-8xl mb-6 sm:mb-8 icon-float">💡</div>
              <h3 className="text-2xl sm:text-4xl font-black text-white mb-3 sm:mb-5 tracking-tight">No Validations Yet</h3>
              <p className="text-gray-400 mb-8 sm:mb-10 text-base sm:text-xl max-w-lg mx-auto leading-relaxed">
                Launch your first AI-powered validation to see deep insights appear here
              </p>
              <button onClick={() => navigate('/new-idea')} className="ultra-button text-base sm:text-lg">
                Start First Validation
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'capabilities' && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.5 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              { icon:'🔍', title:'RAG Research',    desc:'FAISS-indexed evidence retrieval from curated sources',    status:'Active', color:'green' },
              { icon:'⚖️', title:'Critic Agent',    desc:'Quality validation with automated refinement loops',       status:'Active', color:'green' },
              { icon:'🧭', title:'Orchestrator',    desc:'Adaptive workflow routing via Planner Agent',              status:'Active', color:'green' },
              { icon:'📊', title:'Market Intel',    desc:'Competitive positioning and differentiation mapping',       status:'Active', color:'green' },
              { icon:'📄', title:'Report Gen',      desc:'Professional PDF exports with strategic insights',          status:'Active', color:'green' },
              { icon:'🔒', title:'Secure Vault',    desc:'End-to-end encryption with enterprise-grade access control',status:'Active', color:'green' },
            ].map((feature, idx) => (
              <motion.div key={feature.title}
                initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:idx * 0.1 }}
                className="feature-card-ultra p-6 sm:p-10 rounded-2xl backdrop-blur-sm group">
                <div className="flex items-start justify-between mb-5 sm:mb-8">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 glass-panel rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <span className="text-2xl sm:text-4xl">{feature.icon}</span>
                  </div>
                  <span className={`text-xs font-bold mono px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg ${
                    feature.color === 'green'
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                      : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                  }`}>
                    {feature.status}
                  </span>
                </div>
                <h3 className="text-lg sm:text-2xl font-bold text-white mb-2 sm:mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-medium">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

      </div>
    </div>
  );
}