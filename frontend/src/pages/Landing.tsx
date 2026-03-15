// // File: frontend/src/App.tsx

// import React, { useState, useEffect } from 'react';
// import { motion, useScroll } from 'framer-motion';

// const FoundryLanding = () => {
//   const { scrollYProgress } = useScroll();
//   const [isLoaded, setIsLoaded] = useState(false);
  
//   useEffect(() => {
//     setIsLoaded(true);
//   }, []);

//   const companies = [
//     { name: 'Stripe', industry: 'Payments' },
//     { name: 'Linear', industry: 'Project Management' },
//     { name: 'Notion', industry: 'Productivity' },
//     { name: 'Vercel', industry: 'Infrastructure' },
//     { name: 'Retool', industry: 'Internal Tools' }
//   ];

//   return (
//     <div className="foundry-landing">
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=IBM+Plex+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        
//         :root {
//           --primary: #636B2F;
//           --secondary: #BAC095;
//           --accent: #D4DE95;
//           --dark: #3D4127;
//           --bg: #FDFDF9;
//           --bg-warm: #F8F7F2;
//           --bg-dark: #2A2E1A;
//           --text-primary: #2A2E1A;
//           --text-muted: #6B7455;
//           --white: #FFFFFF;
//         }

//         * {
//           margin: 0;
//           padding: 0;
//           box-sizing: border-box;
//         }

//         .foundry-landing {
//           font-family: 'IBM Plex Sans', -apple-system, sans-serif;
//           background: var(--bg);
//           color: var(--text-primary);
//           overflow-x: hidden;
//         }

//         h1, h2, h3, h4 {
//           font-family: 'Cormorant Garamond', Georgia, serif;
//           font-weight: 400;
//           letter-spacing: -0.03em;
//         }

//         .mono {
//           font-family: 'JetBrains Mono', monospace;
//         }

//         /* Navigation */
//         .nav {
//           position: fixed;
//           top: 0;
//           left: 0;
//           right: 0;
//           z-index: 1000;
//           background: rgba(253, 253, 249, 0.85);
//           backdrop-filter: blur(20px) saturate(180%);
//           border-bottom: 1px solid rgba(99, 107, 47, 0.08);
//         }

//         .nav-content {
//           max-width: 1400px;
//           margin: 0 auto;
//           padding: 0 48px;
//           height: 72px;
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//         }

//         .nav-logo {
//           display: flex;
//           align-items: center;
//           gap: 12px;
//         }

//         .logo-mark {
//           width: 36px;
//           height: 36px;
//           background: linear-gradient(135deg, var(--primary) 0%, var(--dark) 100%);
//           border-radius: 8px;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           font-family: 'Cormorant Garamond', serif;
//           font-weight: 500;
//           font-size: 20px;
//           color: var(--white);
//           position: relative;
//           overflow: hidden;
//         }

//         .logo-mark::before {
//           content: '';
//           position: absolute;
//           top: -50%;
//           left: -50%;
//           width: 200%;
//           height: 200%;
//           background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
//           transform: rotate(45deg);
//           animation: shimmer 3s infinite;
//         }

//         @keyframes shimmer {
//           0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
//           100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
//         }

//         .logo-text {
//           display: flex;
//           flex-direction: column;
//           gap: 2px;
//         }

//         .logo-title {
//           font-family: 'JetBrains Mono', monospace;
//           font-size: 16px;
//           font-weight: 600;
//           letter-spacing: 0.05em;
//           color: var(--dark);
//         }

//         .logo-subtitle {
//           font-size: 9px;
//           font-weight: 400;
//           letter-spacing: 0.15em;
//           color: var(--text-muted);
//           text-transform: uppercase;
//         }

//         .nav-links {
//           display: flex;
//           gap: 40px;
//           align-items: center;
//         }

//         .nav-link {
//           text-decoration: none;
//           color: var(--text-muted);
//           font-size: 14px;
//           font-weight: 500;
//           transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
//           position: relative;
//         }

//         .nav-link::after {
//           content: '';
//           position: absolute;
//           bottom: -4px;
//           left: 0;
//           width: 0;
//           height: 2px;
//           background: var(--primary);
//           transition: width 0.3s ease;
//         }

//         .nav-link:hover {
//           color: var(--primary);
//         }

//         .nav-link:hover::after {
//           width: 100%;
//         }

//         /* Buttons */
//         .btn {
//           padding: 12px 28px;
//           border-radius: 10px;
//           font-weight: 600;
//           font-size: 14px;
//           text-decoration: none;
//           transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
//           cursor: pointer;
//           border: none;
//           display: inline-flex;
//           align-items: center;
//           gap: 8px;
//           position: relative;
//           overflow: hidden;
//         }

//         .btn::before {
//           content: '';
//           position: absolute;
//           top: 50%;
//           left: 50%;
//           width: 0;
//           height: 0;
//           border-radius: 50%;
//           background: rgba(255, 255, 255, 0.2);
//           transform: translate(-50%, -50%);
//           transition: width 0.6s, height 0.6s;
//         }

//         .btn:hover::before {
//           width: 300px;
//           height: 300px;
//         }

//         .btn-primary {
//           background: linear-gradient(135deg, var(--primary) 0%, var(--dark) 100%);
//           color: var(--white);
//           box-shadow: 0 4px 20px rgba(99, 107, 47, 0.25);
//         }

//         .btn-primary:hover {
//           box-shadow: 0 8px 32px rgba(99, 107, 47, 0.35);
//           transform: translateY(-2px);
//         }

//         .btn-ghost {
//           background: transparent;
//           color: var(--primary);
//           border: 1.5px solid var(--primary);
//         }

//         .btn-ghost:hover {
//           background: var(--primary);
//           color: var(--white);
//           transform: translateY(-2px);
//         }

//         /* Hero Section */
//         .hero {
//           margin-top: 72px;
//           min-height: calc(100vh - 72px);
//           display: flex;
//           align-items: center;
//           position: relative;
//           overflow: hidden;
//         }

//         .hero-bg {
//           position: absolute;
//           top: 0;
//           left: 0;
//           right: 0;
//           bottom: 0;
//           z-index: 0;
//         }

//         .gradient-orb {
//           position: absolute;
//           border-radius: 50%;
//           filter: blur(80px);
//           opacity: 0.6;
//           animation: float 20s infinite ease-in-out;
//         }

//         @keyframes float {
//           0%, 100% { transform: translate(0, 0) scale(1); }
//           33% { transform: translate(30px, -30px) scale(1.1); }
//           66% { transform: translate(-20px, 20px) scale(0.9); }
//         }

//         .orb-1 {
//           top: 10%;
//           right: 10%;
//           width: 600px;
//           height: 600px;
//           background: radial-gradient(circle, rgba(212, 222, 149, 0.25) 0%, transparent 70%);
//           animation-delay: 0s;
//         }

//         .orb-2 {
//           bottom: 10%;
//           left: 5%;
//           width: 500px;
//           height: 500px;
//           background: radial-gradient(circle, rgba(186, 192, 149, 0.2) 0%, transparent 70%);
//           animation-delay: -7s;
//         }

//         .orb-3 {
//           top: 50%;
//           left: 50%;
//           width: 400px;
//           height: 400px;
//           background: radial-gradient(circle, rgba(99, 107, 47, 0.15) 0%, transparent 70%);
//           animation-delay: -14s;
//         }

//         .grid-pattern {
//           position: absolute;
//           top: 0;
//           left: 0;
//           right: 0;
//           bottom: 0;
//           background-image: 
//             linear-gradient(rgba(99, 107, 47, 0.02) 1px, transparent 1px),
//             linear-gradient(90deg, rgba(99, 107, 47, 0.02) 1px, transparent 1px);
//           background-size: 60px 60px;
//           opacity: 0.5;
//         }

//         .hero-content {
//           max-width: 1400px;
//           margin: 0 auto;
//           padding: 0 48px;
//           position: relative;
//           z-index: 1;
//         }

//         .hero-badge {
//           display: inline-flex;
//           align-items: center;
//           gap: 8px;
//           padding: 8px 16px;
//           background: rgba(212, 222, 149, 0.15);
//           border: 1px solid rgba(99, 107, 47, 0.2);
//           border-radius: 100px;
//           font-size: 13px;
//           font-weight: 600;
//           color: var(--primary);
//           margin-bottom: 32px;
//           backdrop-filter: blur(10px);
//         }

//         .pulse-dot {
//           width: 8px;
//           height: 8px;
//           background: var(--primary);
//           border-radius: 50%;
//           position: relative;
//           animation: pulse 2s infinite;
//         }

//         @keyframes pulse {
//           0%, 100% { opacity: 1; }
//           50% { opacity: 0.4; }
//         }

//         .hero h1 {
//           font-size: 92px;
//           line-height: 1.05;
//           margin-bottom: 32px;
//           color: var(--dark);
//           max-width: 1100px;
//         }

//         .hero h1 .gradient-text {
//           background: linear-gradient(135deg, var(--primary) 0%, var(--dark) 100%);
//           -webkit-background-clip: text;
//           -webkit-text-fill-color: transparent;
//           background-clip: text;
//           font-style: italic;
//         }

//         .hero-description {
//           font-size: 22px;
//           line-height: 1.7;
//           color: var(--text-muted);
//           margin-bottom: 48px;
//           max-width: 700px;
//           font-weight: 300;
//         }

//         .hero-cta {
//           display: flex;
//           gap: 16px;
//           align-items: center;
//         }

