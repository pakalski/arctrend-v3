// scripts/backfill.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const CHAINS = [
  { id: 'arc_testnet', baseUrl: 'https://testnet.arcscan.app/api/v2/stats/charts' },
  { id: 'base_sepolia', baseUrl: 'https://base-sepolia.blockscout.com/api/v2/stats/charts' },
  { id: 'arbitrum_sepolia', baseUrl: 'https://arbitrum-sepolia.blockscout.com/api/v2/stats/charts' }
];

async function runBackfill() {
  console.log('Initiating historical data backfill...');

  for (const chain of CHAINS) {
    try {
      console.log(`Processing historical data for ${chain.id}...`);
      const historyMap = {};

      // 1. Fetch Historical Transactions
      try {
        const txRes = await fetch(`${chain.baseUrl}/transactions`);
        if (txRes.ok) {
          const txData = await txRes.json();
          if (txData.chart_data) {
            txData.chart_data.forEach(item => {
              if (!historyMap[item.date]) historyMap[item.date] = { date: item.date, network: chain.id };
              historyMap[item.date].tx_count = parseInt(item.tx_count || item.value || 0);
            });
          }
        }
      } catch (e) {
        console.log(`Transactions historical fetch failed for ${chain.id}.`);
      }

      // 2. Fetch Historical New Contracts
      try {
        const contractsRes = await fetch(`${chain.baseUrl}/new-contracts`);
        if (contractsRes.ok) {
          const contractsData = await contractsRes.json();
          if (contractsData.chart_data) {
            contractsData.chart_data.forEach(item => {
              if (!historyMap[item.date]) historyMap[item.date] = { date: item.date, network: chain.id };
              historyMap[item.date].new_contracts = parseInt(item.new_contracts || item.value || 0);
            });
          }
        }
      } catch (e) {
        console.log(`New contracts historical fetch failed for ${chain.id}.`);
      }

      const recordsToInsert = Object.values(historyMap);
      
      if (recordsToInsert.length === 0) {
        console.log(`No historical data located for ${chain.id}.`);
        continue;
      }

      console.log(`Preparing to insert ${recordsToInsert.length} historical records for ${chain.id}...`);

      // Upsert data into Supabase in batches of 100 to maintain stability
      for (let i = 0; i < recordsToInsert.length; i += 100) {
        const batch = recordsToInsert.slice(i, i + 100);
        const { error } = await supabase.from('network_snapshots').upsert(batch, { onConflict: 'date, network' });
        
        if (error) {
          console.error(`Supabase insertion error for ${chain.id}:`, error.message);
        }
      }
      
      console.log(`Successfully completed backfill for ${chain.id}.`);

    } catch (error) {
      console.error(`Critical error processing backfill for ${chain.id}:`, error.message);
    }
  }
  
  console.log('Historical backfill procedure complete.');
}

runBackfill();
