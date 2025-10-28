import { supabase } from '../lib/supabase';

export async function getServerSideProps({ res }) {
  const { data: coins } = await supabase.from('coins').select('symbol, updated_at');

  const baseUrl = 'https://crypto-search2.vercel.app';
  const urls = (coins || [])
    .map(coin => {
      const loc = `${baseUrl}/coins/${coin.symbol.toLowerCase()}`;
      const lastmod = coin.updated_at
        ? new Date(coin.updated_at).toISOString()
        : new Date().toISOString();
      return `
        <url>
          <loc>${loc}</loc>
          <lastmod>${lastmod}</lastmod>
          <changefreq>hourly</changefreq>
          <priority>0.8</priority>
        </url>`;
    })
    .join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls}
  </urlset>`;

  res.setHeader('Content-Type', 'text/xml');
  res.write(sitemap);
  res.end();

  return { props: {} };
}

export default function SiteMap() {
  return null;
}
