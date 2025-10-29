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

// ───────────────────────────────
// SSR: Fetch Top 100 Coins + Stats
// ───────────────────────────────
export async function getServerSideProps(context) {
  const page = parseInt(context.query.page || '1', 10);
  const limit = 100;
  const offset = (page - 1) * limit;

  // Fetch main coin list
  const { data: coinsData, error } = await supabase
    .from('coins')
    .select('*')
    .not('cmc_rank', 'is', null)
    .order('cmc_rank', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching coins:', error);
    return { props: { coins: [], page, totalCount: 0, stats: null } };
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

  // Fetch stats data (top gainers, losers, etc.)
// Fetch stats data (top gainers, losers, etc.)
// Get MORE coins and filter better for accurate stats
const { data: allCoins } = await supabase
  .from('coins')
  .select('id, name, symbol, slug, price, percent_change_24h, volume_24h, market_cap, cmc_rank')
  .not('cmc_rank', 'is', null)
  .lte('cmc_rank', 1000) // Only top 1000 coins
  .order('cmc_rank', { ascending: true });

const stats = {
  topGainers: (allCoins || [])
    .filter(c => 
      c.percent_change_24h !== null && 
      c.percent_change_24h > 0 &&
      c.market_cap !== null &&
      parseFloat(c.market_cap) > 1e8 // Filter out tiny coins (>100M market cap)
    )
    .sort((a, b) => b.percent_change_24h - a.percent_change_24h)
    .slice(0, 5),
    
  topLosers: (allCoins || [])
    .filter(c => 
      c.percent_change_24h !== null && 
      c.percent_change_24h < 0 &&
      c.market_cap !== null &&
      parseFloat(c.market_cap) > 1e8 // Filter out tiny coins
    )
    .sort((a, b) => a.percent_change_24h - b.percent_change_24h)
    .slice(0, 5),
    
  topVolume: (allCoins || [])
    .filter(c => 
      c.volume_24h !== null && 
      c.volume_24h > 0
    )
    .sort((a, b) => parseFloat(b.volume_24h) - parseFloat(a.volume_24h))
    .slice(0, 5),
    
  topMarketCap: (allCoins || [])
    .filter(c => 
      c.market_cap !== null && 
      c.market_cap > 0
    )
    .sort((a, b) => parseFloat(b.market_cap) - parseFloat(a.market_cap))
    .slice(0, 5),
};
  const { count } = await supabase
    .from('coins')
    .select('*', { count: 'exact', head: true })
    .not('cmc_rank', 'is', null);

  return {
    props: { 
      coins, 
      page, 
      totalCount: count || 0,
      stats
    },
  };
}

// ───────────────────────────────
// Home Component
// ───────────────────────────────
export default function Home({ coins, page, totalCount, stats }) {
  const [search, setSearch] = useState('');
  const [filteredCoins, setFilteredCoins] = useState(coins);
  const [sortedCoins, setSortedCoins] = useState(coins);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'rank', direction: 'asc' });
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

  // Sorting logic
  useEffect(() => {
    let sorted = [...filteredCoins];
    
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        // Handle null/undefined
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        // Convert to numbers for numeric columns
        if (['rank', 'price_usd', 'chg_24h', 'market_cap', 'volume_24h'].includes(sortConfig.key)) {
          aVal = parseFloat(aVal) || 0;
          bVal = parseFloat(bVal) || 0;
        }

        if (aVal < bVal) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setSortedCoins(sorted);
  }, [filteredCoins, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return '↕️';
    }
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

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
            🔥 Hot
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
        <div className="max-w-7xl mx-auto px-6">
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

          {/* Mini Stats Tables */}
          {stats && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Top Gainers */}
              <MiniStatsTable 
                title="🚀 Top Gainers (24h)" 
                coins={stats.topGainers} 
                highlightKey="percent_change_24h"
                router={router}
              />
              
              {/* Top Losers */}
              <MiniStatsTable 
                title="📉 Top Losers (24h)" 
                coins={stats.topLosers} 
                highlightKey="percent_change_24h"
                router={router}
              />
              
              {/* Most Traded */}
              <MiniStatsTable 
                title="💎 Most Traded (24h)" 
                coins={stats.topVolume} 
                highlightKey="volume_24h"
                router={router}
              />
              
              {/* Highest Market Cap */}
              <MiniStatsTable 
                title="👑 Highest Market Cap" 
                coins={stats.topMarketCap} 
                highlightKey="market_cap"
                router={router}
              />
            </div>
          )}

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
                    <th 
                      className="text-left px-4 py-4 text-gray-700 text-sm font-semibold cursor-pointer hover:bg-blue-200 transition-colors"
                      onClick={() => requestSort('rank')}
                    >
                      # {getSortIcon('rank')}
                    </th>
                    <th 
                      className="text-left px-6 py-4 text-gray-700 text-sm font-semibold cursor-pointer hover:bg-blue-200 transition-colors"
                      onClick={() => requestSort('name')}
                    >
                      Coin {getSortIcon('name')}
                    </th>
                    <th className="text-left px-4 py-4 text-gray-700 text-sm font-semibold">Symbol</th>
                    <th 
                      className="text-right px-6 py-4 text-gray-700 text-sm font-semibold cursor-pointer hover:bg-blue-200 transition-colors"
                      onClick={() => requestSort('price_usd')}
                    >
                      Price {getSortIcon('price_usd')}
                    </th>
                    <th 
                      className="text-right px-6 py-4 text-gray-700 text-sm font-semibold cursor-pointer hover:bg-blue-200 transition-colors"
                      onClick={() => requestSort('chg_24h')}
                    >
                      24h % {getSortIcon('chg_24h')}
                    </th>
                    <th 
                      className="text-right px-6 py-4 text-gray-700 text-sm font-semibold hidden md:table-cell cursor-pointer hover:bg-blue-200 transition-colors"
                      onClick={() => requestSort('market_cap')}
                    >
                      Market Cap {getSortIcon('market_cap')}
                    </th>
                    <th 
                      className="text-right px-6 py-4 text-gray-700 text-sm font-semibold hidden lg:table-cell cursor-pointer hover:bg-blue-200 transition-colors"
                      onClick={() => requestSort('volume_24h')}
                    >
                      Volume (24h) {getSortIcon('volume_24h')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCoins.length > 0 ? (
                    sortedCoins.map((coin) => (
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
                          {formatLargeNumber(coin.market_cap)}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-700 font-medium hidden lg:table-cell">
                          {formatLargeNumber(coin.volume_24h)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
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
/* ────────────────────────────────────────────────
   Mini Stats Table Component
──────────────────────────────────────────────── */
function MiniStatsTable({ title, coins, highlightKey, router }) {
  const formatLargeNumber = (num) => {
    if (!num) return 'N/A';
    const value = parseFloat(num);
    
    if (value >= 1e12) {
      return `$${(value / 1e12).toFixed(2)}T`;
    } else if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`;
    } else if (value >= 1e3) {
      return `$${(value / 1e3).toFixed(2)}K`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  };

  const formatValue = (coin, key) => {
    if (key === 'percent_change_24h') {
      const val = parseFloat(coin[key]);
      return (
        <span className={`font-bold ${val >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {val >= 0 ? '▲' : '▼'} {Math.abs(val).toFixed(2)}%
        </span>
      );
    }
    if (key === 'volume_24h' || key === 'market_cap') {
      return <span className="font-bold text-gray-900">{formatLargeNumber(coin[key])}</span>;
    }
    return coin[key];
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition-shadow">
      <h3 className="text-sm font-bold text-gray-900 mb-3 border-b pb-2">{title}</h3>
      <div className="space-y-2">
        {coins.map((coin, idx) => (
          <div
            key={coin.id}
            onClick={() => router.push(`/coins/${coin.symbol}`)}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-gray-400 text-xs font-medium w-4">{idx + 1}</span>
              <span className="text-gray-900 font-semibold text-sm group-hover:text-blue-600 transition-colors">
                {coin.symbol}
              </span>
              <span className="text-gray-500 text-xs truncate hidden sm:inline">
                {coin.name}
              </span>
            </div>
            <div className="text-right text-xs ml-2">
              {formatValue(coin, highlightKey)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
