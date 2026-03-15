# File: backend/app/services/landing_page_service.py
import os
import re
import base64
import httpx
import json
from typing import Optional
from app.utils.logger import logger

OPENAI_API_KEY  = os.getenv("OPENAI_API_KEY")
GITHUB_TOKEN    = os.getenv("GITHUB_TOKEN")
GITHUB_USERNAME = os.getenv("GITHUB_USERNAME")
GITHUB_REPO     = os.getenv("GITHUB_REPO", "startup-landing-page")

MOSSY_HOLLOW_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>{{STARTUP_NAME}}</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&family=DM+Mono:wght@300;400;500&family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300;1,600&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
  <style>
    :root {
      --primary:   {{COLOR_PRIMARY}};
      --primary2:  {{COLOR_PRIMARY2}};
      --primary3:  {{COLOR_PRIMARY3}};
      --dark:      {{COLOR_DARK}};
      --cream:     #F5F2E8;
      --fog:       #E8EDD8;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { background: var(--cream); color: var(--dark); font-family: 'DM Mono', monospace; overflow-x: hidden; cursor: none; }
    .cursor { width: 12px; height: 12px; background: var(--primary); border-radius: 50%; position: fixed; top: 0; left: 0; pointer-events: none; z-index: 9999; mix-blend-mode: multiply; will-change: transform; }
    .cursor-ring { width: 36px; height: 36px; border: 1.5px solid var(--primary); border-radius: 50%; position: fixed; top: 0; left: 0; pointer-events: none; z-index: 9998; opacity: 0.5; will-change: transform; }
    nav { position: fixed; top: 0; left: 0; right: 0; display: flex; align-items: center; justify-content: space-between; padding: 1.4rem 3rem; z-index: 500; background: rgba(245,242,232,0.85); backdrop-filter: blur(8px); border-bottom: 1px solid rgba(0,0,0,0.06); transition: all 0.3s; }
    nav.shrunk { padding: 0.9rem 3rem; }
    .nav-logo { font-family: 'Playfair Display', serif; font-size: 1.05rem; font-weight: 900; color: var(--dark); text-decoration: none; }
    .nav-logo span { color: var(--primary); }
    .nav-links { display: flex; gap: 2.5rem; list-style: none; }
    .nav-links a { font-size: 0.68rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--primary); text-decoration: none; transition: color 0.2s; }
    .nav-links a:hover { color: var(--dark); }
    .nav-cta { display: flex; gap: 12px; align-items: center; }
    .btn-ghost { padding: 8px 20px; border: 1px solid var(--primary); border-radius: 4px; color: var(--primary); font-family: 'DM Mono', monospace; font-size: 0.68rem; letter-spacing: 0.1em; cursor: pointer; background: transparent; transition: all 0.2s; text-decoration: none; }
    .btn-ghost:hover { background: var(--primary); color: var(--cream); }
    .btn-primary { padding: 8px 20px; background: var(--dark); border: none; border-radius: 4px; color: var(--primary2); font-family: 'DM Mono', monospace; font-size: 0.68rem; letter-spacing: 0.1em; cursor: pointer; transition: all 0.2s; text-decoration: none; }
    .btn-primary:hover { background: var(--primary); color: var(--cream); }
    .hero { min-height: 100vh; display: grid; grid-template-columns: 55% 45%; overflow: hidden; }
    .hero-left { display: flex; flex-direction: column; justify-content: flex-end; padding: 9rem 3.5rem 5rem; background: var(--cream); }
    .hero-eyebrow { font-size: 0.62rem; letter-spacing: 0.22em; text-transform: uppercase; color: var(--primary2); margin-bottom: 1.5rem; animation: fadeUp 1s ease 0.2s both; }
    .hero-title { font-family: 'Playfair Display', serif; font-size: clamp(3.8rem, 6vw, 6.5rem); font-weight: 900; line-height: 0.93; color: var(--dark); margin-bottom: 2.2rem; animation: fadeUp 1s ease 0.4s both; }
    .hero-title em { font-style: italic; color: var(--primary); }
    .hero-desc { font-family: 'Cormorant Garamond', serif; font-size: 1.25rem; font-weight: 300; line-height: 1.75; color: var(--primary); max-width: 38ch; margin-bottom: 2rem; animation: fadeUp 1s ease 0.6s both; }
    .hero-trust { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 2.5rem; animation: fadeUp 1s ease 0.7s both; }
    .hero-trust-item { font-size: 0.68rem; letter-spacing: 0.1em; color: var(--dark); display: flex; align-items: center; gap: 0.5rem; }
    .hero-trust-item i { color: var(--primary); }
    .hero-cta { display: inline-flex; align-items: center; gap: 1rem; background: var(--dark); color: var(--primary2); padding: 1rem 2.2rem; font-size: 0.68rem; letter-spacing: 0.18em; text-transform: uppercase; text-decoration: none; transition: background 0.3s, color 0.3s; animation: fadeUp 1s ease 0.8s both; width: fit-content; }
    .hero-cta:hover { background: var(--primary); color: var(--cream); }
    .hero-cta .arr { display: inline-block; transition: transform 0.3s; }
    .hero-cta:hover .arr { transform: translateX(5px); }
    .hero-right { background: var(--primary); position: relative; overflow: hidden; animation: revealRight 1.3s cubic-bezier(0.77,0,0.175,1) both; }
    .hero-right::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 30% 70%, var(--primary2) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, var(--primary3) 0%, transparent 50%); opacity: 0.25; }
    .grid-overlay { position: absolute; inset: 0; background-image: repeating-linear-gradient(0deg, transparent, transparent 48px, rgba(245,242,232,0.07) 48px, rgba(245,242,232,0.07) 49px), repeating-linear-gradient(90deg, transparent, transparent 48px, rgba(245,242,232,0.07) 48px, rgba(245,242,232,0.07) 49px); }
    .hero-bigtext { position: absolute; font-family: 'Playfair Display', serif; font-size: 22vw; font-weight: 900; font-style: italic; color: rgba(245,242,232,0.07); bottom: -3rem; right: -2rem; line-height: 1; white-space: nowrap; pointer-events: none; }
    .hero-coord { position: absolute; top: 3rem; left: 2.5rem; font-size: 0.62rem; letter-spacing: 0.2em; color: rgba(245,242,232,0.55); }
    .hero-stats { position: absolute; bottom: 3rem; left: 2.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
    .hero-stat-item { border-left: 2px solid rgba(245,242,232,0.3); padding-left: 1rem; }
    .hero-stat-num { font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 900; color: var(--cream); line-height: 1; }
    .hero-stat-label { font-size: 0.58rem; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(245,242,232,0.6); margin-top: 0.2rem; }
    .hero-scroll { position: absolute; bottom: 2.5rem; right: 2.5rem; display: flex; flex-direction: column; align-items: center; gap: 0.6rem; }
    .scroll-line { width: 1px; height: 55px; background: linear-gradient(to bottom, var(--primary2), transparent); animation: scrollPulse 2.2s ease infinite; }
    .scroll-txt { font-size: 0.58rem; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(245,242,232,0.6); }
    .ticker { background: var(--dark); overflow: hidden; padding: 0.85rem 0; white-space: nowrap; }
    .ticker-inner { display: inline-block; animation: ticker 28s linear infinite; font-size: 0.68rem; letter-spacing: 0.16em; text-transform: uppercase; color: var(--primary2); }
    .t-item { margin: 0 3rem; }
    .t-dot { color: var(--primary3); }
    .section-wrap { padding: 8rem 3rem; }
    .section-wrap.fog { background: var(--fog); }
    .section-wrap.dark { background: var(--dark); }
    .section-label { font-size: 0.62rem; letter-spacing: 0.22em; text-transform: uppercase; color: var(--primary2); margin-bottom: 0.8rem; }
    .section-title { font-family: 'Playfair Display', serif; font-size: clamp(2.2rem, 4vw, 3.8rem); font-weight: 700; line-height: 1.1; color: var(--dark); margin-bottom: 1rem; }
    .section-title em { font-style: italic; color: var(--primary); }
    .section-sub { font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-weight: 300; line-height: 1.75; color: var(--primary); max-width: 60ch; margin-bottom: 3rem; }
    .section-wrap.dark .section-title { color: var(--primary2); }
    .section-wrap.dark .section-label { color: var(--primary3); }
    .section-wrap.dark .section-sub { color: rgba(245,242,232,0.6); }
    .features-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 1.2rem; margin-top: 2rem; }
    .feat-card { position: relative; overflow: hidden; cursor: pointer; }
    .feat-card:nth-child(1) { grid-column: 1 / 8; }
    .feat-card:nth-child(2) { grid-column: 8 / 13; }
    .feat-card:nth-child(3) { grid-column: 1 / 5; }
    .feat-card:nth-child(4) { grid-column: 5 / 13; }
    .card-bg { width: 100%; aspect-ratio: 4/3; position: relative; transition: transform 0.65s cubic-bezier(0.4,0,0.2,1); display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 1rem; padding: 2rem; }
    .feat-card:hover .card-bg { transform: scale(1.05); }
    .card-bg-1 { background: linear-gradient(135deg, var(--primary), var(--dark)); }
    .card-bg-2 { background: var(--primary3); }
    .card-bg-3 { background: var(--dark); }
    .card-bg-4 { background: linear-gradient(120deg, var(--primary2), var(--primary3)); }
    .card-icon-big { font-size: 3.5rem; opacity: 0.35; color: var(--cream); }
    .card-desc { font-family: 'Cormorant Garamond', serif; font-size: 1rem; font-weight: 300; line-height: 1.6; color: rgba(245,242,232,0.75); text-align: center; max-width: 30ch; opacity: 0; transition: opacity 0.3s; }
    .card-bg-2 .card-icon-big, .card-bg-4 .card-icon-big { color: var(--dark); }
    .card-bg-2 .card-desc, .card-bg-4 .card-desc { color: rgba(0,0,0,0.6); }
    .feat-card:hover .card-desc { opacity: 1; }
    .card-label { position: absolute; bottom: 1.4rem; left: 1.4rem; right: 1.4rem; display: flex; justify-content: space-between; align-items: flex-end; }
    .card-title { font-family: 'Playfair Display', serif; font-size: 1.2rem; font-weight: 700; line-height: 1.2; color: var(--cream); }
    .card-bg-2 .card-title, .card-bg-4 .card-title { color: var(--dark); }
    .card-tag { font-size: 0.58rem; letter-spacing: 0.16em; text-transform: uppercase; opacity: 0.65; color: var(--cream); }
    .card-bg-2 .card-tag, .card-bg-4 .card-tag { color: var(--dark); }
    .problem-solution { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; margin-top: 4rem; }
    .ps-card { padding: 3rem; border: 1px solid rgba(0,0,0,0.1); }
    .ps-card.problem { border-left: 4px solid #c0392b; background: rgba(192,57,43,0.04); }
    .ps-card.solution { border-left: 4px solid var(--primary); background: rgba(0,0,0,0.02); }
    .ps-label { font-size: 0.62rem; letter-spacing: 0.22em; text-transform: uppercase; margin-bottom: 1rem; }
    .ps-card.problem .ps-label { color: #c0392b; }
    .ps-card.solution .ps-label { color: var(--primary); }
    .ps-title { font-family: 'Playfair Display', serif; font-size: 1.8rem; font-weight: 700; color: var(--dark); margin-bottom: 1.5rem; line-height: 1.2; }
    .ps-text { font-family: 'Cormorant Garamond', serif; font-size: 1.08rem; font-weight: 300; line-height: 1.75; color: var(--primary); margin-bottom: 1.5rem; }
    .ps-list { list-style: none; display: flex; flex-direction: column; gap: 0.8rem; }
    .ps-list li { font-size: 0.78rem; display: flex; align-items: flex-start; gap: 0.8rem; line-height: 1.5; }
    .ps-list li i { margin-top: 2px; flex-shrink: 0; }
    .ps-card.problem .ps-list li i { color: #c0392b; }
    .ps-card.solution .ps-list li i { color: var(--primary); }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem; }
    .stat-item { text-align: center; }
    .stat-num { font-family: 'Playfair Display', serif; font-size: clamp(3rem, 5vw, 5.5rem); font-weight: 900; color: var(--primary2); line-height: 1; }
    .stat-suffix { font-size: clamp(1.5rem, 2.5vw, 2.5rem); color: var(--primary3); }
    .stat-label { font-size: 0.62rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--primary3); margin-top: 0.6rem; opacity: 0.7; }
    .process-list { margin-top: 4rem; border-top: 1px solid rgba(0,0,0,0.12); }
    .process-item { display: grid; grid-template-columns: 70px 1fr 1.5fr; gap: 2rem; padding: 2.5rem 0.5rem; border-bottom: 1px solid rgba(0,0,0,0.12); transition: background 0.3s, padding 0.3s; }
    .process-item:hover { background: rgba(0,0,0,0.03); padding-left: 1.5rem; }
    .p-num { font-size: 0.68rem; letter-spacing: 0.16em; color: var(--primary2); padding-top: 0.3rem; }
    .p-name { font-family: 'Playfair Display', serif; font-size: 1.6rem; font-weight: 700; font-style: italic; color: var(--dark); }
    .p-desc { font-family: 'Cormorant Garamond', serif; font-size: 1.08rem; font-weight: 300; line-height: 1.75; color: var(--primary); }
    .testi-flex { display: flex; height: 340px; border-radius: 3px; overflow: hidden; margin-top: 4rem; }
    .testi-card { position: relative; flex: 1; background: var(--primary); cursor: pointer; transition: flex 0.5s cubic-bezier(0.4,0,0.2,1); overflow: hidden; padding: 2rem; display: flex; flex-direction: column; justify-content: flex-end; }
    .testi-card:nth-child(2) { background: var(--dark); }
    .testi-card:nth-child(3) { background: linear-gradient(135deg, var(--primary), var(--dark)); }
    .testi-info { opacity: 0; transform: translateY(8px); transition: opacity 0.3s, transform 0.3s; }
    .testi-card:hover .testi-info { opacity: 1; transform: none; }
    .testi-stars { color: #f1c40f; font-size: 0.8rem; margin-bottom: 0.8rem; letter-spacing: 2px; }
    .testi-avatar { width: 48px; height: 48px; border-radius: 50%; background: rgba(245,242,232,0.2); display: flex; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 700; color: var(--cream); margin-bottom: 1rem; }
    .testi-name { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 700; color: var(--cream); }
    .testi-role { font-size: 0.62rem; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(245,242,232,0.6); margin-bottom: 0.8rem; }
    .testi-quote { font-family: 'Cormorant Garamond', serif; font-size: 1rem; font-weight: 300; line-height: 1.7; color: rgba(245,242,232,0.85); }
    .testi-initial { font-family: 'Playfair Display', serif; font-size: 8rem; font-weight: 900; font-style: italic; color: rgba(245,242,232,0.05); position: absolute; bottom: -2rem; right: 1rem; line-height: 1; pointer-events: none; }
    .pricing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 4rem; }
    .price-card { border: 1px solid rgba(0,0,0,0.1); padding: 3rem; background: var(--cream); transition: all 0.3s; position: relative; }
    .price-card:hover { transform: translateY(-4px); box-shadow: 0 20px 60px rgba(0,0,0,0.08); }
    .price-card.featured { border-color: var(--primary); background: var(--fog); }
    .price-badge { position: absolute; top: -1px; right: 2rem; background: var(--primary); color: var(--cream); font-size: 0.58rem; letter-spacing: 0.16em; text-transform: uppercase; padding: 4px 12px; }
    .price-tier { font-size: 0.62rem; letter-spacing: 0.22em; text-transform: uppercase; color: var(--primary2); margin-bottom: 1rem; }
    .price-amount { font-family: 'Playfair Display', serif; font-size: 3.5rem; font-weight: 900; color: var(--dark); line-height: 1; margin-bottom: 0.5rem; }
    .price-period { font-size: 0.68rem; color: var(--primary2); letter-spacing: 0.1em; margin-bottom: 2rem; }
    .price-features { list-style: none; margin-bottom: 2.5rem; }
    .price-features li { font-size: 0.78rem; padding: 0.6rem 0; border-bottom: 1px solid rgba(0,0,0,0.06); display: flex; align-items: center; gap: 0.8rem; color: var(--dark); }
    .price-features li i { color: var(--primary); font-size: 0.7rem; }
    .price-cta { display: inline-flex; align-items: center; gap: 0.8rem; background: var(--dark); color: var(--primary2); padding: 0.9rem 2rem; font-size: 0.68rem; letter-spacing: 0.16em; text-transform: uppercase; text-decoration: none; transition: all 0.3s; width: 100%; justify-content: center; }
    .price-cta:hover { background: var(--primary); color: var(--cream); }
    .price-card.featured .price-cta { background: var(--primary); color: var(--cream); }
    .price-card.featured .price-cta:hover { background: var(--dark); }
    .faq-list { margin-top: 4rem; border-top: 1px solid rgba(0,0,0,0.12); }
    .faq-item { border-bottom: 1px solid rgba(0,0,0,0.12); }
    .faq-q { display: flex; justify-content: space-between; align-items: center; padding: 1.8rem 0.5rem; cursor: pointer; transition: padding 0.3s; }
    .faq-q:hover { padding-left: 1rem; }
    .faq-q-text { font-family: 'Playfair Display', serif; font-size: 1.2rem; font-weight: 700; font-style: italic; color: var(--dark); }
    .faq-icon { color: var(--primary); font-size: 1.2rem; transition: transform 0.3s; }
    .faq-a { max-height: 0; overflow: hidden; transition: max-height 0.4s ease; }
    .faq-a-inner { font-family: 'Cormorant Garamond', serif; font-size: 1.08rem; font-weight: 300; line-height: 1.75; color: var(--primary); padding: 0 0.5rem 1.5rem; }
    .faq-item.open .faq-icon { transform: rotate(45deg); }
    .faq-item.open .faq-a { max-height: 300px; }
    .contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5rem; align-items: center; position: relative; overflow: hidden; }
    .contact-grid::after { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 85% 50%, var(--dark) 0%, transparent 55%); opacity: 0.45; pointer-events: none; }
    .c-left, .c-right { position: relative; z-index: 2; }
    .c-title { font-family: 'Playfair Display', serif; font-size: clamp(2.6rem, 4vw, 4.2rem); font-weight: 900; color: var(--cream); line-height: 1.05; margin-bottom: 1.5rem; }
    .c-title em { font-style: italic; color: var(--primary2); }
    .c-sub { font-family: 'Cormorant Garamond', serif; font-size: 1.18rem; font-weight: 300; color: rgba(245,242,232,0.7); line-height: 1.75; }
    .c-form { display: flex; flex-direction: column; gap: 1rem; }
    .f-field { background: rgba(245,242,232,0.1); border: 1px solid rgba(245,242,232,0.2); padding: 1rem 1.2rem; font-family: 'DM Mono', monospace; font-size: 0.78rem; color: var(--cream); outline: none; transition: border-color 0.2s, background 0.2s; width: 100%; }
    .f-field::placeholder { color: rgba(245,242,232,0.35); }
    .f-field:focus { border-color: var(--primary2); background: rgba(245,242,232,0.16); }
    .f-submit { background: var(--primary2); color: var(--dark); border: none; padding: 1rem 2.2rem; font-family: 'DM Mono', monospace; font-size: 0.68rem; letter-spacing: 0.18em; text-transform: uppercase; cursor: pointer; transition: background 0.3s; align-self: flex-start; }
    .f-submit:hover { background: var(--cream); }
    footer { background: var(--dark); padding: 2.5rem 3rem; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(245,242,232,0.08); }
    .f-logo { font-family: 'Playfair Display', serif; font-size: 1.15rem; font-weight: 900; color: var(--primary2); }
    .f-copy { font-size: 0.58rem; letter-spacing: 0.16em; text-transform: uppercase; color: var(--primary3); opacity: 0.55; }
    .f-links { display: flex; gap: 2rem; }
    .f-links a { font-size: 0.6rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--primary3); text-decoration: none; opacity: 0.65; transition: opacity 0.2s; }
    .f-links a:hover { opacity: 1; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(26px); } to { opacity:1; transform:translateY(0); } }
    @keyframes revealRight { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
    @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
    @keyframes scrollPulse { 0%,100%{opacity:.35;} 50%{opacity:1;} }
    .reveal { opacity:0; transform:translateY(28px); transition: opacity 0.85s ease, transform 0.85s ease; }
    .reveal.visible { opacity:1; transform:none; }
    @media (max-width: 860px) {
      .hero { grid-template-columns: 1fr; }
      .hero-right { display: none; }
      nav { padding: 1.2rem 1.5rem; }
      .stats-grid { grid-template-columns: repeat(2,1fr); }
      .feat-card:nth-child(1),.feat-card:nth-child(2),.feat-card:nth-child(3),.feat-card:nth-child(4) { grid-column: 1/-1; }
      .contact-grid,.pricing-grid,.problem-solution { grid-template-columns: 1fr; }
      .testi-flex { flex-direction: column; height: auto; }
      .testi-card { min-height: 220px; }
      .process-item { grid-template-columns: 55px 1fr; }
      .p-desc { grid-column: 2; }
      .section-wrap { padding: 5rem 1.5rem; }
      nav .nav-links { display: none; }
    }
  </style>
</head>
<body>
<div class="cursor" id="cursor"></div>
<div class="cursor-ring" id="cr"></div>
<nav id="navbar">
  <a href="#" class="nav-logo">{{STARTUP_NAME}} <span>.</span></a>
  <ul class="nav-links">
    <li><a href="#features">Features</a></li>
    <li><a href="#process">How It Works</a></li>
    <li><a href="#pricing">Pricing</a></li>
    <li><a href="#faq">FAQ</a></li>
  </ul>
  <div class="nav-cta">
    <a href="#" class="btn-ghost">Sign In</a>
    <a href="#contact" class="btn-primary">{{CTA_TEXT}}</a>
  </div>
</nav>
<section class="hero">
  <div class="hero-left">
    <p class="hero-eyebrow">{{EYEBROW}}</p>
    <h1 class="hero-title">{{HERO_LINE1}}<br><em>{{HERO_LINE2}}</em></h1>
    <p class="hero-desc">{{HERO_SUB}}</p>
    <div class="hero-trust">
      <div class="hero-trust-item"><i class="fa-solid fa-check"></i> {{TRUST_1}}</div>
      <div class="hero-trust-item"><i class="fa-solid fa-check"></i> {{TRUST_2}}</div>
      <div class="hero-trust-item"><i class="fa-solid fa-check"></i> {{TRUST_3}}</div>
    </div>
    <a href="#contact" class="hero-cta">{{CTA_TEXT}} <span class="arr">&#8594;</span></a>
  </div>
  <div class="hero-right">
    <div class="grid-overlay"></div>
    <span class="hero-coord">{{EYEBROW}}</span>
    <div class="hero-stats">
      <div class="hero-stat-item">
        <div class="hero-stat-num">{{STAT_1_NUM}}{{STAT_1_SUFFIX}}</div>
        <div class="hero-stat-label">{{STAT_1_LABEL}}</div>
      </div>
      <div class="hero-stat-item">
        <div class="hero-stat-num">{{STAT_2_NUM}}{{STAT_2_SUFFIX}}</div>
        <div class="hero-stat-label">{{STAT_2_LABEL}}</div>
      </div>
    </div>
    <div class="hero-bigtext">{{STARTUP_NAME_SHORT}}</div>
    <div class="hero-scroll">
      <div class="scroll-line"></div>
      <span class="scroll-txt">Scroll</span>
    </div>
  </div>
</section>
<div class="ticker">
  <div class="ticker-inner" id="tickerInner">{{TICKER_ITEMS}}</div>
</div>
<section class="section-wrap" id="features">
  <div class="reveal">
    <p class="section-label">What We Offer</p>
    <h2 class="section-title">{{FEATURES_TITLE}}<br><em>{{FEATURES_TITLE_EM}}</em></h2>
    <p class="section-sub">{{FEATURES_SUB}}</p>
  </div>
  <div class="features-grid reveal">{{FEATURE_CARDS}}</div>
</section>
<section class="section-wrap fog" id="problem">
  <div class="reveal">
    <p class="section-label">The Challenge</p>
    <h2 class="section-title">{{PROBLEM_TITLE}}<br><em>{{PROBLEM_TITLE_EM}}</em></h2>
  </div>
  <div class="problem-solution reveal">{{PROBLEM_SOLUTION_CARDS}}</div>
</section>
<section class="section-wrap dark">
  <div class="stats-grid">{{STAT_ITEMS}}</div>
</section>
<section class="section-wrap fog" id="process">
  <div class="reveal">
    <p class="section-label">How It Works</p>
    <h2 class="section-title">{{PROCESS_TITLE}}<br><em>{{PROCESS_TITLE_EM}}</em></h2>
    <p class="section-sub">{{PROCESS_SUB}}</p>
  </div>
  <div class="process-list">{{PROCESS_ITEMS}}</div>
</section>
<section class="section-wrap" id="testimonials">
  <div class="reveal">
    <p class="section-label">Student Stories</p>
    <h2 class="section-title">Loved by students<br><em>across India.</em></h2>
  </div>
  <div class="testi-flex reveal" id="testiGrid">{{TESTI_CARDS}}</div>
</section>
<section class="section-wrap fog" id="pricing">
  <div class="reveal">
    <p class="section-label">Simple Pricing</p>
    <h2 class="section-title">{{PRICING_TITLE}}<br><em>{{PRICING_TITLE_EM}}</em></h2>
  </div>
  <div class="pricing-grid reveal">{{PRICING_CARDS}}</div>
</section>
<section class="section-wrap" id="faq">
  <div class="reveal">
    <p class="section-label">Questions</p>
    <h2 class="section-title">{{FAQ_TITLE}}<br><em>{{FAQ_TITLE_EM}}</em></h2>
  </div>
  <div class="faq-list reveal">{{FAQ_ITEMS}}</div>
</section>
<section class="section-wrap dark" id="contact">
  <div class="contact-grid">
    <div class="c-left reveal">
      <h2 class="c-title">{{CONTACT_TITLE}}<br><em>{{CONTACT_TITLE_EM}}</em></h2>
      <p class="c-sub">{{CONTACT_SUB}}</p>
    </div>
    <div class="c-right reveal">
      <div class="c-form">
        <input type="text" class="f-field" placeholder="Your name"/>
        <input type="email" class="f-field" placeholder="Email address"/>
        <input type="text" class="f-field" placeholder="College / Institution"/>
        <textarea class="f-field" style="height:100px;resize:none;" placeholder="Tell us about yourself..."></textarea>
        <button class="f-submit">{{CTA_TEXT}} &#8594;</button>
      </div>
    </div>
  </div>
</section>
<footer>
  <span class="f-logo">{{STARTUP_NAME}}</span>
  <span class="f-copy">&copy; 2025 {{STARTUP_NAME}}. All rights reserved. Made with &#10084; in India</span>
  <div class="f-links">
    <a href="#">Twitter</a>
    <a href="#">LinkedIn</a>
    <a href="#">Instagram</a>
  </div>
</footer>
<script>
  const cur=document.getElementById('cursor'),cr=document.getElementById('cr');
  let mx=0,my=0,rx=0,ry=0;
  document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;cur.style.transform=`translate(${mx-6}px,${my-6}px)`;});
  (function loop(){rx+=(mx-rx)*0.12;ry+=(my-ry)*0.12;cr.style.transform=`translate(${rx-18}px,${ry-18}px)`;requestAnimationFrame(loop);})();
  const obs=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible');}),{threshold:0.1});
  document.querySelectorAll('.reveal').forEach(r=>obs.observe(r));
  function counter(el){const tgt=+el.dataset.target,t0=performance.now();const run=now=>{const t=Math.min((now-t0)/1800,1),ease=1-Math.pow(1-t,3);el.textContent=Math.round(ease*tgt);if(t<1)requestAnimationFrame(run);};requestAnimationFrame(run);}
  const co=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){counter(e.target);co.unobserve(e.target);}}),{threshold:0.5});
  document.querySelectorAll('[data-target]').forEach(el=>co.observe(el));
  const ti=document.getElementById('tickerInner');ti.innerHTML+=ti.innerHTML;
  const tg=document.getElementById('testiGrid');const tc=tg.querySelectorAll('.testi-card');
  tg.addEventListener('mouseenter',()=>tc.forEach(c=>c.style.flex='0.7'));
  tg.addEventListener('mouseleave',()=>tc.forEach(c=>c.style.flex='1'));
  tc.forEach(c=>{c.addEventListener('mouseenter',()=>c.style.flex='2.8');c.addEventListener('mouseleave',()=>c.style.flex='0.7');});
  window.addEventListener('scroll',()=>{document.getElementById('navbar').classList.toggle('shrunk',window.scrollY>50);});
  document.querySelectorAll('.faq-q').forEach(q=>{q.addEventListener('click',()=>{const item=q.parentElement;const wasOpen=item.classList.contains('open');document.querySelectorAll('.faq-item').forEach(i=>i.classList.remove('open'));if(!wasOpen)item.classList.add('open');});});
  document.querySelectorAll('a[href^="#"]').forEach(a=>{a.addEventListener('click',e=>{const t=document.querySelector(a.getAttribute('href'));if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth'});}});});
</script>
</body>
</html>"""


class StartupDataExtractor:
    def extract(self, structured_data: dict) -> dict:
        logger.info("🔍 Extracting startup data...")
        return {
            "startup_name":    structured_data.get("startup_name") or structured_data.get("name") or "EduLang AI",
            "tagline":         structured_data.get("tagline") or structured_data.get("unique_value_proposition") or "AI-powered education in your language.",
            "problem":         structured_data.get("problem") or structured_data.get("problem_statement", ""),
            "solution":        structured_data.get("solution") or structured_data.get("solution_description", ""),
            "target_audience": structured_data.get("target_audience", ""),
            "key_features":    structured_data.get("key_features") or structured_data.get("features", []),
            "business_model":  structured_data.get("business_model", ""),
            "market_size":     structured_data.get("market_size_estimate", ""),
            "unique_value":    structured_data.get("unique_value_proposition", ""),
            "cta_text":        structured_data.get("cta", "Get Early Access"),
            "brand_color":     structured_data.get("brand_color", "#6366f1"),
            "raw_data":        structured_data,
        }


class LandingPageGenerator:
    def __init__(self):
        if not OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY not set.")

    def _build_analysis_prompt(self, d: dict) -> str:
        return (
            "You are a world-class startup analyst, brand strategist, and copywriter.\n\n"
            "STEP 1 — DEEPLY UNDERSTAND THIS STARTUP:\n"
            "- What exact pain does this solve and for whom?\n"
            "- What makes it uniquely valuable?\n"
            "- What emotions does the target audience feel about this problem?\n"
            "- What would make someone trust and sign up immediately?\n\n"
            "STEP 2 — GENERATE RICH, SPECIFIC, EMOTIONAL CONTENT:\n"
            "Every word must feel written by a human who deeply understands this product.\n"
            "Zero generic phrases. Zero lorem ipsum. Zero filler words.\n\n"
            "STARTUP DATA:\n" + json.dumps(d["raw_data"], indent=2) + "\n\n"
            "Return a JSON object with EXACTLY these keys:\n"
            "startup_name, startup_name_short (1 word),\n"
            "eyebrow (5-6 words specific to what they do),\n"
            "hero_line1 (4-5 powerful words — core promise),\n"
            "hero_line2 (4-5 words — emotional hook for audience),\n"
            "hero_sub (20-25 words — specific subheadline for who this is for),\n"
            "cta_text,\n"
            "trust_1 (compelling specific stat), trust_2, trust_3,\n"
            "features_title (3-4 words), features_title_em (3-4 words italic),\n"
            "features_sub (15-20 words),\n"
            "top_4_features: array of 4 objects each with title, tag, icon_class (Font Awesome 6 class), bg_index (integer 1-4), description (2 sentences),\n"
            "problem_title (3-4 words), problem_title_em (3-4 words italic),\n"
            "problem_heading (4-5 words), problem_text (2 sentences),\n"
            "problem_points: array of 3 short pain point strings,\n"
            "solution_heading (4-5 words), solution_text (2 sentences),\n"
            "solution_points: array of 3 specific benefit strings,\n"
            "stats: array of 4 objects each with number (string of digits only), suffix (string), label (string),\n"
            "process_title (3-4 words), process_title_em (3-4 words italic),\n"
            "process_sub (15-20 words),\n"
            "process_items: array of 4 objects each with step (string 01-04), title (italic verb phrase), description (2 sentences),\n"
            "testimonials: array of 3 objects each with name (Indian name), role (college/role), initials (2 letters), quote (2 sentences specific to this product),\n"
            "pricing_title (3-4 words), pricing_title_em (3-4 words italic),\n"
            "pricing_free: object with key 'features' containing array of 3 strings,\n"
            "pricing_premium: object with keys 'amount' (string), 'period' (string), 'features' (array of 5 strings),\n"
            "faq_title (3-4 words), faq_title_em (3-4 words italic),\n"
            "faqs: array of 4 objects each with question (string) and answer (string),\n"
            "ticker_items: array of 8 short phrase strings specific to this product,\n"
            "contact_title (3-4 words), contact_title_em (3-4 words italic),\n"
            "contact_sub (15-20 words),\n"
            "color_primary2: lighter hex shade of " + d["brand_color"] + ",\n"
            "color_primary3: muted hex shade of " + d["brand_color"] + ",\n"
            "color_dark: deep dark hex color complementing " + d["brand_color"] + ",\n"
            "brand_color: \"" + d["brand_color"] + "\"\n\n"
            "CRITICAL: pricing_free MUST be {\"features\": [\"f1\",\"f2\",\"f3\"]}\n"
            "CRITICAL: pricing_premium MUST be {\"amount\":\"₹149\",\"period\":\"per month\",\"features\":[\"f1\",\"f2\",\"f3\",\"f4\",\"f5\"]}\n"
            "Every field must be deeply specific to THIS startup.\n"
            "Return ONLY valid JSON. No markdown. No explanation."
        )

    def _safe_dict(self, val) -> dict:
        return val if isinstance(val, dict) else {}

    def _safe_list(self, val) -> list:
        return val if isinstance(val, list) else []

    def _fill_template(self, analysis: dict) -> str:
        a        = analysis
        brand    = a.get("brand_color", "#6366f1")
        primary2 = a.get("color_primary2", brand + "CC")
        primary3 = a.get("color_primary3", brand + "88")
        dark     = a.get("color_dark", "#1a1a2e")

        ticker_html = ""
        for item in self._safe_list(a.get("ticker_items")):
            ticker_html += f'<span class="t-item">{item} <span class="t-dot">&#9670;</span></span>'

        bg_map    = {1: "card-bg-1", 2: "card-bg-2", 3: "card-bg-3", 4: "card-bg-4"}
        feat_html = ""
        for i, f in enumerate(self._safe_list(a.get("top_4_features"))[:4]):
            if not isinstance(f, dict): continue
            bg = bg_map.get(f.get("bg_index", i + 1), "card-bg-1")
            feat_html += (
                f'<div class="feat-card"><div class="card-bg {bg}">'
                f'<i class="card-icon-big {f.get("icon_class","fa-solid fa-star")}"></i>'
                f'<p class="card-desc">{f.get("description","")}</p></div>'
                f'<div class="card-label"><span class="card-title">{f.get("title","")}</span>'
                f'<span class="card-tag">{f.get("tag","")}</span></div></div>'
            )

        prob_points = "".join([f'<li><i class="fa-solid fa-xmark"></i>{p}</li>' for p in self._safe_list(a.get("problem_points"))])
        sol_points  = "".join([f'<li><i class="fa-solid fa-check"></i>{p}</li>' for p in self._safe_list(a.get("solution_points"))])
        ps_html = (
            f'<div class="ps-card problem reveal"><div class="ps-label">The Problem</div>'
            f'<div class="ps-title">{a.get("problem_heading","")}</div>'
            f'<p class="ps-text">{a.get("problem_text","")}</p>'
            f'<ul class="ps-list">{prob_points}</ul></div>'
            f'<div class="ps-card solution reveal"><div class="ps-label">The Solution</div>'
            f'<div class="ps-title">{a.get("solution_heading","")}</div>'
            f'<p class="ps-text">{a.get("solution_text","")}</p>'
            f'<ul class="ps-list">{sol_points}</ul></div>'
        )

        stats      = self._safe_list(a.get("stats"))
        stats_html = ""
        for s in stats:
            if not isinstance(s, dict): continue
            stats_html += (
                f'<div class="stat-item reveal">'
                f'<div class="stat-num"><span data-target="{s.get("number","0")}">0</span>'
                f'<span class="stat-suffix">{s.get("suffix","")}</span></div>'
                f'<div class="stat-label">{s.get("label","")}</div></div>'
            )

        process_html = ""
        for p in self._safe_list(a.get("process_items")):
            if not isinstance(p, dict): continue
            process_html += (
                f'<div class="process-item reveal">'
                f'<span class="p-num">{p.get("step","")}</span>'
                f'<span class="p-name">{p.get("title","")}</span>'
                f'<p class="p-desc">{p.get("description","")}</p></div>'
            )

        testi_html = ""
        for t in self._safe_list(a.get("testimonials"))[:3]:
            if not isinstance(t, dict): continue
            testi_html += (
                f'<div class="testi-card"><div class="testi-initial">{t.get("initials","")}</div>'
                f'<div class="testi-info"><div class="testi-stars">★★★★★</div>'
                f'<div class="testi-avatar">{t.get("initials","")}</div>'
                f'<div class="testi-name">{t.get("name","")}</div>'
                f'<div class="testi-role">{t.get("role","")}</div>'
                f'<div class="testi-quote">"{t.get("quote","")}"</div></div></div>'
            )

        pricing_free = self._safe_dict(a.get("pricing_free"))
        free_f       = self._safe_list(pricing_free.get("features"))
        prem         = self._safe_dict(a.get("pricing_premium"))
        prem_f       = self._safe_list(prem.get("features"))
        free_li      = "".join([f'<li><i class="fa-solid fa-check"></i>{f}</li>' for f in free_f])
        prem_li      = "".join([f'<li><i class="fa-solid fa-check"></i>{f}</li>' for f in prem_f])
        pricing_html = (
            f'<div class="price-card reveal"><div class="price-tier">Free</div>'
            f'<div class="price-amount">&#8377;0</div><div class="price-period">forever free</div>'
            f'<ul class="price-features">{free_li}</ul>'
            f'<a href="#contact" class="price-cta">Get Started &#8594;</a></div>'
            f'<div class="price-card featured reveal"><div class="price-badge">Most Popular</div>'
            f'<div class="price-tier">Premium</div>'
            f'<div class="price-amount">{prem.get("amount","&#8377;149")}</div>'
            f'<div class="price-period">{prem.get("period","per month")}</div>'
            f'<ul class="price-features">{prem_li}</ul>'
            f'<a href="#contact" class="price-cta">{a.get("cta_text","Get Early Access")} &#8594;</a></div>'
        )

        faq_html = ""
        for f in self._safe_list(a.get("faqs")):
            if not isinstance(f, dict): continue
            faq_html += (
                f'<div class="faq-item"><div class="faq-q">'
                f'<span class="faq-q-text">{f.get("question","")}</span>'
                f'<span class="faq-icon">+</span></div>'
                f'<div class="faq-a"><div class="faq-a-inner">{f.get("answer","")}</div></div></div>'
            )

        stat_1 = stats[0] if len(stats) > 0 and isinstance(stats[0], dict) else {}
        stat_2 = stats[1] if len(stats) > 1 and isinstance(stats[1], dict) else {}

        html = MOSSY_HOLLOW_TEMPLATE
        for k, v in {
            "{{STARTUP_NAME}}":           a.get("startup_name", ""),
            "{{STARTUP_NAME_SHORT}}":     a.get("startup_name_short", ""),
            "{{CTA_TEXT}}":               a.get("cta_text", "Get Early Access"),
            "{{EYEBROW}}":                a.get("eyebrow", ""),
            "{{HERO_LINE1}}":             a.get("hero_line1", ""),
            "{{HERO_LINE2}}":             a.get("hero_line2", ""),
            "{{HERO_SUB}}":               a.get("hero_sub", ""),
            "{{TRUST_1}}":                a.get("trust_1", ""),
            "{{TRUST_2}}":                a.get("trust_2", ""),
            "{{TRUST_3}}":                a.get("trust_3", ""),
            "{{TICKER_ITEMS}}":           ticker_html,
            "{{FEATURES_TITLE}}":         a.get("features_title", ""),
            "{{FEATURES_TITLE_EM}}":      a.get("features_title_em", ""),
            "{{FEATURES_SUB}}":           a.get("features_sub", ""),
            "{{FEATURE_CARDS}}":          feat_html,
            "{{PROBLEM_TITLE}}":          a.get("problem_title", ""),
            "{{PROBLEM_TITLE_EM}}":       a.get("problem_title_em", ""),
            "{{PROBLEM_SOLUTION_CARDS}}": ps_html,
            "{{STAT_ITEMS}}":             stats_html,
            "{{STAT_1_NUM}}":             str(stat_1.get("number", "")),
            "{{STAT_1_SUFFIX}}":          stat_1.get("suffix", ""),
            "{{STAT_1_LABEL}}":           stat_1.get("label", ""),
            "{{STAT_2_NUM}}":             str(stat_2.get("number", "")),
            "{{STAT_2_SUFFIX}}":          stat_2.get("suffix", ""),
            "{{STAT_2_LABEL}}":           stat_2.get("label", ""),
            "{{PROCESS_TITLE}}":          a.get("process_title", ""),
            "{{PROCESS_TITLE_EM}}":       a.get("process_title_em", ""),
            "{{PROCESS_SUB}}":            a.get("process_sub", ""),
            "{{PROCESS_ITEMS}}":          process_html,
            "{{TESTI_CARDS}}":            testi_html,
            "{{PRICING_TITLE}}":          a.get("pricing_title", ""),
            "{{PRICING_TITLE_EM}}":       a.get("pricing_title_em", ""),
            "{{PRICING_CARDS}}":          pricing_html,
            "{{FAQ_TITLE}}":              a.get("faq_title", ""),
            "{{FAQ_TITLE_EM}}":           a.get("faq_title_em", ""),
            "{{FAQ_ITEMS}}":              faq_html,
            "{{CONTACT_TITLE}}":          a.get("contact_title", ""),
            "{{CONTACT_TITLE_EM}}":       a.get("contact_title_em", ""),
            "{{CONTACT_SUB}}":            a.get("contact_sub", ""),
            "{{COLOR_PRIMARY}}":          brand,
            "{{COLOR_PRIMARY2}}":         primary2,
            "{{COLOR_PRIMARY3}}":         primary3,
            "{{COLOR_DARK}}":             dark,
        }.items():
            html = html.replace(k, str(v))
        return html

    async def _analyze(self, startup_data: dict) -> dict:
        logger.info("🧠 Pass 1: Analyzing...")
        async with httpx.AsyncClient(timeout=90.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": "Return only valid JSON. No markdown. No explanation."},
                        {"role": "user",   "content": self._build_analysis_prompt(startup_data)},
                    ],
                    "max_tokens": 6000,
                    "temperature": 0.3,
                }
            )
        resp.raise_for_status()
        raw = resp.json()["choices"][0]["message"]["content"].strip()
        if raw.startswith("```"): raw = raw.split("\n", 1)[-1]
        if raw.endswith("```"):   raw = raw.rsplit("```", 1)[0]
        raw = raw.strip()
        if not raw.endswith("}"):
            last = raw.rfind("}")
            if last != -1: raw = raw[:last + 1]
        analysis = json.loads(raw)
        logger.info(f"✅ Analysis: {analysis.get('startup_name')}")
        return analysis

    async def generate(self, startup_data: dict) -> str:
        logger.info(f"🤖 Generating: {startup_data['startup_name']}")
        analysis = await self._analyze(startup_data)
        html     = self._fill_template(analysis)
        logger.info("✅ HTML built from template.")
        return html


class GitHubPagesDeployer:
    def __init__(self):
        if not GITHUB_TOKEN:    raise ValueError("GITHUB_TOKEN not set.")
        if not GITHUB_USERNAME: raise ValueError("GITHUB_USERNAME not set.")
        self.headers = {
            "Authorization":        f"Bearer {GITHUB_TOKEN}",
            "Accept":               "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        self.base = "https://api.github.com"

    async def _repo_exists(self, c):
        r = await c.get(f"{self.base}/repos/{GITHUB_USERNAME}/{GITHUB_REPO}", headers=self.headers)
        return r.status_code == 200

    async def _create_repo(self, c):
        logger.info(f"📁 Creating repo: {GITHUB_REPO}")
        r = await c.post(f"{self.base}/user/repos", headers=self.headers,
            json={"name": GITHUB_REPO, "description": "Auto-generated landing page", "private": False, "auto_init": True})
        r.raise_for_status()

    async def _get_sha(self, c) -> Optional[str]:
        r = await c.get(f"{self.base}/repos/{GITHUB_USERNAME}/{GITHUB_REPO}/contents/index.html", headers=self.headers)
        return r.json().get("sha") if r.status_code == 200 else None

    async def _push_html(self, c, html: str):
        logger.info("📤 Pushing index.html...")
        html_min = re.sub(r'>\s+<', '><', html)
        html_min = re.sub(r'\s{2,}', ' ', html_min)
        html_min = html_min.strip()
        encoded  = base64.b64encode(html_min.encode()).decode()
        sha      = await self._get_sha(c)
        payload  = {"message": "🚀 Auto-deploy", "content": encoded, "branch": "main"}
        if sha: payload["sha"] = sha
        r = await c.put(
            f"{self.base}/repos/{GITHUB_USERNAME}/{GITHUB_REPO}/contents/index.html",
            headers=self.headers, json=payload)
        r.raise_for_status()
        logger.info("✅ Pushed.")

    async def _enable_pages(self, c):
        r = await c.post(f"{self.base}/repos/{GITHUB_USERNAME}/{GITHUB_REPO}/pages",
            headers=self.headers, json={"source": {"branch": "main", "path": "/"}})
        if r.status_code not in (201, 409, 403):
            logger.warning(f"Pages: {r.status_code} {r.text}")

    async def deploy(self, html: str) -> str:
        async with httpx.AsyncClient(timeout=60.0) as c:
            if not await self._repo_exists(c): await self._create_repo(c)
            await self._push_html(c, html)
            await self._enable_pages(c)
        url = f"https://{GITHUB_USERNAME}.github.io/{GITHUB_REPO}/"
        logger.info(f"🚀 Live: {url}")
        return url


class AgenticLandingPageService:
    def __init__(self):
        self.extractor = StartupDataExtractor()
        self.generator = LandingPageGenerator()
        self.deployer  = GitHubPagesDeployer()

    async def run(self, structured_data: dict) -> dict:
        logger.info("🚀 Pipeline starting...")
        startup_data = self.extractor.extract(structured_data)
        html         = await self.generator.generate(startup_data)
        live_url     = await self.deployer.deploy(html)
        logger.info(f"✅ Live: {live_url}")
        return {
            "startup_name": startup_data["startup_name"],
            "live_url":     live_url,
            "html_preview": html[:500] + "...",
            "html_length":  len(html),
            "status":       "deployed",
        }