//         .hero-meta {
//           margin-top: 48px;
//           display: flex;
//           gap: 48px;
//           padding-top: 48px;
//           border-top: 1px solid rgba(99, 107, 47, 0.1);
//         }

//         .meta-item {
//           display: flex;
//           flex-direction: column;
//           gap: 4px;
//         }

//         .meta-value {
//           font-family: 'Cormorant Garamond', serif;
//           font-size: 36px;
//           font-weight: 500;
//           color: var(--dark);
//         }

//         .meta-label {
//           font-size: 13px;
//           color: var(--text-muted);
//           text-transform: uppercase;
//           letter-spacing: 0.1em;
//         }

//         /* Trust Section */
//         .trust {
//           padding: 80px 0;
//           background: var(--bg-warm);
//           border-top: 1px solid rgba(99, 107, 47, 0.1);
//           border-bottom: 1px solid rgba(99, 107, 47, 0.1);
//         }

//         .trust-content {
//           max-width: 1400px;
//           margin: 0 auto;
//           padding: 0 48px;
//         }

//         .trust-header {
//           text-align: center;
//           margin-bottom: 56px;
//         }

//         .trust-label {
//           font-size: 12px;
//           text-transform: uppercase;
//           letter-spacing: 0.15em;
//           color: var(--text-muted);
//           font-weight: 600;
//           margin-bottom: 32px;
//         }

//         .trust-grid {
//           display: grid;
//           grid-template-columns: repeat(5, 1fr);
//           gap: 40px;
//         }

//         .trust-card {
//           background: var(--white);
//           padding: 32px;
//           border-radius: 12px;
//           border: 1px solid rgba(99, 107, 47, 0.08);
//           transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
//           position: relative;
//           overflow: hidden;
//         }

//         .trust-card::before {
//           content: '';
//           position: absolute;
//           top: 0;
//           left: 0;
//           right: 0;
//           height: 3px;
//           background: linear-gradient(90deg, var(--accent), var(--secondary));
//           transform: scaleX(0);
//           transition: transform 0.4s ease;
//         }

//         .trust-card:hover {
//           transform: translateY(-4px);
//           box-shadow: 0 12px 40px rgba(99, 107, 47, 0.12);
//         }

//         .trust-card:hover::before {
//           transform: scaleX(1);
//         }

//         .company-name {
//           font-family: 'Cormorant Garamond', serif;
//           font-size: 24px;
//           font-weight: 500;
//           color: var(--dark);
//           margin-bottom: 8px;
//         }

//         .company-industry {
//           font-size: 13px;
//           color: var(--text-muted);
//           font-weight: 500;
//         }

//         /* Problem Section */
//         .problem-section {
//           padding: 160px 0;
//           position: relative;
//         }

//         .section-content {
//           max-width: 1400px;
//           margin: 0 auto;
//           padding: 0 48px;
//         }

//         .problem-grid {
//           display: grid;
//           grid-template-columns: 1fr 1fr;
//           gap: 120px;
//           align-items: start;
//         }

//         .section-label {
//           font-family: 'JetBrains Mono', monospace;
//           font-size: 11px;
//           text-transform: uppercase;
//           letter-spacing: 0.2em;
//           color: var(--primary);
//           margin-bottom: 24px;
//           font-weight: 600;
//         }

//         .section-title {
//           font-size: 64px;
//           line-height: 1.1;
//           margin-bottom: 32px;
//           color: var(--dark);
//         }

//         .section-description {
//           font-size: 18px;
//           line-height: 1.8;
//           color: var(--text-muted);
//           margin-bottom: 48px;
//         }

//         .problem-list {
//           display: flex;
//           flex-direction: column;
//           gap: 32px;
//         }

//         .problem-item {
//           display: flex;
//           gap: 20px;
//           padding: 32px;
//           background: rgba(212, 222, 149, 0.05);
//           border-radius: 12px;
//           border-left: 3px solid var(--accent);
//           transition: all 0.3s ease;
//         }

//         .problem-item:hover {
//           background: rgba(212, 222, 149, 0.1);
//           transform: translateX(8px);
//         }

//         .problem-icon {
//           font-size: 32px;
//           flex-shrink: 0;
//         }

//         .problem-content h4 {
//           font-size: 20px;
//           margin-bottom: 8px;
//           color: var(--dark);
//           font-weight: 500;
//         }

//         .problem-content p {
//           font-size: 15px;
//           line-height: 1.7;
//           color: var(--text-muted);
//         }

//         .solution-card {
//           background: linear-gradient(135deg, rgba(99, 107, 47, 0.03) 0%, rgba(212, 222, 149, 0.08) 100%);
//           padding: 56px;
//           border-radius: 16px;
//           border: 1px solid rgba(99, 107, 47, 0.15);
//           position: sticky;
//           top: 120px;
//         }

//         .solution-card h3 {
//           font-size: 40px;
//           margin-bottom: 24px;
//           color: var(--primary);
//         }

//         .solution-card p {
//           font-size: 17px;
//           line-height: 1.8;
//           color: var(--text-primary);
//           margin-bottom: 32px;
//         }

//         .solution-features {
//           display: flex;
//           flex-direction: column;
//           gap: 16px;
//         }

//         .solution-feature {
//           display: flex;
//           align-items: center;
//           gap: 12px;
//           font-size: 15px;
//           font-weight: 500;
//           color: var(--text-primary);
//         }

//         .check-icon {
//           width: 24px;
//           height: 24px;
//           background: var(--accent);
//           border-radius: 50%;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           color: var(--dark);
//           font-size: 14px;
//           font-weight: 700;
//         }

//         /* Features Section */
//         .features {
//           padding: 160px 0;
//           background: var(--bg-warm);
//         }

//         .features-header {
//           text-align: center;
//           margin-bottom: 96px;
//         }

//         .features-header h2 {
//           font-size: 72px;
//           margin-bottom: 24px;
//           color: var(--dark);
//         }

//         .features-header p {
//           font-size: 20px;
//           color: var(--text-muted);
//           max-width: 650px;
//           margin: 0 auto;
//         }

//         .features-grid {
//           display: grid;
//           grid-template-columns: repeat(3, 1fr);
//           gap: 32px;
//         }

//         .feature-card {
//           background: var(--white);
//           padding: 48px;
//           border-radius: 16px;
//           border: 1px solid rgba(99, 107, 47, 0.08);
//           transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
//           position: relative;
//           overflow: hidden;
//         }

//         .feature-card::before {
//           content: '';
//           position: absolute;
//           top: 0;
//           left: 0;
//           width: 100%;
//           height: 100%;
//           background: linear-gradient(135deg, rgba(212, 222, 149, 0.05) 0%, transparent 100%);
//           opacity: 0;
//           transition: opacity 0.5s ease;
//         }

//         .feature-card:hover {
//           transform: translateY(-12px);
//           box-shadow: 0 20px 60px rgba(99, 107, 47, 0.15);
//           border-color: var(--accent);
//         }

//         .feature-card:hover::before {
//           opacity: 1;
//         }

//         .feature-header {
//           display: flex;
//           align-items: center;
//           gap: 16px;
//           margin-bottom: 24px;
//         }

//         .feature-icon {
//           width: 64px;
//           height: 64px;
//           background: linear-gradient(135deg, var(--accent) 0%, var(--secondary) 100%);
//           border-radius: 14px;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           font-size: 32px;
//           position: relative;
//           z-index: 1;
//         }

//         .feature-card h3 {
//           font-size: 28px;
//           color: var(--dark);
//           font-weight: 500;
//           margin-bottom: 16px;
//         }

//         .feature-card p {
//           font-size: 16px;
//           line-height: 1.8;
//           color: var(--text-muted);
//           margin-bottom: 24px;
//         }

//         .feature-tag {
//           display: inline-block;
//           padding: 6px 14px;
//           background: var(--accent);
//           color: var(--dark);
//           border-radius: 6px;
//           font-size: 12px;
//           font-weight: 700;
//           text-transform: uppercase;
//           letter-spacing: 0.05em;
//         }

//         /* How It Works */
//         .how-it-works {
//           padding: 160px 0;
//         }

//         .how-header {
//           text-align: center;
//           margin-bottom: 96px;
//         }

//         .how-header h2 {
//           font-size: 72px;
//           margin-bottom: 24px;
//           color: var(--dark);
//         }

//         .how-header p {
//           font-size: 20px;
//           color: var(--text-muted);
//         }

//         .steps-wrapper {
//           position: relative;
//           max-width: 1200px;
//           margin: 0 auto;
//         }

//         .steps-line {
//           position: absolute;
//           top: 48px;
//           left: 48px;
//           right: 48px;
//           height: 3px;
//           background: linear-gradient(90deg, var(--accent) 0%, var(--secondary) 50%, var(--primary) 100%);
//           z-index: 0;
//         }

//         .steps-grid {
//           display: grid;
//           grid-template-columns: repeat(4, 1fr);
//           gap: 40px;
//           position: relative;
//           z-index: 1;
//         }

//         .step {
//           text-align: center;
//         }

//         .step-number-wrapper {
//           margin-bottom: 32px;
//         }

//         .step-number {
//           width: 96px;
//           height: 96px;
//           background: linear-gradient(135deg, var(--primary) 0%, var(--dark) 100%);
//           border-radius: 50%;
//           display: inline-flex;
//           align-items: center;
//           justify-content: center;
//           font-family: 'Cormorant Garamond', serif;
//           font-size: 40px;
//           font-weight: 500;
//           color: var(--white);
//           border: 6px solid var(--bg);
//           box-shadow: 0 8px 32px rgba(99, 107, 47, 0.25);
//           position: relative;
//         }

