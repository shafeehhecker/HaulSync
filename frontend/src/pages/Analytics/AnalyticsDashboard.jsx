import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import api from '../../api/client';
import { PageHeader, Spinner, StatCard } from '../../components/common';
import { TrendingUp, Star } from 'lucide-react';

const TT = { contentStyle: { background: '#18181B', border: '1px solid #3F3F46', borderRadius: '8px', color: '#FAFAFA', fontSize: '12px' } };

export default function AnalyticsDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [transporterPerf, setTransporterPerf] = useState([]);
  const [routeData, setRouteData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/dashboard'),
      api.get('/analytics/transporter-performance'),
      api.get('/analytics/route-analysis'),
    ]).then(([d, t, r]) => {
      setDashboard(d.data);
      setTransporterPerf(t.data.slice(0, 10));
      setRouteData(r.data.slice(0, 10));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const { summary = {} } = dashboard || {};

  const routeChartData = routeData.map(r => ({
    name: `${r.originCity} → ${r.destCity}`,
    trips: r._count,
    avgFreight: Math.round(r._avg?.freightAmount || 0),
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Analytics" subtitle="Performance insights and operational metrics" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard label="Total Shipments" value={summary.totalShipments || 0} icon={TrendingUp} color="amber" />
        <StatCard label="Delivered (30d)" value={summary.deliveredThisMonth || 0} icon={TrendingUp} color="green" />
        <StatCard label="Active Trips" value={summary.activeShipments || 0} icon={TrendingUp} color="blue" />
        <StatCard label="Pending Invoices" value={summary.pendingInvoices || 0} icon={TrendingUp} color="red" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Route Analysis */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-display font-semibold text-zinc-200 mb-4">Top Routes by Shipment Volume</h3>
          {routeChartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-zinc-600 text-sm">No route data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={routeChartData} barSize={28} margin={{ left: 0, right: 0, top: 0, bottom: 60 }}>
                <CartesianGrid vertical={false} stroke="#27272A" />
                <XAxis dataKey="name" tick={{ fill: '#71717A', fontSize: 10 }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...TT} />
                <Bar dataKey="trips" name="Trips" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Transporter Performance */}
      <div className="card">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h3 className="font-display font-semibold text-zinc-200">Transporter Performance</h3>
        </div>
        {transporterPerf.length === 0 ? (
          <div className="py-10 text-center text-zinc-500 text-sm">No transporter data yet</div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {transporterPerf.map((t, i) => (
              <div key={t.id} className="flex items-center gap-4 px-5 py-3.5">
                <span className="text-xs font-mono text-zinc-600 w-5">#{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-200">{t.name}</p>
                  <p className="text-xs text-zinc-500">{t.city}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-400">{t.acceptedQuotes}/{t.totalQuotes} quotes won</p>
                  <div className="flex items-center gap-1 justify-end mt-0.5">
                    <Star size={11} className="text-amber-400 fill-amber-400" />
                    <span className="text-xs font-mono text-amber-400">{t.winRate}% win rate</span>
                  </div>
                </div>
                {/* Win rate bar */}
                <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(t.winRate, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
