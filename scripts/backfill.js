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
  console.log('Initiating authentic historical data backfill...');

  for (const chain of CHAINS) {
    try {
      console.log(`Processing historical data for ${chain.id}...`);
      const historyMap = {};

      // 1. Fetch True Historical Transactions
      try {
        const txRes = await fetch(`${chain.baseUrl}/transactions`, { headers: { 'Accept': 'application/json' } });
        if (txRes.ok) {
          const txData = await txRes.json();
          const items = txData.chart_data || (Array.isArray(txData) ? txData : []);
          
          items.forEach(item => {
            if (!historyMap[item.date]) historyMap[item.date] = { date: item.date, network: chain.id };
            const txVal = String(item.tx_count || item.value || '0').replace(/,/g, '');
            historyMap[item.date].tx_count = parseInt(txVal, 10) || 0;
          });
        }
      } catch (e) {
        console.log(`Transactions historical fetch failed for ${chain.id}.`);
      }

      // 2. Fetch True Historical New Contracts
      try {
        const contractsRes = await fetch(`${chain.baseUrl}/new-contracts`, { headers: { 'Accept': 'application/json' } });
        if (contractsRes.ok) {
          const contractsData = await contractsRes.json();
          const items = contractsData.chart_data || (Array.isArray(contractsData) ? contractsData : []);
          
          items.forEach(item => {
            if (!historyMap[item.date]) historyMap[item.date] = { date: item.date, network: chain.id };
            const contractVal = String(item.new_contracts || item.value || '0').replace(/,/g, '');
            historyMap[item.date].new_contracts = parseInt(contractVal, 10) || 0;
          });
        }
      } catch (e) {
        console.log(`New contracts historical fetch failed for ${chain.id}.`);
      }

      // 3. Fetch True Historical Active Accounts
      try {
        const activeRes = await fetch(`${chain.baseUrl}/active-accounts`, { headers: { 'Accept': 'application/json' } });
        if (activeRes.ok) {
          const activeData = await activeRes.json();
          const items = activeData.chart_data || (Array.isArray(activeData) ? activeData : []);
          
          items.forEach(item => {
            if (!historyMap[item.date]) historyMap[item.date] = { date: item.date, network: chain.id };
            const walletVal = String(item.active_accounts || item.value || '0').replace(/,/g, '');
            historyMap[item.date].active_wallets = parseInt(walletVal, 10) || 0;
          });
        }
      } catch (e) {
        console.log(`Active accounts historical fetch failed for ${chain.id}.`);
      }

      const recordsToInsert = Object.values(historyMap);
      
      if (recordsToInsert.length === 0) {
        console.log(`No historical data located for ${chain.id}.`);
        continue;
      }

      console.log(`Preparing to insert ${recordsToInsert.length} historical records for ${chain.id}...`);

      for (let i = 0; i < recordsToInsert.length; i += 100) {
        const batch = recordsToInsert.slice(i, i + 100);
        const { error } = await supabase.from('network_snapshots').upsert(batch, { onConflict: 'date, network' });
        if (error) console.error(`Supabase insertion error for ${chain.id}:`, error.message);
      }
      
      console.log(`Successfully completed backfill for ${chain.id}.`);

    } catch (error) {
      console.error(`Critical error processing backfill for ${chain.id}:`, error.message);
    }
  }
}

runBackfill();
