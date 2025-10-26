export default function Home() {
  return (
    <main style={{ fontFamily: 'Arial', textAlign: 'center', padding: '50px' }}>
      <h1>Crypto Search 🔍</h1>
      <p>Type a coin ticker (like BTC) in the URL:</p>
      <code style={{ fontSize: '18px', background: '#eee', padding: '4px 8px', borderRadius: '4px' }}>
        /coins/BTC
      </code>
      <p style={{ marginTop: '20px' }}>Or build a search box here later 😎</p>
    </main>
  );
}
