// pages/sitemap.xml.js
export async function getServerSideProps({ res }) {
  const { supabase } = require('../lib/supabase');
  
  const { data: coins } = await supabase
    .from('coins')
    .select('symbol, slug, last_updated')
    .not('cmc_rank', 'is', null)
    .order('cmc_rank', { ascending: true })
    .limit(5000);

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>https://www.01x2.com/</loc>
        <changefreq>hourly</changefreq>
        <priority>1.0</priority>
      </url>
      ${coins.map(coin => `
        <url>
          <loc>https://www.01x2.com/coins/${coin.symbol}</loc>
          <lastmod>${coin.last_updated || new Date().toISOString()}</lastmod>
          <changefreq>hourly</changefreq>
          <priority>0.8</priority>
        </url>
      `).join('')}
    </urlset>`;

  res.setHeader('Content-Type', 'text/xml');
  res.write(sitemap);
  res.end();

  return { props: {} };
}

export default function Sitemap() {}
