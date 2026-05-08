'use client';
import { useState, useEffect } from 'react';
import KpiChart from '@/components/KpiChart';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [data, setData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('all');

  const loadData = async () => {
    const { data: result, error } = await supabase
      .from('network_snapshots')
      .select('*')
      .order('date', { ascending: true });
    
    if (error) console.error("Error loading data:", error);
    setData(result || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredData = data.filter(row => {
    const rowDate = new Date(row.date);
    const now = new Date();
    if (timeRange === '7d') return rowDate >= new Date(now.getTime() - 7*24*60*60*1000);
    if (timeRange === '30d') return rowDate >= new Date(now.getTime() - 30*24*60*60*1000);
    if (timeRange === '90d') return rowDate >= new Date(now.getTime() - 90*24*60*60*1000);
    if (timeRange === '180d') return rowDate >= new Date(now.getTime() - 180*24*60*60*1000);
    if (timeRange === '365d') return rowDate >= new Date(now.getTime() - 365*24*60*60*1000);
    return true;
  });

  const getLatest = (network: string) => {
    const chainData = filteredData.filter(d => d.network === network);
    return chainData.length > 0 ? chainData[chainData.length - 1] : null;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="border-b border-slate-800 bg-slate-900 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 py-6 flex flex-col md:flex-row md:justify-between md:items-center gap-6">
          <div>
            <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">ArcTrend</h1>
            <p className="text-slate-400 text-xl mt-2">Institutional Multi-Chain KPI Tracking</p>
          </div>
          <div className="flex items-center gap-4">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)} 
              className="bg-slate-950 border border-slate-700 rounded-xl px-5 py-3 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 3 Months</option>
              <option value="180d">Last 6 Months</option>
              <option value="365d">Last Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex flex-wrap gap-2 border-b border-slate-800 mb-8">
          {[
            { id: 'overview', label: 'Network Overview' },
            { id: 'competitive', label: 'Competitive Benchmark' },
            { id: 'institutional', label: 'Institutional Signals' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-semibold rounded-t-xl transition-all ${
                activeTab === tab.id 
                ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-400' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <p className="text-slate-400 text-sm font-medium mb-1">Today's Active Wallets</p>
                <p className="text-3xl font-bold text-emerald-400">{getLatest('arc_testnet')?.active_wallets?.toLocaleString() || '0'}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <p className="text-slate-400 text-sm font-medium mb-1">24h Transactions</p>
                <p className="text-3xl font-bold text-blue-400">{getLatest('arc_testnet')?.tx_count?.toLocaleString() || '0'}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <p className="text-slate-400 text-sm font-medium mb-1">New Contracts</p>
                <p className="text-3xl font-bold text-fuchsia-400">{getLatest('arc_testnet')?.new_contracts?.toLocaleString() || '0'}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <p className="text-slate-400 text-sm font-medium mb-1">Avg Gas Fee</p>
                <p className="text-3xl font-bold text-amber-400">{getLatest('arc_testnet')?.avg_gas_fee?.toLocaleString() || '0'} <span className="text-sm font-normal text-slate-500">wei</span></p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <KpiChart title="Daily Active Wallets (DAA)" data={filteredData.filter(d => d.network === 'arc_testnet')} dataKey="active_wallets" color="#34d399" />
              <KpiChart title="Transactions (24h)" data={filteredData.filter(d => d.network === 'arc_testnet')} dataKey="tx_count" color="#60a5fa" />
              <KpiChart title="New Wallets (24h)" data={filteredData.filter(d => d.network === 'arc_testnet')} dataKey="new_wallets" color="#c084fc" />
              <KpiChart title="New Contracts Deployed" data={filteredData.filter(d => d.network === 'arc_testnet')} dataKey="new_contracts" color="#fbbf24" />
            </div>
          </div>
        )}

        {activeTab === 'competitive' && (
          <div className="animate-in fade-in duration-500 space-y-10">
            <div>
              <h2 className="text-2xl font-bold mb-6">Latest 24h Snapshot</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-emerald-950/30 border border-emerald-500/30 p-6 rounded-2xl">
                  <h3 className="text-emerald-400 font-bold text-xl mb-4">Arc Testnet</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-slate-400">Active Wallets:</span> <span className="font-medium">{getLatest('arc_testnet')?.active_wallets?.toLocaleString() || 0}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Transactions:</span> <span className="font-medium">{getLatest('arc_testnet')?.tx_count?.toLocaleString() || 0}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">New Contracts:</span> <span className="font-medium">{getLatest('arc_testnet')?.new_contracts?.toLocaleString() || 0}</span></div>
                  </div>
                </div>
                <div className="bg-blue-950/30 border border-blue-500/30 p-6 rounded-2xl">
                  <h3 className="text-blue-400 font-bold text-xl mb-4">Base Sepolia</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-slate-400">Active Wallets:</span> <span className="font-medium">{getLatest('base_sepolia')?.active_wallets?.toLocaleString() || 0}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Transactions:</span> <span className="font-medium">{getLatest('base_sepolia')?.tx_count?.toLocaleString() || 0}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">New Contracts:</span> <span className="font-medium">{getLatest('base_sepolia')?.new_contracts?.toLocaleString() || 0}</span></div>
                  </div>
                </div>
                <div className="bg-purple-950/30 border border-purple-500/30 p-6 rounded-2xl">
                  <h3 className="text-purple-400 font-bold text-xl mb-4">Arbitrum Sepolia</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-slate-400">Active Wallets:</span> <span className="font-medium">{getLatest('arbitrum_sepolia')?.active_wallets?.toLocaleString() || 0}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Transactions:</span> <span className="font-medium">{getLatest('arbitrum_sepolia')?.tx_count?.toLocaleString() || 0}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">New Contracts:</span> <span className="font-medium">{getLatest('arbitrum_sepolia')?.new_contracts?.toLocaleString() || 0}</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-6">Historical Comparison</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="text-emerald-400 font-semibold mb-4">Arc Testnet Trend</h3>
                  <KpiChart title="Daily Active Wallets" data={filteredData.filter(d => d.network === 'arc_testnet')} dataKey="active_wallets" color="#34d399" />
                </div>
                <div>
                  <h3 className="text-blue-400 font-semibold mb-4">Base Sepolia Trend</h3>
                  <KpiChart title="Daily Active Wallets" data={filteredData.filter(d => d.network === 'base_sepolia')} dataKey="active_wallets" color="#60a5fa" />
                </div>
                <div>
                  <h3 className="text-purple-400 font-semibold mb-4">Arbitrum Sepolia Trend</h3>
                  <KpiChart title="Daily Active Wallets" data={filteredData.filter(d => d.network === 'arbitrum_sepolia')} dataKey="active_wallets" color="#c084fc" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'institutional' && (
          <div className="animate-in fade-in duration-500 mt-4 p-10 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
            <div className="mb-10">
              <h2 className="text-3xl font-bold mb-2">Institutional Signals</h2>
              <p className="text-slate-400">Deep metrics indicating sophisticated capital movement on Arc.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <KpiChart title="USDC Bridge Volume (Simulated/Placeholder)" data={filteredData.filter(d => d.network === 'arc_testnet')} dataKey="usdc_volume" color="#0ea5e9" prefix="$" />
              <KpiChart title="Average Gas Fee (Wei)" data={filteredData.filter(d => d.network === 'arc_testnet')} dataKey="avg_gas_fee" color="#f43f5e" />
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-slate-800 mt-20">
        <div className="max-w-7xl mx-auto px-8 py-8 text-center text-slate-500 text-sm">
          ArcTrend Data Dashboard • Real-time metrics indexed via Blockscout V2 API
        </div>
      </footer>
    </div>
  );
}
