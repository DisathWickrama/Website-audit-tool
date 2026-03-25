# 🔍 Website Audit Tool

An AI-powered webpage analyzer built for EIGHT25MEDIA's technical assessment. 
Accepts a single URL, extracts factual metrics via scraping, and generates 
structured insights using Google Gemini AI.

## 🚀 Live Demo
https://website-audit-tool-production-f16a.up.railway.app

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18+
- A Google Gemini API key (free at https://aistudio.google.com)

### Steps
```bash
git clone https://github.com/DisathWickrama/website-audit-tool.git
cd website-audit-tool
npm install
```

Create a `.env` file in the root:
```
GEMINI_API_KEY=your-key-here
```

Start the server:
```bash
npm start
```

Visit **http://localhost:3000** in your browser.

---

## 🏗️ Architecture Overview
```
┌─────────────────┐       POST /audit        ┌──────────────────────┐
│   Browser UI    │ ──────────────────────►  │   Express Server     │
│  (public/)      │ ◄──────────────────────  │   (src/server.js)    │
└─────────────────┘     JSON response         └──────────┬───────────┘
                                                         │
                                          ┌──────────────▼───────────────┐
                                          │       src/scraper.js         │
                                          │  axios + cheerio             │
                                          │  Extracts: headings, links,  │
                                          │  images, CTAs, word count    │
                                          └──────────────┬───────────────┘
                                                         │ structured metrics
                                          ┌──────────────▼───────────────┐
                                          │       src/analyzer.js        │
                                          │  Google Gemini Flash         │
                                          │  Returns: insights +         │
                                          │  recommendations as JSON     │
                                          └──────────────────────────────┘
```

**Three clear layers:**
- **Scraping layer** (`scraper.js`) — pure data extraction, no AI involved
- **AI layer** (`analyzer.js`) — receives structured metrics, returns structured JSON
- **Server layer** (`server.js`) — orchestrates the pipeline, serves the frontend

---

## 🤖 AI Design Decisions

### 1. Metrics-first, AI-second
The scraper runs completely independently of the AI. Raw factual data is extracted 
first, then passed as structured input to the model. This ensures AI insights are 
always grounded in real numbers — not hallucinated.

### 2. Structured prompt design
The prompt explicitly provides all metrics in a labeled format and demands a strict 
JSON response schema. This prevents the model from returning vague or generic advice 
and makes the output reliably parseable.

### 3. System + user prompt separation
A system prompt establishes the AI's persona (senior web strategist), while the user 
prompt delivers the data. This separation improves response consistency and quality.

### 4. Prompt logs as first-class output
Every API response includes the exact system prompt, user prompt, and raw model 
output attached to the response. This provides full transparency into the AI layer.

---

## ⚖️ Trade-offs

| Decision | Trade-off |
|---|---|
| Cheerio over Puppeteer | Faster and lighter, but can't scrape JS-rendered pages |
| Single-page only | Keeps scope focused; multi-page crawling would need a queue system |
| Gemini Flash model | Free tier available; GPT-4 would give richer insights but costs more |
| Vanilla JS frontend | No build step needed; React would offer better state management at scale |
| No caching | Every audit hits the AI API; caching repeated URLs would reduce cost |

---

## 🔮 What I'd Improve With More Time

1. **Puppeteer support** — Handle JS-rendered SPAs (React/Next.js sites) which Cheerio can't scrape accurately
2. **PDF/CSV export** — Let users download the audit report
3. **Audit history** — Store past audits in a database (SQLite/Postgres) for comparison
4. **Multi-page crawling** — Crawl up to 5 pages and aggregate insights
5. **Performance metrics** — Integrate Lighthouse API for Core Web Vitals data
6. **Competitor comparison** — Audit two URLs side by side

---

## 📋 Prompt Logs

Every audit response includes a `promptLog` field in the JSON with:
- `systemContext` — the persona/role given to the AI
- `userPrompt` — the full structured prompt including all metrics
- `rawModelOutput` — the unformatted response directly from Gemini

These are visible directly in the UI under the "🧾 Prompt Logs" 
section after running an audit, with collapsible panels for each.

---

## 🛠️ Tech Stack

- **Backend:** Node.js + Express
- **Scraping:** Axios + Cheerio
- **AI:** Google Gemini Flash (via `@google/generative-ai`)
- **Frontend:** Vanilla HTML, CSS, JavaScript
- **Deployment:** Railway.app