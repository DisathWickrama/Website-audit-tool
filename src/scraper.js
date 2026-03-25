const axios = require('axios');
const cheerio = require('cheerio');

async function scrapePage(url) {
  // Fetch the raw HTML of the page
  const { data: html } = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AuditBot/1.0)' },
    timeout: 15000,
  });

  // Load HTML into cheerio (works like jQuery - lets us query the DOM)
  const $ = cheerio.load(html);

  // ── Meta ──────────────────────────────────────────────
  const metaTitle = $('title').first().text().trim();
  const metaDescription = $('meta[name="description"]').attr('content') || '';

  // ── Headings ──────────────────────────────────────────
  const h1 = $('h1').length;
  const h2 = $('h2').length;
  const h3 = $('h3').length;

  // ── Word count (visible text only) ────────────────────
  $('script, style, noscript').remove();       // strip non-visible tags
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const wordCount = bodyText.split(' ').filter(Boolean).length;

  // ── Links ─────────────────────────────────────────────
  const urlHost = new URL(url).hostname;
  let internalLinks = 0, externalLinks = 0;
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (href.startsWith('http')) {
      href.includes(urlHost) ? internalLinks++ : externalLinks++;
    } else if (href.startsWith('/') || href.startsWith('#')) {
      internalLinks++;
    }
  });

  // ── Images ────────────────────────────────────────────
  const totalImages = $('img').length;
  let missingAlt = 0;
  $('img').each((_, el) => {
    const alt = $(el).attr('alt');
    if (!alt || alt.trim() === '') missingAlt++;
  });
  const missingAltPercent = totalImages
    ? Math.round((missingAlt / totalImages) * 100)
    : 0;

  // ── CTAs (buttons + prominent links) ─────────────────
  const ctaCount =
    $('button').length +
    $('a').filter((_, el) => {
      const text = $(el).text().toLowerCase();
      return /get started|contact|buy|sign up|learn more|request|demo|free|download|start/i.test(text);
    }).length;

  // ── Page content snippet for AI context ───────────────
  const contentSnippet = bodyText.slice(0, 3000);

  return {
    url,
    metaTitle,
    metaDescription,
    headings: { h1, h2, h3 },
    wordCount,
    links: { internal: internalLinks, external: externalLinks },
    images: { total: totalImages, missingAltPercent },
    ctaCount,
    contentSnippet,
  };
}

module.exports = { scrapePage };