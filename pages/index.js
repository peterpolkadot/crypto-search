import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const [coins, setCoins] = useState([]);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const router = useRouter();

  const API_BASE = "https://script.google.com/macros/s/AKfycbx5InHS_BGPrTCwCm1fY4oezO3Xdwjqe4yE_AKKpLrbT1e_5fC_Vh5Xcfj7ImfknOy-/exec";

  // Fetch coins on load
  useEffect(() => {
    async function fetchCoins() {
      try {
        const res = await fetch(API_BASE);
        const text = await res.text();
        const json = JSON.parse(text.startsWith("[") ? text : `[${text}]`);
        if (Array.isArray(json)) setCoins(json);
      } catch (err) {
        console.error("Failed to fetch coins:", err);
      }
    }
    fetchCoins();
  }, []);

  // Handle search box input
  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearch(query);

    if (!coins.length || !query) {
      setFiltered([]);
      return;
    }

    const filteredCoins = coins.filter((c) => {
      const sym = typeof c.symbol === "string" ? c.symbol.toLowerCase() : "";
      const name = typeof c.name === "string" ? c.name.toLowerCase() : "";
      return sym.includes(query) || name.includes(query);
    });

    setFiltered(filteredCoins.slice(0, 20));
  };

  // Handle coin selection
  const handleSelect = (coin) => {
    setSearch(coin.symbol);
    setFiltered([]);
    setSelectedCoin(coin); // ✅ Display its data
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

      {selectedCoin && (
        <div
          style={{
            marginTop: "20px",
            background: "#f9f9f9",
            padding: "15px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <h2>
            {selectedCoin.name} ({selectedCoin.symbol})
          </h2>
          <p style={{ fontSize: "20px", margin: "10px 0", color: "#0070f3" }}>
            ${selectedCoin.price_usd?.toFixed(2) ?? "N/A"}
          </p>
          <button
            onClick={() => router.push(`/coins/${selectedCoin.symbol}`)}
            style={{
              background: "#0070f3",
              color: "white",
              border: "none",
              padding: "10px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            View {selectedCoin.symbol} Page →
          </button>
        </div>
      )}
    </main>
  );
}