//         .step-number::before {
//           content: '';
//           position: absolute;
//           inset: -6px;
//           border-radius: 50%;
//           padding: 3px;
//           background: linear-gradient(135deg, var(--accent), var(--secondary));
//           -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
//           mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
//           -webkit-mask-composite: xor;
//           mask-composite: exclude;
//         }

//         .step h4 {
//           font-size: 24px;
//           margin-bottom: 12px;
//           color: var(--dark);
//           font-weight: 500;
//         }

//         .step p {
//           font-size: 15px;
//           line-height: 1.7;
//           color: var(--text-muted);
//         }

//         /* Security Section */
//         .security {
//           background: var(--dark);
//           padding: 120px 0;
//           position: relative;
//           overflow: hidden;
//         }

//         .security-grid-bg {
//           position: absolute;
//           top: 0;
//           left: 0;
//           right: 0;
//           bottom: 0;
//           background-image: 
//             repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(212, 222, 149, 0.03) 3px, rgba(212, 222, 149, 0.03) 6px),
//             repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(212, 222, 149, 0.03) 3px, rgba(212, 222, 149, 0.03) 6px);
//           background-size: 60px 60px;
//         }

//         .security-content {
//           max-width: 1000px;
//           margin: 0 auto;
//           text-align: center;
//           position: relative;
//           z-index: 1;
//         }

//         .security h2 {
//           font-size: 72px;
//           color: var(--white);
//           margin-bottom: 32px;
//         }

//         .security > .section-content > p {
//           font-size: 20px;
//           line-height: 1.8;
//           color: rgba(255, 255, 255, 0.7);
//           margin-bottom: 72px;
//           max-width: 750px;
//           margin-left: auto;
//           margin-right: auto;
//         }

//         .security-grid {
//           display: grid;
//           grid-template-columns: repeat(3, 1fr);
//           gap: 48px;
//           margin-top: 72px;
//         }

//         .security-item {
//           text-align: center;
//         }

//         .security-icon {
//           width: 80px;
//           height: 80px;
//           background: rgba(212, 222, 149, 0.12);
//           border: 2px solid rgba(212, 222, 149, 0.2);
//           border-radius: 16px;
//           display: inline-flex;
//           align-items: center;
//           justify-content: center;
//           font-size: 36px;
//           margin-bottom: 24px;
//           transition: all 0.4s ease;
//         }

//         .security-item:hover .security-icon {
//           background: rgba(212, 222, 149, 0.2);
//           transform: scale(1.1);
//         }

//         .security-item h4 {
//           font-size: 22px;
//           color: var(--white);
//           margin-bottom: 12px;
//           font-weight: 500;
//         }

//         .security-item p {
//           font-size: 15px;
//           line-height: 1.7;
//           color: rgba(255, 255, 255, 0.6);
//         }

//         /* CTA Section */
//         .cta {
//           padding: 180px 0;
//           text-align: center;
//           position: relative;
//           overflow: hidden;
//         }

//         .cta-bg {
//           position: absolute;
//           top: 50%;
//           left: 50%;
//           transform: translate(-50%, -50%);
//           width: 1000px;
//           height: 1000px;
//           background: radial-gradient(circle, rgba(212, 222, 149, 0.15) 0%, transparent 70%);
//           filter: blur(100px);
//         }

//         .cta-content {
//           max-width: 900px;
//           margin: 0 auto;
//           position: relative;
//           z-index: 1;
//         }

//         .cta h2 {
//           font-size: 80px;
//           line-height: 1.1;
//           margin-bottom: 32px;
//           color: var(--dark);
//         }

//         .cta p {
//           font-size: 22px;
//           line-height: 1.7;
//           color: var(--text-muted);
//           margin-bottom: 56px;
//         }

//         .cta-button {
//           padding: 20px 48px;
//           font-size: 17px;
//           box-shadow: 0 12px 48px rgba(99, 107, 47, 0.3);
//         }

//         /* Footer */
//         footer {
//           background: var(--bg-dark);
//           padding: 96px 0 48px;
//           color: rgba(255, 255, 255, 0.7);
//         }

//         .footer-content {
//           max-width: 1400px;
//           margin: 0 auto;
//           padding: 0 48px;
//         }

//         .footer-grid {
//           display: grid;
//           grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
//           gap: 80px;
//           margin-bottom: 80px;
//         }

//         .footer-brand h3 {
//           font-family: 'JetBrains Mono', monospace;
//           font-size: 20px;
//           color: var(--white);
//           margin-bottom: 16px;
//           letter-spacing: 0.05em;
//         }

//         .footer-brand p {
//           font-size: 14px;
//           line-height: 1.8;
//           color: rgba(255, 255, 255, 0.5);
//           max-width: 320px;
//         }

//         .footer-column h4 {
//           font-size: 13px;
//           font-weight: 700;
//           color: var(--white);
//           margin-bottom: 24px;
//           text-transform: uppercase;
//           letter-spacing: 0.1em;
//         }

//         .footer-links {
//           display: flex;
//           flex-direction: column;
//           gap: 16px;
//         }

//         .footer-links a {
//           color: rgba(255, 255, 255, 0.6);
//           text-decoration: none;
//           font-size: 14px;
//           transition: all 0.3s ease;
//         }

//         .footer-links a:hover {
//           color: var(--accent);
//           transform: translateX(4px);
//         }

//         .footer-bottom {
//           padding-top: 48px;
//           border-top: 1px solid rgba(255, 255, 255, 0.1);
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//         }

//         .footer-bottom p {
//           font-size: 13px;
//           color: rgba(255, 255, 255, 0.4);
//         }

//         .footer-social {
//           display: flex;
//           gap: 24px;
//         }

//         .footer-social a {
//           color: rgba(255, 255, 255, 0.5);
//           text-decoration: none;
//           font-size: 14px;
//           transition: color 0.3s ease;
//         }

//         .footer-social a:hover {
//           color: var(--accent);
//         }

//         /* Responsive */
//         @media (max-width: 1024px) {
//           .hero h1 { font-size: 64px; }
//           .section-title { font-size: 48px; }
//           .features-header h2, .how-header h2 { font-size: 56px; }
//           .cta h2 { font-size: 56px; }
//           .problem-grid { grid-template-columns: 1fr; gap: 60px; }
//           .features-grid { grid-template-columns: 1fr; }
//           .steps-grid { grid-template-columns: 1fr; }
//           .steps-line { display: none; }
//           .trust-grid { grid-template-columns: repeat(2, 1fr); }
//           .security-grid { grid-template-columns: 1fr; }
//           .footer-grid { grid-template-columns: 1fr; gap: 48px; }
//         }

//         @media (max-width: 640px) {
//           .nav-content { padding: 0 24px; }
//           .hero-content, .section-content { padding: 0 24px; }
//           .hero h1 { font-size: 42px; }
//           .hero-description { font-size: 18px; }
//           .nav-links { display: none; }
//           .hero-cta { flex-direction: column; width: 100%; }
//           .btn { width: 100%; justify-content: center; }
//         }
//       `}</style>

//       {/* Navigation */}
//       <motion.nav 
//         className="nav"
//         initial={{ y: -100 }}
//         animate={{ y: 0 }}
//         transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
//       >
//         <div className="nav-content">
//           <div className="nav-logo">
//             <div className="logo-mark">F</div>
//             <div className="logo-text">
//               <div className="logo-title">FOUNDRY</div>
//               <div className="logo-subtitle">AI-POWERED VALIDATION</div>
//             </div>
//           </div>
//           <div className="nav-links">
//             <a href="#features" className="nav-link">Features</a>
//             <a href="#how" className="nav-link">Process</a>
//             <a href="#security" className="nav-link">Security</a>
//             <a href="/sign-up" className="btn btn-primary">Get Started</a>
//           </div>
//         </div>
//       </motion.nav>

//       {/* Hero */}
//       <section className="hero">
//         <div className="hero-bg">
//           <div className="grid-pattern"></div>
//           <div className="gradient-orb orb-1"></div>
//           <div className="gradient-orb orb-2"></div>
//           <div className="gradient-orb orb-3"></div>
//         </div>
//         <div className="hero-content">
//           <motion.div
//             initial={{ opacity: 0, y: 30 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.8, delay: 0.2 }}
//           >
//             <div className="hero-badge">
//               <div className="pulse-dot"></div>
//               <span>FOUNDER-CENTRIC OPERATIONAL UNIFIED NEW-VENTURE DEVELOPMENT RESOURCE YIELD</span>
//             </div>
//             <h1>
//               Validate startup ideas with <span className="gradient-text">precision intelligence</span>
//             </h1>
//             <p className="hero-description">
//               Transform uncertain concepts into evidence-backed strategies. FOUNDRY analyzes markets, competitors, and viability using AI orchestration—so you build what actually works, not what feels right.
//             </p>
//             <div className="hero-cta">
//               <a href="#" className="btn btn-primary">Start Validating Free</a>
//               <a href="#how" className="btn btn-ghost">See How It Works →</a>
//             </div>
//             <div className="hero-meta">
//               <div className="meta-item">
//                 <div className="meta-value">10k+</div>
//                 <div className="meta-label">Ideas Validated</div>
//               </div>
//               <div className="meta-item">
//                 <div className="meta-value">94%</div>
//                 <div className="meta-label">Accuracy Rate</div>
//               </div>
//               <div className="meta-item">
//                 <div className="meta-value">15min</div>
//                 <div className="meta-label">Avg. Analysis Time</div>
//               </div>
//             </div>
//           </motion.div>
//         </div>
//       </section>

