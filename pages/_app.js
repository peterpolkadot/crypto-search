import '../styles/globals.css';
import Head from 'next/head';
import { Analytics } from '@vercel/analytics/react';
import Header from '../components/Header';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="robots" content="index,follow" />
        <meta name="description" content="Search and track live cryptocurrency prices for Bitcoin, Ethereum, Solana and thousands more. Get real-time crypto data and detailed coin information." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="og:title" content="Crypto Search - Live Cryptocurrency Prices & Data" />
        <meta property="og:description" content="Search and track live cryptocurrency prices for Bitcoin, Ethereum, Solana and thousands more. Get real-time crypto data and detailed coin information." />
        <meta property="og:url" content="https://www.01x2.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.01x2.com/og-image.png" />
        <meta property="og:image:alt" content="Crypto Search" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:site_name" content="Crypto Search" />
      </Head>
      
      <Header />
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
