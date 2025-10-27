import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const [coins, setCoins] = useState([]);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState([]);
  const router = useRouter();
  const timeoutRef = useRef(null);

  const API_BASE =
    "https://script.google.com/macros/s/AKfycbx5InHS_BGPrTCwCm1fY4oezO3Xdwjqe4yE_AKKpLrbT1e_5fC_Vh5Xcfj7ImfknOy-/exec";

  // Fetch once on load
  useEffect(() => {
    async function fetchCoins() {
      try {
        const res = await fetch(API_BASE);
        const data = await res.json();
        if (Array.isArray(data)) setCoins(data);
      } catch (err) {
        console.error("Failed to fetch coin list:", err);
      }
    }
    fetchCoins();
  }, []);

  // Handle typing (debounced)
  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearch(query);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      if (!query) {
        setFiltered([]);
        return;
      }
      const filteredCoins = coins.filter(
        (c) =>
          (c.symbol &&
            c.symbol.toLowerCase().startsWith(query)) ||
          (c.name &&
            c.name.toLowerCase().startsWith(query))
      );
      setFiltered(filteredCoins.setFiltered(filteredCoins.slice(0, 20));
console.log("Filtered:", filteredCoins.length, "coins");
slice(0, 20)); // Limit results
    }, 150);
  };

  const handleSelect = (coin) => {
    setSearch("");
    setFiltered([]);
    router.push(`/coins/${coin.symbol}`);
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
            background: "#fff",
            textAlign: "left",
            overflowY: "auto",
            maxHeight: "300px",
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
