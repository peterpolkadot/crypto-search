import { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';

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

// ───────────────────────────────
// SSR: Fetch Top 100 Coins
// ───────────────────────────────
export async function getServerSideProps(context) {
  const page = parseInt(context.query.page || '1', 10);
  const limit = 100;
  const offset = (page - 1) * limit;

  // Fetch from coins table
  const { data: coinsData, error } = await supabase
    .from('coins')
    .select('*')
    .not('cmc_rank', 'is', null)
    .order('cmc_rank', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching coins:', error);
    return { props: { coins: [], page, totalCount: 0 } };
  }

  // Fetch metadata for these coins
  const coinIds = coinsData.map(c => c.id);
  const { data: metaData } = await supabase
    .from('coins_meta')
    .select('id, logo, description')
    .in('id', coinIds);

  // Create a map for quick lookup
  const metaMap = {};
  (metaData || []).forEach(meta => {
    metaMap[meta.id] = meta;
  });

  // Merge the data
  const coins = coinsData.map(coin => ({
    id: coin.id,
    name: coin.name,
    symbol: coin.symbol,
    slug: coin.slug,
    rank: coin.cmc_rank,
    price_usd: coin.price,
    chg_24h: coin.percent_change_24h,
    volume_24h: coin.volume_24h,
    market_cap: coin.market_cap,
    logo: metaMap[coin.id]?.logo || null,
  }));

  const { count } = await supabase
    .from('coins')
    .select('*', { count: 'exact', head: true })
    .not('cmc_rank', 'is', null);

  return {
    props: { 
      coins, 
      page, 
      totalCount: count || 0 
    },
  };
}

// ───────────────────────────────
// Home Component
// ───────────────────────────────
export default function Home({ coins, page, totalCount }) {
  const [search, setSearch] = useState('');
  const [filteredCoins, setFilteredCoins] = useState(coins);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const router = useRouter();
  const limit = 100;
  const totalPages = Math.ceil(totalCount / limit);

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('favorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading favorites:', e);
      }
    }
  }, []);

  // Smooth scroll to top on pagination change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  // Filter coins client-side and show suggestions
  useEffect(() => {
    if (!search.trim()) {
      setFilteredCoins(coins);
      setShowSuggestions(false);
    } else {
      const term = search.toLowerCase();
      const filtered = coins.filter(
        (c) =>
          c.name?.toLowerCase().includes(term) ||
          c.symbol?.toLowerCase().includes(term)
      );
      setFilteredCoins(filtered);
      
      // Show top 5 suggestions
      if (search.length >= 2) {
        setSuggestions(filtered.slice(0, 5));
        setShowSuggestions(true);
      }
    }
  }, [search, coins]);

  const goToPage = (newPage) => {
    router.push(`/?page=${newPage}`);
  };

  const toggleFavorite = (coinId, e) => {
    e.stopPropagation();
    const newFavorites = favorites.includes(coinId)
      ? favorites.filter(id => id !== coinId)
      : [...favorites, coinId];
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  const getTrendingBadge = (coin) => {
    if (coin.volume_24h && coin.market_cap) {
      const volumeToMcap = coin.volume_24h / coin.market_cap;
      if (volumeToMcap > 0.3) {
        return (
          <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
            🔥 Trending
          </span>
        );
      }
    }
    return null;
  };

  return (
    <>
      <Head>
        <title>Crypto Search - Top 100 Live Prices | Real-Time Cryptocurrency Tracker</title>
        <meta
          name="description"
          content="View the top 100 cryptocurrencies by market cap. Track live prices, rank, and 24h performance updates. Bitcoin, Ethereum, and more."
        />
        <meta name="keywords" content="cryptocurrency, bitcoin, ethereum, crypto prices, market cap, live crypto" />
        <link rel="canonical" href="https://www.01x2.com/" />
        <meta property="og:title" content="Crypto Search - Top 100 Live Prices" />
        <meta property="og:description" content="Track live cryptocurrency prices and market data" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.01x2.com/" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-10">
        <div className="max-w-6xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
              💰 Crypto Search
            </h1>
            <p className="text-gray-600">
              Search and explore top cryptocurrencies by market cap
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Tracking {totalCount.toLocaleString()} cryptocurrencies
            </p>
          </div>

          {/* Search Bar with Suggestions */}
          <div className="relative mb-8">
            <input
              type="text"
              placeholder="Search Bitcoin, Ethereum, Solana..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => search.length >= 2 && setShowSuggestions(true)}
              className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-2xl shadow-lg focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all"
            />
            <svg
              className="absolute right-5 top-5 w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>

            {/* Search Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white rounded-xl shadow-2xl mt-2 z-10 overflow-hidden">
                {suggestions.map(coin => (
                  <div
                    key={coin.id}
                    onClick={() => {
                      router.push(`/coins/${coin.symbol}`);
                      setShowSuggestions(false);
                    }}
                    className="px-6 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer flex items-center gap-3 border-b transition-all"
                  >
                    {coin.logo ? (
                      <img src={coin.logo} alt={coin.name} className="w-8 h-8 rounded-full" loading="lazy" />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        {coin.symbol?.substring(0, 2) || '?'}
                      </div>
                    )}
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900">{coin.name}</span>
                      <span className="text-gray-500 text-sm ml-2">{coin.symbol}</span>
                    </div>
                    <span className="text-gray-700 font-medium">{formatPrice(coin.price_usd)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Results count */}
          {search && (
            <p className="text-gray-600 mb-4">
              Found {filteredCoins.length} result{filteredCoins.length !== 1 ? 's' : ''}
            </p>
          )}

          {/* Coin Table */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gradient-to-r from-blue-100 to-purple-100">
                  <tr>
                    <th className="text-left px-4 py-4 text-gray-700 text-sm font-semibold">⭐</th>
                    <th className="text-left px-4 py-4 text-gray-700 text-sm font-semibold">#</th>
                    <th className="text-left px-6 py-4 text-gray-700 text-sm font-semibold">Coin</th>
                    <th className="text-left px-4 py-4 text-gray-700 text-sm font-semibold">Symbol</th>
                    <th className="text-right px-6 py-4 text-gray-700 text-sm font-semibold">Price</th>
                    <th className="text-right px-6 py-4 text-gray-700 text-sm font-semibold">24h %</th>
                    <th className="text-right px-6 py-4 text-gray-700 text-sm font-semibold hidden md:table-cell">Market Cap</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCoins.length > 0 ? (
                    filteredCoins.map((coin) => (
                      <tr
                        key={coin.id}
                        className="border-b hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all cursor-pointer"
                        onClick={() => router.push(`/coins/${coin.symbol}`)}
                      >
                        <td className="px-4 py-4">
                          <button
                            onClick={(e) => toggleFavorite(coin.id, e)}
                            className="text-xl hover:scale-125 transition-transform"
                            title={favorites.includes(coin.id) ? "Remove from favorites" : "Add to favorites"}
                          >
                            {favorites.includes(coin.id) ? '⭐' : '☆'}
                          </button>
                        </td>
                        <td className="px-4 py-4 text-gray-600 font-medium">{coin.rank}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {coin.logo ? (
                              <img
                                src={coin.logo}
                                alt={coin.name}
                                className="w-8 h-8 rounded-full"
                                loading="lazy"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                {coin.symbol?.substring(0, 2) || '?'}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="text-gray-900 font-semibold hover:text-blue-600 transition-all">
                                {coin.name}
                              </span>
                              {getTrendingBadge(coin)}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-500 font-medium">{coin.symbol}</td>
                        <td className="px-6 py-4 text-right text-gray-800 font-semibold">
                          {formatPrice(coin.price_usd)}
                        </td>
                        <td
                          className={`px-6 py-4 text-right font-bold ${
                            coin.chg_24h >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {coin.chg_24h !== null && coin.chg_24h !== undefined ? (
                            <>
                              {coin.chg_24h >= 0 ? '▲' : '▼'}{' '}
                              {parseFloat(coin.chg_24h).toFixed(2)}%
                            </>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-700 font-medium hidden md:table-cell">
                          {coin.market_cap
                            ? `$${(parseFloat(coin.market_cap) / 1e9).toFixed(2)}B`
                            : 'N/A'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-10 text-center text-gray-500"
                      >
                        {search ? (
                          <>
                            <p className="text-xl mb-2">🔍 No coins found</p>
                            <p className="text-sm">Try a different search term</p>
                          </>
                        ) : (
                          <>
                            <p className="text-xl mb-2">📊 Loading coins...</p>
                            <div className="animate-pulse space-y-4 max-w-md mx-auto mt-4">
                              {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-12 bg-gray-200 rounded"></div>
                              ))}
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {!search && (
            <div className="flex justify-between items-center mt-8 flex-wrap gap-4">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className={`px-6 py-3 rounded-2xl font-semibold text-white transition-all transform ${
                  page <= 1
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-105 shadow-lg'
                }`}
              >
                ◀ Previous
              </button>

              <p className="text-gray-600 font-medium">
                Page {page} of {totalPages}
              </p>

              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className={`px-6 py-3 rounded-2xl font-semibold text-white transition-all transform ${
                  page >= totalPages
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-105 shadow-lg'
                }`}
              >
                Next ▶
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-12 text-gray-500 text-sm">
            <p>Data updates every 5 minutes • Powered by CoinMarketCap</p>
          </div>
        </div>
      </div>
    </>
  );
}
