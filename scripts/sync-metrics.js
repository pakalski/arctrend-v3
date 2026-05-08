// scripts/sync-metrics.js
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase using environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Use the service role key for backend scripts
const supabase = createClient(supabaseUrl, supabaseKey);

const CHAINS = [
  { id: 'arc_testnet', url: 'https://testnet.arcscan.app/api/v2/stats' },
  { id: 'base_sepolia', url: 'https://base-sepolia.blockscout.com/api/v2/stats' },
  { id: 'arbitrum_sepolia', url: 'https://arbitrum-sepolia.blockscout.com/api/v2/stats' }
];

async function runSync() {
  console.log('Starting data synchronization for all networks...');
  const today = new Date().toISOString().split('T')[0];

  for (const chain of CHAINS) {
    try {
      console.log(`Fetching metrics for ${chain.id}...`);
      
      // 1. Fetch High-Level Stats from Blockscout V2
      const res = await fetch(chain.url);
      if (!res.ok) throw new Error(`Failed to fetch ${chain.id}: ${res.statusText}`);
      const stats = await res.json();

      const active_wallets = stats.active_addresses_24h || stats.total_addresses || 0;
      const new_wallets = stats.new_addresses_24h || 0;
      const tx_count = stats.transactions_24h || stats.transactions_today || 0;
      const new_contracts = stats.new_contracts_24h || 0;
      const avg_gas_fee = stats.average_gas_price ? parseFloat(stats.average_gas_price) : 0;

      // 2. Placeholder for deep institutional metrics (USDC Volume, etc.)
      // In the future, this is where you can add logic to paginate through 
      // the Etherscan-compatible API (/api?module=account&action=tokentx) 
      // to aggregate historical stablecoin transfers without timing out.
      const usdc_volume = 0; 

      // 3. Upsert data into Supabase
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
  
  console.log('Synchronization complete.');
}

runSync();
