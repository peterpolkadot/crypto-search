import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function CoinPage() {
  const router = useRouter();
  const { symbol } = router.query;
  const [coin, setCoin] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE =
    "https://script.google.com/macros/s/AKfycbx5InHS_BGPrTCwCm1fY4oezO3Xdwjqe4yE_AKKpLrbT1e_5fC_Vh5Xcfj7ImfknOy-/exec";

  useEffect(() => {
    if (!symbol) return; // Wait until route param is ready
    async function fetchCoin() {
      try {
        const res = await fetch(`${API_BASE}?symbol=${symbol}`);
        const data = await res.json();
        setCoin(data.error ? null : data);
      } catch (err) {
        console.error("Failed to fetch coin info:", err);
        setCoin(null);
      } finally {
        setLoading(false);
      }
    }
    fetchCoin();
  }, [symbol]);

  if (loading) return <p style={{ textAlign: "center", padding: "40px" }}>Loading...</p>;
  if (!coin) return <p style={{ textAlign: "center", padding: "40px" }}>No data found.</p>;

  return (
    <main
      style={{
        fontFamily: "Arial, sans-serif",
        textAlign: "center",
        padding: "40px",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      {coin.logo && (
        <img
          src={coin.logo}
          alt={coin.name}
          style={{ width: "80px", height: "80px", borderRadius: "50%" }}
        />
      )}
      <h1>
        {coin.name} ({coin.symbol})
      </h1>
      {coin.price_usd && (
        <p style={{ fontSize: "22px", color: "#0070f3" }}>
          ${Number(coin.price_usd).toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </p>
      )}
      <p style={{ color: "#555" }}>{coin.category}</p>

      <p style={{ marginTop: "20px", textAlign: "justify" }}>
        {coin.description}
      </p>

      {coin.urls_website && (
        <p style={{ marginTop: "20px" }}>
          🌐 <a href={coin.urls_website} target="_blank">{coin.urls_website}</a>
        </p>
      )}

      <button
        onClick={() => router.push("/")}
        style={{
          marginTop: "30px",
          background: "#0070f3",
          color: "white",
          border: "none",
          padding: "10px 16px",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        ← Back to Search
      </button>
    </main>
  );
}
