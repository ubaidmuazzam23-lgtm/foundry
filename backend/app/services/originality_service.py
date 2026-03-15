# File: backend/app/services/originality_service.py
import os
import json
import numpy as np
import pickle
import csv
import io
import urllib.request
from pathlib import Path
from typing import Optional
from groq import Groq
from app.utils.logger import logger

FAISS_INDEX_PATH = Path("app/data/startup_index.faiss")
METADATA_PATH    = Path("app/data/startup_metadata.pkl")


class OriginalityService:
    def __init__(self):
        self.model       = None
        self.index       = None
        self.metadata    = None
        self.groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self._load_or_build_index()

    def _load_model(self):
        if self.model is None:
            logger.info("📦 Loading sentence-transformer model...")
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("✅ Model loaded.")

    def _load_or_build_index(self):
        if FAISS_INDEX_PATH.exists() and METADATA_PATH.exists():
            logger.info("📂 Loading existing FAISS index...")
            import faiss
            self.index = faiss.read_index(str(FAISS_INDEX_PATH))
            with open(METADATA_PATH, "rb") as f:
                self.metadata = pickle.load(f)
            logger.info(f"✅ Index loaded: {self.index.ntotal} startups")
        else:
            logger.info("🏗️ Building FAISS index from dataset...")
            self._build_index()

    def _build_index(self):
        import faiss
        from datasets import load_dataset

        self._load_model()

        texts, names, fields = None, None, None

        # Attempt 1: miulab company descriptions
        try:
            logger.info("📥 Trying miulab/company-descriptions...")
            ds     = load_dataset("miulab/company-descriptions", split="train")
            texts  = [f"{row.get('company_name','')} {row.get('description','')}" for row in ds]
            names  = [str(row.get('company_name', f'Company {i}')) for i, row in enumerate(ds)]
            fields = [str(row.get('industry', 'Technology')) for row in ds]
            logger.info(f"✅ Loaded {len(texts)} companies")
        except Exception as e:
            logger.warning(f"Attempt 1 failed: {e}")

        # Attempt 2: awacke1 startups and funding
        if not texts:
            try:
                logger.info("📥 Trying awacke1/startups-and-funding...")
                ds     = load_dataset("awacke1/startups-and-funding", split="train")
                texts  = [f"{row.get('name','')} {row.get('description','')}" for row in ds]
                names  = [str(row.get('name', f'Startup {i}')) for i, row in enumerate(ds)]
                fields = [str(row.get('category_list', 'Technology')) for row in ds]
                logger.info(f"✅ Loaded {len(texts)} startups")
            except Exception as e:
                logger.warning(f"Attempt 2 failed: {e}")

        # Attempt 3: GitHub CSV mirrors
        if not texts:
            csv_urls = [
                "https://raw.githubusercontent.com/notpeter/crunchbase-data/master/companies.csv",
                "https://raw.githubusercontent.com/sdorius/globant-data-science/master/resources/startups.csv",
                "https://raw.githubusercontent.com/priya-dwivedi/Deep-Learning/master/startup_name_generator/startup_data.csv",
            ]
            for url in csv_urls:
                try:
                    logger.info(f"📥 Trying CSV: {url}")
                    req     = urllib.request.urlopen(url, timeout=15)
                    content = req.read().decode("utf-8", errors="ignore")
                    reader  = csv.DictReader(io.StringIO(content))
                    rows    = list(reader)
                    if not rows:
                        continue
                    sample   = rows[0]
                    name_col = next((k for k in sample if 'name' in k.lower()), list(sample.keys())[0])
                    desc_col = next((k for k in sample if any(x in k.lower() for x in ['desc', 'about', 'summary', 'overview', 'short'])), None)
                    cat_col  = next((k for k in sample if any(x in k.lower() for x in ['cat', 'sector', 'industry', 'type', 'market'])), None)
                    texts  = [f"{r.get(name_col,'')} {r.get(desc_col,'') if desc_col else ''}" for r in rows]
                    names  = [r.get(name_col, f'Company {i}') for i, r in enumerate(rows)]
                    fields = [r.get(cat_col, 'Technology') if cat_col else 'Technology' for r in rows]
                    logger.info(f"✅ Loaded {len(texts)} companies from CSV")
                    break
                except Exception as e:
                    logger.warning(f"CSV {url} failed: {e}")

        # Attempt 4: Wikipedia streaming (tech companies)
        if not texts:
            try:
                logger.info("📥 Trying Wikipedia streaming for company articles...")
                from datasets import load_dataset
                ds   = load_dataset("wikipedia", "20220301.en", split="train", streaming=True)
                rows = []
                keywords = ['startup', 'company', 'platform', 'software', 'app', 'founded', 'inc.', 'ltd', 'corporation']
                for row in ds:
                    snippet = row.get('text', '')[:300].lower()
                    if any(kw in snippet for kw in keywords):
                        rows.append(row)
                    if len(rows) >= 10000:
                        break
                texts  = [r.get('text', '')[:300] for r in rows]
                names  = [r.get('title', f'Company {i}') for i, r in enumerate(rows)]
                fields = ['Technology'] * len(rows)
                logger.info(f"✅ Loaded {len(texts)} Wikipedia company articles")
            except Exception as e:
                logger.warning(f"Attempt 4 failed: {e}")

        # Attempt 5: Hugging Face Hub search dataset
        if not texts:
            try:
                logger.info("📥 Trying cc_news dataset for company mentions...")
                from datasets import load_dataset
                ds   = load_dataset("cc_news", split="train", streaming=True)
                rows = []
                for row in ds:
                    if any(kw in row.get('title','').lower() for kw in ['startup', 'raises', 'funding', 'launches', 'platform', 'app']):
                        rows.append(row)
                    if len(rows) >= 5000:
                        break
                texts  = [f"{r.get('title','')} {r.get('description','')}" for r in rows]
                names  = [r.get('title', f'Company {i}') for i, r in enumerate(rows)]
                fields = ['Technology'] * len(rows)
                logger.info(f"✅ Loaded {len(texts)} news articles about startups")
            except Exception as e:
                logger.warning(f"Attempt 5 failed: {e}")

        # Final fallback: expanded synthetic data
        if not texts or len(texts) < 10:
            logger.warning("All real datasets failed — using expanded synthetic fallback")
            texts, names, fields = self._generate_fallback_data()

        # Clean empty rows
        combined = [(t, n, f) for t, n, f in zip(texts, names, fields) if t and len(str(t).strip()) > 10]
        texts  = [x[0] for x in combined]
        names  = [x[1] for x in combined]
        fields = [x[2] for x in combined]

        cap = min(len(texts), 10000)
        logger.info(f"🔢 Encoding {cap} startup descriptions...")
        embeddings = self.model.encode(
            texts[:cap],
            batch_size=128,
            show_progress_bar=True,
            convert_to_numpy=True
        ).astype("float32")
        faiss.normalize_L2(embeddings)

        dim   = embeddings.shape[1]
        index = faiss.IndexFlatIP(dim)
        index.add(embeddings)

        FAISS_INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)
        faiss.write_index(index, str(FAISS_INDEX_PATH))

        metadata = {
            "names":  names[:cap],
            "fields": fields[:cap],
            "texts":  texts[:cap],
        }
        with open(METADATA_PATH, "wb") as f:
            pickle.dump(metadata, f)

        self.index    = index
        self.metadata = metadata
        logger.info(f"✅ Index built: {index.ntotal} startups")

    def _generate_fallback_data(self):
        startups = [
            ("Duolingo",         "EdTech",        "Language learning app with gamification and AI-powered lessons for students worldwide"),
            ("Byju's",           "EdTech",        "AI tutoring platform for K-12 students in India with video lessons and adaptive learning"),
            ("Coursera",         "EdTech",        "Online learning platform with university courses and professional certificates"),
            ("Unacademy",        "EdTech",        "Online learning platform for competitive exam preparation in India"),
            ("PhysicsWallah",    "EdTech",        "Affordable online coaching for JEE and NEET students in Hindi language"),
            ("Chegg",            "EdTech",        "Student platform for homework help, tutoring, textbook rentals and study resources"),
            ("Brainly",          "EdTech",        "Peer-to-peer learning community where students answer each other's homework questions"),
            ("Khan Academy",     "EdTech",        "Free online education platform with courses and exercises for all ages"),
            ("Vedantu",          "EdTech",        "Live online tutoring platform connecting students with expert teachers in India"),
            ("Toppr",            "EdTech",        "Adaptive learning app for competitive exam preparation with personalized study plans"),
            ("DoubtNut",         "EdTech",        "Photo-based doubt solving app for students in India using AI and human tutors"),
            ("Embibe",           "EdTech",        "AI-powered test preparation platform for students with personalized feedback"),
            ("Testbook",         "EdTech",        "Online test preparation platform for government job exams in India"),
            ("Simplilearn",      "EdTech",        "Professional certification and online bootcamp platform for tech skills"),
            ("upGrad",           "EdTech",        "Higher education platform for working professionals with MBA and tech courses"),
            ("Stripe",           "FinTech",       "Payment processing API for developers to accept online payments globally"),
            ("Razorpay",         "FinTech",       "Payment gateway for Indian businesses with UPI, cards and banking support"),
            ("Zerodha",          "FinTech",       "Discount stock broker platform for retail investors in India"),
            ("CRED",             "FinTech",       "Credit card bill payment app with rewards for users with good credit scores"),
            ("Groww",            "FinTech",       "Investment app for mutual funds and stocks targeted at first-time investors"),
            ("Paytm",            "FinTech",       "Digital payments and financial services super app for India"),
            ("PhonePe",          "FinTech",       "UPI-based digital payments app for India with insurance and investments"),
            ("BharatPe",         "FinTech",       "Payment acceptance and lending platform for small merchants in India"),
            ("Jupiter",          "FinTech",       "Digital banking and savings platform for millennials in India"),
            ("Fi Money",         "FinTech",       "Smart salary account and financial management app for young professionals"),
            ("Swiggy",           "FoodTech",      "Food delivery platform connecting restaurants with customers via mobile app"),
            ("Zomato",           "FoodTech",      "Restaurant discovery and food delivery platform with reviews and ratings"),
            ("Uber Eats",        "FoodTech",      "Food delivery service integrated with ride-sharing for urban customers"),
            ("Rebel Foods",      "FoodTech",      "Cloud kitchen operator with multiple virtual restaurant brands in India"),
            ("Box8",             "FoodTech",      "Indian meal delivery platform with focus on dabbas and healthy food"),
            ("Uber",             "Transport",     "Ride-hailing app connecting drivers with passengers using GPS and dynamic pricing"),
            ("Ola",              "Transport",     "Indian ride-sharing platform with auto, cab and electric vehicle booking"),
            ("Rapido",           "Transport",     "Bike taxi and auto booking app for affordable last-mile urban transport"),
            ("Yulu",             "Transport",     "Electric bicycle sharing platform for sustainable urban commuting in India"),
            ("Bounce",           "Transport",     "Dockless scooter and bike rental platform for urban mobility in India"),
            ("Notion",           "Productivity",  "All-in-one workspace for notes, docs, wikis, databases and project management"),
            ("Slack",            "Productivity",  "Team messaging and collaboration platform with channel-based communication"),
            ("Asana",            "Productivity",  "Project management and team collaboration tool for tracking work and deadlines"),
            ("Figma",            "Design",        "Collaborative UI and UX design tool for product teams with real-time editing"),
            ("Canva",            "Design",        "Graphic design platform for non-designers with drag-and-drop templates"),
            ("Shopify",          "E-commerce",    "E-commerce platform for businesses to build and manage online stores"),
            ("Meesho",           "E-commerce",    "Social commerce platform enabling small sellers to sell via WhatsApp in India"),
            ("Nykaa",            "E-commerce",    "Beauty and fashion e-commerce platform for women in India with own brands"),
            ("Myntra",           "E-commerce",    "Fashion e-commerce platform for clothing, accessories and lifestyle products"),
            ("Flipkart",         "E-commerce",    "Indian e-commerce marketplace for electronics, fashion and daily essentials"),
            ("Healthify Me",     "HealthTech",    "AI nutrition coach and fitness tracking app with personalized diet plans"),
            ("Practo",           "HealthTech",    "Online doctor consultation and medical appointment booking platform"),
            ("1mg",              "HealthTech",    "Online pharmacy and healthcare platform for medicine delivery and lab tests"),
            ("Cult.fit",         "HealthTech",    "Fitness and wellness platform combining gym, yoga and online workout classes"),
            ("Portea Medical",   "HealthTech",    "Home healthcare services platform connecting patients with nurses and doctors"),
            ("Urban Company",    "Services",      "Home services marketplace connecting verified professionals with customers"),
            ("Housejoy",         "Services",      "On-demand home services platform for repairs, cleaning and beauty"),
            ("Postman",          "DevTools",      "API development and testing platform used by millions of developers worldwide"),
            ("BrowserStack",     "DevTools",      "Cloud-based cross-browser and mobile app testing platform for developers"),
            ("Freshworks",       "SaaS",          "Customer support, CRM and ITSM software suite for businesses of all sizes"),
            ("Zoho",             "SaaS",          "Business software suite with over 50 apps including CRM, HR and finance"),
            ("Chargebee",        "SaaS",          "Subscription billing and revenue management platform for SaaS businesses"),
            ("Clevertap",        "SaaS",          "Customer engagement and retention platform for mobile and web apps"),
            ("OYO",              "HospTech",      "Budget hotel aggregator and hospitality management platform across Asia"),
            ("MakeMyTrip",       "Travel",        "Online travel booking platform for flights, hotels and holiday packages"),
            ("Airbnb",           "Travel",        "Home sharing and short-term rental marketplace connecting hosts with travelers"),
            ("Treebo",           "Travel",        "Budget hotel brand offering standardized quality stays across India"),
            ("BigBasket",        "Grocery",       "Online grocery delivery platform with fresh produce and daily essentials"),
            ("Blinkit",          "Grocery",       "10-minute grocery and essentials delivery platform for urban India"),
            ("Zepto",            "Grocery",       "Quick commerce startup delivering groceries in 10 minutes using dark stores"),
            ("Dunzo",            "Delivery",      "Hyperlocal delivery app for groceries, medicines and essentials in India"),
            ("Delhivery",        "Logistics",     "Technology-driven logistics and supply chain platform for e-commerce businesses"),
            ("Shiprocket",       "Logistics",     "Shipping aggregator platform for D2C brands and small e-commerce sellers"),
            ("Licious",          "FoodTech",      "Online meat and seafood delivery platform with quality-assured fresh products"),
            ("Country Delight",  "FoodTech",      "Farm-to-home milk and dairy products delivery platform in India"),
            ("Noise",            "Consumer Tech", "Indian wearable brand offering smartwatches and earbuds at affordable prices"),
            ("boAt",             "Consumer Tech", "Lifestyle brand for audio products and wearables targeting Indian millennials"),
            ("Open",             "FinTech",       "Neobank and business banking platform for SMEs and startups in India"),
            ("Khatabook",        "FinTech",       "Digital ledger app for small business owners to track credit and payments"),
            ("OkCredit",         "FinTech",       "Digital account book for small merchants to manage customer credit records"),
            ("Spinny",           "AutoTech",      "Used car buying and selling platform with quality assurance and fixed prices"),
            ("Cars24",           "AutoTech",      "Online platform for selling used cars with instant price and doorstep pickup"),
            ("DriveU",           "Services",      "On-demand professional driver service for personal and corporate use"),
            ("Furlenco",         "Rental",        "Furniture rental and subscription platform for urban millennials in India"),
            ("RentoMojo",        "Rental",        "Appliance and furniture rental platform for students and young professionals"),
            ("Vedantu",          "EdTech",        "LIVE online tutoring platform for K-12 students with top teachers"),
            ("Classplus",        "EdTech",        "Platform for tutors and coaching centers to build their own branded app"),
            ("Teachmint",        "EdTech",        "Teaching infrastructure platform for schools and individual educators in India"),
            ("Scaler",           "EdTech",        "Tech skills and coding bootcamp platform for software engineers in India"),
            ("InterviewBit",     "EdTech",        "Coding interview preparation platform for software engineering job seekers"),
            ("HackerRank",       "EdTech",        "Technical skill assessment and coding challenge platform for developers"),
            ("LeetCode",         "EdTech",        "Online coding practice platform for technical interview preparation"),
            ("GitHub",           "DevTools",      "Code hosting and collaboration platform for software developers worldwide"),
            ("GitLab",           "DevTools",      "DevOps platform combining source code management and CI/CD pipelines"),
            ("Vercel",           "DevTools",      "Frontend cloud platform for deploying and scaling web applications"),
            ("Netlify",          "DevTools",      "Web development platform for building and deploying modern web projects"),
            ("Supabase",         "DevTools",      "Open source Firebase alternative with Postgres database and authentication"),
            ("PlanetScale",      "DevTools",      "Serverless MySQL database platform with branching for developer workflows"),
            ("Railway",          "DevTools",      "Infrastructure platform for deploying full-stack apps with zero configuration"),
            ("Render",           "DevTools",      "Cloud platform for deploying and scaling web services and databases"),
            ("Linear",           "Productivity",  "Issue tracking and project management tool built for modern software teams"),
            ("Loom",             "Productivity",  "Video messaging platform for async communication and screen recording"),
            ("Miro",             "Productivity",  "Online collaborative whiteboard platform for distributed teams"),
            ("Airtable",         "Productivity",  "Low-code platform combining spreadsheet and database for business workflows"),
            ("Monday.com",       "Productivity",  "Work operating system for teams to manage projects and workflows"),
            ("ClickUp",          "Productivity",  "All-in-one productivity platform replacing multiple work management tools"),
        ]
        # Repeat to get ~1000 entries
        extended = startups * 10
        texts  = [f"{name} {field} {desc}" for name, field, desc in extended][:1000]
        names  = [name  for name, _,     _ in extended][:1000]
        fields = [field for _,    field, _ in extended][:1000]
        return texts, names, fields

    def _encode(self, text: str) -> np.ndarray:
        import faiss
        self._load_model()
        vec = self.model.encode([text], convert_to_numpy=True).astype("float32")
        faiss.normalize_L2(vec)
        return vec

    def _search(self, vec: np.ndarray, top_k: int = 5):
        scores, indices = self.index.search(vec, top_k)
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0:
                continue
            results.append({
                "name":       self.metadata["names"][idx],
                "field":      self.metadata["fields"][idx],
                "similarity": round(float(score) * 100, 1),
                "snippet":    self.metadata["texts"][idx][:120],
            })
        return results

    def _llama_analyze(self, idea: str, matches: list) -> dict:
        matches_text = "\n".join([
            f"- {m['name']} ({m['field']}): {m['similarity']}% similarity — {m['snippet']}"
            for m in matches
        ])

        prompt = f"""You are an expert startup analyst evaluating idea originality.

SUBMITTED IDEA:
"{idea}"

MOST SIMILAR EXISTING STARTUPS FOUND:
{matches_text}

Based on these matches, evaluate the originality of the submitted idea.

Return ONLY valid JSON:
{{
  "originality_score": <integer 0-100>,
  "verdict": "<one of: Highly Original / Moderately Original / Similar to Existing / Very Similar>",
  "reasoning": "<2-3 sentences explaining why this score, specific to this idea>",
  "differentiators": ["<what makes this idea different from matches>", "<another differentiator>"],
  "risk": "<one sentence about market entry risk given these competitors>",
  "recommendation": "<one actionable sentence for the founder>"
}}

Scoring guide:
- 85-100: No close matches, truly novel concept
- 65-84: Some overlap but meaningful differentiation
- 40-64: Similar to existing players, needs strong differentiation
- 0-39: Very similar to established startups, high competition risk

JSON:"""

        try:
            response = self.groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=800
            )
            raw = response.choices[0].message.content.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            return json.loads(raw.strip())
        except Exception as e:
            logger.error(f"Llama analysis error: {e}")
            top_sim = matches[0]["similarity"] if matches else 50
            score   = max(0, min(100, int(100 - top_sim)))
            return {
                "originality_score": score,
                "verdict":           "Moderately Original",
                "reasoning":         "Automated analysis unavailable. Score based on similarity search.",
                "differentiators":   ["Manual review recommended"],
                "risk":              "Unknown — review similar startups manually.",
                "recommendation":    "Review the similar startups listed and identify your key differentiator.",
            }

    async def score(self, idea_text: str, idea_id: Optional[int] = None) -> dict:
        logger.info(f"🔍 Scoring originality for idea: {idea_text[:80]}...")
        vec      = self._encode(idea_text)
        matches  = self._search(vec, top_k=5)
        analysis = self._llama_analyze(idea_text, matches)

        result = {
            "idea_id":           idea_id,
            "originality_score": analysis.get("originality_score", 70),
            "verdict":           analysis.get("verdict", "Moderately Original"),
            "reasoning":         analysis.get("reasoning", ""),
            "differentiators":   analysis.get("differentiators", []),
            "risk":              analysis.get("risk", ""),
            "recommendation":    analysis.get("recommendation", ""),
            "similar_startups":  matches[:3],
            "top_match":         matches[0] if matches else None,
        }

        logger.info(f"✅ Originality score: {result['originality_score']}/100 — {result['verdict']}")
        return result