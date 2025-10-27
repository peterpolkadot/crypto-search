import { useState, useEffect } from 'react';

export default function CryptoSearch() {
  const [search, setSearch] = useState('');
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState(null);

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
    try {
      const res = await fetch(`${API_URL}?symbol=${symbol}`);
      const data = await res.json();
      setSelectedCoin(data);
    } catch (error) {
      console.error('Failed to fetch coin details:', error);
    }
    setLoading(false);
  }

  const filteredCoins = coins.filter(coin =>
    coin.name?.toLowerCase().includes(search.toLowerCase()) ||
    coin.symbol?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Crypto Search</h1>
      
      <input
        type="text"
        placeholder="Search by name or symbol..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-3 border rounded-lg mb-6"
      />

      {!selectedCoin && (
        <div className="space-y-2">
          {filteredCoins.slice(0, 20).map((coin) => (
            <div
              key={coin.symbol}
              onClick={() => handleCoinClick(coin.symbol)}
              className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer flex justify-between items-center"
            >
              <div>
                <span className="font-bold">{coin.symbol}</span>
                <span className="text-gray-600 ml-2">{coin.name}</span>
              </div>
              <span className="text-green-600 font-semibold">
                ${parseFloat(coin.price_usd).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}

      {selectedCoin && !loading && (
        <div className="space-y-6">
          <button
            onClick={() => setSelectedCoin(null)}
            className="text-blue-600 hover:underline mb-4"
          >
            Back to search
          </button>

          <div className="border rounded-lg p-6 bg-white shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              {selectedCoin.logo && (
                <img src={selectedCoin.logo} alt={selectedCoin.name} className="w-16 h-16" />
              )}
              <div>
                <h2 className="text-2xl font-bold">{selectedCoin.name}</h2>
                <p className="text-gray-600">{selectedCoin.symbol}</p>
              </div>
            </div>
            
            <div className="text-3xl font-bold text-green-600 mb-4">
              ${parseFloat(selectedCoin.price_usd).toLocaleString()}
            </div>

            
         <a href={`/coins/${selectedCoin.symbol.toLowerCase()}`} className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">View Full Details</a>
          </div>
        </div>
      )}

      {loading && <p className="text-center text-gray-500">Loading...</p>}
    </div>
  );
}
