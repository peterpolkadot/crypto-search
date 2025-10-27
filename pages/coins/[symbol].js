import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

export default function CoinDetail() {
  const router = useRouter();
  const { slug } = router.query;
  const [coin, setCoin] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';

  useEffect(() => {
    if (slug) {
      fetchCoinDetails();
    }
  }, [slug]);

  async function fetchCoinDetails() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?symbol=${slug.toUpperCase()}`);
      const data = await res.json();
      setCoin(data);
    } catch (error) {
      console.error('Failed to fetch coin:', error);
    }
    setLoading(false);
  }

  if (loading) return <div className="p-6">Loading...</div>;
  if (!coin) return <div className="p-6">Coin not found</div>;

  const parseUrls = (urlString) => {
    if (!urlString) return [];
    return urlString.split(',').map(url => url.trim()).filter(Boolean);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        {coin.logo && <img src={coin.logo} alt={coin.name} className="w-20 h-20" />}
        <div>
          <h1 className="text-4xl font-bold">{coin.name}</h1>
          <p className="text-xl text-gray-600">{coin.symbol}</p>
        </div>
      </div>

      {/* Price */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <p className="text-gray-600 mb-2">Current Price</p>
        <p className="text-4xl font-bold text-green-600">
          ${parseFloat(coin.price_usd).toLocaleString()}
        </p>
      </div>

      {/* Description */}
      {coin.description && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-3">About</h2>
          <p className="text-gray-700 leading-relaxed">{coin.description}</p>
        </div>
      )}

      {/* Official Links */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Website */}
        {coin.urls_website && (
          <LinkSection title="🌐 Website" urls={parseUrls(coin.urls_website)} />
        )}

        {/* Whitepaper */}
        {coin.urls_technical_doc && (
          <LinkSection title="📄 Whitepaper" urls={parseUrls(coin.urls_technical_doc)} />
        )}

        {/* Source Code */}
        {coin.urls_source_code && (
          <LinkSection title="💻 Source Code" urls={parseUrls(coin.urls_source_code)} />
        )}

        {/* Explorers */}
        {coin.urls_explorer && (
          <LinkSection title="🔍 Block Explorers" urls={parseUrls(coin.urls_explorer)} />
        )}
      </div>

      {/* Social Links */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-3">Social & Community</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {coin.urls_twitter && (
            <LinkSection title="🐦 Twitter" urls={parseUrls(coin.urls_twitter)} />
          )}
          {coin.urls_reddit && (
            <LinkSection title="👽 Reddit" urls={parseUrls(coin.urls_reddit)} />
          )}
          {coin.urls_chat && (
            <LinkSection title="💬 Chat" urls={parseUrls(coin.urls_chat)} />
          )}
          {coin.urls_message_board && (
            <LinkSection title="📋 Message Board" urls={parseUrls(coin.urls_message_board)} />
          )}
          {coin.urls_announcement && (
            <LinkSection title="📢 Announcements" urls={parseUrls(coin.urls_announcement)} />
          )}
        </div>
      </div>

      {/* Tags */}
      {coin.tags && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-3">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {coin.tags.split(',').map((tag, i) => (
              <span key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {tag.trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Additional Info */}
      <div className="grid md:grid-cols-2 gap-4 text-sm">
        {coin.category && (
          <InfoItem label="Category" value={coin.category} />
        )}
        {coin.platform && (
          <InfoItem label="Platform" value={coin.platform} />
        )}
        {coin.date_added && (
          <InfoItem label="Date Added" value={new Date(coin.date_added).toLocaleDateString()} />
        )}
        {coin.date_launched && (
          <InfoItem label="Date Launched" value={new Date(coin.date_launched).toLocaleDateString()} />
        )}
      </div>
    </div>
  );
}

function LinkSection({ title, urls }) {
  if (!urls.length) return null;
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-2">{title}</h3>
      <ul className="space-y-1">
        {urls.map((url, i) => (
          <li key={i}>
            
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              {url}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="border rounded-lg p-3">
      <p className="text-gray-600 text-xs mb-1">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
