// File: frontend/src/components/AdvancedFeaturesButtons.tsx
// Add these buttons to your main Dashboard after Quality Check

import { useNavigate } from 'react-router-dom';

interface AdvancedFeaturesButtonsProps {
  ideaId: string | number;
}

export default function AdvancedFeaturesButtons({ ideaId }: AdvancedFeaturesButtonsProps) {
  const navigate = useNavigate();

  const features = [
    {
      id: 'financial',
      icon: '💰',
      title: 'Financial Projections',
      description: '3-year revenue model with CAC/LTV',
      color: 'from-green-500 to-emerald-600',
      route: `/financial-projections?ideaId=${ideaId}`
    },
    {
      id: 'pitch',
      icon: '🎨',
      title: 'Pitch Deck',
      description: 'Investor-ready presentation (PPTX)',
      color: 'from-purple-500 to-indigo-600',
      route: `/pitch-deck?ideaId=${ideaId}`
    },
    {
      id: 'launch',
      icon: '🚀',
      title: 'Launch Strategy',
      description: '90-day actionable execution plan',
      color: 'from-blue-500 to-cyan-600',
      route: `/launch-strategy?ideaId=${ideaId}`
    },
    {
      id: 'risk',
      icon: '⚠️',
      title: 'Risk Analysis',
      description: 'Comprehensive risk assessment',
      color: 'from-red-500 to-orange-600',
      route: `/risk-analysis?ideaId=${ideaId}`
    },
    {
      id: 'team',
      icon: '👥',
      title: 'Team Building',
      description: 'Hiring roadmap + job descriptions',
      color: 'from-yellow-500 to-amber-600',
      route: `/team-building?ideaId=${ideaId}`
    },
    {
      id: 'report',
      icon: '📄',
      title: 'Final Report',
      description: 'Complete PDF validation report',
      color: 'from-pink-500 to-rose-600',
      route: `/final-report?ideaId=${ideaId}`
    }
  ];

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-3">
          Advanced Features
        </h2>
        <p className="text-gray-400">
          Generate investor-ready deliverables
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <button
            key={feature.id}
            onClick={() => navigate(feature.route)}
            className="glass p-6 rounded-2xl hover:scale-105 transition-all group text-left"
          >
            <div className="flex items-start gap-4">
              <div className={`text-4xl p-3 rounded-xl bg-gradient-to-br ${feature.color} bg-opacity-10`}>
                {feature.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#D4DE95] transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-400">
                  {feature.description}
                </p>
              </div>
              <div className="text-gray-600 group-hover:text-white transition-colors">
                →
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}