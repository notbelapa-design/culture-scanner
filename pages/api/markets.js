/**
 * API route that fetches Polymarket market data, computes an
 * attention score and returns the top markets sorted by score.
 *
 * The data is fetched from the public Gamma API provided by
 * Polymarket: https://gamma-api.polymarket.com/markets
 * Each market entry contains fields for volume and price change
 * used in our simple scoring function【760619788126338†L146-L204】.
 */

import { NextResponse } from 'next/server';

// Helper to parse numeric strings safely
function toNumber(value) {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

export default async function handler(req, res) {
  try {
    const url = 'https://gamma-api.polymarket.com/markets';
    const response = await fetch(url, {
      headers: { 'Cache-Control': 'no-cache' },
    });
    const markets = await response.json();
    // Optional query parameters to weight volume and price change
    const volumeWeight = req.query.volumeWeight
      ? parseFloat(req.query.volumeWeight)
      : 1;
    const priceWeight = req.query.priceWeight
      ? parseFloat(req.query.priceWeight)
      : 1;
    // Process markets: compute attention score and normalise fields
    const processed = markets.map((m) => {
      const volume = toNumber(m.volume24hr ?? m.volume1wk ?? m.volumeNum ?? 0);
      const priceChange = Math.abs(
        toNumber(m.oneDayPriceChange ?? m.oneHourPriceChange ?? 0),
      );
      const attention = (volume * volumeWeight) * (priceChange * priceWeight);
      const [yesPrice, noPrice] = Array.isArray(m.outcomePrices)
        ? m.outcomePrices.map(toNumber)
        : [0, 0];
      return {
        slug: m.slug,
        question: m.question,
        category: m.category,
        yesPrice,
        noPrice,
        volume,
        priceChange,
        attention,
        icon: m.icon || m.image || null,
      };
    });
    processed.sort((a, b) => b.attention - a.attention);
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
    const top = processed.slice(0, limit);
    res.status(200).json({ data: top });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch markets' });
  }
}
