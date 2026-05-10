'use client';
import { useState, useEffect } from 'react';
import KpiChart from '@/components/KpiChart';

export default function Home() {
  const [data, setData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('all');
  const [loading, setLoading] = useState(true);

  // Safely fetch data from our working server proxy instead of the empty Supabase database
  useEffect(() => {
    async function loadDashboardData() {
      try {
        const res = await fetch('/api/metrics');
        if (res.ok) {
          const result = await res.json();
          if (result.success) {
            setData(result.data || []);
          }
        }
      } catch (err) {
        console.error("Error loading proxy data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  // Filter rows based on selected time horizon
  const filteredData = data.filter(row => {
    if (!row.date) return false;
    const rowDate = new Date(row.date);
    const now = new Date();
    if (timeRange === '7d') return rowDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (timeRange === '30d') return rowDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (timeRange === '90d') return rowDate >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    if (timeRange === '180d') return rowDate >= new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    if (timeRange === '365d') return rowDate >= new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    return true;
  });

  // Helper to extract the most recent metric value for the snapshots
  const getLatest = (networkPrefix: string, metricKey: string) => {
    if (filteredData.length === 0) return 0;
    const latestRow = filteredData[filteredData.length - 1];
    return latestRow[`${networkPrefix}_${metricKey}`] || 0;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sticky Header */}
      <div className="border-b border-slate-800 bg-slate-900 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-8 py-6 flex flex-col md:flex-row md:justify-between md:items-center gap-6">
          <div>
            <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              ArcTrend
            </h1>
            <p className="text-slate-400 text-xl mt-2">Institutional Multi-Chain KPI Tracking</p>
          </div>
          <div className="flex items-center gap-4">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)} 
              className="bg-slate-950 border border-slate-700 rounded-xl px-5 py-3 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-slate-200"
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
        {/* Main Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 mb-8 overflow-x-auto">
          {[
            { id: 'overview', label: 'Network Overview' },
            { id: 'competitive', label: 'Competitive Benchmark' },
            { id: 'institutional', label: 'Institutional Signals' },
            { id: 'data', label: 'Raw Data Table' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-semibold rounded-t-xl transition-all whitespace-nowrap ${
                activeTab === tab.id 
                ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-400' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64 text-slate-500 animate-pulse text-xl">
            Loading dashboard data via secure server proxy...
          </div>
        ) : (
          <>
            {/* Tab 1: Network Overview (Focused entirely on Arc Testnet) */}
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                {/* Top KPI Snapshot Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
                    <p className="text-slate-400 text-sm font-medium mb-1">Today's Active Wallets</p>
                    <p className="text-3xl font-bold text-emerald-400">
                      {getLatest('arc_testnet', 'active_wallets').toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
                    <p className="text-slate-400 text-sm font-medium mb-1">24h Transactions</p>
                    <p className="text-3xl font-bold text-blue-400">
                      {getLatest('arc_testnet', 'tx_count').toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
                    <p className="text-slate-400 text-sm font-medium mb-1">New Contracts</p>
                    <p className="text-3xl font-bold text-fuchsia-400">
                      {getLatest('arc_testnet', 'new_contracts').toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
                    <p className="text-slate-400 text-sm font-medium mb-1">Avg Gas Fee</p>
                    <p className="text-3xl font-bold text-amber-400">
                      0 <span className="text-sm font-normal text-slate-500">wei</span>
                    </p>
                  </div>
                </div>

                {/* Main Trend Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <KpiChart 
                    title="Daily Active Wallets (DAA)" 
                    data={filteredData.map(d => ({ date: d.date, val: d.arc_testnet_active_wallets || 0 }))} 
                    dataKey="val" 
                    color="#34d399" 
                  />
                  <KpiChart 
                    title="Transactions (24h)" 
                    data={filteredData.map(d => ({ date: d.date, val: d.arc_testnet_tx_count || 0 }))} 
                    dataKey="val" 
                    color="#60a5fa" 
                  />
                  <KpiChart 
                    title="New Contracts Deployed" 
                    data={filteredData.map(d => ({ date: d.date, val: d.arc_testnet_new_contracts || 0 }))} 
                    dataKey="val" 
                    color="#fbbf24" 
                  />
                </div>
              </div>
            )}

            {/* Tab 2: Competitive Benchmark */}
            {activeTab === 'competitive' && (
              <div className="animate-in fade-in duration-500 space-y-10">
                {/* 24h Summary Comparison Grid */}
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-slate-200">Latest 24h Snapshot</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-emerald-950/30 border border-emerald-500/30 p-6 rounded-2xl shadow">
                      <h3 className="text-emerald-400 font-bold text-xl mb-4">Arc Testnet</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-slate-400">Active Wallets:</span> <span className="font-mono font-medium text-slate-200">{getLatest('arc_testnet', 'active_wallets').toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Transactions:</span> <span className="font-mono font-medium text-slate-200">{getLatest('arc_testnet', 'tx_count').toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">New Contracts:</span> <span className="font-mono font-medium text-slate-200">{getLatest('arc_testnet', 'new_contracts').toLocaleString()}</span></div>
                      </div>
                    </div>
                    <div className="bg-blue-950/30 border border-blue-500/30 p-6 rounded-2xl shadow">
                      <h3 className="text-blue-400 font-bold text-xl mb-4">Base Sepolia</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-slate-400">Active Wallets:</span> <span className="font-mono font-medium text-slate-200">{getLatest('base_sepolia', 'active_wallets').toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Transactions:</span> <span className="font-mono font-medium text-slate-200">{getLatest('base_sepolia', 'tx_count').toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">New Contracts:</span> <span className="font-mono font-medium text-slate-200">{getLatest('base_sepolia', 'new_contracts').toLocaleString()}</span></div>
                      </div>
                    </div>
                    <div className="bg-purple-950/30 border border-purple-500/30 p-6 rounded-2xl shadow">
                      <h3 className="text-purple-400 font-bold text-xl mb-4">Arbitrum Sepolia</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-slate-400">Active Wallets:</span> <span className="font-mono font-medium text-slate-200">{getLatest('arbitrum_sepolia', 'active_wallets').toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Transactions:</span> <span className="font-mono font-medium text-slate-200">{getLatest('arbitrum_sepolia', 'tx_count').toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">New Contracts:</span> <span className="font-mono font-medium text-slate-200">{getLatest('arbitrum_sepolia', 'new_contracts').toLocaleString()}</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Multi-Chain Historical Chart Comparisons */}
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-slate-200">Historical Comparison (Active Wallets)</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                      <h3 className="text-emerald-400 font-semibold mb-4 text-center">Arc Testnet Trend</h3>
                      <KpiChart title="Daily Active Wallets" data={filteredData.map(d => ({ date: d.date, val: d.arc_testnet_active_wallets || 0 }))} dataKey="val" color="#34d399" />
                    </div>
                    <div>
                      <h3 className="text-blue-400 font-semibold mb-4 text-center">Base Sepolia Trend</h3>
                      <KpiChart title="Daily Active Wallets" data={filteredData.map(d => ({ date: d.date, val: d.base_sepolia_active_wallets || 0 }))} dataKey="val" color="#60a5fa" />
                    </div>
                    <div>
                      <h3 className="text-purple-400 font-semibold mb-4 text-center">Arbitrum Sepolia Trend</h3>
                      <KpiChart title="Daily Active Wallets" data={filteredData.map(d => ({ date: d.date, val: d.arbitrum_sepolia_active_wallets || 0 }))} dataKey="val" color="#c084fc" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Institutional Signals (Placeholders) */}
            {activeTab === 'institutional' && (
              <div className="animate-in fade-in duration-500 mt-4 p-10 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
                <div className="mb-10">
                  <h2 className="text-3xl font-bold mb-2 text-slate-200">Institutional Signals</h2>
                  <p className="text-slate-400">Deep metrics indicating sophisticated capital movement on Arc.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <KpiChart title="USDC Bridge Volume (Placeholder)" data={filteredData.map(d => ({ date: d.date, val: 0 }))} dataKey="val" color="#0ea5e9" prefix="$" />
                  <KpiChart title="Average Gas Fee (Wei)" data={filteredData.map(d => ({ date: d.date, val: 0 }))} dataKey="val" color="#f43f5e" />
                </div>
              </div>
            )}

            {/* Tab 4: Aggregated Raw Data View */}
            {activeTab === 'data' && (
              <div className="animate-in fade-in duration-500 overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
                <table className="w-full text-left text-sm text-slate-400">
                  <thead className="bg-slate-950 text-slate-300 sticky top-0 border-b border-slate-800 z-10 font-semibold">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4 text-right text-emerald-400">Arc Wallets</th>
                      <th className="px-6 py-4 text-right text-emerald-400">Arc Txs</th>
                      <th className="px-6 py-4 text-right text-blue-400">Base Wallets</th>
                      <th className="px-6 py-4 text-right text-blue-400">Base Txs</th>
                      <th className="px-6 py-4 text-right text-purple-400">Arbi Wallets</th>
                      <th className="px-6 py-4 text-right text-purple-400">Arbi Txs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    {filteredData.slice().reverse().map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-slate-300 font-sans font-medium">{row.date}</td>
                        <td className="px-6 py-4 text-right text-emerald-400/90">{(row.arc_testnet_active_wallets || 0).toLocaleString()}</td>
                        <td className="px-6 py-4 text-right text-emerald-400/90">{(row.arc_testnet_tx_count || 0).toLocaleString()}</td>
                        <td className="px-6 py-4 text-right text-blue-400/90">{(row.base_sepolia_active_wallets || 0).toLocaleString()}</td>
                        <td className="px-6 py-4 text-right text-blue-400/90">{(row.base_sepolia_tx_count || 0).toLocaleString()}</td>
                        <td className="px-6 py-4 text-right text-purple-400/90">{(row.arbitrum_sepolia_active_wallets || 0).toLocaleString()}</td>
                        <td className="px-6 py-4 text-right text-purple-400/90">{(row.arbitrum_sepolia_tx_count || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredData.length === 0 && (
                  <div className="p-8 text-center text-slate-500 font-sans">
                    No data pulled from server proxy.
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <footer className="border-t border-slate-800 mt-20 bg-slate-950">
        <div className="max-w-7xl mx-auto px-8 py-8 text-center text-slate-500 text-sm">
          ArcTrend Data Dashboard • Live metrics aggregated via Vercel secure proxy feed
        </div>
      </footer>
    </div>
  );
}
