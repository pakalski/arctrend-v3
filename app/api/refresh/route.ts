import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const CHAINS = [
  { id: 'arc_testnet', url: 'https://testnet.arcscan.app/api/v2/stats' },
  { id: 'base_sepolia', url: 'https://base-sepolia.blockscout.com/api/v2/stats' },
  { id: 'arbitrum_sepolia', url: 'https://arbitrum-sepolia.blockscout.com/api/v2/stats' }
];

export async function GET(request: Request) {
  // Optional: Secure this endpoint so only Vercel Cron or authorized admins can trigger it
  const authHeader = request.headers.get('authorization');
  const url = new URL(request.url);
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}` || url.searchParams.get('secret') === process.env.CRON_SECRET;

  const today = new Date().toISOString().split('T')[0];
  const results = [];

  for (const chain of CHAINS) {
    try {
      const res = await fetch(chain.url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to fetch ${chain.id}`);
      
      const stats = await res.json();

      // Map Blockscout V2 stats to your Supabase Schema
      const active_wallets = stats.active_addresses_24h || stats.total_addresses || 0;
      const new_wallets = stats.new_addresses_24h || 0;
      const tx_count = stats.transactions_24h || stats.transactions_today || 0;
      const new_contracts = stats.new_contracts_24h || 0;
      const avg_gas_fee = stats.average_gas_price ? parseFloat(stats.average_gas_price) : 0;
      
      // USDC Volume and Deep Institutional metrics require indexed contract scraping
      // Setting defaults here to satisfy schema until deep indexing is added
      const usdc_volume = 0; 

      const { data, error } = await supabase.from('network_snapshots').upsert({
        date: today,
        network: chain.id,
        active_wallets,
        new_wallets,
        tx_count,
        new_contracts,
        avg_gas_fee,
        usdc_volume
      }, { onConflict: 'date, network' });

      if (error) throw error;
      results.push({ chain: chain.id, status: 'success' });

    } catch (e: any) {
      console.error(`Error processing ${chain.id}:`, e);
      results.push({ chain: chain.id, status: 'error', error: e.message });
    }
  }

  return NextResponse.json({ success: true, results, timestamp: new Date().toISOString() });
}
