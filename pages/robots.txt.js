// pages/robots.txt.js
export async function getServerSideProps({ res }) {
  const robots = `User-agent: *
Allow: /
Sitemap: https://www.01x2.com/sitemap.xml`;

  res.setHeader('Content-Type', 'text/plain');
  res.write(robots);
  res.end();

  return { props: {} };
}

export default function Robots() {}
