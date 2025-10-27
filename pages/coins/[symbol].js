import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function CoinPage() {
  const router = useRouter();
  const { symbol } = router.query;
  const [coin, setCoin] = useState(null);

  const API_BASE = "https://script.google.com/macros/s/AKfycbxXA0v3u4bWWLuvqxV34k6uYRlGFXInOgXuccgDaf6oikS1-zWSqEJwz6bbm1qWsocp/exec";

  useEffect(() => {
    if (!symbol) return;
    fetch(`${API_BASE}?symbol=${symbol}`)
      .then((res) => res.json())
      .then((data) => setCoin(data[0]))
      .catch(console.error);
  }, [symbol]);

  if (!symbol) return <p style={{ textAlign: "center" }}>Loading...</p>;
  if (!coin) return <p style={{ textAlign: "center" }}>No data for {symbol}</p>;

  return (
    <div style={{ textAlign: "center", fontFamily: "Arial", padding: "40px" }}>
      <h1>{coin.name} ({coin.symbol})</h1>
      <h2>${Number(coin.price_usd).toLocaleString()}</h2>
      <p>
        <a href="/" style={{ textDecoration: "none", color: "blue" }}>← Back to search</a>
      </p>
    </div>
  );
}
