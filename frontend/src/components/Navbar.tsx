// File: frontend/src/components/Navbar.tsx
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser, UserButton } from '@clerk/clerk-react';

const STEPS = [
  { path: '/new-idea',             label: 'Idea',        icon: '💡', step: 1 },
  { path: '/cross-questioning',    label: 'Questions',   icon: '❓', step: 2 },
  { path: '/idea-review',          label: 'Review',      icon: '📋', step: 3 },
  { path: '/validation',           label: 'Validate',    icon: '✅', step: 4 },
  { path: '/competitor-analysis',  label: 'Competitors', icon: '⚔️', step: 5 },
  { path: '/quality-check',        label: 'Quality',     icon: '🎯', step: 6 },
  { path: '/refine',               label: 'Refine',      icon: '✨', step: 7 },
];

const ADVANCED = [
  { path: '/financial-projections', label: 'Financials',  icon: '📊' },
  { path: '/hiring-plan',           label: 'Hiring',      icon: '👥' },
  { path: '/content-marketing',     label: 'Marketing',   icon: '📣' },
  { path: '/landing-page',          label: 'Landing Page',icon: '🚀' },
];

export default function Navbar({ ideaId }: { ideaId?: string | null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();

  const currentStep = STEPS.find(s => location.pathname.startsWith(s.path));
  const isAdvanced   = ADVANCED.find(s => location.pathname.startsWith(s.path));
  const isDashboard  = location.pathname === '/dashboard';

  const navTo = (path: string) => {
    if (ideaId) navigate(`${path}?ideaId=${ideaId}`);
    else navigate(path);
  };

  return (
    <nav style={{
      background: 'rgba(10,10,11,0.92)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Top bar */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
        {/* Logo + back */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: isDashboard ? '#D4DE95' : 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#D4DE95')}
            onMouseLeave={e => (e.currentTarget.style.color = isDashboard ? '#D4DE95' : 'rgba(255,255,255,0.5)')}
          >
            <span style={{ fontSize: 20 }}>⚡</span>
            Foundry
          </button>

          {!isDashboard && (
            <>
              <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 18 }}>›</span>
              {/* Breadcrumb */}
              {currentStep && (
                <span style={{ color: '#D4DE95', fontSize: 13, fontWeight: 600 }}>
                  Step {currentStep.step} — {currentStep.label}
                </span>
              )}
              {isAdvanced && (
                <span style={{ color: '#D4DE95', fontSize: 13, fontWeight: 600 }}>
                  {isAdvanced.icon} {isAdvanced.label}
                </span>
              )}
            </>
          )}
        </div>

        {/* Right: user */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user && (
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
              {user.firstName || user.emailAddresses[0]?.emailAddress.split('@')[0]}
            </span>
          )}
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      {/* Step progress bar — only on idea flow pages */}
      {currentStep && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', overflowX: 'auto' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 2, height: 44, minWidth: 'max-content' }}>
            {STEPS.map((step, idx) => {
              const isActive  = location.pathname.startsWith(step.path);
              const isPast    = currentStep.step > step.step;
              const isFuture  = currentStep.step < step.step;
              return (
                <button
                  key={step.path}
                  onClick={() => navTo(step.path)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '4px 12px',
                    borderRadius: 6,
                    border: 'none',
                    cursor: isFuture ? 'default' : 'pointer',
                    background: isActive ? 'rgba(99,107,47,0.25)' : 'transparent',
                    color: isActive ? '#D4DE95' : isPast ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.2)',
                    fontSize: 12,
                    fontWeight: isActive ? 700 : 500,
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { if (!isFuture) e.currentTarget.style.color = '#D4DE95'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = isActive ? '#D4DE95' : isPast ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.2)'; }}
                >
                  <span style={{
                    width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700,
                    background: isActive ? '#636B2F' : isPast ? 'rgba(99,107,47,0.4)' : 'rgba(255,255,255,0.06)',
                    color: isActive ? '#fff' : isPast ? '#D4DE95' : 'rgba(255,255,255,0.3)',
                    flexShrink: 0,
                  }}>
                    {isPast ? '✓' : step.step}
                  </span>
                  {step.label}
                </button>
              );
            })}

            <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)', margin: '0 8px', flexShrink: 0 }} />

            {/* Advanced tools */}
            {ADVANCED.map(tool => (
              <button
                key={tool.path}
                onClick={() => navTo(tool.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: '1px solid',
                  borderColor: location.pathname.startsWith(tool.path) ? 'rgba(212,222,149,0.3)' : 'rgba(255,255,255,0.06)',
                  cursor: 'pointer',
                  background: location.pathname.startsWith(tool.path) ? 'rgba(99,107,47,0.2)' : 'transparent',
                  color: location.pathname.startsWith(tool.path) ? '#D4DE95' : 'rgba(255,255,255,0.3)',
                  fontSize: 11,
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#D4DE95'; e.currentTarget.style.borderColor = 'rgba(212,222,149,0.3)'; }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = location.pathname.startsWith(tool.path) ? '#D4DE95' : 'rgba(255,255,255,0.3)';
                  e.currentTarget.style.borderColor = location.pathname.startsWith(tool.path) ? 'rgba(212,222,149,0.3)' : 'rgba(255,255,255,0.06)';
                }}
              >
                <span>{tool.icon}</span>
                {tool.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Advanced page — just show quick nav back to steps */}
      {isAdvanced && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 8, height: 36 }}>
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>Advanced Tools:</span>
            {ADVANCED.map(tool => (
              <button
                key={tool.path}
                onClick={() => navTo(tool.path)}
                style={{
                  padding: '2px 10px', borderRadius: 4, border: '1px solid',
                  borderColor: location.pathname.startsWith(tool.path) ? 'rgba(212,222,149,0.4)' : 'rgba(255,255,255,0.07)',
                  background: location.pathname.startsWith(tool.path) ? 'rgba(99,107,47,0.2)' : 'transparent',
                  color: location.pathname.startsWith(tool.path) ? '#D4DE95' : 'rgba(255,255,255,0.35)',
                  fontSize: 11, cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {tool.icon} {tool.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}