//       {/* Trust Section */}
//       <section className="trust">
//         <div className="trust-content">
//           <div className="trust-header">
//             <div className="trust-label">Trusted by teams building transformative companies</div>
//           </div>
//           <div className="trust-grid">
//             {companies.map((company, idx) => (
//               <motion.div
//                 key={company.name}
//                 className="trust-card"
//                 initial={{ opacity: 0, y: 20 }}
//                 whileInView={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.5, delay: idx * 0.1 }}
//                 viewport={{ once: true }}
//               >
//                 <div className="company-name">{company.name}</div>
//                 <div className="company-industry">{company.industry}</div>
//               </motion.div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Problem-Solution */}
//       <section className="problem-section">
//         <div className="section-content">
//           <div className="problem-grid">
//             <div>
//               <div className="section-label">THE PROBLEM</div>
//               <h2 className="section-title">Most startups fail because they build something nobody wants</h2>
//               <div className="problem-list">
//                 <div className="problem-item">
//                   <div className="problem-icon">💭</div>
//                   <div className="problem-content">
//                     <h4>Intuition replaces data</h4>
//                     <p>Founders trust gut feelings instead of market signals, missing critical indicators that predict failure before a single line of code is written.</p>
//                   </div>
//                 </div>
//                 <div className="problem-item">
//                   <div className="problem-icon">⏰</div>
//                   <div className="problem-content">
//                     <h4>Validation takes weeks or months</h4>
//                     <p>Traditional research requires expensive consultants or endless manual analysis—by the time you have answers, the opportunity has shifted.</p>
//                   </div>
//                 </div>
//                 <div className="problem-item">
//                   <div className="problem-icon">🎯</div>
//                   <div className="problem-content">
//                     <h4>Competitive blindness</h4>
//                     <p>Teams miss existing solutions or fail to articulate meaningful differentiation that actually matters to customers.</p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//             <div>
//               <div className="solution-card">
//                 <div className="section-label">THE SOLUTION</div>
//                 <h3>AI that validates before you invest</h3>
//                 <p>
//                   FOUNDRY analyzes your idea against real market data, competitive landscapes, and verified demand signals—delivering institutional-grade insights in minutes, not weeks.
//                 </p>
//                 <div className="solution-features">
//                   <div className="solution-feature">
//                     <div className="check-icon">✓</div>
//                     Evidence-backed market validation
//                   </div>
//                   <div className="solution-feature">
//                     <div className="check-icon">✓</div>
//                     Automated competitor intelligence
//                   </div>
//                   <div className="solution-feature">
//                     <div className="check-icon">✓</div>
//                     Real-time demand verification
//                   </div>
//                   <div className="solution-feature">
//                     <div className="check-icon">✓</div>
//                     Strategic differentiation mapping
//                   </div>
//                   <div className="solution-feature">
//                     <div className="check-icon">✓</div>
//                     Quality-scored AI outputs
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Features */}
//       <section className="features" id="features">
//         <div className="section-content">
//           <div className="features-header">
//             <h2>Built for clarity, not confusion</h2>
//             <p>Every feature is designed to give you confidence in your next move</p>
//           </div>
//           <div className="features-grid">
//             {[
//               { icon: '🎤', title: 'Voice-First Input', desc: 'Describe your idea naturally through text or voice. Our multimodal system understands context and asks intelligent follow-up questions to build a complete picture.', tag: 'Natural UI' },
//               { icon: '🔍', title: 'RAG-Powered Research', desc: 'We don\'t hallucinate. Our retrieval-augmented system pulls verified market research, competitor intelligence, and demand signals from curated data sources.', tag: 'Evidence-Based' },
//               { icon: '⚖️', title: 'Quality Validation', desc: 'Every output is scored and validated by our Critic Agent. Low-quality responses are rejected and regenerated until they meet enterprise standards.', tag: 'Zero Hallucinations' },
//               { icon: '🧭', title: 'Adaptive Orchestration', desc: 'Our Planner Agent orchestrates the right analysis steps for your specific idea—no generic templates, just tailored intelligence workflows.', tag: 'Smart Routing' },
//               { icon: '📊', title: 'Competitive Mapping', desc: 'Understand the landscape with precision. We identify direct and indirect competitors, then highlight exactly where you can win in the market.', tag: 'Strategic Intel' },
//               { icon: '📄', title: 'Investor-Ready Reports', desc: 'Get comprehensive validation reports ready to share with co-founders, investors, or advisors—no fluff, just actionable strategic insights.', tag: 'Professional Output' }
//             ].map((feature, idx) => (
//               <motion.div
//                 key={feature.title}
//                 className="feature-card"
//                 initial={{ opacity: 0, y: 40 }}
//                 whileInView={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.6, delay: idx * 0.1 }}
//                 viewport={{ once: true }}
//               >
//                 <div className="feature-header">
//                   <div className="feature-icon">{feature.icon}</div>
//                 </div>
//                 <h3>{feature.title}</h3>
//                 <p>{feature.desc}</p>
//                 <div className="feature-tag">{feature.tag}</div>
//               </motion.div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* How It Works */}
//       <section className="how-it-works" id="how">
//         <div className="section-content">
//           <div className="how-header">
//             <h2>From idea to insight in four steps</h2>
//             <p>A validated startup strategy in minutes</p>
//           </div>
//           <div className="steps-wrapper">
//             <div className="steps-line"></div>
//             <div className="steps-grid">
//               {[
//                 { num: 1, title: 'Describe Your Vision', desc: 'Share your concept through text or voice. Our dynamic questioning engine captures the complete picture.' },
//                 { num: 2, title: 'AI Orchestration', desc: 'The Planner Agent determines which validation steps matter for your specific idea and coordinates execution.' },
//                 { num: 3, title: 'Quality Assurance', desc: 'Every insight is scored by our Critic Agent. Weak outputs are refined until they meet quality thresholds.' },
//                 { num: 4, title: 'Strategic Report', desc: 'Receive a structured validation report with market data, competitor analysis, and actionable recommendations.' }
//               ].map((step, idx) => (
//                 <motion.div
//                   key={step.num}
//                   className="step"
//                   initial={{ opacity: 0, y: 30 }}
//                   whileInView={{ opacity: 1, y: 0 }}
//                   transition={{ duration: 0.6, delay: idx * 0.15 }}
//                   viewport={{ once: true }}
//                 >
//                   <div className="step-number-wrapper">
//                     <div className="step-number">{step.num}</div>
//                   </div>
//                   <h4>{step.title}</h4>
//                   <p>{step.desc}</p>
//                 </motion.div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Security */}
//       <section className="security" id="security">
//         <div className="security-grid-bg"></div>
//         <div className="section-content">
//           <div className="security-content">
//             <div className="section-label" style={{ color: 'var(--accent)' }}>ENTERPRISE-GRADE ARCHITECTURE</div>
//             <h2>Built on deterministic logic, not AI promises</h2>
//             <p>
//               We don't trust AI to make final decisions. Every analysis is governed by backend logic, validated against quality rubrics, and logged for complete auditability. Your intellectual property stays secure.
//             </p>
//             <div className="security-grid">
//               {[
//                 { icon: '🔒', title: 'Secure Authentication', desc: 'Clerk-powered identity management with enterprise SSO and role-based access control' },
//                 { icon: '📝', title: 'Complete Auditability', desc: 'Every AI action, decision, and output is logged and traceable in PostgreSQL with version control' },
//                 { icon: '⚡', title: 'Deterministic Workflows', desc: 'Backend-controlled orchestration prevents hallucinations and ensures consistent, reliable results' }
//               ].map((item, idx) => (
//                 <motion.div
//                   key={item.title}
//                   className="security-item"
//                   initial={{ opacity: 0, y: 20 }}
//                   whileInView={{ opacity: 1, y: 0 }}
//                   transition={{ duration: 0.5, delay: idx * 0.1 }}
//                   viewport={{ once: true }}
//                 >
//                   <div className="security-icon">{item.icon}</div>
//                   <h4>{item.title}</h4>
//                   <p>{item.desc}</p>
//                 </motion.div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* CTA */}
//       <section className="cta">
//         <div className="cta-bg"></div>
//         <div className="cta-content">
//           <motion.div
//             initial={{ opacity: 0, y: 30 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.8 }}
//             viewport={{ once: true }}
//           >
//             <h2>Stop guessing. Start building with precision.</h2>
//             <p>
//               Join founders who validate ideas before they invest months of work and capital into uncertainty. Get started in under 60 seconds.
//             </p>
//             <a href="#" className="btn btn-primary cta-button">Validate Your Idea Free →</a>
//           </motion.div>
//         </div>
//       </section>

