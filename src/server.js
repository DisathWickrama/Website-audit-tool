require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { scrapePage } = require('./scraper');
const { analyzePage } = require('./analyzer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // serves our frontend files

// ── Main audit endpoint ────────────────────────────────
app.post('/audit', async (req, res) => {
  const { url } = req.body;

  // Basic validation
  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ error: 'Please provide a valid URL starting with http/https' });
  }

  try {
    console.log(`\n[1/3] Scraping: ${url}`);
    const metrics = await scrapePage(url);
    console.log(`[2/3] Scraping complete. Sending to AI...`);

    const analysis = await analyzePage(metrics);
    console.log(`[3/3] AI analysis complete. Sending response.`);

    res.json({ metrics, analysis });

  } catch (err) {
    console.error('Audit error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n✅ Server running at http://localhost:${PORT}`);
});