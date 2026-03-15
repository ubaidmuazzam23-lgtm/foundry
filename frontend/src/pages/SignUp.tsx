// import { SignUp } from '@clerk/clerk-react';

// export default function SignUpPage() {
//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
//       <div className="max-w-md w-full">
//         <div className="text-center mb-8">
//           <h2 className="text-3xl font-bold text-gray-900">Join Foundry</h2>
//           <p className="mt-2 text-gray-600">Start validating your startup ideas with AI</p>
//         </div>
//         <SignUp 
//           appearance={{
//             elements: {
//               rootBox: "mx-auto",
//               card: "shadow-xl"
//             }
//           }}
//           afterSignUpUrl="/dashboard"
//           afterSignInUrl="/dashboard"
//           redirectUrl="/dashboard"
//         />
//       </div>
//     </div>
//   );
// }
// File: frontend/src/pages/SignUpPage.tsx

import { SignUp } from '@clerk/clerk-react';

export default function SignUpPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#FDFDF9',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* ── Background ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: '10%', right: '10%',
          width: 'clamp(200px, 35vw, 500px)', height: 'clamp(200px, 35vw, 500px)',
          background: 'radial-gradient(circle, rgba(212,222,149,0.3) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', left: '5%',
          width: 'clamp(160px, 28vw, 400px)', height: 'clamp(160px, 28vw, 400px)',
          background: 'radial-gradient(circle, rgba(186,192,149,0.25) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(99,107,47,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,107,47,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      {/* ── Logo ── */}
      <a href="/" style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        textDecoration: 'none', marginBottom: '28px', position: 'relative', zIndex: 1,
      }}>
        <div style={{
          width: 40, height: 40,
          background: 'linear-gradient(135deg, #636B2F 0%, #3D4127 100%)',
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Cormorant Garamond', serif",
          fontWeight: 500, fontSize: 22, color: '#fff',
          flexShrink: 0,
        }}>F</div>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 600, letterSpacing: '0.05em', color: '#3D4127' }}>
            FOUNDRY
          </div>
          <div style={{ fontSize: 9, letterSpacing: '0.12em', color: '#6B7455', textTransform: 'uppercase' }}>
            AI-POWERED VALIDATION
          </div>
        </div>
      </a>

      {/* ── Heading ── */}
      <div style={{ textAlign: 'center', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
        <h2 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 'clamp(24px, 4vw, 32px)',
          fontWeight: 400, letterSpacing: '-0.02em', color: '#2A2E1A', marginBottom: 8,
        }}>
          Join Foundry
        </h2>
        <p style={{ fontSize: 14, color: '#6B7455' }}>
          Start validating your startup ideas with AI
        </p>
      </div>

      {/* ── Clerk SignUp ── */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440 }}>
        <SignUp
          afterSignUpUrl="/dashboard"
          afterSignInUrl="/dashboard"
          redirectUrl="/dashboard"
          appearance={{
            variables: {
              colorPrimary:                 '#636B2F',
              colorBackground:              '#FFFFFF',
              colorInputBackground:         '#F8F7F2',
              colorInputText:               '#2A2E1A',
              colorText:                    '#2A2E1A',
              colorTextSecondary:           '#6B7455',
              colorTextOnPrimaryBackground: '#FFFFFF',
              colorDanger:                  '#DC2626',
              colorSuccess:                 '#636B2F',
              borderRadius:                 '12px',
              fontFamily:                   "'IBM Plex Sans', -apple-system, sans-serif",
              fontSize:                     '14px',
            },
            elements: {
              rootBox: { width: '100%' },
              card: {
                background: '#FFFFFF',
                border: '1px solid rgba(99,107,47,0.15)',
                borderRadius: '20px',
                boxShadow: '0 8px 40px rgba(99,107,47,0.12)',
                padding: '36px 32px',
              },
              // Hide Clerk's built-in header — we have our own above
              headerTitle:    { display: 'none' },
              headerSubtitle: { display: 'none' },
              header:         { display: 'none' },

              socialButtonsBlockButton: {
                background: '#F8F7F2',
                border: '1px solid rgba(99,107,47,0.2)',
                borderRadius: '10px',
                color: '#2A2E1A',
                fontWeight: 500,
                fontSize: '14px',
              },
              socialButtonsBlockButtonText: { color: '#2A2E1A', fontWeight: 500 },

              dividerLine: { background: 'rgba(99,107,47,0.12)' },
              dividerText:  { color: '#6B7455', fontSize: '12px' },

              formFieldLabel: {
                color: '#6B7455',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              },
              formFieldInput: {
                background: '#F8F7F2',
                border: '1px solid rgba(99,107,47,0.2)',
                borderRadius: '10px',
                color: '#2A2E1A',
                fontSize: '14px',
                padding: '11px 14px',
              },
              formFieldErrorText: { color: '#DC2626', fontSize: '12px' },

              formButtonPrimary: {
                background: 'linear-gradient(135deg, #636B2F 0%, #3D4127 100%)',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                padding: '12px 24px',
                boxShadow: '0 4px 20px rgba(99,107,47,0.3)',
                border: 'none',
              },

              footerActionLink:  { color: '#636B2F', fontWeight: 600 },
              footerActionText:  { color: '#6B7455' },

              identityPreviewText:       { color: '#2A2E1A' },
              identityPreviewEditButton: { color: '#636B2F' },

              otpCodeFieldInput: {
                background: '#F8F7F2',
                border: '1px solid rgba(99,107,47,0.2)',
                borderRadius: '8px',
                color: '#2A2E1A',
                fontSize: '20px',
                fontWeight: 600,
              },

              alert: {
                background: 'rgba(212,222,149,0.15)',
                border: '1px solid rgba(99,107,47,0.2)',
                borderRadius: '10px',
              },
              alertText: { color: '#2A2E1A', fontSize: '13px' },
            },
          }}
        />
      </div>

      {/* ── Bottom note ── */}
      <p style={{ position: 'relative', zIndex: 1, marginTop: 20, fontSize: 12, color: '#6B7455', textAlign: 'center' }}>
        Already have an account?{' '}
        <a href="/sign-in" style={{ color: '#636B2F', fontWeight: 600, textDecoration: 'none' }}>
          Sign in →
        </a>
      </p>
    </div>
  );
}