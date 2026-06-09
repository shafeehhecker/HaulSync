import { useState } from 'react';
import { FileBarChart, Download, Printer, TrendingUp, Package, Receipt } from 'lucide-react';
import api from '../../api/client';
import { PageHeader, Button, StatusBadge, Spinner } from '../../components/common';

const TABS = [
  { id: 'invoices', label: 'Invoice Report', icon: Receipt },
  { id: 'shipments', label: 'Shipment Report', icon: Package },
];

const INVOICE_STATUSES = ['', 'PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'DISPUTED', 'PAID'];
const SHIPMENT_STATUSES = ['', 'PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'CANCELLED'];

function fmt(n) { return Number(n || 0).toLocaleString('en-IN'); }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN') : '—'; }

function SummaryCard({ label, value, color = 'zinc' }) {
  const colors = {
    zinc: 'text-zinc-100',
    amber: 'text-amber-400',
    green: 'text-green-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
  };
  return (
    <div className="card p-4">
      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`font-display text-2xl font-bold ${colors[color]}`}>{value}</p>
    </div>
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState('invoices');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    setLoading(true);
    setError('');
    setData(null);
    try {
      const params = { ...(from && { from }), ...(to && { to }), ...(status && { status }) };
      const r = await api.get(`/reports/${tab}`, { params });
      setData(r.data);
    } catch {
      setError('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const printReport = () => window.print();

  const exportCSV = () => {
    if (!data) return;
    const rows = tab === 'invoices'
      ? [
          ['Invoice #', 'Company', 'Shipment', 'Route', 'Invoice Date', 'Freight', 'GST', 'Total', 'Status'],
          ...data.invoices.map(i => [
            i.invoiceNumber, i.company?.name, i.shipment?.shipmentNumber,
            `${i.shipment?.originCity} → ${i.shipment?.destCity}`,
            fmtDate(i.invoiceDate), i.freightAmount, i.gstAmount, i.totalAmount, i.status,
          ]),
        ]
      : [
          ['Shipment #', 'Shipper', 'Origin', 'Destination', 'Loading Date', 'Freight', 'Driver', 'Vehicle', 'Status'],
          ...data.shipments.map(s => [
            s.shipmentNumber, s.shipper?.name, s.originCity, s.destCity,
            fmtDate(s.loadingDate), s.freightAmount || 0, s.driver?.name || '', s.vehicle?.registrationNo || '', s.status,
          ]),
        ];

    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `haulsync-${tab}-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statuses = tab === 'invoices' ? INVOICE_STATUSES : SHIPMENT_STATUSES;

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Reports"
        subtitle="Generate and export operational reports"
        action={data && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={exportCSV}>
              <Download size={14} /> Export CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={printReport}>
              <Printer size={14} /> Print
            </Button>
          </div>
        )}
      />

      {/* Tab selector */}
      <div className="flex gap-1 p-1 bg-zinc-900 rounded-lg w-fit border border-zinc-800">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setTab(id); setData(null); setError(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === id ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Filters</p>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="input-field w-44">
              {statuses.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
            </select>
          </div>
          <Button onClick={generate} disabled={loading}>
            <FileBarChart size={14} /> Generate Report
          </Button>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {loading && <Spinner />}

      {data && (
        <div className="space-y-5 print-section">
          {/* Summary cards */}
          {tab === 'invoices' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <SummaryCard label="Total Invoices" value={data.summary.totalInvoices} />
              <SummaryCard label="Total Amount" value={`₹${fmt(data.summary.totalAmount)}`} color="amber" />
              <SummaryCard label="Paid" value={data.summary.paid} color="green" />
              <SummaryCard label="Disputed" value={data.summary.disputed} color="red" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <SummaryCard label="Total Shipments" value={data.summary.total} />
              <SummaryCard label="Total Freight" value={`₹${fmt(data.summary.totalFreight)}`} color="amber" />
              <SummaryCard label="Delivered" value={data.summary.delivered} color="green" />
              <SummaryCard label="In Transit" value={data.summary.inTransit} color="blue" />
            </div>
          )}

          {/* Table */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-200">
                {tab === 'invoices' ? `${data.invoices.length} invoices` : `${data.shipments.length} shipments`}
              </p>
            </div>
            <div className="overflow-x-auto">
              {tab === 'invoices' ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      {['Invoice #', 'Company', 'Shipment', 'Route', 'Invoice Date', 'Freight', 'GST', 'Total', 'Status'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {data.invoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-zinc-900/40">
                        <td className="px-4 py-2.5 font-mono text-xs text-amber-400">{inv.invoiceNumber}</td>
                        <td className="px-4 py-2.5 text-xs text-zinc-300">{inv.company?.name}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-zinc-400">{inv.shipment?.shipmentNumber}</td>
                        <td className="px-4 py-2.5 text-xs text-zinc-400">{inv.shipment?.originCity} → {inv.shipment?.destCity}</td>
                        <td className="px-4 py-2.5 text-xs text-zinc-400">{fmtDate(inv.invoiceDate)}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-zinc-300">₹{fmt(inv.freightAmount)}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-zinc-400">₹{fmt(inv.gstAmount)}</td>
                        <td className="px-4 py-2.5 font-mono text-xs font-medium text-zinc-100">₹{fmt(inv.totalAmount)}</td>
                        <td className="px-4 py-2.5"><StatusBadge status={inv.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-zinc-700">
                    <tr className="bg-zinc-900/50">
                      <td colSpan={5} className="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase">Totals</td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-zinc-200">₹{fmt(data.summary.totalFreight)}</td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-zinc-400">₹{fmt(data.summary.totalGST)}</td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-amber-400">₹{fmt(data.summary.totalAmount)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      {['Shipment #', 'Shipper', 'Origin', 'Destination', 'Loading Date', 'Freight', 'Driver', 'Vehicle', 'Status'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {data.shipments.map(s => (
                      <tr key={s.id} className="hover:bg-zinc-900/40">
                        <td className="px-4 py-2.5 font-mono text-xs text-amber-400">{s.shipmentNumber}</td>
                        <td className="px-4 py-2.5 text-xs text-zinc-300">{s.shipper?.name}</td>
                        <td className="px-4 py-2.5 text-xs text-zinc-400">{s.originCity}</td>
                        <td className="px-4 py-2.5 text-xs text-zinc-400">{s.destCity}</td>
                        <td className="px-4 py-2.5 text-xs text-zinc-400">{fmtDate(s.loadingDate)}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-zinc-300">₹{fmt(s.freightAmount)}</td>
                        <td className="px-4 py-2.5 text-xs text-zinc-400">{s.driver?.name || '—'}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-zinc-400">{s.vehicle?.registrationNo || '—'}</td>
                        <td className="px-4 py-2.5"><StatusBadge status={s.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-zinc-700">
                    <tr className="bg-zinc-900/50">
                      <td colSpan={5} className="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase">Total Freight</td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-amber-400">₹{fmt(data.summary.totalFreight)}</td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-section, .print-section * { visibility: visible; }
          .print-section { position: absolute; inset: 0; padding: 24px; background: white; color: black; }
          .print-section .card { border: 1px solid #ccc; background: white; }
          .print-section table { border-collapse: collapse; width: 100%; }
          .print-section th, .print-section td { border: 1px solid #ddd; padding: 6px 8px; font-size: 11px; color: black; }
          .print-section th { background: #f5f5f5; font-weight: 600; }
        }
      `}</style>
    </div>
  );
}
