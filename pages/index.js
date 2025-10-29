import { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';

// ───────────────────────────────
// SSR: Fetch Top 100 Coins (Paginated)
// ───────────────────────────────
export async function getServerSideProps(context) {
  const page = parseInt(context.query.page || '1', 10);
  const limit = 100;
  const offset = (page - 1) * limit;

  const { data: coins, error } = await supabase
   .from('coin_full')
    .select('*')
    .order('market_cap', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching coins:', error);
    return { props: { coins: [], page } };
  }

  const { count } = await supabase
   .from('coin_full')
    .select('*', { count: 'exact', head: true });

  return {
    props: { coins: coins || [], page, totalCount: count || 0 },
  };
}

// ───────────────────────────────
// Home Component
// ───────────────────────────────
export default function Home({ coins, page, totalCount }) {
  const [search, setSearch] = useState('');
  const [filteredCoins, setFilteredCoins] = useState(coins);
  const router = useRouter();
  const limit = 100;
  const totalPages = Math.ceil(totalCount / limit);

  // Smooth scroll to top on pagination change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  // Filter coins client-side
  useEffect(() => {
    if (!search.trim()) {
      setFilteredCoins(coins);
    } else {
      const term = search.toLowerCase();
      setFilteredCoins(
        coins.filter(
          (c) =>
            c.name?.toLowerCase().includes(term) ||
            c.symbol?.toLowerCase().includes(term)
        )
      );
    }
  }, [search, coins]);

  const goToPage = (newPage) => {
    router.push(`/?page=${newPage}`);
  };

  return (
    <>
      <Head>
        <title>Crypto Search - Top 100 Live Prices</title>
        <meta
          name="description"
          content="View the top 100 cryptocurrencies by market cap. Track live prices, rank, and 24h performance updates."
        />
        <link rel="canonical" href="https://crypto-search2.vercel.app/" />
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
          </div>

          {/* Search Bar */}
          <div className="relative mb-8">
            <input
              type="text"
              placeholder="Search Bitcoin, Ethereum, Solana..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
          </div>

          {/* Coin Table */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <table className="min-w-full table-auto">
              <thead className="bg-gradient-to-r from-blue-100 to-purple-100">
                <tr>
                  <th className="text-left px-6 py-4 text-gray-700 text-sm font-semibold">#</th>
                  <th className="text-left px-6 py-4 text-gray-700 text-sm font-semibold">Coin</th>
                  <th className="text-left px-6 py-4 text-gray-700 text-sm font-semibold">Symbol</th>
                  <th className="text-right px-6 py-4 text-gray-700 text-sm font-semibold">Price (USD)</th>
                  <th className="text-right px-6 py-4 text-gray-700 text-sm font-semibold">24h</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoins.length > 0 ? (
                  filteredCoins.map((coin) => (
                    <tr
                      key={coin.id}
                      className="border-b hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all"
                    >
                      <td className="px-6 py-4 text-gray-600 font-medium">{coin.rank}</td>
                      <td className="px-6 py-4 flex items-center gap-3">
                        {coin.logo ? (
                          <img
                            src={coin.logo}
                            alt={coin.name}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                            {coin.symbol?.substring(0, 2) || '?'}
                          </div>
                        )}
                        <a
                          href={`/coins/${coin.slug}`}
                          className="text-gray-900 font-semibold hover:text-blue-600 transition-all"
                        >
                          {coin.name}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{coin.symbol}</td>
                      <td className="px-6 py-4 text-right text-gray-800 font-semibold">
                        {coin.price_usd
                          ? `$${parseFloat(coin.price_usd).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`
                          : 'N/A'}
                      </td>
                      <td
                        className={`px-6 py-4 text-right font-bold ${
                          coin.chg_24h >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {coin.chg_24h >= 0 ? '▲' : '▼'}{' '}
                        {coin.chg_24h
                          ? `${parseFloat(coin.chg_24h).toFixed(2)}%`
                          : '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      No coins found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-8">
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
        </div>
      </div>
    </>
  );
}
