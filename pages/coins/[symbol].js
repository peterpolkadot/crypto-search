import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '../../lib/supabase';

export async function getServerSideProps(context) {
  const { symbol } = context.params;
  
  // Query Supabase for the coin by symbol
  const { data: coin, error } = await supabase
    .from('coins')
    .select('*')
    .ilike('symbol', symbol)
    .single();
  
  if (error || !coin) {
    console.error('Error fetching coin:', error);
    return {
      props: { coin: null }
    };
  }
  
  return {
    props: { coin }
  };
}

export default function CoinDetail({ coin }) {
  const router = useRouter();

  if (!coin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Coin Not Found</h1>
          <p className="text-gray-600 mb-6">We couldn't find information for this coin</p>
          <a href="/" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">Back to Search</a>
        </div>
      </div>
    );
  }

  const coinPrice = coin.price_usd ? parseFloat(coin.price_usd).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) : 'N/A';
  
  const pageUrl = `https://crypto-search2.vercel.app/coins/${String(coin.symbol).toLowerCase()}`;

  return (
    <>
      <Head>
        <title>{coin.name} ({coin.symbol}) Price | Crypto Search</title>
        <meta name="description" content={`Live ${coin.name} price and market data. Current ${coin.symbol} price: $${coinPrice}. Rank #${coin.rank}`} />
        <meta property="og:title" content={`${coin.name} (${coin.symbol}) - $${coinPrice}`} />
        <meta property="og:description" content={`Live ${coin.name} price and market information. Rank #${coin.rank}`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${coin.name} (${coin.symbol}) - $${coinPrice}`} />
        <meta name="twitter:description" content={`Live ${coin.name} price and market information`} />
        <link rel="canonical" href={pageUrl} />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-800 font-medium mb-6 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Search
          </button>

          <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                {coin.symbol ? coin.symbol.substring(0, 2) : '?'}
              </div>
              <div>
                <h1 className="text-5xl font-bold text-gray-900">{coin.name}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-2xl text-gray-600">{coin.symbol}</span>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    Rank #{coin.rank}
                  </span>
                </div>
              </div>
            </div>

            {coin.price_usd && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8 mb-8">
                <p className="text-gray-600 text-sm font-medium mb-2">Current Price</p>
                <p className="text-5xl font-bold text-green-600">
                  ${parseFloat(coin.price_usd).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 8
                  })}
                </p>
                
                {/* Price Changes */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  {coin.chg_1h && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">1h Change</p>
                      <p className={`font-bold ${coin.chg_1h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {coin.chg_1h >= 0 ? '+' : ''}{parseFloat(coin.chg_1h).toFixed(2)}%
                      </p>
                    </div>
                  )}
                  {coin.chg_24h && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">24h Change</p>
                      <p className={`font-bold ${coin.chg_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {coin.chg_24h >= 0 ? '+' : ''}{parseFloat(coin.chg_24h).toFixed(2)}%
                      </p>
                    </div>
                  )}
                  {coin.chg_7d && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">7d Change</p>
                      <p className={`font-bold ${coin.chg_7d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {coin.chg_7d >= 0 ? '+' : ''}{parseFloat(coin.chg_7d).toFixed(2)}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Market Stats */}
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-3xl font-bold mb-6 text-gray-900">Market Statistics</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coin.market_cap && (
                <StatCard label="Market Cap" value={`$${parseFloat(coin.market_cap).toLocaleString(undefined, {maximumFractionDigits: 0})}`} />
              )}
              {coin.volume_24h && (
                <StatCard label="24h Volume" value={`$${parseFloat(coin.volume_24h).toLocaleString(undefined, {maximumFractionDigits: 0})}`} />
              )}
              {coin.circulating_supply && (
                <StatCard label="Circulating Supply" value={`${parseFloat(coin.circulating_supply).toLocaleString(undefined, {maximumFractionDigits: 0})} ${coin.symbol}`} />
              )}
              {coin.total_supply && (
                <StatCard label="Total Supply" value={`${parseFloat(coin.total_supply).toLocaleString(undefined, {maximumFractionDigits: 0})} ${coin.symbol}`} />
              )}
              {coin.max_supply && (
                <StatCard label="Max Supply" value={`${parseFloat(coin.max_supply).toLocaleString(undefined, {maximumFractionDigits: 0})} ${coin.symbol}`} />
              )}
              {coin.rank && (
                <StatCard label="CoinMarketCap Rank" value={`#${coin.rank}`} />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value }) {
  if (!value) return null;
  
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 border rounded-xl p-4">
      <p className="text-gray-600 text-xs font-medium mb-2 uppercase tracking-wide">{label}</p>
      <p className="font-semibold text-gray-900 text-base break-all">{value}</p>
    </div>
  );
}
