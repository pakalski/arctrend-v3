'use client';
import { useState, useEffect } from 'react';
import KpiChart from '@/components/KpiChart';

const CHAINS = [
  { id: 'arc_testnet', name: 'Arc Testnet', color: '#10b981' },
  { id: 'base_sepolia', name: 'Base Sepolia', color: '#3b82f6' },
  { id: 'arbitrum_sepolia', name: 'Arbitrum Sepolia', color: '#c084fc' }
];

export default function AnalyticsPage() {
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'tx_count' | 'new_contracts' | 'active_wallets'>('tx_count');

  useEffect(() => {
    async function loadProxyData() {
      try {
        // Fetch securely from your local Vercel server proxy to bypass CORS entirely
        const res = await fetch('/api/metrics');
        if (res.ok) {
          const result = await res.json();
          if (result.success) {
            setHistoryData(result.data || []);
          }
        }
      } catch (err) {
        console.error('Failed to load proxy metrics:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProxyData();
  }, []);

  const metricTitles = {
    tx_count: 'Daily Transaction Volume',
    active_wallets: 'Daily Active Wallets (DAA)',
    new_contracts: 'New Smart Contracts Deployed'
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="border-b border-slate-800 pb-6 mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Institutional Cross-Chain Analytics
            </h1>
            <p className="text-slate-400 mt-2 text-lg">Secure Server Proxy Feed • Reliable Multi-Chain Trend Analysis</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-xl overflow-x-auto w-full md:w-auto">
            {(['tx_count', 'active_wallets', 'new_contracts'] as const).map(m => (
              <button
                key={m}
                onClick={() => setSelectedMetric(m)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  selectedMetric === m 
                    ? 'bg-slate-800 text-emerald-400 shadow border-b border-emerald-500/30' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {metricTitles[m]}
              </button>
            ))}
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center items-center h-64 text-slate-500 animate-pulse text-xl">
            Fetching cross-chain historical metrics via Vercel secure proxy...
          </div>
        ) : (
          <div className="space-y-12">
            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {CHAINS.map(net => (
                <div key={net.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: net.color }}></span>
                    {net.name}
                  </h2>
                  <KpiChart 
                    title={metricTitles[selectedMetric]}
                    data={historyData.map(d => ({ date: d.date, val: d[`${net.id}_${selectedMetric}`] || 0 }))} 
                    dataKey="val" 
                    color={net.color} 
                  />
                </div>
              ))}
            </div>

            {/* Aggregated Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/50">
                <h3 className="font-semibold text-slate-300">Aggregated Audit Log</h3>
              </div>
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left text-sm text-slate-400">
                  <thead className="bg-slate-950 text-slate-300 sticky top-0 border-b border-slate-800 z-10">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4 text-emerald-400 font-semibold text-right">Arc {selectedMetric === 'tx_count' ? 'Txs' : selectedMetric === 'active_wallets' ? 'Wallets' : 'Contracts'}</th>
                      <th className="px-6 py-4 text-blue-400 font-semibold text-right">Base {selectedMetric === 'tx_count' ? 'Txs' : selectedMetric === 'active_wallets' ? 'Wallets' : 'Contracts'}</th>
                      <th className="px-6 py-4 text-purple-400 font-semibold text-right">Arbitrum {selectedMetric === 'tx_count' ? 'Txs' : selectedMetric === 'active_wallets' ? 'Wallets' : 'Contracts'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {historyData.slice().reverse().map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-3 whitespace-nowrap text-slate-300 font-medium">{row.date}</td>
                        <td className="px-6 py-3 text-right font-mono text-emerald-400/90">{(row[`arc_testnet_${selectedMetric}`] || 0).toLocaleString()}</td>
                        <td className="px-6 py-3 text-right font-mono text-blue-400/90">{(row[`base_sepolia_${selectedMetric}`] || 0).toLocaleString()}</td>
                        <td className="px-6 py-3 text-right font-mono text-purple-400/90">{(row[`arbitrum_sepolia_${selectedMetric}`] || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {historyData.length === 0 && (
                  <div className="p-8 text-center text-slate-500">
                    No data successfully retrieved from the local proxy route.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
