import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const router = useRouter();

  const categories = [
    { slug: 'defi', name: 'DeFi', emoji: '💎' },
    { slug: 'memes', name: 'Memes', emoji: '🐕' },
    { slug: 'layer-1', name: 'Layer 1', emoji: '🔷' },
    { slug: 'stablecoin', name: 'Stablecoin', emoji: '💵' },
    { slug: 'nfts-collectibles', name: 'NFTs', emoji: '🎨' },
    { slug: 'ethereum-ecosystem', name: 'Ethereum', emoji: '⟠' },
    { slug: 'solana-ecosystem', name: 'Solana', emoji: '◎' },
    { slug: 'bnb-chain-ecosystem', name: 'BNB Chain', emoji: '🟡' },
    { slug: 'avalanche-ecosystem', name: 'Avalanche', emoji: '🔺' },
    { slug: 'arbitrum-ecosystem', name: 'Arbitrum', emoji: '🔵' },
    { slug: 'ai-agents', name: 'AI Agents', emoji: '🤖' },
    { slug: 'depin', name: 'DePIN', emoji: '📡' },
    { slug: 'liquid-staking', name: 'Liquid Staking', emoji: '💧' },
    { slug: 'metaverse', name: 'Metaverse', emoji: '🌐' },
    { slug: 'gaming', name: 'Gaming', emoji: '🎮' },
    { slug: 'a16z-portfolio', name: 'a16z Portfolio', emoji: '🏢' },
    { slug: 'coinbase-ventures', name: 'Coinbase Ventures', emoji: '🏢' },
    { slug: 'dex', name: 'DEX', emoji: '🔄' },
    { slug: 'ai-big-data', name: 'AI & Big Data', emoji: '🧠' },
    { slug: 'cex', name: 'CEX', emoji: '🏦' },
  ];

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-3xl">💰</span>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform">
              Crypto Search
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={`text-gray-700 hover:text-blue-600 font-medium transition-colors ${
                router.pathname === '/' ? 'text-blue-600' : ''
              }`}
            >
              Home
            </Link>

            <div className="relative">
              <button
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                onBlur={() => setTimeout(() => setCategoriesOpen(false), 200)}
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors flex items-center gap-1"
              >
                Categories
                <svg
                  className={`w-4 h-4 transition-transform ${categoriesOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {categoriesOpen && (
                <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 w-64 max-h-96 overflow-y-auto">
                  {categories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/category/${cat.slug}`}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all"
                      onClick={() => setCategoriesOpen(false)}
                    >
                      <span className="text-xl">{cat.emoji}</span>
                      <span className="text-gray-700 font-medium">{cat.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-700 hover:text-blue-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <Link
              href="/"
              className="block py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>

            <div className="py-2">
              <p className="text-gray-500 text-sm font-semibold mb-2">Categories</p>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/category/${cat.slug}`}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-lg transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>{cat.emoji}</span>
                    <span className="text-sm text-gray-700 font-medium">{cat.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
