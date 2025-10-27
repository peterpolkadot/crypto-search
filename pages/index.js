import { useState, useEffect } from 'react';

export default function CryptoSearch() {
  const [search, setSearch] = useState('');
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const API_URL = 'https://script.google.com/macros/s/AKfycbw3__81Gn2Ie73rqYUs2YZa0ctdkraREFG0TzhG72WXUE2piebqs8_v2GZTev9iDb7c/exec';

  useEffect(() => {
    fetchAllCoins();
  }, []);

  async function fetchAllCoins() {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setCoins(data);
    } catch (error) {
      console.error('Failed to fetch coins:', error);
    }
    setLoading(false);
  }

  async function handleCoinClick(symbol) {
    setLoading(true);
    setShowDropdown(false);
    setSearch('');
    try {
      const res = await fetch(`${API_URL}?symbol=${symbol}`);
      const data = await res.json();
      setSelectedCoin(data);
    } catch (error) {
      console.error('Failed to fetch coin details:', error);
    }
    setLoading(false);
  }

  const filteredCoins = search.trim() 
    ? coins.filter(coin => {
        const name = coin.name ? String(coin.name).toLowerCase() : '';
        const symbol = coin.symbol ? String(coin.symbol).toLowerCase() : '';
        const searchTerm = search.toLowerCase();
        return name.includes(searchTerm) || symbol.includes(searchTerm);
      }).slice(0, 8)
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-2xl mx-auto p-8">
        
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            💰 Crypto Search
          </h1>
          <p className="text-gray-600">Search thousands of cryptocurrencies instantly</p>
        </div>
        
        <div className="relative mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search Bitcoin, Ethereum, Solana..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowDropdown(true);
                setSelectedCoin(null);
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-2xl shadow-lg focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all"
            />
            <svg className="absolute right-5 top-5 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {showDropdown && search.trim() && filteredCoins.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-2xl shadow-2xl max-h-96 overflow-y-auto">
              {filteredCoins.map((coin, idx) => (
                <div
                  key={coin.symbol}
                  onClick={() => handleCoinClick(coin.symbol)}
                  className={`p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer transition-all ${
                    idx !== filteredCoins.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {coin.symbol ? coin.symbol.substring(0, 2) : '?'}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{coin.symbol}</div>
                        <div className="text-sm text-gray-500">{coin.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        ${coin.price_usd ? parseFloat(coin.price_usd).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showDropdown && search.trim() && filteredCoins.length === 0 && (
            <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-2xl shadow-2xl p-6">
              <p className="text-center text-gray-500">No coins found matching "{search}"</p>
            </div>
          )}
        </div>

        {selectedCoin && !loading && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-gray-100 transform transition-all">
            
            <div className="flex items-center gap-4 mb-6">
              {selectedCoin.logo && (
                <img src={selectedCoin.logo} alt={selectedCoin.name} className="w-20 h-20 rounded-full shadow-lg" />
              )}
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{selectedCoin.name}</h2>
                <p className="text-xl text-gray-500">{selectedCoin.symbol}</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-6">
              <p className="text-sm text-gray-600 mb-2">Current Price</p>
              <p className="text-5xl font-bold text-green-600">
                ${selectedCoin.price_usd ? parseFloat(selectedCoin.price_usd).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 8
                }) : 'N/A'}
              </p>
            </div>

            <a href={`/coins/${String(selectedCoin.symbol).toLowerCase()}`} className="block w-full text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-6 rounded-2xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all shadow-lg">View Full Details</a>

            <button onClick={() => setSelectedCoin(null)} className="block w-full text-center text-gray-600 hover:text-gray-900 font-medium py-3 mt-3 transition-all">Search another coin</button>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading...</p>
          </div>
        )}

      </div>
    </div>
  );
}
