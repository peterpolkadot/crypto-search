import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function CoinPage() {
  const router = useRouter();
  const { symbol } = router.query;
  const [coin, setCoin] = useState(null);

  useEffect(() => {
    if (!symbol) return;
    fetch(`https://script.google.com/macros/s/AKfycbwuKirWMqW7_xav3tZ04zoGVgbzeczzB6ER-BfqGAH24F6bn4rVC8uBXgEvp65LhAHz/exec?symbol=${symbol}`)
      .then(res => res.json())
      .then(setCoin)
      .catch(console.error);
  }, [symbol]);

  if (!coin) return <p>Loading...</p>;

  return (
    <div style={{ textAlign: 'center', fontFamily: 'Arial', padding: '40px' }}>
      <h1>{coin.name} ({coin.symbol})</h1>
      <h2>${Number(coin.price_usd).toLocaleString()}</h2>
    </div>
  );
}
