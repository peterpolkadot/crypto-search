import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '../../lib/supabase';

/* ────────────────────────────────────────────────
   Server-Side Fetch (Smart symbol matching)
──────────────────────────────────────────────── */
export async function getServerSideProps(context) {
  const { symbol } = context.params;

  // Get all coins with this symbol, ordered by:
  // 1. Best rank (lowest cmc_rank = most popular)
  // 2. Then by oldest (lowest id = original)
  const { data: coins, error } = await supabase
    .from('coins')
    .select('*')
    .ilike('symbol', symbol)
    .order('cmc_rank', { ascending: true, nullsLast: true })
    .order('id', { ascending: true })
    .limit(1);

  if (error || !coins || coins.length === 0) {
    return { props: { coin: null } };
  }

  const coin = coins[0];

  // Fetch metadata
  const { data: meta } = await supabase
    .from('coins_meta')
    .select('*')
    .eq('id', coin.id)
    .limit(1);

  // Merge data
  const mergedCoin = {
    ...coin,
    ...(meta && meta[0] ? meta[0] : {}),
  };

  return { props: { coin: mergedCoin } };
}

/* ────────────────────────────────────────────────
   Component
──────────────────────────────────────────────── */
export default function CoinDetail({ coin }) {
  const router = useRouter();

  if (!coin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Coin Not Found</h1>
          <p className="text-gray-600 mb-6">We couldn't find information for this coin</p>
          <a href="/" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            Back to Search
          </a>
        </div>
      </div>
    );
  }

  const parseUrls = str => (!str ? [] : String(str).split(',').map(u => u.trim()).filter(Boolean));
  const formatDate = d =>
    !d
      ? 'N/A'
      : new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const coinPrice = coin.price
    ? parseFloat(coin.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })
    : 'N/A';
  const pageUrl = `https://www.01x2.com/coins/${coin.symbol}`;

  /* JSON-LD Schema */
  const sameAsLinks = [
    ...(parseUrls(coin.urls_website) || []),
    ...(parseUrls(coin.urls_twitter) || []),
    ...(parseUrls(coin.urls_reddit) || []),
  ];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CryptoCurrency',
    name: coin.name,
    symbol: coin.symbol,
    description: coin.description || '',
    url: pageUrl,
    image: coin.logo || '',
    price: coin.price ? parseFloat(coin.price) : undefined,
    priceCurrency: 'USD',
    marketCap: coin.market_cap ? parseFloat(coin.market_cap) : undefined,
    totalSupply: coin.total_supply ? parseFloat(coin.total_supply) : undefined,
    circulatingSupply: coin.circulating_supply ? parseFloat(coin.circulating_supply) : undefined,
    sameAs: sameAsLinks
  };

  /* ────────────────────────────────────────────────
     Render
  ──────────────────────────────────────────────── */
  return (
    <>
      <Head>
        <title>
          {coin.name} ({coin.symbol}) Price Today: ${coinPrice} | Live Market Data
        </title>
        <meta
          name="description"
          content={`Live ${coin.name} (${coin.symbol}) price today is $${coinPrice}. Explore real-time market cap, trading volume, circulating supply, and performance stats — updated live.`}
        />
        <meta property="og:title" content={`${coin.name} (${coin.symbol}) - $${coinPrice}`} />
        <meta
          property="og:description"
          content={coin.description || `Live ${coin.name} price and market information.`}
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        {coin.logo && <meta property="og:image" content={coin.logo} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${coin.name} (${coin.symbol}) - $${coinPrice}`} />
        <meta
          name="twitter:description"
          content={coin.description || `Live ${coin.name} price and market information.`}
        />
        {coin.logo && <meta name="twitter:image" content={coin.logo} />}
        <link rel="canonical" href={pageUrl} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
        <div className="max-w-6xl mx-auto px-6">
          {/* Back */}
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-800 font-medium mb-6 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Search
          </button>

          {/* HERO SPLIT */}
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 grid md:grid-cols-2 gap-8 items-center">
            {/* Left */}
            <div className="flex items-center gap-6">
              {coin.logo ? (
                <img src={coin.logo} alt={coin.name} className="w-28 h-28 rounded-full shadow-lg" />
              ) : (
                <div className="w-28 h-28 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                  {coin.symbol?.substring(0, 2) || '?'}
                </div>
              )}
              <div>
                <h1 className="text-5xl font-bold text-gray-900">{coin.name}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className="text-2xl text-gray-600">{coin.symbol}</span>
                  {coin.cmc_rank && (
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      Rank #{coin.cmc_rank}
                    </span>
                  )}
                  {coin.category && (
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                      {coin.category}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right */}
            <div>
              {coin.price && (
                <>
                  <p className="text-gray-600 text-sm font-medium mb-1">Current Price</p>
                  <p className="text-5xl font-bold text-green-600">${coinPrice}</p>
                </>
              )}
              <div className="grid grid-cols-3 gap-4 mt-4">
                {[
                  { key: 'percent_change_1h', label: '1h' },
                  { key: 'percent_change_24h', label: '24h' },
                  { key: 'percent_change_7d', label: '7d' }
                ].map(({ key, label }) =>
                  coin[key] !== null && coin[key] !== undefined ? (
                    <div key={key}>
                      <p className="text-xs text-gray-500 mb-1">{label} Change</p>
                      <p
                        className={`font-bold ${
                          coin[key] >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {coin[key] >= 0 ? '+' : ''}
                        {parseFloat(coin[key]).toFixed(2)}%
                      </p>
                    </div>
                  ) : null
                )}
              </div>
            </div>
          </div>

          {/* MARKET STATS */}
          {(coin.market_cap || coin.volume_24h) && (
            <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
              <h2 className="text-3xl font-bold mb-6 text-gray-900">Market Statistics</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coin.market_cap && (
                  <StatCard
                    label="Market Cap"
                    value={`$${parseFloat(coin.market_cap).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  />
                )}
                {coin.volume_24h && (
                  <StatCard
                    label="24h Volume"
                    value={`$${parseFloat(coin.volume_24h).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  />
                )}
                {coin.circulating_supply && (
                  <StatCard
                    label="Circulating Supply"
                    value={`${parseFloat(coin.circulating_supply).toLocaleString(undefined, {
                      maximumFractionDigits: 0
                    })} ${coin.symbol}`}
                  />
                )}
                {coin.total_supply && (
                  <StatCard
                    label="Total Supply"
                    value={`${parseFloat(coin.total_supply).toLocaleString(undefined, {
                      maximumFractionDigits: 0
                    })} ${coin.symbol}`}
                  />
                )}
                {coin.max_supply && (
                  <StatCard
                    label="Max Supply"
                    value={`${parseFloat(coin.max_supply).toLocaleString(undefined, {
                      maximumFractionDigits: 0
                    })} ${coin.symbol}`}
                  />
                )}
                {coin.cmc_rank && <StatCard label="CoinMarketCap Rank" value={`#${coin.cmc_rank}`} />}
              </div>
            </div>
          )}

          {/* ABOUT */}
          {coin.description && (
            <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">About {coin.name}</h2>
              <p className="text-gray-700 leading-relaxed text-lg">{coin.description}</p>
            </div>
          )}

          {/* RESOURCES */}
          {(coin.urls_website || coin.urls_technical_doc || coin.urls_source_code || coin.urls_explorer) && (
            <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
              <h2 className="text-3xl font-bold mb-6 text-gray-900">Official Resources</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {parseUrls(coin.urls_website).length > 0 && (
                  <SimpleLinkCard title="🌐 Website" urls={parseUrls(coin.urls_website)} />
                )}
                {parseUrls(coin.urls_technical_doc).length > 0 && (
                  <SimpleLinkCard title="📄 Whitepaper" urls={parseUrls(coin.urls_technical_doc)} />
                )}
                {parseUrls(coin.urls_source_code).length > 0 && (
                  <SimpleLinkCard title="💻 Source Code" urls={parseUrls(coin.urls_source_code)} />
                )}
                {parseUrls(coin.urls_explorer).length > 0 && (
                  <SimpleLinkCard title="🔍 Block Explorers" urls={parseUrls(coin.urls_explorer)} numbered />
                )}
              </div>
            </div>
          )}

          {/* SOCIAL */}
          {(coin.urls_twitter || coin.urls_reddit || coin.urls_message_board) && (
            <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
              <h2 className="text-3xl font-bold mb-6 text-gray-900">Social & Community</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {parseUrls(coin.urls_twitter).length > 0 && (
                  <SimpleLinkCard title="🐦 Twitter" urls={parseUrls(coin.urls_twitter)} />
                )}
                {parseUrls(coin.urls_reddit).length > 0 && (
                  <SimpleLinkCard title="👽 Reddit" urls={parseUrls(coin.urls_reddit)} />
                )}
                {parseUrls(coin.urls_message_board).length > 0 && (
                  <SimpleLinkCard title="📋 Message Board" urls={parseUrls(coin.urls_message_board)} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ────────────────────────────────────────────────
   Helper Components
──────────────────────────────────────────────── */
function StatCard({ label, value }) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 border rounded-xl p-4">
      <p className="text-gray-600 text-xs font-medium mb-2 uppercase tracking-wide">{label}</p>
      <p className="font-semibold text-gray-900 text-base break-all">{value}</p>
    </div>
  );
}

function SimpleLinkCard({ title, urls, numbered = false }) {
  if (!urls || urls.length === 0) return null;
  const mainLink = urls[0];
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 border rounded-xl p-5 hover:shadow-md transition-shadow">
      <h3 className="font-bold text-gray-900 mb-3 text-lg">
        <a href={mainLink} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-700">
          {title}
        </a>
      </h3>
      {numbered && (
        <p className="text-sm text-blue-600 flex flex-wrap gap-2">
          {urls.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="hover:underline">
              [{i + 1}]
            </a>
          ))}
        </p>
      )}
    </div>
  );
}
