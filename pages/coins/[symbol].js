import { useRouter } from 'next/router';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

// ───────────────────────────────
// Helper Functions
// ───────────────────────────────
const formatPrice = (price) => {
  if (!price) return 'N/A';
  const num = parseFloat(price);
  
  if (num >= 1) {
    return `$${num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  } else if (num >= 0.01) {
    return `$${num.toFixed(4)}`;
  } else if (num >= 0.00001) {
    return `$${num.toFixed(8)}`;
  } else {
    return `$${num.toExponential(2)}`;
  }
};

const formatLargeNumber = (num) => {
  if (!num) return 'N/A';
  const value = parseFloat(num);
  
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  } else if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  } else {
    return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }
};

/* ────────────────────────────────────────────────
   Server-Side Fetch
──────────────────────────────────────────────── */
export async function getServerSideProps(context) {
  const { symbol } = context.params;

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

  const { data: meta } = await supabase
    .from('coins_meta')
    .select('*')
    .eq('id', coin.id)
    .limit(1);

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
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (coin) {
      const saved = localStorage.getItem('favorites');
      if (saved) {
        try {
          const favorites = JSON.parse(saved);
          setIsFavorite(favorites.includes(coin.id));
        } catch (e) {
          console.error('Error loading favorites:', e);
        }
      }
    }
  }, [coin]);

  const toggleFavorite = () => {
    const saved = localStorage.getItem('favorites');
    let favorites = [];
    if (saved) {
      try {
        favorites = JSON.parse(saved);
      } catch (e) {
        favorites = [];
      }
    }

    const newFavorites = favorites.includes(coin.id)
      ? favorites.filter(id => id !== coin.id)
      : [...favorites, coin.id];
    
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
    setIsFavorite(newFavorites.includes(coin.id));
  };

  if (!coin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Coin Not Found</h1>
          <p className="text-gray-600 mb-6">We couldn't find information for this coin</p>
          <a href="/" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all">
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

  const coinPrice = formatPrice(coin.price);
  const pageUrl = `https://www.01x2.com/coins/${coin.symbol}`;

  const marketDominance = coin.market_cap 
    ? ((parseFloat(coin.market_cap) / 3e12) * 100).toFixed(2) 
    : null;

  const sameAsLinks = [
    ...(parseUrls(coin.urls_website) || []),
    ...(parseUrls(coin.urls_twitter) || []),
    ...(parseUrls(coin.urls_reddit) || []),
  ].filter(Boolean);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CryptoCurrency',
    name: coin.name,
    symbol: coin.symbol,
    description: coin.description || `Live ${coin.name} price and market information`,
    url: pageUrl,
    image: coin.logo || '',
    price: coin.price ? parseFloat(coin.price) : undefined,
    priceCurrency: 'USD',
    marketCap: coin.market_cap ? parseFloat(coin.market_cap) : undefined,
    totalSupply: coin.total_supply ? parseFloat(coin.total_supply) : undefined,
    circulatingSupply: coin.circulating_supply ? parseFloat(coin.circulating_supply) : undefined,
    sameAs: sameAsLinks
  };

  return (
    <>
      <Head>
        <title>
          {coin.name} ({coin.symbol}) Price: {coinPrice} | Live Market Data & Stats
        </title>
        <meta
          name="description"
          content={`${coin.name} (${coin.symbol}) live price is ${coinPrice}. View market cap, 24h volume, circulating supply, and real-time price changes. ${coin.description ? coin.description.substring(0, 120) + '...' : ''}`}
        />
        <meta name="keywords" content={`${coin.name}, ${coin.symbol}, cryptocurrency, price, market cap, ${coin.category || 'crypto'}`} />
        <meta property="og:title" content={`${coin.name} (${coin.symbol}) - ${coinPrice}`} />
        <meta
          property="og:description"
          content={coin.description || `Live ${coin.name} price and market information.`}
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        {coin.logo && <meta property="og:image" content={coin.logo} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${coin.name} (${coin.symbol}) - ${coinPrice}`} />
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
    {/* COMBINED HERO + MARKET STATS SECTION */}
    <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
      {/* Top Row - Coin Info & Price */}
      <div className="grid md:grid-cols-2 gap-8 items-center mb-8">
        {/* Left - Coin Info */}
        <div className="flex items-center gap-6">
          {coin.logo ? (
            <img 
              src={coin.logo} 
              alt={coin.name} 
              className="w-28 h-28 rounded-full shadow-lg" 
              loading="lazy"
            />
          ) : (
            <div className="w-28 h-28 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-lg">
              {coin.symbol?.substring(0, 2) || '?'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-5xl font-bold text-gray-900">{coin.name}</h1>
              <button
                onClick={toggleFavorite}
                className="text-3xl hover:scale-125 transition-transform"
                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                {isFavorite ? '⭐' : '☆'}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
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

        {/* Right - Price Info */}
        <div>
          {coin.price && (
            <>
              <p className="text-gray-600 text-sm font-medium mb-1">Current Price</p>
              <p className="text-5xl font-bold text-green-600 mb-4">{coinPrice}</p>
            </>
          )}
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: 'percent_change_1h', label: '1h' },
              { key: 'percent_change_24h', label: '24h' },
              { key: 'percent_change_7d', label: '7d' }
            ].map(({ key, label }) =>
              coin[key] !== null && coin[key] !== undefined ? (
                <div key={key}>
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p
                    className={`font-bold text-lg ${
                      coin[key] >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {coin[key] >= 0 ? '▲' : '▼'}{' '}
                    {parseFloat(coin[key]).toFixed(2)}%
                  </p>
                </div>
              ) : null
            )}
          </div>
          {coin.last_updated && (
            <p className="text-gray-500 text-xs mt-4">
              Last updated: {new Date(coin.last_updated).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Market Stats Grid - Below Hero */}
      {(coin.market_cap || coin.volume_24h) && (
        <div className="border-t pt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {coin.market_cap && (
              <StatCard
                label="Market Cap"
                value={formatLargeNumber(coin.market_cap)}
                subtext={marketDominance ? `${marketDominance}% dominance` : null}
              />
            )}
            {coin.volume_24h && (
              <StatCard
                label="24h Volume"
                value={formatLargeNumber(coin.volume_24h)}
                subtext={coin.market_cap ? `${((coin.volume_24h / coin.market_cap) * 100).toFixed(1)}% of market cap` : null}
              />
            )}
            {coin.circulating_supply && (
              <StatCard
                label="Circulating Supply"
                value={`${parseFloat(coin.circulating_supply).toLocaleString(undefined, {
                  maximumFractionDigits: 0
                })}`}
                subtext={coin.symbol}
              />
            )}
            {coin.total_supply && (
              <StatCard
                label="Total Supply"
                value={`${parseFloat(coin.total_supply).toLocaleString(undefined, {
                  maximumFractionDigits: 0
                })}`}
                subtext={coin.symbol}
              />
            )}
            {coin.max_supply && (
              <StatCard
                label="Max Supply"
                value={`${parseFloat(coin.max_supply).toLocaleString(undefined, {
                  maximumFractionDigits: 0
                })}`}
                subtext={coin.symbol}
              />
            )}
            {coin.cmc_rank && (
              <StatCard 
                label="CMC Rank" 
                value={`#${coin.cmc_rank}`}
              />
            )}
            {coin.num_market_pairs && (
              <StatCard 
                label="Trading Pairs" 
                value={coin.num_market_pairs}
              />
            )}
          </div>
        </div>
      )}
    </div>

    {/* ABOUT SECTION - remains the same */}
    {coin.description && (
      <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
        <h2 className="text-3xl font-bold mb-4 text-gray-900">ℹ️ About {coin.name}</h2>
        <p className="text-gray-700 leading-relaxed text-lg">{coin.description}</p>
        {coin.date_added && (
          <p className="text-gray-500 text-sm mt-4">
            Added to CoinMarketCap: {formatDate(coin.date_added)}
          </p>
        )}
      </div>
    )}



          {/* RESOURCES */}
          {(coin.urls_website || coin.urls_technical_doc || coin.urls_source_code || coin.urls_explorer) && (
            <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
              <h2 className="text-3xl font-bold mb-6 text-gray-900">🔗 Official Resources</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {parseUrls(coin.urls_website).length > 0 && (
                  <LinkCard title="🌐 Website" urls={parseUrls(coin.urls_website)} />
                )}
                {parseUrls(coin.urls_technical_doc).length > 0 && (
                  <LinkCard title="📄 Whitepaper" urls={parseUrls(coin.urls_technical_doc)} />
                )}
                {parseUrls(coin.urls_source_code).length > 0 && (
                  <LinkCard title="💻 Source Code" urls={parseUrls(coin.urls_source_code)} />
                )}
                {parseUrls(coin.urls_explorer).length > 0 && (
                  <LinkCard title="🔍 Block Explorers" urls={parseUrls(coin.urls_explorer)} numbered />
                )}
              </div>
            </div>
          )}

          {/* SOCIAL */}
          {(coin.urls_twitter || coin.urls_reddit || coin.urls_message_board) && (
            <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
              <h2 className="text-3xl font-bold mb-6 text-gray-900">💬 Social & Community</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {parseUrls(coin.urls_twitter).length > 0 && (
                  <LinkCard title="🐦 Twitter" urls={parseUrls(coin.urls_twitter)} />
                )}
                {parseUrls(coin.urls_reddit).length > 0 && (
                  <LinkCard title="👽 Reddit" urls={parseUrls(coin.urls_reddit)} />
                )}
                {parseUrls(coin.urls_message_board).length > 0 && (
                  <LinkCard title="📋 Message Board" urls={parseUrls(coin.urls_message_board)} />
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
function StatCard({ label, value, subtext }) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
      <p className="text-gray-600 text-xs font-medium mb-2 uppercase tracking-wide">{label}</p>
      <p className="font-semibold text-gray-900 text-lg break-all">{value}</p>
      {subtext && <p className="text-gray-500 text-xs mt-1">{subtext}</p>}
    </div>
  );
}

function LinkCard({ title, urls, numbered = false }) {
  if (!urls || urls.length === 0) return null;
  const mainLink = urls[0];
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all">
      <h3 className="font-bold text-gray-900 mb-3 text-lg">
        <a 
          href={mainLink} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-blue-600 transition-colors flex items-center gap-2"
        >
          {title}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </h3>
      {numbered && urls.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((url, i) => (
            <a 
              key={i} 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
            >
              Explorer {i + 1}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
