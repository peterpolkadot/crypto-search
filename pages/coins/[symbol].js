import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

export default function CoinDetail() {
  const router = useRouter();
  const { symbol } = router.query;
  const [coin, setCoin] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = 'https://script.google.com/macros/s/AKfycbzY1t4l6Osq7CQf8v5kwtvPnuWfBl1-GzD-KXz3LUl1zD_qyQVUa9T9o1LCzoOO3caP/exec';

  useEffect(() => {
    if (symbol) {
      fetchCoinDetails();
    }
  }, [symbol]);

  async function fetchCoinDetails() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?symbol=${symbol.toUpperCase()}`);
      const data = await res.json();
      setCoin(data);
    } catch (error) {
      console.error('Failed to fetch coin:', error);
    }
    setLoading(false);
  }

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (!coin) return <div className="p-6 text-center">Coin not found</div>;

  const parseUrls = (urlString) => {
    if (!urlString) return [];
    return urlString.split(',').map(url => url.trim()).filter(Boolean);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const parseTags = (tagString) => {
    if (!tagString) return [];
    return tagString.split(',').map(tag => tag.trim()).filter(Boolean);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="text-blue-600 hover:underline mb-6 flex items-center gap-2"
      >
        &lt; Back to search
      </button>

      {/* Header with Logo, Name, Symbol */}
      <div className="flex items-center gap-6 mb-8">
        {coin.logo && (
          <img 
            src={coin.logo} 
            alt={coin.name} 
            className="w-24 h-24 rounded-full shadow-lg" 
          />
        )}
        <div>
          <h1 className="text-5xl font-bold text-gray-900">{coin.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-2xl text-gray-600">{coin.symbol}</span>
            {coin.category && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {coin.category}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Price Card */}
      {coin.price_usd && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-8 mb-8 shadow-md">
          <p className="text-gray-600 text-sm font-medium mb-2">Current Price</p>
          <p className="text-5xl font-bold text-green-600">
            ${parseFloat(coin.price_usd).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 8
            })}
          </p>
        </div>
      )}

      {/* Description */}
      {coin.description && (
        <div className="mb-8 bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">About {coin.name}</h2>
          <p className="text-gray-700 leading-relaxed text-lg">{coin.description}</p>
        </div>
      )}

      {/* Notice (if any) */}
      {coin.notice && (
        <div className="mb-8 bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-lg">
          <p className="text-yellow-800 font-medium">⚠️ {coin.notice}</p>
        </div>
      )}

      {/* Official Resources */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-6 text-gray-900">Official Resources</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {coin.urls_website && parseUrls(coin.urls_website).length > 0 && (
            <LinkCard title="🌐 Website" urls={parseUrls(coin.urls_website)} />
          )}
          {coin.urls_technical_doc && parseUrls(coin.urls_technical_doc).length > 0 && (
            <LinkCard title="📄 Whitepaper" urls={parseUrls(coin.urls_technical_doc)} />
          )}
          {coin.urls_source_code && parseUrls(coin.urls_source_code).length > 0 && (
            <LinkCard title="💻 Source Code" urls={parseUrls(coin.urls_source_code)} />
          )}
          {coin.urls_explorer && parseUrls(coin.urls_explorer).length > 0 && (
            <LinkCard title="🔍 Block Explorers" urls={parseUrls(coin.urls_explorer)} />
          )}
        </div>
      </div>

      {/* Social & Community */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-6 text-gray-900">Social & Community</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coin.urls_twitter && parseUrls(coin.urls_twitter).length > 0 && (
            <LinkCard title="🐦 Twitter" urls={parseUrls(coin.urls_twitter)} />
          )}
          {coin.urls_reddit && parseUrls(coin.urls_reddit).length > 0 && (
            <LinkCard title="👽 Reddit" urls={parseUrls(coin.urls_reddit)} />
          )}
          {coin.urls_chat && parseUrls(coin.urls_chat).length > 0 && (
            <LinkCard title="💬 Chat" urls={parseUrls(coin.urls_chat)} />
          )}
          {coin.urls_message_board && parseUrls(coin.urls_message_board).length > 0 && (
            <LinkCard title="📋 Message Board" urls={parseUrls(coin.urls_message_board)} />
          )}
          {coin.urls_announcement && parseUrls(coin.urls_announcement).length > 0 && (
            <LinkCard title="📢 Announcements" urls={parseUrls(coin.urls_announcement)} />
          )}
        </div>
      </div>

      {/* Tags */}
      {coin.tags && parseTags(coin.tags).length > 0 && (
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-4 text-gray-900">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {parseTags(coin.tags).map((tag, i) => (
              <span 
                key={i} 
                className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium hover:shadow-md transition-shadow"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Technical Details */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-6 text-gray-900">Technical Details</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coin.category && <InfoCard label="Category" value={coin.category} />}
          {coin.platform && <InfoCard label="Platform" value={coin.platform} />}
          {coin.contract_address && (
            <InfoCard 
              label="Contract Address" 
              value={coin.contract_address} 
              mono 
            />
          )}
          {coin.date_added && (
            <InfoCard label="Date Added to CMC" value={formatDate(coin.date_added)} />
          )}
          {coin.date_launched && (
            <InfoCard label="Launch Date" value={formatDate(coin.date_launched)} />
          )}
          {coin.id && <InfoCard label="CMC ID" value={coin.id} />}
        </div>
      </div>
    </div>
  );
}

// Link Card Component
function LinkCard({ title, urls }) {
  if (!urls || urls.length === 0) return null;
  
  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="font-bold text-gray-900 mb-3 text-lg">{title}</h3>
      <ul className="space-y-2">
        {urls.map((url, i) => (
          <li key={i}>
            
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline text-sm break-all"
            >
              {url}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Info Card Component
function InfoCard({ label, value, mono = false }) {
  if (!value) return null;
  
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 border rounded-xl p-4 shadow-sm">
      <p className="text-gray-600 text-xs font-medium mb-2 uppercase tracking-wide">{label}</p>
      <p className={`font-semibold text-gray-900 ${mono ? 'font-mono text-xs' : 'text-base'} break-all`}>
        {value}
      </p>
    </div>
  );
}
