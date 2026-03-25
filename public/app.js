const auditBtn = document.getElementById('auditBtn');
const urlInput = document.getElementById('urlInput');
const loader = document.getElementById('loader');
const errorBox = document.getElementById('errorBox');
const results = document.getElementById('results');

auditBtn.addEventListener('click', async () => {
  const url = urlInput.value.trim();
  if (!url) return;

  // Reset UI
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

function populateResults({ metrics, analysis }) {
  // Metrics
  document.getElementById('metaTitle').textContent = metrics.metaTitle || '(none)';
  document.getElementById('metaDesc').textContent = metrics.metaDescription || '(none)';
  document.getElementById('wordCount').textContent = metrics.wordCount.toLocaleString();
  document.getElementById('headings').textContent =
    `${metrics.headings.h1} / ${metrics.headings.h2} / ${metrics.headings.h3}`;
  document.getElementById('internalLinks').textContent = metrics.links.internal;
  document.getElementById('externalLinks').textContent = metrics.links.external;
  document.getElementById('totalImages').textContent = metrics.images.total;
  document.getElementById('missingAlt').textContent = metrics.images.missingAltPercent + '%';
  document.getElementById('ctaCount').textContent = metrics.ctaCount;

  // AI Insights
  document.getElementById('seoInsight').textContent = analysis.insights.seo;
  document.getElementById('messagingInsight').textContent = analysis.insights.messaging;
  document.getElementById('ctaInsight').textContent = analysis.insights.cta;
  document.getElementById('contentInsight').textContent = analysis.insights.content_depth;
  document.getElementById('uxInsight').textContent = analysis.insights.ux_concerns;

  // Recommendations
  const list = document.getElementById('recommendationsList');
  list.innerHTML = '';
  analysis.recommendations.forEach(rec => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${rec.title}</strong> — ${rec.reasoning}`;
    list.appendChild(li);
  });
}