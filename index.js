import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();
  const [listings, setListings] = useState([]);
  const [query, setQuery] = useState("");

  const API_BASE = "https://script.google.com/macros/s/AKfycbz7qbbd9vly8ppB6uR1JCNlL2ZWkpTiCkrzo6HcN_3RW_MrxqdfDu832a-IDXdeexZS/exec";

  useEffect(() => {
    async function loadData() {
      const res = await fetch(API_BASE);
      const data = await res.json();
      setListings(data);
    }
    loadData();
  }, []);

  const filtered = listings.filter(
    (c) => c.symbol && c.symbol.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div style={{ textAlign: "center", fontFamily: "Arial", padding: "40px" }}>
      <h1>Crypto Search</h1>
      <input
        placeholder="Type ticker (e.g. BTC)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ width: 300, padding: 10, fontSize: 16 }}
      />
      <ul style={{ listStyle: "none", padding: 0, maxWidth: 300, margin: "20px auto", textAlign: "left" }}>
        {filtered.slice(0, 10).map((c) => (
          <li
            key={c.symbol}
            style={{ padding: "8px", cursor: "pointer" }}
            onClick={() => router.push(`/coins/${c.symbol}`)}
          >
            {c.symbol} — {c.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
