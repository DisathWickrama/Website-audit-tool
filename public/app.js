const auditBtn = document.getElementById('auditBtn');
const urlInput = document.getElementById('urlInput');
const loader = document.getElementById('loader');
const errorBox = document.getElementById('errorBox');
const results = document.getElementById('results');
const copyBtn = document.getElementById('copyBtn');

// Store last audit data for markdown export
let lastAuditData = null;

auditBtn.addEventListener('click', async () => {
  const url = urlInput.value.trim();
  if (!url) return;

  errorBox.classList.add('hidden');
  results.classList.add('hidden');
  loader.classList.remove('hidden');
  auditBtn.disabled = true;

  try {
    const response = await fetch('/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    lastAuditData = data;
    populateResults(data);
    results.classList.remove('hidden');

  } catch (err) {
    errorBox.textContent = '❌ ' + err.message;
    errorBox.classList.remove('hidden');
  } finally {
    loader.classList.add('hidden');
    auditBtn.disabled = false;
  }
});

// ── SEO Score Calculator ──────────────────────────────
function calculateScore(metrics) {
  const factors = [];

  // Word count (max 25 pts) - ideal is 800+
  const wcScore = Math.min(25, Math.round((metrics.wordCount / 800) * 25));
  factors.push({ label: 'Word Count', score: wcScore, max: 25 });

  // Alt text (max 25 pts) - penalize missing alt text
  const altScore = Math.round(((100 - metrics.images.missingAltPercent) / 100) * 25);
  factors.push({ label: 'Image Alt Text', score: altScore, max: 25 });

  // Headings structure (max 20 pts) - H1 should exist, H2s good
  const h1Score = metrics.headings.h1 === 1 ? 10 : (metrics.headings.h1 === 0 ? 0 : 5);
  const h2Score = Math.min(10, metrics.headings.h2 * 2);
  factors.push({ label: 'Heading Structure', score: h1Score + h2Score, max: 20 });

  // Internal links (max 15 pts) - more is generally better up to a point
  const linkScore = Math.min(15, Math.round((metrics.links.internal / 20) * 15));
  factors.push({ label: 'Internal Links', score: linkScore, max: 15 });

  // CTA count (max 15 pts) - 3-7 is ideal
  const cta = metrics.ctaCount;
  const ctaScore = cta >= 3 && cta <= 7 ? 15 : cta > 0 ? 8 : 0;
  factors.push({ label: 'CTA Presence', score: ctaScore, max: 15 });

  const total = factors.reduce((sum, f) => sum + f.score, 0);
  return { total, factors };
}

function getScoreLabel(score) {
  if (score >= 80) return { label: 'Excellent', color: '#22c55e' };
  if (score >= 60) return { label: 'Good', color: '#3b82f6' };
  if (score >= 40) return { label: 'Needs Work', color: '#f97316' };
  return { label: 'Poor', color: '#ef4444' };
}

function renderScore(metrics) {
  const { total, factors } = calculateScore(metrics);
  const { label, color } = getScoreLabel(total);

  // Animate number
  const numEl = document.getElementById('scoreNumber');
  let current = 0;
  const step = total / 40;
  const interval = setInterval(() => {
    current = Math.min(total, current + step);
    numEl.textContent = Math.round(current);
    if (current >= total) clearInterval(interval);
  }, 20);

  // Animate ring
  const ring = document.getElementById('scoreRing');
  const circumference = 289;
  const offset = circumference - (total / 100) * circumference;
  ring.style.stroke = color;
  setTimeout(() => { ring.style.strokeDashoffset = offset; }, 50);

  // Label and description
  document.getElementById('scoreLabel').textContent = `${label} · ${total}/100`;
  document.getElementById('scoreDescription').textContent =
    total >= 80 ? 'This page is well-optimized. Minor improvements could push it further.' :
    total >= 60 ? 'Solid foundation with clear areas to improve.' :
    total >= 40 ? 'Several important SEO issues need attention.' :
    'This page has significant SEO issues that should be addressed urgently.';

  // Factor bars
  const factorsEl = document.getElementById('scoreFactors');
  factorsEl.innerHTML = factors.map(f => `
    <div class="factor">
      <span class="factor-label">${f.label}</span>
      <div class="factor-bar-wrap">
        <div class="factor-bar" style="width:${(f.score/f.max)*100}%"></div>
      </div>
      <span class="factor-score">${f.score}/${f.max}</span>
    </div>
  `).join('');
}

// ── Priority Badge Helper ─────────────────────────────
function getBadge(priority) {
  if (priority <= 2) return '<span class="priority-badge badge-high">High</span>';
  if (priority === 3) return '<span class="priority-badge badge-medium">Medium</span>';
  return '<span class="priority-badge badge-low">Low</span>';
}

// ── Populate All Results ──────────────────────────────
function populateResults({ metrics, analysis }) {
  // Metrics
  document.getElementById('metaTitle').textContent = metrics.metaTitle || '(none)';
  document.getElementById('metaDesc').textContent = metrics.metaDescription || '(none)';
  document.getElementById('wordCount').textContent = metrics.wordCount.toLocaleString() + ' words';
  document.getElementById('headings').textContent =
    `${metrics.headings.h1} / ${metrics.headings.h2} / ${metrics.headings.h3}`;
  document.getElementById('internalLinks').textContent = metrics.links.internal;
  document.getElementById('externalLinks').textContent = metrics.links.external;
  document.getElementById('totalImages').textContent = metrics.images.total;
  document.getElementById('missingAlt').textContent = metrics.images.missingAltPercent + '%';
  document.getElementById('ctaCount').textContent = metrics.ctaCount;

  // Score
  renderScore(metrics);

  // Insights
  document.getElementById('seoInsight').textContent = analysis.insights.seo;
  document.getElementById('messagingInsight').textContent = analysis.insights.messaging;
  document.getElementById('ctaInsight').textContent = analysis.insights.cta;
  document.getElementById('contentInsight').textContent = analysis.insights.content_depth;
  document.getElementById('uxInsight').textContent = analysis.insights.ux_concerns;

  // Recommendations with colored badges
  const recList = document.getElementById('recList');
  recList.innerHTML = analysis.recommendations.map(rec => `
    <div class="rec-item">
      ${getBadge(rec.priority)}
      <div class="rec-content">
        <strong>${rec.title}</strong>
        <p>${rec.reasoning}</p>
      </div>
    </div>
  `).join('');

  // Prompt Logs
  document.getElementById('logSystem').textContent = analysis.promptLog.systemContext;
  document.getElementById('logUser').textContent = analysis.promptLog.userPrompt;
  document.getElementById('logRaw').textContent = analysis.promptLog.rawModelOutput;
  document.getElementById('promptLogCard').style.display = 'block';
}

// ── Copy as Markdown ──────────────────────────────────
copyBtn.addEventListener('click', () => {
  if (!lastAuditData) return;
  const { metrics, analysis } = lastAuditData;
  const { total } = calculateScore(metrics);

  const md = `# Website Audit Report
**URL:** ${metrics.url}
**SEO Health Score:** ${total}/100

## Factual Metrics
| Metric | Value |
|---|---|
| Meta Title | ${metrics.metaTitle} |
| Meta Description | ${metrics.metaDescription} |
| Word Count | ${metrics.wordCount} |
| Headings (H1/H2/H3) | ${metrics.headings.h1}/${metrics.headings.h2}/${metrics.headings.h3} |
| Internal Links | ${metrics.links.internal} |
| External Links | ${metrics.links.external} |
| Total Images | ${metrics.images.total} |
| Missing Alt Text | ${metrics.images.missingAltPercent}% |
| CTAs Found | ${metrics.ctaCount} |

## AI Insights
**SEO Structure:** ${analysis.insights.seo}

**Messaging Clarity:** ${analysis.insights.messaging}

**CTA Usage:** ${analysis.insights.cta}

**Content Depth:** ${analysis.insights.content_depth}

**UX Concerns:** ${analysis.insights.ux_concerns}

## Recommendations
${analysis.recommendations.map(r => `${r.priority}. **${r.title}** — ${r.reasoning}`).join('\n')}

---
*Generated by AuditTool · Built by Disath Wickrama*`;

  navigator.clipboard.writeText(md).then(() => {
    copyBtn.textContent = '✅ Copied!';
    copyBtn.classList.add('copied');
    setTimeout(() => {
      copyBtn.textContent = '📋 Copy as Markdown';
      copyBtn.classList.remove('copied');
    }, 2000);
  });
});