//       {/* Footer */}
//       <footer>
//         <div className="footer-content">
//           <div className="footer-grid">
//             <div className="footer-brand">
//               <h3>FOUNDRY</h3>
//               <p>
//                 Founder-centric Operational Unified New-venture Development Resource Yield. Intelligence that validates your vision before you build.
//               </p>
//             </div>
//             <div className="footer-column">
//               <h4>Product</h4>
//               <div className="footer-links">
//                 <a href="#">Features</a>
//                 <a href="#">How It Works</a>
//                 <a href="#">Pricing</a>
//                 <a href="#">Case Studies</a>
//                 <a href="#">Documentation</a>
//               </div>
//             </div>
//             <div className="footer-column">
//               <h4>Company</h4>
//               <div className="footer-links">
//                 <a href="#">About</a>
//                 <a href="#">Careers</a>
//                 <a href="#">Blog</a>
//                 <a href="#">Press Kit</a>
//                 <a href="#">Contact</a>
//               </div>
//             </div>
//             <div className="footer-column">
//               <h4>Resources</h4>
//               <div className="footer-links">
//                 <a href="#">API Reference</a>
//                 <a href="#">Community</a>
//                 <a href="#">Support</a>
//                 <a href="#">Status</a>
//                 <a href="#">Changelog</a>
//               </div>
//             </div>
//             <div className="footer-column">
//               <h4>Legal</h4>
//               <div className="footer-links">
//                 <a href="#">Privacy Policy</a>
//                 <a href="#">Terms of Service</a>
//                 <a href="#">Security</a>
//                 <a href="#">Compliance</a>
//                 <a href="#">Data Processing</a>
//               </div>
//             </div>
//           </div>
//           <div className="footer-bottom">
//             <p>© 2026 FOUNDRY. All rights reserved. Built with precision.</p>
//             <div className="footer-social">
//               <a href="#">Twitter</a>
//               <a href="#">LinkedIn</a>
//               <a href="#">GitHub</a>
//               <a href="#">Discord</a>
//             </div>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// };

// export default FoundryLanding;

// File: frontend/src/App.tsx
// CTA buttons now route to /sign-up (Clerk)
// Mobile-responsive: hamburger nav, fluid typography, responsive grids

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll } from 'framer-motion';

