// File: frontend/src/features/idea-collection/components/CrossQuestioning.tsx
// FIXED: Correct progress, stops at 5 questions

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';

interface Question {
  field: string;
  question: string;
  remaining_questions: number;
}

interface StructuredData {
  [key: string]: string | string[] | null;
}

const MAX_QUESTIONS = 5; // Hard limit

export default function CrossQuestioning() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [searchParams] = useSearchParams();
  const ideaId = searchParams.get('ideaId');

  const [isLoading, setIsLoading] = useState(true);
  const [structuredIdeaId, setStructuredIdeaId] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [structuredData, setStructuredData] = useState<StructuredData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);

  // Initialize
  useEffect(() => {
    if (!ideaId) {
      navigate('/new-idea');
      return;
    }

    const normalizeIdea = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:8000/api/v1/questioning/normalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_input_id: parseInt(ideaId) })
        });

        if (!response.ok) throw new Error('Failed to normalize idea');

        const data = await response.json();
        
        setStructuredIdeaId(data.structured_idea_id);
        setStructuredData(data.structured_data);
        setCurrentQuestion(data.next_question);

        if (data.is_complete || !data.next_question) {
          navigate(`/idea-review?structuredIdeaId=${data.structured_idea_id}`);
        }
      } catch (error) {
        console.error('Error:', error);
        setErrorMessage('Failed to process your idea.');
      } finally {
        setIsLoading(false);
      }
    };

    normalizeIdea();
  }, [ideaId, navigate]);

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || !currentQuestion || !structuredIdeaId) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('http://localhost:8000/api/v1/questioning/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structured_idea_id: structuredIdeaId,
          field_name: currentQuestion.field,
          answer: answer
        })
      });

      if (!response.ok) throw new Error('Failed to submit');

      const data = await response.json();
      
      setStructuredData(data.updated_data);
      setAnswer('');
      const newAnsweredCount = answeredQuestions + 1;
      setAnsweredQuestions(newAnsweredCount);

      // Check if done (complete, no more questions, OR hit 5 questions)
      if (data.is_complete || !data.next_question || newAnsweredCount >= MAX_QUESTIONS) {
        setTimeout(() => {
          navigate(`/idea-review?structuredIdeaId=${structuredIdeaId}`);
        }, 500);
      } else {
        setCurrentQuestion(data.next_question);
      }

    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('Failed to submit answer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (answeredQuestions / MAX_QUESTIONS) * 100;
  
  const fieldLabels: Record<string, string> = {
    problem_statement: 'Problem',
    target_audience: 'Target Audience',
    solution_description: 'Solution',
    market_size_estimate: 'Market Size',
    competitors: 'Competitors',
    unique_value_proposition: 'Unique Value',
    business_model: 'Business Model',
    key_features: 'Key Features',
    stage: 'Stage'
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');`}</style>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#636B2F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Analyzing your idea...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .gradient-primary { background: linear-gradient(135deg, #636B2F 0%, #3D4127 100%); }
      `}</style>

      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#636B2F] opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#D4DE95] opacity-5 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation */}
      <nav className="glass sticky top-0 z-50 relative">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-all group"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              <span className="text-sm font-medium">Dashboard</span>
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
              <span className="text-sm text-gray-500 mono">Step 2/4</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-12 relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-6">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
            <span className="text-sm font-semibold text-white">Clarifying Questions</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Let's Complete<br />
            <span className="bg-gradient-to-r from-[#D4DE95] via-[#BAC095] to-[#636B2F] bg-clip-text text-transparent">
              Your Idea
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Just {MAX_QUESTIONS} quick questions to understand your startup better
          </p>
        </motion.div>

        {/* Progress */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="max-w-3xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400 mono">
              Question {answeredQuestions + 1} of {MAX_QUESTIONS}
            </span>
            <span className="text-sm text-gray-400">{Math.round(progress)}% complete</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#636B2F] to-[#D4DE95]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto mb-6">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-red-400 text-sm">{errorMessage}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Question */}
        <AnimatePresence mode="wait">
          {currentQuestion && (
            <motion.div
              key={currentQuestion.field}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-3xl mx-auto space-y-6"
            >
              <div className="glass p-10 rounded-3xl">
                <div className="mb-6">
                  <span className="text-xs text-[#D4DE95] font-semibold uppercase tracking-wider">
                    {fieldLabels[currentQuestion.field] || currentQuestion.field}
                  </span>
                  <h2 className="text-2xl font-bold text-white mt-2">{currentQuestion.question}</h2>
                </div>

                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full h-40 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 resize-none focus:outline-none focus:border-[#D4DE95] transition"
                  disabled={isSubmitting}
                />

                <div className="flex justify-between items-center mt-6">
                  <span className="text-sm text-gray-500">{answer.length} characters</span>
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!answer.trim() || isSubmitting}
                    className="gradient-primary text-white px-8 py-3 rounded-xl font-semibold hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        {answeredQuestions + 1 < MAX_QUESTIONS ? 'Next Question' : 'Complete'}
                        <span>→</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Progress Summary */}
              <div className="glass p-6 rounded-2xl">
                <h3 className="text-sm font-semibold text-gray-400 mb-4">📋 What we know:</h3>
                <div className="grid gap-3">
                  {Object.entries(structuredData).filter(([k, v]) => k !== '_asked_fields' && v && v !== '' && !(Array.isArray(v) && v.length === 0)).map(([key, value]) => (
                    <div key={key} className="flex items-start gap-3">
                      <span className="text-green-400 mt-1">✓</span>
                      <div className="flex-1">
                        <span className="text-xs text-gray-500">{fieldLabels[key] || key}</span>
                        <p className="text-sm text-gray-300">
                          {Array.isArray(value) ? value.join(', ') : value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}