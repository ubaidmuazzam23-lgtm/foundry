// File: frontend/src/features/idea-collection/components/NewIdea.tsx
// Updated to navigate to cross-questioning after submission

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';

export default function NewIdea() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [inputMode, setInputMode] = useState<'text' | null>(null);
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const MIN_CHARS = 50;
  const MAX_CHARS = 5000;
  const charCount = textInput.length;
  const progress = Math.min((charCount / MIN_CHARS) * 100, 100);

  const handleSubmit = async () => {
    if (charCount < MIN_CHARS) {
      setErrorMessage(`Please provide at least ${MIN_CHARS} characters to describe your idea.`);
      return;
    }

    if (charCount > MAX_CHARS) {
      setErrorMessage(`Maximum ${MAX_CHARS} characters allowed.`);
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('http://localhost:8000/api/v1/ideas/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textInput,
          user_id: user?.id || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit idea');
      }

      const data = await response.json();
      setSuccessMessage('Idea submitted successfully! 🎉');
      
      // Navigate to cross-questioning
      setTimeout(() => {
        navigate(`/cross-questioning?ideaId=${data.id}`);
      }, 1000);

    } catch (error) {
      console.error('Submission error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to process your idea. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const exampleIdeas = [
    "A SaaS platform for restaurants to manage online orders, deliveries, and customer feedback in one place.",
    "An AI-powered personal finance app that analyzes spending patterns and automatically suggests budget optimizations.",
    "A mobile app connecting freelance fitness trainers with clients for virtual 1-on-1 coaching sessions."
  ];

  const fillExample = (example: string) => {
    setTextInput(example);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .mono {
          font-family: 'JetBrains Mono', monospace;
        }
        .glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .gradient-primary {
          background: linear-gradient(135deg, #636B2F 0%, #3D4127 100%);
        }
        .progress-bar {
          transition: width 0.3s ease;
        }
      `}</style>

      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#636B2F] opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#D4DE95] opacity-5 rounded-full blur-3xl"></div>
      </div>

      <nav className="glass sticky top-0 z-50 relative">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-all group"
              disabled={isProcessing}
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              <span className="text-sm font-medium">Back to Dashboard</span>
            </button>
            <div className="flex items-center gap-6">
              {user && (
                <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">
                  <div className="w-8 h-8 rounded-full bg-[#636B2F] flex items-center justify-center text-white font-semibold">
                    {user.firstName?.charAt(0) || user.emailAddresses[0]?.emailAddress.charAt(0).toUpperCase()}
                  </div>
                  <span>{user.firstName || user.emailAddresses[0]?.emailAddress.split('@')[0]}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-8 h-1 bg-[#636B2F] rounded-full"></div>
                  <div className="w-8 h-1 bg-white/10 rounded-full"></div>
                  <div className="w-8 h-1 bg-white/10 rounded-full"></div>
                  <div className="w-8 h-1 bg-white/10 rounded-full"></div>
                </div>
                <span className="text-sm text-gray-500 mono">Step 1/4</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-sm font-semibold text-white">New Validation Session</span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
            Describe Your
            <br />
            <span className="bg-gradient-to-r from-[#D4DE95] via-[#BAC095] to-[#636B2F] bg-clip-text text-transparent">
              Startup Idea
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Share your vision in your own words. Our AI will analyze it, ask clarifying questions,
            and provide comprehensive validation.
          </p>
        </motion.div>

        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-3xl mx-auto mb-6"
            >
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <p className="text-green-400 font-medium">{successMessage}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-3xl mx-auto mb-6"
            >
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <p className="text-red-400 text-sm">{errorMessage}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!inputMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <button
              onClick={() => setInputMode('text')}
              className="w-full glass p-12 rounded-3xl hover:bg-white/5 transition-all duration-300 group text-left relative overflow-hidden cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#636B2F]/0 via-[#636B2F]/5 to-[#636B2F]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none"></div>
              <div className="relative z-10">
                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">✍️</div>
                <h3 className="text-3xl font-bold text-white mb-3">Text Input</h3>
                <p className="text-gray-400 text-lg mb-6 leading-relaxed">
                  Type your idea with full control. Edit and refine as you go. Perfect for detailed descriptions.
                </p>
                <div className="inline-flex items-center gap-2 text-[#D4DE95] font-semibold text-lg">
                  <span>Start Writing</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </button>

            <div className="mt-6 text-center">
              <span className="inline-flex items-center gap-2 text-sm text-gray-500">
                <span className="w-1.5 h-1.5 bg-gray-600 rounded-full"></span>
                Voice input coming soon
              </span>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {inputMode === 'text' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              <div className="glass p-6 rounded-2xl relative z-20">
                <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                  <span>💡</span>
                  Need inspiration? Try these examples:
                </h4>
                <div className="grid gap-3">
                  {exampleIdeas.map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => fillExample(example)}
                      disabled={isProcessing}
                      className="text-left text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-3 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass p-12 rounded-3xl relative z-20">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white">Describe Your Idea</h3>
                  <span className="text-sm text-gray-500 mono">
                    {charCount}/{MAX_CHARS}
                  </span>
                </div>
                
                <textarea
                  value={textInput}
                  onChange={(e) => {
                    setTextInput(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="Example: I want to build a platform that helps remote teams collaborate more effectively by combining project management with real-time communication. The target market would be small to medium-sized tech companies with distributed teams..."
                  className="w-full h-72 bg-white/5 border border-white/10 rounded-xl p-6 text-white text-lg placeholder-gray-600 resize-none focus:outline-none focus:border-[#D4DE95] focus:bg-white/[0.07] transition relative z-30"
                  disabled={isProcessing}
                  style={{ pointerEvents: 'auto' }}
                />
                
                {charCount > 0 && (
                  <div className="mt-4">
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`progress-bar h-full rounded-full ${
                          progress === 100 ? 'bg-green-500' : 'bg-[#D4DE95]'
                        }`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {charCount < MIN_CHARS 
                        ? `${MIN_CHARS - charCount} more characters needed` 
                        : progress === 100 
                        ? 'Ready to submit ✓' 
                        : 'Looking good!'}
                    </p>
                  </div>
                )}
                
                <div className="flex justify-between items-center mt-8 relative z-30">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        setInputMode(null);
                        setTextInput('');
                        setErrorMessage(null);
                      }}
                      disabled={isProcessing}
                      className="text-gray-400 hover:text-white px-6 py-3 rounded-xl font-semibold transition disabled:opacity-50 cursor-pointer"
                      style={{ pointerEvents: 'auto' }}
                    >
                      ← Back
                    </button>
                    {textInput && (
                      <button
                        onClick={() => setTextInput('')}
                        disabled={isProcessing}
                        className="text-gray-500 hover:text-gray-300 text-sm transition disabled:opacity-50 cursor-pointer"
                        style={{ pointerEvents: 'auto' }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={charCount < MIN_CHARS || charCount > MAX_CHARS || isProcessing}
                    className="gradient-primary text-white px-10 py-4 rounded-xl font-semibold hover:scale-105 hover:shadow-2xl hover:shadow-[#636B2F]/20 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center gap-3 cursor-pointer"
                    style={{ pointerEvents: 'auto' }}
                  >
                    {isProcessing ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        Submit Idea
                        <span className="text-lg">→</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="glass p-6 rounded-2xl relative z-20">
                <h4 className="text-sm font-semibold text-white mb-3">💭 Tips for a better analysis:</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-[#D4DE95] mt-0.5">•</span>
                    <span>Describe the problem you're solving and who faces it</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#D4DE95] mt-0.5">•</span>
                    <span>Mention your target market or customer segment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#D4DE95] mt-0.5">•</span>
                    <span>Include key features or how your solution works</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#D4DE95] mt-0.5">•</span>
                    <span>Share your business model or revenue idea if you have one</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}