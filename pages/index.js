import { useState } from 'react';
import useSWR from 'swr';

/**
 * Fetcher for SWR that wraps the native fetch API.
 * SWR will call this function periodically to refresh the data.
 */
const fetcher = (url) => fetch(url).then((res) => res.json());

export default function Home() {
  // Email state for the notification placeholder
  const [email, setEmail] = useState('');

  // Fetch market data from the API route.  Refresh every 60 seconds.
  const { data, error, isLoading } = useSWR('/api/markets', fetcher, {
    refreshInterval: 60_000,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // This handler doesn't actually send email yet.  In a real app you'd POST
    // the email to a backend service (e.g. sendgrid, postmark, supabase, etc.).
    alert('Notifications are not implemented yet. This is just a placeholder.');
    setEmail('');
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6 font-sans">
      <h1 className="text-3xl font-bold mb-2">Culture Scanner<span className="text-blue-600"> – Narrative Pulse</span></h1>
      <p className="mb-6 text-gray-700 max-w-2xl">
        A lightweight dashboard that surfaces the biggest swings in Polymarket prediction markets.
        Instead of mimicking the trading interface, this tool focuses on the magnitude and
        direction of moves. Large price jumps and volume spikes bubble to the top so you can
        spot emerging narratives and sentiment shifts at a glance. Each question links back to
        Polymarket for deeper exploration.
      </p>
      <form
        onSubmit={handleSubmit}
        className="mb-8 max-w-md flex gap-2 items-end"
      >
        <div className="flex-1">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email for alerts (placeholder)
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            required
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700"
        >
          Subscribe
        </button>
      </form>
      {error && (
        <div className="text-red-600">Failed to load markets.</div>
      )}
      {isLoading && !data && (
        <div className="text-gray-600">Loading markets…</div>
      )}
      {data && data.data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.data.map((market) => (
            <MarketCard key={market.slug} market={market} />
          ))}
        </div>
      )}
    </main>
  );
}

/**
 * Display a single market card.  Shows the question, probabilities,
 * recent price change, volume and computed attention score.
 */
function MarketCard({ market }) {
  // Pull out individual fields, including the slug so we can link to the source
  const {
    slug,
    question,
    yesPrice,
    noPrice,
    volume,
    priceChange,
    attention,
    icon,
  } = market;
  const yesPct = (yesPrice * 100).toFixed(1);
  const noPct = (noPrice * 100).toFixed(1);
  // Determine the direction of the price move for coloring the change.
  const priceDir = priceChange >= 0 ? 'up' : 'down';
  // Compute bar widths for the probability bar.  Each portion is expressed as
  // a percentage string so Tailwind can apply inline styles.  We clamp the
  // values between 0 and 100 to avoid overflow if rounding errors push the sum
  // slightly over 100%.
  const yesBarWidth = `${Math.min(Math.max(yesPrice * 100, 0), 100)}%`;
  const noBarWidth = `${Math.min(Math.max(noPrice * 100, 0), 100)}%`;
  // Link to the underlying Polymarket page for reference.  Slugs map
  // directly onto the URL path for each market on polymarket.com.
  const marketUrl = `https://polymarket.com/${slug}`;
  // Flag large moves – any absolute daily change over 5% will trigger a badge.
  const isBigMove = Math.abs(priceChange) > 0.05;
  return (
    <div className="bg-white rounded-xl shadow p-4 flex flex-col justify-between border border-gray-100">
      {/* Header with question and big move badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={icon}
              alt="market icon"
              className="w-10 h-10 rounded-md object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-200 rounded-md" />
          )}
          <a
            href={marketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <h2 className="text-lg font-semibold leading-snug hover:underline">
              {question}
            </h2>
          </a>
        </div>
        {isBigMove && (
          <span className="px-2 py-0.5 rounded bg-yellow-200 text-yellow-800 text-xs font-semibold">
            Big move
          </span>
        )}
      </div>
      {/* Probability bar showing YES vs NO */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1 text-gray-500">
          <span>YES {yesPct}%</span>
          <span>NO {noPct}%</span>
        </div>
        <div className="h-2 w-full rounded bg-gray-200 flex overflow-hidden">
          <div
            className="bg-blue-500"
            style={{ width: yesBarWidth }}
          />
          <div
            className="bg-pink-500"
            style={{ width: noBarWidth }}
          />
        </div>
      </div>
      {/* Stats section */}
      <div className="grid grid-cols-3 gap-y-1 text-xs text-gray-600 mb-4">
        <div className="flex flex-col">
          <span className="uppercase text-gray-400">Volume</span>
          <span className="font-medium">${volume.toLocaleString()}</span>
        </div>
        <div className="flex flex-col">
          <span className="uppercase text-gray-400">Change</span>
          <span
            className={
              priceDir === 'up'
                ? 'font-medium text-green-600'
                : 'font-medium text-red-600'
            }
          >
            {(priceChange * 100).toFixed(2)}%
          </span>
        </div>
        <div className="flex flex-col">
          <span className="uppercase text-gray-400">Attention</span>
          <span className="font-medium text-gray-800">{attention.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}