const FoundryLanding = () => {
  const { scrollYProgress } = useScroll();
  const [isLoaded, setIsLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setIsLoaded(true); }, []);

  const companies = [
    { name: 'Stripe',  industry: 'Payments'          },
    { name: 'Linear',  industry: 'Project Management' },
    { name: 'Notion',  industry: 'Productivity'       },
    { name: 'Vercel',  industry: 'Infrastructure'     },
    { name: 'Retool',  industry: 'Internal Tools'     },
  ];

  return (
    <div className="foundry-landing">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=IBM+Plex+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

        :root {
          --primary:      #636B2F;
          --secondary:    #BAC095;
          --accent:       #D4DE95;
          --dark:         #3D4127;
          --bg:           #FDFDF9;
          --bg-warm:      #F8F7F2;
          --bg-dark:      #2A2E1A;
          --text-primary: #2A2E1A;
          --text-muted:   #6B7455;
          --white:        #FFFFFF;
        }

        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }

        .foundry-landing {
          font-family: 'IBM Plex Sans', -apple-system, sans-serif;
          background: var(--bg);
          color: var(--text-primary);
          overflow-x: hidden;
        }

        h1,h2,h3,h4 {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-weight: 400;
          letter-spacing: -0.03em;
        }

        .mono { font-family: 'JetBrains Mono', monospace; }

        /* ── NAV ── */
        .nav {
          position: fixed; top:0; left:0; right:0; z-index: 1000;
          background: rgba(253,253,249,0.92);
          backdrop-filter: blur(20px) saturate(180%);
          border-bottom: 1px solid rgba(99,107,47,0.08);
        }

        .nav-content {
          max-width: 1400px; margin: 0 auto;
          padding: 0 24px; height: 64px;
          display: flex; justify-content: space-between; align-items: center;
        }

        @media (min-width: 768px) { .nav-content { padding: 0 48px; height: 72px; } }

        .nav-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }

        .logo-mark {
          width: 32px; height: 32px;
          background: linear-gradient(135deg, var(--primary) 0%, var(--dark) 100%);
          border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Cormorant Garamond', serif;
          font-weight: 500; font-size: 18px; color: var(--white);
          position: relative; overflow: hidden; flex-shrink: 0;
        }

        @media (min-width: 768px) { .logo-mark { width: 36px; height: 36px; font-size: 20px; } }

        .logo-mark::before {
          content: ''; position: absolute; top:-50%; left:-50%; width:200%; height:200%;
          background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
          transform: rotate(45deg); animation: shimmer 3s infinite;
        }

        @keyframes shimmer {
          0%   { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          100% { transform: translateX(100%)  translateY(100%)  rotate(45deg); }
        }

        .logo-text { display: flex; flex-direction: column; gap: 1px; }

        .logo-title {
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px; font-weight: 600; letter-spacing: 0.05em; color: var(--dark);
        }

        @media (min-width: 768px) { .logo-title { font-size: 16px; } }

        .logo-subtitle {
          font-size: 8px; font-weight: 400; letter-spacing: 0.12em;
          color: var(--text-muted); text-transform: uppercase; display: none;
        }

        @media (min-width: 480px) { .logo-subtitle { display: block; } }

        .nav-links { display: none; gap: 32px; align-items: center; }
        @media (min-width: 768px) { .nav-links { display: flex; gap: 40px; } }

        .nav-link {
          text-decoration: none; color: var(--text-muted);
          font-size: 14px; font-weight: 500;
          transition: all 0.3s cubic-bezier(0.4,0,0.2,1); position: relative;
        }

        .nav-link::after {
          content: ''; position: absolute; bottom:-4px; left:0;
          width:0; height:2px; background: var(--primary); transition: width 0.3s ease;
        }

        .nav-link:hover { color: var(--primary); }
        .nav-link:hover::after { width: 100%; }

        .hamburger {
          display: flex; flex-direction: column; justify-content: space-between;
          width: 24px; height: 18px;
          background: none; border: none; cursor: pointer; padding: 0;
          -webkit-tap-highlight-color: transparent;
        }

        @media (min-width: 768px) { .hamburger { display: none; } }

        .hamburger span {
          display: block; width: 100%; height: 2px;
          background: var(--dark); border-radius: 2px;
          transition: all 0.3s ease; transform-origin: center;
        }

        .hamburger.open span:nth-child(1) { transform: translateY(8px) rotate(45deg); }
        .hamburger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .hamburger.open span:nth-child(3) { transform: translateY(-8px) rotate(-45deg); }

        .mobile-menu {
          position: fixed; top: 64px; left:0; right:0;
          background: rgba(253,253,249,0.98); backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(99,107,47,0.1);
          z-index: 999; padding: 24px;
          display: flex; flex-direction: column; gap: 8px;
        }

        .mobile-nav-link {
          text-decoration: none; color: var(--text-muted);
          font-size: 16px; font-weight: 500; padding: 12px 0;
          border-bottom: 1px solid rgba(99,107,47,0.08); transition: color 0.2s;
        }

        .mobile-nav-link:hover { color: var(--primary); }

        /* ── BUTTONS ── */
        .btn {
          padding: 11px 24px; border-radius: 10px;
          font-weight: 600; font-size: 14px; text-decoration: none;
          transition: all 0.4s cubic-bezier(0.4,0,0.2,1);
          cursor: pointer; border: none;
          display: inline-flex; align-items: center; gap: 8px;
          position: relative; overflow: hidden;
          -webkit-tap-highlight-color: transparent;
        }

        @media (min-width: 768px) { .btn { padding: 12px 28px; } }

        .btn::before {
          content: ''; position: absolute; top:50%; left:50%;
          width:0; height:0; border-radius:50%;
          background: rgba(255,255,255,0.2);
          transform: translate(-50%,-50%); transition: width 0.6s, height 0.6s;
        }

        .btn:hover::before { width: 300px; height: 300px; }

        .btn-primary {
          background: linear-gradient(135deg, var(--primary) 0%, var(--dark) 100%);
          color: var(--white); box-shadow: 0 4px 20px rgba(99,107,47,0.25);
        }

        .btn-primary:hover { box-shadow: 0 8px 32px rgba(99,107,47,0.35); transform: translateY(-2px); }

        .btn-ghost {
          background: transparent; color: var(--primary); border: 1.5px solid var(--primary);
        }

        .btn-ghost:hover { background: var(--primary); color: var(--white); transform: translateY(-2px); }

        /* ── HERO ── */
        .hero {
          margin-top: 64px; min-height: calc(100vh - 64px);
          display: flex; align-items: center;
          position: relative; overflow: hidden; padding: 60px 0;
        }

        @media (min-width: 768px) { .hero { margin-top: 72px; padding: 0; } }

        .hero-bg { position: absolute; inset:0; z-index:0; }

        .gradient-orb {
          position: absolute; border-radius: 50%;
          filter: blur(80px); opacity: 0.6;
          animation: float 20s infinite ease-in-out;
        }

        @keyframes float {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(30px,-30px) scale(1.1); }
          66%      { transform: translate(-20px,20px) scale(0.9); }
        }

        .orb-1 {
          top:10%; right:5%;
          width: clamp(200px,40vw,600px); height: clamp(200px,40vw,600px);
          background: radial-gradient(circle, rgba(212,222,149,0.25) 0%, transparent 70%);
        }

        .orb-2 {
          bottom:10%; left:2%; animation-delay:-7s;
          width: clamp(160px,35vw,500px); height: clamp(160px,35vw,500px);
          background: radial-gradient(circle, rgba(186,192,149,0.2) 0%, transparent 70%);
        }

        .orb-3 {
          top:50%; left:50%; animation-delay:-14s;
          width: clamp(140px,30vw,400px); height: clamp(140px,30vw,400px);
          background: radial-gradient(circle, rgba(99,107,47,0.15) 0%, transparent 70%);
        }

        .grid-pattern {
          position: absolute; inset:0;
          background-image:
            linear-gradient(rgba(99,107,47,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,107,47,0.02) 1px, transparent 1px);
          background-size: 60px 60px; opacity: 0.5;
        }

        .hero-content, .section-content, .trust-content, .footer-content {
          max-width: 1400px; margin: 0 auto; padding: 0 24px;
          position: relative; z-index:1; width:100%;
        }

        @media (min-width: 768px) {
          .hero-content, .section-content, .trust-content, .footer-content { padding: 0 48px; }
        }

        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 7px 14px;
          background: rgba(212,222,149,0.15); border: 1px solid rgba(99,107,47,0.2);
          border-radius: 100px; font-size: 11px; font-weight: 600; color: var(--primary);
          margin-bottom: 24px; backdrop-filter: blur(10px); max-width: 100%;
        }

        @media (min-width: 768px) { .hero-badge { font-size: 13px; margin-bottom: 32px; padding: 8px 16px; } }

        .hero-badge-text {
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 240px;
        }

        @media (min-width: 480px) { .hero-badge-text { max-width: none; white-space: normal; } }

        .pulse-dot {
          width: 8px; height: 8px; background: var(--primary);
          border-radius: 50%; flex-shrink: 0; animation: pulse 2s infinite;
        }

        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }

        .hero h1 {
          font-size: clamp(36px,7vw,92px); line-height: 1.05;
          margin-bottom: 20px; color: var(--dark); max-width: 1100px;
        }

        @media (min-width: 768px) { .hero h1 { margin-bottom: 32px; } }

        .gradient-text {
          background: linear-gradient(135deg, var(--primary) 0%, var(--dark) 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; font-style: italic;
        }

        .hero-description {
          font-size: clamp(16px,2.2vw,22px); line-height: 1.7;
          color: var(--text-muted); margin-bottom: 32px; max-width: 700px; font-weight: 300;
        }

        @media (min-width: 768px) { .hero-description { margin-bottom: 48px; } }

        .hero-cta { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }

        .hero-meta {
          margin-top: 36px; display: flex; gap: 24px; flex-wrap: wrap;
          padding-top: 36px; border-top: 1px solid rgba(99,107,47,0.1);
        }

        @media (min-width: 768px) { .hero-meta { gap: 48px; margin-top: 48px; padding-top: 48px; } }

        .meta-item { display: flex; flex-direction: column; gap: 4px; }

        .meta-value {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(24px,4vw,36px); font-weight: 500; color: var(--dark);
        }

        .meta-label {
          font-size: 11px; color: var(--text-muted);
          text-transform: uppercase; letter-spacing: 0.1em;
        }

        @media (min-width: 768px) { .meta-label { font-size: 13px; } }

        /* ── TRUST ── */
        .trust { padding: 60px 0; background: var(--bg-warm); border-top: 1px solid rgba(99,107,47,0.1); border-bottom: 1px solid rgba(99,107,47,0.1); }
        @media (min-width: 768px) { .trust { padding: 80px 0; } }

        .trust-header { text-align: center; margin-bottom: 40px; }
        @media (min-width: 768px) { .trust-header { margin-bottom: 56px; } }

        .trust-label {
          font-size: 11px; text-transform: uppercase;
          letter-spacing: 0.12em; color: var(--text-muted); font-weight: 600;
        }

        .trust-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 16px; }
        @media (min-width: 640px)  { .trust-grid { grid-template-columns: repeat(3,1fr); } }
        @media (min-width: 1024px) { .trust-grid { grid-template-columns: repeat(5,1fr); gap: 40px; } }

        .trust-card {
          background: var(--white); padding: 20px 24px; border-radius: 12px;
          border: 1px solid rgba(99,107,47,0.08);
          transition: all 0.4s cubic-bezier(0.4,0,0.2,1); position: relative; overflow: hidden;
        }

        @media (min-width: 768px) { .trust-card { padding: 32px; } }

        .trust-card::before {
          content: ''; position: absolute; top:0; left:0; right:0; height:3px;
          background: linear-gradient(90deg, var(--accent), var(--secondary));
          transform: scaleX(0); transition: transform 0.4s ease;
        }

        .trust-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(99,107,47,0.12); }
        .trust-card:hover::before { transform: scaleX(1); }

        .company-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(18px,2.5vw,24px); font-weight: 500; color: var(--dark); margin-bottom: 6px;
        }

        .company-industry { font-size: 12px; color: var(--text-muted); font-weight: 500; }

        /* ── PROBLEM-SOLUTION ── */
        .problem-section { padding: 80px 0; }
        @media (min-width: 768px) { .problem-section { padding: 160px 0; } }

        .problem-grid { display: grid; grid-template-columns: 1fr; gap: 48px; }
        @media (min-width: 1024px) { .problem-grid { grid-template-columns: 1fr 1fr; gap: 120px; align-items: start; } }

        .section-label {
          font-family: 'JetBrains Mono', monospace; font-size: 10px;
          text-transform: uppercase; letter-spacing: 0.18em; color: var(--primary);
          margin-bottom: 16px; font-weight: 600;
        }

        @media (min-width: 768px) { .section-label { font-size: 11px; margin-bottom: 24px; } }

        .section-title { font-size: clamp(32px,5vw,64px); line-height: 1.1; margin-bottom: 24px; color: var(--dark); }
        .section-description { font-size: clamp(15px,1.8vw,18px); line-height: 1.8; color: var(--text-muted); margin-bottom: 36px; }

        .problem-list { display: flex; flex-direction: column; gap: 20px; }
        @media (min-width: 768px) { .problem-list { gap: 32px; } }

        .problem-item {
          display: flex; gap: 16px; padding: 20px;
          background: rgba(212,222,149,0.05); border-radius: 12px;
          border-left: 3px solid var(--accent); transition: all 0.3s ease;
        }

        @media (min-width: 768px) { .problem-item { padding: 32px; gap: 20px; } }

        .problem-item:hover { background: rgba(212,222,149,0.1); transform: translateX(6px); }

        .problem-icon { font-size: 24px; flex-shrink: 0; }
        @media (min-width: 768px) { .problem-icon { font-size: 32px; } }

        .problem-content h4 { font-size: clamp(16px,2vw,20px); margin-bottom: 6px; color: var(--dark); font-weight: 500; }
        .problem-content p  { font-size: 14px; line-height: 1.7; color: var(--text-muted); }
        @media (min-width: 768px) { .problem-content p { font-size: 15px; } }

        .solution-card {
          background: linear-gradient(135deg, rgba(99,107,47,0.03) 0%, rgba(212,222,149,0.08) 100%);
          padding: 32px; border-radius: 16px; border: 1px solid rgba(99,107,47,0.15);
        }

        @media (min-width: 1024px) { .solution-card { padding: 56px; position: sticky; top: 120px; } }

        .solution-card h3 { font-size: clamp(28px,3.5vw,40px); margin-bottom: 20px; color: var(--primary); }
        .solution-card p  { font-size: clamp(14px,1.5vw,17px); line-height: 1.8; color: var(--text-primary); margin-bottom: 24px; }

        .solution-features { display: flex; flex-direction: column; gap: 12px; }
        @media (min-width: 768px) { .solution-features { gap: 16px; } }

        .solution-feature { display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 500; color: var(--text-primary); }
        @media (min-width: 768px) { .solution-feature { font-size: 15px; gap: 12px; } }

        .check-icon {
          width: 22px; height: 22px; background: var(--accent); border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: var(--dark); font-size: 12px; font-weight: 700; flex-shrink: 0;
        }

        /* ── FEATURES ── */
        .features { padding: 80px 0; background: var(--bg-warm); }
        @media (min-width: 768px) { .features { padding: 160px 0; } }

        .features-header { text-align: center; margin-bottom: 56px; }
        @media (min-width: 768px) { .features-header { margin-bottom: 96px; } }

        .features-header h2 { font-size: clamp(36px,5.5vw,72px); margin-bottom: 16px; color: var(--dark); }
        .features-header p  { font-size: clamp(15px,2vw,20px); color: var(--text-muted); max-width: 650px; margin: 0 auto; }

        .features-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
        @media (min-width: 640px)  { .features-grid { grid-template-columns: repeat(2,1fr); } }
        @media (min-width: 1024px) { .features-grid { grid-template-columns: repeat(3,1fr); gap: 32px; } }

        .feature-card {
          background: var(--white); padding: 28px; border-radius: 16px;
          border: 1px solid rgba(99,107,47,0.08);
          transition: all 0.5s cubic-bezier(0.4,0,0.2,1); position: relative; overflow: hidden;
        }

        @media (min-width: 768px) { .feature-card { padding: 48px; } }

        .feature-card::before {
          content: ''; position: absolute; inset:0;
          background: linear-gradient(135deg, rgba(212,222,149,0.05) 0%, transparent 100%);
          opacity: 0; transition: opacity 0.5s ease;
        }

        .feature-card:hover { transform: translateY(-8px); box-shadow: 0 20px 60px rgba(99,107,47,0.15); border-color: var(--accent); }
        .feature-card:hover::before { opacity: 1; }

        .feature-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }

        .feature-icon {
          width: 52px; height: 52px;
          background: linear-gradient(135deg, var(--accent) 0%, var(--secondary) 100%);
          border-radius: 12px; display: flex; align-items: center; justify-content: center;
          font-size: 26px; position: relative; z-index:1; flex-shrink: 0;
        }

        @media (min-width: 768px) { .feature-icon { width: 64px; height: 64px; font-size: 32px; } }

        .feature-card h3 { font-size: clamp(20px,2.5vw,28px); color: var(--dark); font-weight: 500; margin-bottom: 12px; }
        .feature-card p  { font-size: 14px; line-height: 1.8; color: var(--text-muted); margin-bottom: 20px; }
        @media (min-width: 768px) { .feature-card p { font-size: 16px; margin-bottom: 24px; } }

        .feature-tag {
          display: inline-block; padding: 5px 12px;
          background: var(--accent); color: var(--dark);
          border-radius: 6px; font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.05em;
        }

        /* ── HOW IT WORKS ── */
        .how-it-works { padding: 80px 0; }
        @media (min-width: 768px) { .how-it-works { padding: 160px 0; } }

        .how-header { text-align: center; margin-bottom: 56px; }
        @media (min-width: 768px) { .how-header { margin-bottom: 96px; } }

        .how-header h2 { font-size: clamp(36px,5.5vw,72px); margin-bottom: 16px; color: var(--dark); }
        .how-header p  { font-size: clamp(15px,2vw,20px); color: var(--text-muted); }

        .steps-wrapper { position: relative; max-width: 1200px; margin: 0 auto; }

        .steps-line {
          display: none; position: absolute; top:48px; left:48px; right:48px; height:3px;
          background: linear-gradient(90deg, var(--accent) 0%, var(--secondary) 50%, var(--primary) 100%); z-index:0;
        }

        @media (min-width: 768px) { .steps-line { display: block; } }

        .steps-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 32px; position: relative; z-index:1; }
        @media (min-width: 768px) { .steps-grid { grid-template-columns: repeat(4,1fr); gap: 40px; } }

        .step { text-align: center; }
        .step-number-wrapper { margin-bottom: 20px; }
        @media (min-width: 768px) { .step-number-wrapper { margin-bottom: 32px; } }

        .step-number {
          width: 72px; height: 72px;
          background: linear-gradient(135deg, var(--primary) 0%, var(--dark) 100%);
          border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;
          font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 500; color: var(--white);
          border: 5px solid var(--bg); box-shadow: 0 8px 32px rgba(99,107,47,0.25); position: relative;
        }

        @media (min-width: 768px) { .step-number { width: 96px; height: 96px; font-size: 40px; border-width: 6px; } }

        .step-number::before {
          content: ''; position: absolute; inset:-6px; border-radius:50%; padding:3px;
          background: linear-gradient(135deg, var(--accent), var(--secondary));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
        }

        .step h4 { font-size: clamp(16px,2vw,24px); margin-bottom: 10px; color: var(--dark); font-weight: 500; }
        .step p  { font-size: 13px; line-height: 1.7; color: var(--text-muted); }
        @media (min-width: 768px) { .step p { font-size: 15px; } }

        /* ── SECURITY ── */
        .security { background: var(--dark); padding: 80px 0; position: relative; overflow: hidden; }
        @media (min-width: 768px) { .security { padding: 120px 0; } }

        .security-grid-bg {
          position: absolute; inset:0;
          background-image:
            repeating-linear-gradient(0deg,   transparent, transparent 3px, rgba(212,222,149,0.03) 3px, rgba(212,222,149,0.03) 6px),
            repeating-linear-gradient(90deg,  transparent, transparent 3px, rgba(212,222,149,0.03) 3px, rgba(212,222,149,0.03) 6px);
          background-size: 60px 60px;
        }

        .security-content { max-width: 1000px; margin: 0 auto; text-align: center; position: relative; z-index:1; }

        .security h2 { font-size: clamp(32px,5.5vw,72px); color: var(--white); margin-bottom: 20px; }

        .security-desc {
          font-size: clamp(15px,2vw,20px); line-height: 1.8; color: rgba(255,255,255,0.7);
          margin-bottom: 48px; max-width: 750px; margin-left: auto; margin-right: auto;
        }

        @media (min-width: 768px) { .security-desc { margin-bottom: 72px; } }

        .security-grid { display: grid; grid-template-columns: 1fr; gap: 32px; }
        @media (min-width: 640px) { .security-grid { grid-template-columns: repeat(3,1fr); } }

        .security-item { text-align: center; }

        .security-icon {
          width: 64px; height: 64px;
          background: rgba(212,222,149,0.12); border: 2px solid rgba(212,222,149,0.2);
          border-radius: 14px; display: inline-flex; align-items: center; justify-content: center;
          font-size: 28px; margin-bottom: 16px; transition: all 0.4s ease;
        }

        @media (min-width: 768px) { .security-icon { width: 80px; height: 80px; font-size: 36px; margin-bottom: 24px; } }

        .security-item:hover .security-icon { background: rgba(212,222,149,0.2); transform: scale(1.1); }

        .security-item h4 { font-size: clamp(16px,2vw,22px); color: var(--white); margin-bottom: 10px; font-weight: 500; }
        .security-item p  { font-size: 13px; line-height: 1.7; color: rgba(255,255,255,0.6); }
        @media (min-width: 768px) { .security-item p { font-size: 15px; } }

        /* ── CTA ── */
        .cta { padding: 100px 0; text-align: center; position: relative; overflow: hidden; }
        @media (min-width: 768px) { .cta { padding: 180px 0; } }

        .cta-bg {
          position: absolute; top:50%; left:50%; transform: translate(-50%,-50%);
          width: min(1000px,90vw); height: min(1000px,90vw);
          background: radial-gradient(circle, rgba(212,222,149,0.15) 0%, transparent 70%);
          filter: blur(100px);
        }

        .cta-content { max-width: 900px; margin: 0 auto; position: relative; z-index:1; padding: 0 24px; }

        .cta h2 { font-size: clamp(32px,6vw,80px); line-height: 1.1; margin-bottom: 20px; color: var(--dark); }
        .cta p  { font-size: clamp(16px,2vw,22px); line-height: 1.7; color: var(--text-muted); margin-bottom: 40px; }
        @media (min-width: 768px) { .cta h2 { margin-bottom: 32px; } .cta p { margin-bottom: 56px; } }

        .cta-button { padding: 16px 36px; font-size: 16px; box-shadow: 0 12px 48px rgba(99,107,47,0.3); }
        @media (min-width: 768px) { .cta-button { padding: 20px 48px; font-size: 17px; } }

        /* ── FOOTER ── */
        footer { background: var(--bg-dark); padding: 64px 0 36px; color: rgba(255,255,255,0.7); }
        @media (min-width: 768px) { footer { padding: 96px 0 48px; } }

        .footer-grid { display: grid; grid-template-columns: 1fr; gap: 36px; margin-bottom: 48px; }
        @media (min-width: 640px)  { .footer-grid { grid-template-columns: 1fr 1fr; gap: 40px; } }
        @media (min-width: 1024px) { .footer-grid { grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap: 80px; margin-bottom: 80px; } }

        .footer-brand h3 { font-family: 'JetBrains Mono', monospace; font-size: 18px; color: var(--white); margin-bottom: 14px; letter-spacing: 0.05em; }
        .footer-brand p  { font-size: 13px; line-height: 1.8; color: rgba(255,255,255,0.5); max-width: 320px; }

        .footer-column h4 { font-size: 12px; font-weight: 700; color: var(--white); margin-bottom: 18px; text-transform: uppercase; letter-spacing: 0.1em; }
        .footer-links { display: flex; flex-direction: column; gap: 12px; }
        @media (min-width: 768px) { .footer-links { gap: 16px; } }

        .footer-links a { color: rgba(255,255,255,0.6); text-decoration: none; font-size: 13px; transition: all 0.3s ease; display: inline-block; }
        .footer-links a:hover { color: var(--accent); transform: translateX(4px); }

        .footer-bottom {
          padding-top: 32px; border-top: 1px solid rgba(255,255,255,0.1);
          display: flex; flex-direction: column; gap: 16px; align-items: center; text-align: center;
        }

        @media (min-width: 640px) { .footer-bottom { flex-direction: row; justify-content: space-between; text-align: left; } }

        .footer-bottom p { font-size: 12px; color: rgba(255,255,255,0.4); }
        .footer-social { display: flex; gap: 20px; flex-wrap: wrap; justify-content: center; }
        @media (min-width: 640px) { .footer-social { justify-content: flex-end; } }

        .footer-social a { color: rgba(255,255,255,0.5); text-decoration: none; font-size: 13px; transition: color 0.3s ease; }
        .footer-social a:hover { color: var(--accent); }
      `}</style>

      {/* Navigation */}
      <motion.nav className="nav" initial={{ y:-100 }} animate={{ y:0 }} transition={{ duration:0.6, ease:[0.4,0,0.2,1] }}>
        <div className="nav-content">
          <a href="/" className="nav-logo">
            <div className="logo-mark">F</div>
            <div className="logo-text">
              <div className="logo-title">FOUNDRY</div>
              <div className="logo-subtitle">AI-POWERED VALIDATION</div>
            </div>
          </a>
          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#how"      className="nav-link">Process</a>
            <a href="#security" className="nav-link">Security</a>
            <a href="/sign-up"  className="btn btn-primary">Get Started</a>
          </div>
          <button className={`hamburger ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            <span /><span /><span />
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div className="mobile-menu" initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-12 }} transition={{ duration:0.2 }}>
            <a href="#features" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#how"      className="mobile-nav-link" onClick={() => setMenuOpen(false)}>Process</a>
            <a href="#security" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>Security</a>
            <a href="/sign-up"  className="btn btn-primary" style={{ marginTop:8 }} onClick={() => setMenuOpen(false)}>Get Started</a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg">
          <div className="grid-pattern"></div>
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
        </div>
        <div className="hero-content">
          <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.8, delay:0.2 }}>
            <div className="hero-badge">
              <div className="pulse-dot"></div>
              <span className="hero-badge-text">FOUNDER-CENTRIC OPERATIONAL UNIFIED NEW-VENTURE DEVELOPMENT RESOURCE YIELD</span>
            </div>
            <h1>Validate startup ideas with <span className="gradient-text">precision intelligence</span></h1>
            <p className="hero-description">
              Transform uncertain concepts into evidence-backed strategies. FOUNDRY analyzes markets, competitors, and viability using AI orchestration—so you build what actually works, not what feels right.
            </p>
            <div className="hero-cta">
              {/* ← CTA now goes to /sign-up */}
              <a href="/sign-up" className="btn btn-primary">Start Validating Free</a>
              <a href="#how"     className="btn btn-ghost">See How It Works →</a>
            </div>
            <div className="hero-meta">
              {[
                { value:'10k+', label:'Ideas Validated'   },
                { value:'94%',  label:'Accuracy Rate'     },
                { value:'15min',label:'Avg. Analysis Time'},
              ].map(m => (
                <div key={m.label} className="meta-item">
                  <div className="meta-value">{m.value}</div>
                  <div className="meta-label">{m.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust */}
      <section className="trust">
        <div className="trust-content">
          <div className="trust-header">
            <div className="trust-label">Trusted by teams building transformative companies</div>
          </div>
          <div className="trust-grid">
            {companies.map((company, idx) => (
              <motion.div key={company.name} className="trust-card"
                initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
                transition={{ duration:0.5, delay:idx * 0.1 }} viewport={{ once:true }}>
                <div className="company-name">{company.name}</div>
                <div className="company-industry">{company.industry}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem-Solution */}
      <section className="problem-section">
        <div className="section-content">
          <div className="problem-grid">
            <div>
              <div className="section-label">THE PROBLEM</div>
              <h2 className="section-title">Most startups fail because they build something nobody wants</h2>
              <div className="problem-list">
                {[
                  { icon:'💭', title:'Intuition replaces data',         body:'Founders trust gut feelings instead of market signals, missing critical indicators that predict failure before a single line of code is written.' },
                  { icon:'⏰', title:'Validation takes weeks or months', body:'Traditional research requires expensive consultants or endless manual analysis—by the time you have answers, the opportunity has shifted.' },
                  { icon:'🎯', title:'Competitive blindness',           body:'Teams miss existing solutions or fail to articulate meaningful differentiation that actually matters to customers.' },
                ].map(item => (
                  <div key={item.title} className="problem-item">
                    <div className="problem-icon">{item.icon}</div>
                    <div className="problem-content"><h4>{item.title}</h4><p>{item.body}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="solution-card">
                <div className="section-label">THE SOLUTION</div>
                <h3>AI that validates before you invest</h3>
                <p>FOUNDRY analyzes your idea against real market data, competitive landscapes, and verified demand signals—delivering institutional-grade insights in minutes, not weeks.</p>
                <div className="solution-features">
                  {['Evidence-backed market validation','Automated competitor intelligence','Real-time demand verification','Strategic differentiation mapping','Quality-scored AI outputs'].map(f => (
                    <div key={f} className="solution-feature"><div className="check-icon">✓</div>{f}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features" id="features">
        <div className="section-content">
          <div className="features-header">
            <h2>Built for clarity, not confusion</h2>
            <p>Every feature is designed to give you confidence in your next move</p>
          </div>
          <div className="features-grid">
            {[
              { icon:'🎤', title:'Voice-First Input',       desc:"Describe your idea naturally through text or voice. Our multimodal system understands context and asks intelligent follow-up questions to build a complete picture.", tag:'Natural UI' },
              { icon:'🔍', title:'RAG-Powered Research',    desc:"We don't hallucinate. Our retrieval-augmented system pulls verified market research, competitor intelligence, and demand signals from curated data sources.", tag:'Evidence-Based' },
              { icon:'⚖️', title:'Quality Validation',     desc:"Every output is scored and validated by our Critic Agent. Low-quality responses are rejected and regenerated until they meet enterprise standards.", tag:'Zero Hallucinations' },
              { icon:'🧭', title:'Adaptive Orchestration', desc:"Our Planner Agent orchestrates the right analysis steps for your specific idea—no generic templates, just tailored intelligence workflows.", tag:'Smart Routing' },
              { icon:'📊', title:'Competitive Mapping',    desc:"Understand the landscape with precision. We identify direct and indirect competitors, then highlight exactly where you can win in the market.", tag:'Strategic Intel' },
              { icon:'📄', title:'Investor-Ready Reports', desc:"Get comprehensive validation reports ready to share with co-founders, investors, or advisors—no fluff, just actionable strategic insights.", tag:'Professional Output' },
            ].map((feature, idx) => (
              <motion.div key={feature.title} className="feature-card"
                initial={{ opacity:0, y:40 }} whileInView={{ opacity:1, y:0 }}
                transition={{ duration:0.6, delay:idx * 0.1 }} viewport={{ once:true }}>
                <div className="feature-header"><div className="feature-icon">{feature.icon}</div></div>
                <h3>{feature.title}</h3><p>{feature.desc}</p>
                <div className="feature-tag">{feature.tag}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works" id="how">
        <div className="section-content">
          <div className="how-header">
            <h2>From idea to insight in four steps</h2>
            <p>A validated startup strategy in minutes</p>
          </div>
          <div className="steps-wrapper">
            <div className="steps-line"></div>
            <div className="steps-grid">
              {[
                { num:1, title:'Describe Your Vision', desc:'Share your concept through text or voice. Our dynamic questioning engine captures the complete picture.' },
                { num:2, title:'AI Orchestration',     desc:'The Planner Agent determines which validation steps matter for your specific idea and coordinates execution.' },
                { num:3, title:'Quality Assurance',    desc:'Every insight is scored by our Critic Agent. Weak outputs are refined until they meet quality thresholds.' },
                { num:4, title:'Strategic Report',     desc:'Receive a structured validation report with market data, competitor analysis, and actionable recommendations.' },
              ].map((step, idx) => (
                <motion.div key={step.num} className="step"
                  initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }}
                  transition={{ duration:0.6, delay:idx * 0.15 }} viewport={{ once:true }}>
                  <div className="step-number-wrapper"><div className="step-number">{step.num}</div></div>
                  <h4>{step.title}</h4><p>{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="security" id="security">
        <div className="security-grid-bg"></div>
        <div className="section-content">
          <div className="security-content">
            <div className="section-label" style={{ color:'var(--accent)' }}>ENTERPRISE-GRADE ARCHITECTURE</div>
            <h2>Built on deterministic logic, not AI promises</h2>
            <p className="security-desc">
              We don't trust AI to make final decisions. Every analysis is governed by backend logic, validated against quality rubrics, and logged for complete auditability. Your intellectual property stays secure.
            </p>
            <div className="security-grid">
              {[
                { icon:'🔒', title:'Secure Authentication',   desc:'Clerk-powered identity management with enterprise SSO and role-based access control' },
                { icon:'📝', title:'Complete Auditability',   desc:'Every AI action, decision, and output is logged and traceable in PostgreSQL with version control' },
                { icon:'⚡', title:'Deterministic Workflows', desc:'Backend-controlled orchestration prevents hallucinations and ensures consistent, reliable results' },
              ].map((item, idx) => (
                <motion.div key={item.title} className="security-item"
                  initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
                  transition={{ duration:0.5, delay:idx * 0.1 }} viewport={{ once:true }}>
                  <div className="security-icon">{item.icon}</div>
                  <h4>{item.title}</h4><p>{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="cta-bg"></div>
        <div className="cta-content">
          <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} transition={{ duration:0.8 }} viewport={{ once:true }}>
            <h2>Stop guessing. Start building with precision.</h2>
            <p>Join founders who validate ideas before they invest months of work and capital into uncertainty. Get started in under 60 seconds.</p>
            {/* ← CTA also goes to /sign-up */}
            <a href="/sign-up" className="btn btn-primary cta-button">Validate Your Idea Free →</a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="footer-content">
          <div className="footer-grid">
            <div className="footer-brand">
              <h3>FOUNDRY</h3>
              <p>Founder-centric Operational Unified New-venture Development Resource Yield. Intelligence that validates your vision before you build.</p>
            </div>
            {[
              { heading:'Product',   links:['Features','How It Works','Pricing','Case Studies','Documentation'] },
              { heading:'Company',   links:['About','Careers','Blog','Press Kit','Contact'] },
              { heading:'Resources', links:['API Reference','Community','Support','Status','Changelog'] },
              { heading:'Legal',     links:['Privacy Policy','Terms of Service','Security','Compliance','Data Processing'] },
            ].map(col => (
              <div key={col.heading} className="footer-column">
                <h4>{col.heading}</h4>
                <div className="footer-links">{col.links.map(l => <a key={l} href="#">{l}</a>)}</div>
              </div>
            ))}
          </div>
          <div className="footer-bottom">
            <p>© 2026 FOUNDRY. All rights reserved. Built with precision.</p>
            <div className="footer-social">{['Twitter','LinkedIn','GitHub','Discord'].map(s => <a key={s} href="#">{s}</a>)}</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FoundryLanding;