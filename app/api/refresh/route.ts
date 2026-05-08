// app/api/refresh/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const today = new Date().toISOString().split('T')[0];

  try {
    // Get basic stats from Blockscout
    const statsRes = await fetch('https://testnet.arcscan.app/api/v2/stats');
    const stats = await statsRes.json();

    await supabase.from('network_snapshots').upsert({
      date: today,
      network: 'arc_testnet',
      active_wallets: stats.total_addresses || 0,
      tx_count: stats.transactions_24h || stats.transactions_today || 0,
      new_contracts: stats.new_contracts_24h || 0,
      avg_gas_fee: stats.average_gas_price || 0,
      // Add more fields as we discover better sources
    });

    return NextResponse.json({ success: true, message: 'Data refreshed' });
  } catch (e) {
    return NextResponse.json({ success: false, error: e }, { status: 500 });
  }
}
