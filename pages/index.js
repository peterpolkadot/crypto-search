import { useState, useEffect } from "react";

export default function Home() {
  const [coins, setCoins] = useState([]);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState(null);

  const API_BASE = "https://script.google.com/macros/s/AKfycbz7qbbd9vly8ppB6uR1JCNlL2ZWkpTiCkrzo6HcN_3RW_MrxqdfDu832a-IDXdeexZS/exec";

  useEffect(() => {
    async function fetchCoins() {
      try {
        const res = await fetch(API_BASE);
        const data = await res.json();
        setCoins(data);
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
      setFiltered(
        coins.filter(
          (c) =>
            c.symbol.toLowerCase().includes(query) ||
            c.name.toLowerCase().includes(query)
        )
      );
    } else {
      setFiltered([]);
    }
  };

  const handleSelect = (coin) => {
    setSelected(coin);
    setFiltered([]);
    setSearch(coin.symbol);
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
        placeholder="Search coin symbol..."
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

      {selected && (
        <div style={{ marginTop: "20px" }}>
          <h2>
            {selected.name} ({selected.symbol})
          </h2>
          <p style={{ fontSize: "20px" }}>
            💵 {Number(selected.price_usd).toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            })}
          </p>
        </div>
      )}
    </main>
  );
}
