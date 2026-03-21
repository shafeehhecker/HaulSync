import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Plus, Filter } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, Button, StatusBadge, SearchInput, EmptyState, Spinner } from '../../components/common';

const STATUSES = ['', 'OPEN', 'QUOTED', 'AWARDED', 'CANCELLED', 'EXPIRED'];

export default function RFQList() {
  const [rfqs, setRfqs] = useState([]);
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
    api.get('/rfq', { params })
      .then(r => { setRfqs(r.data.data); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, status]);
  useEffect(() => {
    const t = setTimeout(load, 400);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="RFQ Indenting"
        subtitle="Post truck requirements and collect transporter quotes"
        action={canManage() && (
          <Link to="/rfq/new">
            <Button><Plus size={16} /> New RFQ</Button>
          </Link>
        )}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search RFQs..." />
        <select className="input-field w-40" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
        <span className="text-xs text-zinc-500 ml-auto">{total} records</span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {['RFQ #', 'Title', 'Route', 'Vehicle Type', 'Loading Date', 'Quotes', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr><td colSpan={8}><Spinner /></td></tr>
              ) : rfqs.length === 0 ? (
                <tr><td colSpan={8}>
                  <EmptyState icon={ClipboardList} title="No RFQs found" description="Create your first RFQ to start collecting quotes from transporters"
                    action={canManage() && <Link to="/rfq/new"><Button>New RFQ</Button></Link>} />
                </td></tr>
              ) : rfqs.map((rfq) => (
                <tr key={rfq.id} className="hover:bg-zinc-900/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-amber-400">{rfq.rfqNumber}</td>
                  <td className="px-4 py-3 text-zinc-200 font-medium max-w-xs truncate">{rfq.title}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{rfq.originCity} → {rfq.destCity}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{rfq.vehicleType?.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{new Date(rfq.loadingDate).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <span className="text-zinc-300 font-mono text-xs">{rfq._count?.quotes || 0}</span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={rfq.status} /></td>
                  <td className="px-4 py-3">
                    <Link to={`/rfq/${rfq.id}`} className="text-xs text-amber-400 hover:text-amber-300 font-medium">View →</Link>
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
