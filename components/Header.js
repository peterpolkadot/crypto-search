// components/Header.js
export default function Header() {
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          💰 Crypto Search
        </a>
        <nav className="flex gap-6">
          <a href="/" className="text-gray-600 hover:text-blue-600">Home</a>
          <a href="/about" className="text-gray-600 hover:text-blue-600">About</a>
        </nav>
      </div>
    </header>
  );
}
