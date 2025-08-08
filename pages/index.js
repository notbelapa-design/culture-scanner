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
      <h1 className="text-3xl font-bold mb-4">Culture Scanner</h1>
      <p className="mb-6 text-gray-700 max-w-2xl">
        This dashboard monitors Polymarket prediction markets for big
        changes in sentiment. It ranks markets by an attention score
        computed from recent price movement and trading volume. Use it
        as an early warning system for narratives gaining traction.
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
  const { question, yesPrice, noPrice, volume, priceChange, attention, icon } = market;
  const yesPct = (yesPrice * 100).toFixed(1);
  const noPct = (noPrice * 100).toFixed(1);
  const priceDir = priceChange >= 0 ? 'up' : 'down';
  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col justify-between">
      <div className="flex items-center gap-4 mb-4">
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
        <h2 className="text-lg font-semibold leading-snug">
          {question}
        </h2>
      </div>
      <div className="mb-4 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">YES</span>
          <span className="font-medium">{yesPct}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">NO</span>
          <span className="font-medium">{noPct}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Volume (24h)</span>
          <span className="font-medium">${volume.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Price change (1d)</span>
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
      </div>
      <div className="mt-auto text-sm text-gray-500">
        Attention score: <span className="font-semibold">{attention.toFixed(2)}</span>
      </div>
    </div>
  );
}
