import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck, ClipboardList, Receipt, TruckIcon, UserCheck, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../api/client';
import { StatCard, StatusBadge, Spinner } from '../components/common';

const COLORS = ['#F59E0B', '#60A5FA', '#A78BFA', '#4ADE80', '#F87171', '#94A3B8'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/dashboard')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const { summary = {}, recentShipments = [], shipmentsByStatus = [], rfqsByStatus = [] } = data || {};

  const statusChartData = shipmentsByStatus.map(s => ({ name: s.status.replace('_', ' '), value: s._count }));

  const rfqChartData = rfqsByStatus.map(s => ({ name: s.status, value: s._count }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-zinc-100">Dashboard</h1>
        <p className="text-zinc-400 text-sm mt-1">Operations overview — live data</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard label="Total Shipments" value={summary.totalShipments ?? '—'} icon={Package} color="amber" />
        <StatCard label="Active Trips" value={summary.activeShipments ?? '—'} icon={TruckIcon} color="blue" delta="In transit now" />
        <StatCard label="Delivered (30d)" value={summary.deliveredThisMonth ?? '—'} icon={Truck} color="green" />
        <StatCard label="Open RFQs" value={summary.openRFQs ?? '—'} icon={ClipboardList} color="purple" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard label="Fleet Vehicles" value={summary.totalVehicles ?? '—'} icon={TruckIcon} color="amber" />
        <StatCard label="Active Drivers" value={summary.totalDrivers ?? '—'} icon={UserCheck} color="blue" />
        <StatCard label="Pending Invoices" value={summary.pendingInvoices ?? '—'} icon={Receipt} color="red" />
        <StatCard label="On-Time Rate" value="92%" icon={Package} color="green" delta="+3% vs last month" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Shipment Status Breakdown */}
        <div className="card p-5">
          <h3 className="font-display font-semibold text-zinc-200 mb-4">Shipments by Status</h3>
          {statusChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={3}>
                  {statusChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#18181B', border: '1px solid #3F3F46', borderRadius: '8px', color: '#FAFAFA', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-zinc-600 text-sm">No shipment data yet</div>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {statusChartData.map((s, i) => (
              <div key={s.name} className="flex items-center gap-1.5 text-xs text-zinc-400">
                <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                {s.name} ({s.value})
              </div>
            ))}
          </div>
        </div>

        {/* RFQ Status */}
        <div className="card p-5">
          <h3 className="font-display font-semibold text-zinc-200 mb-4">RFQ Pipeline</h3>
          {rfqChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={rfqChartData} barSize={28}>
                <XAxis dataKey="name" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#18181B', border: '1px solid #3F3F46', borderRadius: '8px', color: '#FAFAFA', fontSize: '12px' }} />
                <Bar dataKey="value" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-zinc-600 text-sm">No RFQ data yet</div>
          )}
        </div>
      </div>

      {/* Recent Shipments */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h3 className="font-display font-semibold text-zinc-200">Recent Shipments</h3>
          <Link to="/shipments" className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {recentShipments.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-sm">No shipments yet. Create your first shipment.</div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {recentShipments.map((s) => (
              <Link key={s.id} to={`/shipments/${s.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-zinc-900/50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Package size={14} className="text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200 font-mono">{s.shipmentNumber}</p>
                  <p className="text-xs text-zinc-500">{s.originCity} → {s.destCity}</p>
                </div>
                <div className="text-xs text-zinc-500">{s.driver?.name || '—'}</div>
                <StatusBadge status={s.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
