// scripts/sync-metrics.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const CHAINS = [
  { id: 'arc_testnet', url: 'https://testnet.arcscan.app/api/v2/stats' },
  { id: 'base_sepolia', url: 'https://base-sepolia.blockscout.com/api/v2/stats' },
  { id: 'arbitrum_sepolia', url: 'https://arbitrum-sepolia.blockscout.com/api/v2/stats' }
];

const safeParse = (val) => parseInt(String(val || '0').replace(/,/g, ''), 10) || 0;

async function runSync() {
  console.log('Starting pure data synchronization...');
  const today = new Date().toISOString().split('T')[0];

  for (const chain of CHAINS) {
    try {
      console.log(`Fetching metrics for ${chain.id}...`);
      
      const res = await fetch(chain.url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error(`Failed to fetch ${chain.id}: ${res.statusText}`);
      const stats = await res.json();

      const tx_count = safeParse(stats.transactions_24h || stats.transactions_today);
      const active_wallets = safeParse(stats.active_addresses_24h) || safeParse(stats.active_accounts_24h) || 0; 
      const new_wallets = safeParse(stats.new_addresses_24h);
      const new_contracts = safeParse(stats.new_contracts_24h);
      const avg_gas_fee = stats.average_gas_price ? parseFloat(stats.average_gas_price) : 0;
      const usdc_volume = 0; 

      const { error } = await supabase.from('network_snapshots').upsert({
        date: today,
        network: chain.id,
        active_wallets,
        new_wallets,
        tx_count,
        new_contracts,
        avg_gas_fee,
        usdc_volume
      }, { onConflict: 'date, network' });

      if (error) {
        console.error(`Supabase error for ${chain.id}:`, error.message);
      } else {
        console.log(`Successfully updated ${chain.id} for ${today}.`);
      }

    } catch (e) {
      console.error(`Error processing ${chain.id}:`, e.message);
    }
  }
}

runSync();
