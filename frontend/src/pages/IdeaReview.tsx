// File: frontend/src/pages/IdeaReview.tsx
// Shows the completed structured idea

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';

interface StructuredData {
  [key: string]: string | string[] | null;
}

export default function IdeaReview() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [searchParams] = useSearchParams();
  const structuredIdeaId = searchParams.get('structuredIdeaId');

  const [isLoading, setIsLoading] = useState(true);
  const [structuredData, setStructuredData] = useState<StructuredData>({});

  useEffect(() => {
    if (!structuredIdeaId) {
      navigate('/new-idea');
      return;
    }

    const fetchIdea = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/api/v1/questioning/structured/${structuredIdeaId}`
        );

        if (!response.ok) throw new Error('Failed to fetch idea');

        const data = await response.json();
        setStructuredData(data.structured_data);
        setIsLoading(false);
      } catch (error) {
        console.error('Fetch error:', error);
        setIsLoading(false);
      }
    };

    fetchIdea();
  }, [structuredIdeaId, navigate]);

  const fieldLabels: Record<string, string> = {
    problem_statement: 'Problem Statement',
    target_audience: 'Target Audience',
    solution_description: 'Solution Description',
    market_size_estimate: 'Market Size',
    competitors: 'Main Competitors',
    unique_value_proposition: 'Unique Value Proposition',
    business_model: 'Business Model',
    key_features: 'Key Features',
    stage: 'Current Stage'
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        `}</style>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#636B2F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading your idea...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        .glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .gradient-primary {
          background: linear-gradient(135deg, #636B2F 0%, #3D4127 100%);
        }
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
              className="flex items-center gap-2 text-gray-400 hover:text-white transition"
            >
              <span>←</span>
              <span className="text-sm font-medium">Back to Dashboard</span>
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

      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-12 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-6">
            <span className="text-2xl">🎉</span>
            <span className="text-sm font-semibold text-white">Idea Complete!</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Your Startup
            <br />
            <span className="bg-gradient-to-r from-[#D4DE95] via-[#BAC095] to-[#636B2F] bg-clip-text text-transparent">
              Overview
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Here's everything we've collected about your startup vision
          </p>
        </motion.div>

        {/* Structured Data Cards */}
        <div className="grid gap-6 mb-8">
          {Object.entries(structuredData)
            .filter(([field]) => !field.startsWith('_')) // Filter out metadata fields
            .map(([field, value], index) => (
              <motion.div
                key={field}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass p-8 rounded-2xl"
              >
                <h3 className="text-sm font-semibold text-[#D4DE95] uppercase tracking-wide mb-3">
                  {fieldLabels[field] || field}
                </h3>
                {value && value !== null && value.length > 0 ? (
                  <div className="text-white">
                    {Array.isArray(value) ? (
                      <ul className="space-y-2">
                        {value.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-[#D4DE95] mt-1">•</span>
                            <span className="text-lg">{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-lg leading-relaxed">{value}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600 italic">Not provided</p>
                )}
              </motion.div>
            ))}
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center items-center gap-4"
        >
          <button
            onClick={() => navigate(`/validation?ideaId=${structuredIdeaId}`)}
            className="gradient-primary text-white px-10 py-4 rounded-xl font-semibold hover:scale-105 transition-all flex items-center gap-3"
          >
            <span>🚀</span>
            Proceed to Validation
            <span>→</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}