import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const [coins, setCoins] = useState([]);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState([]);
  const router = useRouter();

  const API_BASE =
    "https://script.google.com/macros/s/AKfycbz7qbbd9vly8ppB6uR1JCNlL2ZWkpTiCkrzo6HcN_3RW_MrxqdfDu832a-IDXdeexZS/exec";

  useEffect(() => {
    async function fetchCoins() {
      try {
        const res = await fetch(API_BASE);
        const text = await res.text();

        // Handle plain-text or malformed JSON responses gracefully
        const json = JSON.parse(
          text.startsWith("[") ? text : `[${text}]`
        );

        if (Array.isArray(json)) {
          setCoins(json);
        } else {
          console.error("Unexpected data:", json);
        }
      } catch (err) {
        console.error("Failed to fetch coin list:", err);
      }
    }

    fetchCoins();
  }, []);

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearch(query);

    if (query.length > 0) {
      const filteredCoins = coins.filter(
        (c) =>
          (c.symbol && c.symbol.toLowerCase().includes(query)) ||
          (c.name && c.name.toLowerCase().includes(query))
      );
      setFiltered(filteredCoins.slice(0, 20)); // Limit to 20 results
    } else {
      setFiltered([]);
    }
  };

  const handleSelect = (coin) => {
    setSearch(coin.symbol);
    setFiltered([]);
    router.push(`/coins/${coin.symbol}`); // Redirect to coin page
  };

  return (
    <main
      style={{
        fontFamily: "Arial, sans-serif",
        textAlign: "center",
        padding: "40px",
        maxWidth: "500px",
        margin: "0 auto",
      }}
    >
      <h1>💰 Crypto Search</h1>
      <input
        type="text"
        placeholder="Search for a coin..."
        value={search}
        onChange={handleSearch}
        style={{
          padding: "10px",
          width: "100%",
          borderRadius: "8px",
          border: "1px solid #ccc",
          fontSize: "16px",
          marginBottom: "10px",
        }}
      />

      {filtered.length > 0 && (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            maxHeight: "200px",
            overflowY: "auto",
            background: "#fff",
            textAlign: "left",
          }}
        >
          {filtered.map((coin) => (
            <div
              key={coin.symbol}
              onClick={() => handleSelect(coin)}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                borderBottom: "1px solid #eee",
              }}
            >
              <strong>{coin.symbol}</strong> — {coin.name}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
