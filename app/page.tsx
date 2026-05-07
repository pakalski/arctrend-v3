'use client';
import { useState, useEffect } from 'react';
import KpiChart from '@/components/KpiChart';
import { supabase } from '@/lib/supabase';
import { createWalletClient, custom } from 'viem';
import { arcTestnet } from '@/lib/arc-client'; // Make sure this file exists

const CONTRACT_ADDRESS = '0x5391d64389995d86dDb7a8FfdC4F8d854B61a0FF';

const ABI = [
  {
    name: 'executeBatch',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'recipients', type: 'address[]' },
      { name: 'amounts', type: 'uint256[]' }
    ],
    outputs: []
  }
];

export default function Home() {
  const [data, setData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(false);

  // Treasury form
  const [recipients, setRecipients] = useState<string[]>(['']);
  const [amounts, setAmounts] = useState<string[]>(['']);

  const loadData = async () => {
    const { data: result } = await supabase
      .from('network_snapshots')
      .select('*')
      .order('date', { ascending: true });
    setData(result || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const refreshLiveData = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://testnet.arcscan.app/api/v2/stats');
      const stats = await res.json();
      const today = new Date().toISOString().split('T')[0];

      await supabase.from('network_snapshots').upsert({
        date: today,
        network: 'arc_testnet',
        active_wallets: stats.active_addresses_24h || 0,
        new_wallets: stats.new_addresses_24h || 0,
        tx_count: stats.transactions_24h || 0,
        usdc_volume: stats.usdc_volume_24h || 0,
        new_contracts: stats.new_contracts_24h || 0,
      });
      await loadData();
      alert('✅ Real live Arc testnet data refreshed!');
    } catch (e) {
      alert('Could not fetch live data. Try again.');
    }
    setLoading(false);
  };

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

  // Treasury batch helpers
  const addRow = () => {
    setRecipients([...recipients, '']);
    setAmounts([...amounts, '']);
  };

  const updateRecipient = (index: number, value: string) => {
    const newRecipients = [...recipients];
    newRecipients[index] = value;
    setRecipients(newRecipients);
  };

  const updateAmount = (index: number, value: string) => {
    const newAmounts = [...amounts];
    newAmounts[index] = value;
    setAmounts(newAmounts);
  };

  const removeRow = (index: number) => {
    if (recipients.length === 1) return;
    setRecipients(recipients.filter((_, i) => i !== index));
    setAmounts(amounts.filter((_, i) => i !== index));
  };

  const executeBatch = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask');
      return;
    }

    try {
      const walletClient = createWalletClient({
        chain: arcTestnet,
        transport: custom(window.ethereum)
      });

      const [account] = await walletClient.getAddresses();

      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'executeBatch',
        args: [recipients, amounts.map(a => BigInt(Math.floor(parseFloat(a) * 1e18)))],
        account,
        value: BigInt(Math.floor(amounts.reduce((sum, a) => sum + parseFloat(a), 0) * 1e18)),
      });

      alert(`Transaction sent! Hash: ${hash}`);
    } catch (e: any) {
      alert('Transaction failed or cancelled: ' + e.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-7xl mx-auto px-8 py-8 flex justify-between items-center">
          <div>
            <h1 className="text-6xl font-bold tracking-tighter">ArcTrend</h1>
            <p className="text-slate-400 text-2xl mt-1">Arc Testnet • Institutional Adoption Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl px-6 py-3 text-lg">
              <option value="7d">1 Week</option>
              <option value="30d">1 Month</option>
              <option value="90d">3 Months</option>
              <option value="180d">6 Months</option>
              <option value="365d">1 Year</option>
              <option value="all">All Time</option>
            </select>
            <button onClick={refreshLiveData} disabled={loading} className="bg-emerald-500 hover:bg-emerald-600 px-6 py-3 rounded-2xl font-medium">
              {loading ? 'Fetching...' : '🔄 Refresh Live Arc Data'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8">
        <div className="flex border-b border-slate-700">
          {['overview', 'institutional', 'competitive', 'treasury'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-6 text-lg font-medium border-b-2 transition-all ${activeTab === tab ? 'border-emerald-400 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
              {tab === 'overview' ? 'Overview' : tab === 'institutional' ? 'Institutional Signals' : tab === 'competitive' ? 'Competitive Benchmark' : 'My Treasury Contract'}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
            <KpiChart title="Daily Active Wallets (DAA)" data={filteredData} dataKey="active_wallets" color="#10b981" />
            <KpiChart title="USDC Volume" data={filteredData} dataKey="usdc_volume" color="#3b82f6" prefix="$" />
            <KpiChart title="New Wallets" data={filteredData} dataKey="new_wallets" color="#8b5cf6" />
            <KpiChart title="New Contracts Deployed" data={filteredData} dataKey="new_contracts" color="#f59e0b" />
          </div>
        )}

        {/* Institutional Signals */}
        {activeTab === 'institutional' && (
          <div className="mt-10 p-8 bg-slate-900 border border-slate-700 rounded-3xl">
            <h2 className="text-3xl font-semibold mb-8">Institutional Signals</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <KpiChart title="Large Transactions (> $10k)" data={filteredData} dataKey="large_tx_10k" color="#ec4899" />
              <KpiChart title="CCTP Bridge Volume" data={filteredData} dataKey="cctp_volume" color="#06b67f" prefix="$" />
              <KpiChart title="Batch Payment Rate" data={filteredData} dataKey="batch_tx_rate" color="#a78bfa" />
            </div>
          </div>
        )}

        {/* Competitive Benchmark */}
        {activeTab === 'competitive' && (
          <div className="mt-10">
            <h2 className="text-3xl font-semibold mb-8">Competitive Benchmark</h2>
            <p className="text-slate-400 mb-8">Arc Testnet vs Base Sepolia vs Arbitrum Sepolia</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-emerald-400 text-lg font-medium mb-4">Arc Testnet</h3>
                <KpiChart title="Daily Active Wallets" data={filteredData.filter(d => d.network === 'arc_testnet')} dataKey="active_wallets" color="#10b981" />
              </div>
              <div>
                <h3 className="text-blue-400 text-lg font-medium mb-4">Base Sepolia</h3>
                <KpiChart title="Daily Active Wallets" data={filteredData.filter(d => d.network === 'base_sepolia')} dataKey="active_wallets" color="#3b82f6" />
              </div>
              <div>
                <h3 className="text-purple-400 text-lg font-medium mb-4">Arbitrum Sepolia</h3>
                <KpiChart title="Daily Active Wallets" data={filteredData.filter(d => d.network === 'arbitrum_sepolia')} dataKey="active_wallets" color="#a78bfa" />
              </div>
            </div>
          </div>
        )}

        {/* Treasury Contract - Full UX */}
        {activeTab === 'treasury' && (
          <div className="mt-10 p-10 bg-gradient-to-br from-slate-900 to-emerald-950 border border-emerald-400/30 rounded-3xl">
            <h2 className="text-3xl font-bold mb-8">Your Treasury Batch Router</h2>
            <div className="bg-slate-950 rounded-2xl p-6 mb-8 font-mono text-sm break-all">
              0x5391d64389995d86dDb7a8FfdC4F8d854B61a0FF
            </div>

            <h3 className="text-xl mb-6">Execute Batch Payment</h3>
            <div className="space-y-6">
              {recipients.map((_, index) => (
                <div key={index} className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm text-slate-400 mb-1">Recipient Address</label>
                    <input
                      type="text"
                      value={recipients[index]}
                      onChange={(e) => updateRecipient(index, e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm font-mono"
                      placeholder="0x..."
                    />
                  </div>
                  <div className="w-40">
                    <label className="block text-sm text-slate-400 mb-1">Amount (USDC)</label>
                    <input
                      type="text"
                      value={amounts[index]}
                      onChange={(e) => updateAmount(index, e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm"
                      placeholder="0.0"
                    />
                  </div>
                  <button onClick={() => removeRow(index)} className="text-red-400 hover:text-red-500 px-4 py-3">✕</button>
                </div>
              ))}
            </div>

            <button onClick={addRow} className="mt-6 text-emerald-400 hover:text-emerald-300 flex items-center gap-2">
              + Add another recipient
            </button>

            <button 
              onClick={executeBatch}
              className="mt-10 w-full bg-emerald-500 hover:bg-emerald-600 py-5 rounded-2xl font-semibold text-lg"
            >
              Execute Batch Payment (MetaMask)
            </button>
          </div>
        )}
      </div>

      <footer className="text-center text-slate-500 text-sm mt-20 pb-12">
        Built as interview demo for Circle/Arc • Contract deployed on Arc Testnet
      </footer>
    </div>
  );
}
