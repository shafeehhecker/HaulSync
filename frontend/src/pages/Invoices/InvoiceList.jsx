import { useState, useEffect } from 'react';
import { Receipt } from 'lucide-react';
import api from '../../api/client';
import { PageHeader, Button, StatusBadge, SearchInput, EmptyState, Spinner } from '../../components/common';

const STATUSES = ['', 'PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'DISPUTED', 'PAID', 'CANCELLED'];

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const load = () => {
    setLoading(true);
    api.get('/invoices', { params: { page, limit, ...(search && { search }), ...(status && { status }) } })
      .then(r => { setInvoices(r.data.data); setTotal(r.data.total); }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, status]);
  useEffect(() => { const t = setTimeout(load, 400); return () => clearTimeout(t); }, [search]);

  const updateStatus = async (id, newStatus) => {
    await api.put(`/invoices/${id}`, { status: newStatus });
    load();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Invoice Reconciliation" subtitle={`${total} invoices`} />

      <div className="flex gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search invoices..." />
        <select className="input-field w-44" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Invoice #', 'Shipment', 'Company', 'Freight', 'GST', 'Total', 'Invoice Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? <tr><td colSpan={9}><Spinner /></td></tr>
                : invoices.length === 0 ? <tr><td colSpan={9}><EmptyState icon={Receipt} title="No invoices" description="Invoices are created when shipments are completed" /></td></tr>
                : invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-amber-400">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">{inv.shipment?.shipmentNumber}</td>
                    <td className="px-4 py-3 text-zinc-300 text-xs">{inv.company?.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-300">₹{inv.freightAmount?.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">₹{inv.gstAmount?.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-100 font-medium">₹{inv.totalAmount?.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                    <td className="px-4 py-3">
                      {inv.status === 'PENDING' && (
                        <div className="flex gap-1">
                          <button onClick={() => updateStatus(inv.id, 'APPROVED')} className="text-xs text-green-400 hover:text-green-300">Approve</button>
                          <span className="text-zinc-700">·</span>
                          <button onClick={() => updateStatus(inv.id, 'DISPUTED')} className="text-xs text-red-400 hover:text-red-300">Dispute</button>
                        </div>
                      )}
                      {inv.status === 'APPROVED' && (
                        <button onClick={() => updateStatus(inv.id, 'PAID')} className="text-xs text-amber-400 hover:text-amber-300">Mark Paid</button>
                      )}
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
