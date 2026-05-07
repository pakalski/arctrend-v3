'use client';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export default function KpiChart({ title, data, dataKey, color = '#3b82f6', prefix = '' }: any) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-4 text-slate-100">{title}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="date" stroke="#64748b" tickFormatter={(v) => format(new Date(v), 'MMM dd')} />
          <YAxis stroke="#64748b" tickFormatter={(v) => prefix + v} />
          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
          <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#grad-${dataKey})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}