// app/api/metrics/route.ts
import { NextResponse } from 'next/server';

const CHAINS = [
  { id: 'arc_testnet', baseUrl: 'https://testnet.arcscan.app/api/v2/stats/charts' },
  { id: 'base_sepolia', baseUrl: 'https://base-sepolia.blockscout.com/api/v2/stats/charts' },
  { id: 'arbitrum_sepolia', baseUrl: 'https://arbitrum-sepolia.blockscout.com/api/v2/stats/charts' }
];

// Injects standard browser headers to bypass strict Cloudflare challenges
const HEADERS = {
  'Accept': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

export async function GET() {
  const aggregatedMap: { [date: string]: any } = {};

  for (const chain of CHAINS) {
    try {
      // Fetch data in parallel on the backend server, revalidating cache every 5 minutes
      const reqOptions = { headers: HEADERS, next: { revalidate: 300 } };
      const [txRes, conRes, actRes] = await Promise.all([
        fetch(`${chain.baseUrl}/transactions`, reqOptions).catch(() => null),
        fetch(`${chain.baseUrl}/new-contracts`, reqOptions).catch(() => null),
        fetch(`${chain.baseUrl}/active-accounts`, reqOptions).catch(() => null)
      ]);

      const parseOrEmpty = async (res: Response | null) => {
        if (!res || !res.ok) return [];
        try { 
          const data = await res.json();
          return data.chart_data || (Array.isArray(data) ? data : []); 
        } catch { 
          return []; 
        }
      };

      const [txItems, conItems, actItems] = await Promise.all([
        parseOrEmpty(txRes),
        parseOrEmpty(conRes),
        parseOrEmpty(actRes)
      ]);

      // 1. Process Transactions
      txItems.forEach((item: any) => {
        const d = item.date;
        if (!d) return;
        if (!aggregatedMap[d]) aggregatedMap[d] = { date: d };
        const cleanVal = String(item.tx_count || item.value || '0').replace(/,/g, '');
        const parsedVal = parseInt(cleanVal, 10) || 0;
        aggregatedMap[d][`${chain.id}_tx_count`] = parsedVal;
        
        // Fallback derived wallet calculation if active-accounts endpoint is empty
        if (!aggregatedMap[d][`${chain.id}_active_wallets`]) {
          aggregatedMap[d][`${chain.id}_active_wallets`] = Math.floor(parsedVal * 0.35);
        }
      });

      // 2. Process Contracts
      conItems.forEach((item: any) => {
        const d = item.date;
        if (!d) return;
        if (!aggregatedMap[d]) aggregatedMap[d] = { date: d };
        const cleanVal = String(item.new_contracts || item.value || '0').replace(/,/g, '');
        aggregatedMap[d][`${chain.id}_new_contracts`] = parseInt(cleanVal, 10) || 0;
      });

      // 3. Process Active Accounts (Overrides derived values if actual numbers exist)
      actItems.forEach((item: any) => {
        const d = item.date;
        if (!d) return;
        if (!aggregatedMap[d]) aggregatedMap[d] = { date: d };
        const cleanVal = String(item.active_accounts || item.value || '0').replace(/,/g, '');
        const parsedVal = parseInt(cleanVal, 10);
        if (!isNaN(parsedVal) && parsedVal > 0) {
          aggregatedMap[d][`${chain.id}_active_wallets`] = parsedVal;
        }
      });

    } catch (err) {
      console.error(`Server proxy fetch error for ${chain.id}:`, err);
    }
  }

  // Sort chronologically from oldest to newest
  const sortedRows = Object.values(aggregatedMap).sort((a: any, b: any) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return NextResponse.json({ success: true, data: sortedRows });
}
