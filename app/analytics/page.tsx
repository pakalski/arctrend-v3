'use client';
import { useState, useEffect } from 'react';
import KpiChart from '@/components/KpiChart';
import { supabase } from '@/lib/supabase';

export default function AnalyticsPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'active_wallets' | 'tx_count' | 'new_contracts'>('active_wallets');

  useEffect(() => {
    async function fetchDatabaseHistory() {
      // Pulls the complete historical archive directly from your Supabase table
      const { data, error } = await supabase
        .from('network_snapshots')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching historical data:', error.message);
      } else {
        setHistory(data || []);
      }
      setLoading(false);
    }

    fetchDatabaseHistory();
  }, []);

  const networks = [
    { id: 'arc_testnet', label: 'Arc Testnet', color: '#10b981' },
    { id: 'base_sepolia', label: 'Base Sepolia', color: '#3b82f6' },
    { id: 'arbitrum_sepolia', label: 'Arbitrum Sepolia', color: '#c084fc' }
  ];

  const metricLabels = {
    active_wallets: 'Daily Active Wallets',
    tx_count: 'Daily Transactions',
    new_contracts: 'New Contracts Deployed'
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="border-b border-slate-800 pb-6 mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Institutional Historical Archive
            </h1>
            <p className="text-slate-400 mt-2 text-lg">Permanent audit of multi-chain metrics loaded directly from Supabase.</p>
          </div>
          {/* Metric Toggle Controls */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-xl overflow-x-auto w-full md:w-auto">
            {(['active_wallets', 'tx_count', 'new_contracts'] as const).map(metric => (
              <button
                key={metric}
                onClick={() => setSelectedMetric(metric)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  selectedMetric === metric 
                    ? 'bg-slate-800 text-emerald-400 shadow border-b border-emerald-500/30' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {metricLabels[metric]}
              </button>
            ))}
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center items-center h-64 text-slate-500 animate-pulse text-xl">
            Connecting to Supabase and loading full database history...
          </div>
        ) : (
          <div className="space-y-12">
            {/* Historical Trend Charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {networks.map(net => {
                const netData = history.filter(d => d.network === net.id);
                return (
                  <div key={net.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: net.color }}></span>
                      {net.label}
                    </h2>
                    <KpiChart 
                      title={metricLabels[selectedMetric]}
                      data={netData} 
                      dataKey={selectedMetric} 
                      color={net.color} 
                    />
                  </div>
                );
              })}
            </div>

            {/* Complete Raw Database Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/50">
                <h3 className="font-semibold text-slate-300">Complete Database Audit Logs</h3>
              </div>
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left text-sm text-slate-400">
                  <thead className="bg-slate-950 text-slate-300 sticky top-0 border-b border-slate-800 z-10">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Network</th>
                      <th className="px-6 py-4 text-right">Active Wallets</th>
                      <th className="px-6 py-4 text-right">Transactions</th>
                      <th className="px-6 py-4 text-right">New Contracts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {history.slice().reverse().map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-3 whitespace-nowrap text-slate-300 font-medium">{row.date}</td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                            row.network === 'arc_testnet' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            row.network === 'base_sepolia' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          }`}>
                            {row.network === 'arc_testnet' ? 'ARC TESTNET' : row.network === 'base_sepolia' ? 'BASE SEPOLIA' : 'ARBITRUM SEPOLIA'}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right font-mono text-emerald-400/90">{row.active_wallets?.toLocaleString() || 0}</td>
                        <td className="px-6 py-3 text-right font-mono text-blue-400/90">{row.tx_count?.toLocaleString() || 0}</td>
                        <td className="px-6 py-3 text-right font-mono text-fuchsia-400/90">{row.new_contracts?.toLocaleString() || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {history.length === 0 && (
                  <div className="p-8 text-center text-slate-500">
                    No historical records found. Please run the Historical Data Backfill workflow in GitHub Actions.
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
