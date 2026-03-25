const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function analyzePage(metrics) {
  const systemContext = `You are a senior web strategist at a marketing agency specializing in 
SEO, conversion optimization, and UX. You analyze webpages and provide specific, 
data-driven insights. Always reference the exact metrics provided. Never give generic advice.`;

  const userPrompt = `
Analyze this webpage audit data and return a JSON object only (no markdown, no extra text).

FACTUAL METRICS:
- URL: ${metrics.url}
- Meta Title: "${metrics.metaTitle}"
- Meta Description: "${metrics.metaDescription}"
- Word Count: ${metrics.wordCount}
- Headings: H1=${metrics.headings.h1}, H2=${metrics.headings.h2}, H3=${metrics.headings.h3}
- Internal Links: ${metrics.links.internal}, External Links: ${metrics.links.external}
- Total Images: ${metrics.images.total}, Missing Alt Text: ${metrics.images.missingAltPercent}%
- CTA Count: ${metrics.ctaCount}

PAGE CONTENT SAMPLE:
${metrics.contentSnippet}

Return this exact JSON structure:
{
  "insights": {
    "seo": "2-3 sentences grounded in the metrics above",
    "messaging": "2-3 sentences grounded in the metrics above",
    "cta": "2-3 sentences grounded in the metrics above",
    "content_depth": "2-3 sentences grounded in the metrics above",
    "ux_concerns": "2-3 sentences grounded in the metrics above"
  },
  "recommendations": [
    { "priority": 1, "title": "Short title", "reasoning": "Specific reasoning tied to metrics" },
    { "priority": 2, "title": "Short title", "reasoning": "Specific reasoning tied to metrics" },
    { "priority": 3, "title": "Short title", "reasoning": "Specific reasoning tied to metrics" },
    { "priority": 4, "title": "Short title", "reasoning": "Specific reasoning tied to metrics" },
    { "priority": 5, "title": "Short title", "reasoning": "Specific reasoning tied to metrics" }
  ]
}`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    system: systemContext,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const rawText = response.content[0].text;
  const cleaned = rawText.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(cleaned);

  // Attach prompt logs (required deliverable!)
  parsed.promptLog = {
    systemContext,
    userPrompt,
    rawModelOutput: rawText,
  };

  return parsed;
}

module.exports = { analyzePage };