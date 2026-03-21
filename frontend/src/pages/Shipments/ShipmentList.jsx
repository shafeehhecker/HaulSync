import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Plus } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, Button, StatusBadge, SearchInput, EmptyState, Spinner } from '../../components/common';

const STATUSES = ['', 'PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'POD_UPLOADED', 'COMPLETED', 'CANCELLED'];

export default function ShipmentList() {
  const [shipments, setShipments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { canManage } = useAuth();
  const limit = 20;

  const load = () => {
    setLoading(true);
    const params = { page, limit, ...(search && { search }), ...(status && { status }) };
    api.get('/shipments', { params })
      .then(r => { setShipments(r.data.data); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, status]);
  useEffect(() => { const t = setTimeout(load, 400); return () => clearTimeout(t); }, [search]);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Shipments"
        subtitle={`${total} total shipments`}
        action={canManage() && <Link to="/shipments/new"><Button><Plus size={16} /> New Shipment</Button></Link>}
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search shipments..." />
        <select className="input-field w-44" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Shipment #', 'Route', 'Vehicle', 'Driver', 'Loading Date', 'Freight', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr><td colSpan={8}><Spinner /></td></tr>
              ) : shipments.length === 0 ? (
                <tr><td colSpan={8}>
                  <EmptyState icon={Package} title="No shipments found"
                    description="Create your first shipment to get started"
                    action={canManage() && <Link to="/shipments/new"><Button>New Shipment</Button></Link>} />
                </td></tr>
              ) : shipments.map(s => (
                <tr key={s.id} className="hover:bg-zinc-900/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-amber-400">{s.shipmentNumber}</td>
                  <td className="px-4 py-3 text-zinc-300 text-xs">{s.originCity} → {s.destCity}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs font-mono">{s.vehicle?.registrationNo || '—'}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{s.driver?.name || '—'}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{new Date(s.loadingDate).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3 text-zinc-300 text-xs font-mono">
                    {s.freightAmount ? `₹${s.freightAmount.toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3">
                    <Link to={`/shipments/${s.id}`} className="text-xs text-amber-400 hover:text-amber-300">View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > limit && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
            <Button variant="secondary" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Previous</Button>
            <span className="text-xs text-zinc-500">Page {page} of {Math.ceil(total / limit)}</span>
            <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * limit >= total}>Next</Button>
          </div>
        )}
      </div>
    </div>
  );
}
