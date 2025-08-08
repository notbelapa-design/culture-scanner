import { useState, useEffect } from 'react';
import useSWR from 'swr';

/**
 * Fetcher for SWR that wraps the native fetch API.
 * SWR will call this function periodically to refresh the data.
 */
const fetcher = (url) => fetch(url).then((res) => res.json());

export default function Home() {
  // Email state for the notification placeholder
  const [email, setEmail] = useState('');

  // Toggle dark mode.  Traders often prefer dark terminals, so expose a
  // button that flips between light and dark palettes.
  const [darkMode, setDarkMode] = useState(false);

  // Store previous market results so we can compute attention deltas on the
  // client.  When new data arrives we update this map.  Keys are market
  // slugs and values are the last attention scores.
  const [prevData, setPrevData] = useState({});

  // Timestamp of the last successful data fetch.  Displayed on the page to
  // show when the numbers were last refreshed.
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch market data from the API route.  Refresh more frequently to
  // surface changes quickly.  Traders might want very fresh data, so we
  // set the interval to 10 seconds by default.
  const { data, error, isLoading } = useSWR('/api/markets', fetcher, {
    refreshInterval: 10_000,
  });

  // When new data arrives, record the time and update the prevData map.
  useEffect(() => {
    if (data && data.data) {
      // Build a map of current attention scores keyed by slug
      const current = {};
      data.data.forEach((m) => {
        current[m.slug] = m.attention;
      });
      setPrevData(current);
      setLastUpdated(new Date());
    }
  }, [data]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // This handler doesn't actually send email yet.  In a real app you'd POST
    // the email to a backend service (e.g. sendgrid, postmark, supabase, etc.).
    alert('Notifications are not implemented yet. This is just a placeholder.');
    setEmail('');
  };

  return (
    <main
      className={
        darkMode
          ? 'min-h-screen bg-gray-900 text-gray-100 p-6 font-sans'
          : 'min-h-screen bg-gray-100 text-gray-900 p-6 font-sans'
      }
    >
      {/* Top bar: title, description, dark mode toggle and last updated */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between">
        <div className="mb-4 md:mb-0 md:pr-4 flex-1">
          <h1 className="text-3xl font-bold mb-1">
            Culture Scanner<span className="text-blue-500"> – Narrative Pulse</span>
          </h1>
          <p className={darkMode ? 'mb-2 text-gray-300 max-w-2xl' : 'mb-2 text-gray-700 max-w-2xl'}>
            A lightweight dashboard that surfaces the biggest swings in Polymarket prediction
            markets. Instead of mimicking the trading interface, this tool focuses on the
            magnitude and direction of moves. Large price jumps and volume spikes bubble to
            the top so you can spot emerging narratives and sentiment shifts at a glance. Each
            question links back to Polymarket for deeper exploration.
          </p>
          {lastUpdated && (
            <div className="text-xs italic text-gray-400">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          {/* Data source and refresh info */}
          <div className="text-xs text-gray-400 mt-1">
            Data sourced from Polymarket&#39;s Gamma API &nbsp;•&nbsp; Updates every 10&nbsp;seconds
          </div>
        </div>
        {/* Top markets in the last hour */}
        {data && data.data && (
          <TopHourMarkets markets={data.data} darkMode={darkMode} />
        )}
      </div>

      {/* Theme toggle */}
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-full border border-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          {darkMode ? '🌞' : '🌜'}
        </button>
        <span className="text-sm">{darkMode ? 'Light mode' : 'Dark mode'}</span>
      </div>
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
        // Scrollable list of markets.  Each row receives the previous attention
        // map so it can compute deltas and highlight moves.  We clamp the
        // max height to keep the list contained within the viewport.
        <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
          {data.data.map((market) => (
            <MarketRow
              key={market.slug}
              market={market}
              prevAttention={prevData[market.slug] ?? null}
              darkMode={darkMode}
            />
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
function MarketRow({ market, prevAttention, darkMode }) {
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
  // Determine if we have valid probability data.  Some markets (e.g. scalar or
  // multi‑outcome) may not provide outcomePrices for simple YES/NO events.  In
  // those cases both yesPrice and noPrice will be zero.  When this happens we
  // show “N/A” instead of 0% and render a muted bar.
  const hasProb = yesPrice > 0 || noPrice > 0;
  const yesPct = hasProb ? (yesPrice * 100).toFixed(1) : 'N/A';
  const noPct = hasProb ? (noPrice * 100).toFixed(1) : 'N/A';
  // Determine the direction of the price move for coloring the change.
  const priceDir = priceChange >= 0 ? 'up' : 'down';
  // Compute bar widths for the probability bar.  Each portion is expressed as
  // a percentage string so Tailwind can apply inline styles.  We clamp the
  // values between 0 and 100 to avoid overflow if rounding errors push the sum
  // slightly over 100%.
  const yesBarWidth = hasProb
    ? `${Math.min(Math.max(yesPrice * 100, 0), 100)}%`
    : '0%';
  const noBarWidth = hasProb
    ? `${Math.min(Math.max(noPrice * 100, 0), 100)}%`
    : '0%';
  // Link to the underlying Polymarket page for reference.
  const marketUrl = `https://polymarket.com/${slug}`;
  // Flag large moves – any absolute daily change over 5% will trigger a badge.
  const isBigMove = Math.abs(priceChange) > 0.05;
  // Compute the change in attention compared to the previous refresh.  If
  // prevAttention is null (e.g. first load) then delta is null.
  const delta = typeof prevAttention === 'number' ? attention - prevAttention : null;

  // Determine border highlight based on delta to draw the eye to movers.  Positive
  // deltas get a green bar, negative deltas get red.  We set a small threshold
  // so that very tiny changes don’t flash constantly.
  let borderClass = '';
  if (delta !== null && Math.abs(delta) > 1) {
    borderClass = delta > 0 ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500';
  }
  return (
    <div
      className={
        `${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} ${borderClass} rounded-lg shadow p-3 transition-colors duration-500 ${
          isBigMove ? 'animate-pulse' : ''
        }`
      }
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-start gap-3">
          {icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={icon}
              alt="market icon"
              className="w-8 h-8 rounded object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-200 rounded" />
          )}
          <a
            href={marketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-sm md:text-base hover:underline"
          >
            {question}
          </a>
        </div>
        {isBigMove && (
          <span className="ml-2 px-2 py-0.5 rounded bg-yellow-200 text-yellow-800 text-xs font-semibold whitespace-nowrap">
            Big move
          </span>
        )}
      </div>
      {/* Probability bar showing YES vs NO */}
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-0.5 text-gray-500">
          <span>YES {yesPct}{hasProb ? '%' : ''}</span>
          <span>NO {noPct}{hasProb ? '%' : ''}</span>
        </div>
        <div className="h-2 w-full rounded bg-gray-200 flex overflow-hidden">
          {hasProb ? (
            <>
              <div className="bg-blue-500" style={{ width: yesBarWidth }} />
              <div className="bg-pink-500" style={{ width: noBarWidth }} />
            </>
          ) : (
            <div className={darkMode ? 'bg-gray-700' : 'bg-gray-300'} style={{ width: '100%' }} />
          )}
        </div>
      </div>
      {/* Stats row */}
      <div className="flex text-xs gap-6">
        <div className="flex flex-col">
          <span className={darkMode ? 'uppercase text-gray-400' : 'uppercase text-gray-500'}>
            Vol
          </span>
          <span className="font-medium">${volume.toLocaleString()}</span>
        </div>
        <div className="flex flex-col">
          <span className={darkMode ? 'uppercase text-gray-400' : 'uppercase text-gray-500'}>
            1d
          </span>
          <span
            className={
              priceDir === 'up'
                ? 'font-medium text-green-500'
                : 'font-medium text-red-500'
            }
          >
            {(priceChange * 100).toFixed(2)}%
          </span>
        </div>
        <div className="flex flex-col">
          <span className={darkMode ? 'uppercase text-gray-400' : 'uppercase text-gray-500'}>
            Attention
          </span>
          <span className="font-medium">{attention.toFixed(2)}</span>
        </div>
        <div className="flex flex-col">
          <span className={darkMode ? 'uppercase text-gray-400' : 'uppercase text-gray-500'}>
            Δ
          </span>
          <span
            className={
              delta === null
                ? 'font-medium'
                : delta > 0
                ? 'font-medium text-green-500'
                : delta < 0
                ? 'font-medium text-red-500'
                : 'font-medium'
            }
          >
            {delta === null || Math.abs(delta) < 0.01
              ? '–'
              : `${delta > 0 ? '↑' : '↓'}${Math.abs(delta).toFixed(2)}`}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Display the top three markets ranked by short‑term attention (volume ×
 * absolute one‑hour price change).  This sits in the header and gives a
 * quick glance at what narratives are spiking right now.  Markets are
 * sorted descending by the computed metric.  The component expects an
 * array of market objects with `volume` and `hourChange` fields.
 */
function TopHourMarkets({ markets, darkMode }) {
  // Compute an array of {market, score} pairs for hour attention
  const scored = markets
    .map((m) => {
      const score = m.volume * Math.abs(m.hourChange ?? 0);
      return { market: m, score };
    })
    .filter((x) => x.score > 0);
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 3);
  if (top.length === 0) return null;
  return (
    <div
      className={
        darkMode
          ? 'bg-gray-800 text-gray-100 p-3 rounded-lg border border-gray-700 w-full md:w-64'
          : 'bg-white text-gray-800 p-3 rounded-lg border border-gray-200 w-full md:w-64'
      }
    >
      <h2 className="text-sm font-semibold mb-2">Top Hour Movers</h2>
      <ul className="space-y-1">
        {top.map(({ market: m, score }) => {
          const changePct = (m.hourChange * 100).toFixed(2);
          return (
            <li key={m.slug} className="text-xs flex justify-between items-center">
              <span className="truncate w-40 mr-2">
                <a
                  href={`https://polymarket.com/${m.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {m.question}
                </a>
              </span>
              <span
                className={
                  m.hourChange >= 0 ? 'text-green-500 font-medium' : 'text-red-500 font-medium'
                }
              >
                {changePct}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}