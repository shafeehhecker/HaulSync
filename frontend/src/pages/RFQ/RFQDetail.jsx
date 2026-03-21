import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, Button, Modal, FormField, Spinner } from '../../components/common';
import { IndianRupee, MapPin, Package, Calendar, Truck, ChevronLeft } from 'lucide-react';

export default function RFQDetail() {
  const { id } = useParams();
  const { user, canManage } = useAuth();
  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quoteModal, setQuoteModal] = useState(false);
  const [quoteForm, setQuoteForm] = useState({ amount: '', validUntil: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = () => api.get(`/rfq/${id}`).then(r => setRfq(r.data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, [id]);

  const submitQuote = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/rfq/${id}/quote`, quoteForm);
      setQuoteModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit quote');
    } finally {
      setSubmitting(false);
    }
  };

  const awardQuote = async (quoteId) => {
    if (!confirm('Award this quote? All other quotes will be rejected.')) return;
    await api.post(`/rfq/${id}/award/${quoteId}`);
    load();
  };

  if (loading) return <Spinner />;
  if (!rfq) return <div className="text-zinc-400">RFQ not found</div>;

  const isTransporter = user?.role === 'TRANSPORTER';
  const canQuote = isTransporter && rfq.status === 'OPEN';

  return (
    <div className="max-w-4xl animate-fade-in space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/rfq" className="text-zinc-500 hover:text-zinc-300 flex items-center gap-1 text-sm"><ChevronLeft size={16} />Back</Link>
      </div>

      {/* Header */}
      <div className="card p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="font-mono text-xs text-amber-400 mb-1">{rfq.rfqNumber}</p>
            <h1 className="font-display text-xl font-bold text-zinc-100">{rfq.title}</h1>
            <p className="text-zinc-500 text-sm mt-1">by {rfq.shipper?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={rfq.status} />
            {canQuote && <Button onClick={() => setQuoteModal(true)}>Submit Quote</Button>}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-zinc-800">
          <InfoBlock icon={MapPin} label="Route" value={`${rfq.originCity} → ${rfq.destCity}`} />
          <InfoBlock icon={Truck} label="Vehicle Type" value={rfq.vehicleType?.replace('_', ' ')} />
          <InfoBlock icon={Package} label="Goods" value={rfq.goodsType?.name || '—'} />
          <InfoBlock icon={Calendar} label="Loading Date" value={new Date(rfq.loadingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />
        </div>

        {rfq.description && (
          <div className="mt-4 p-3 rounded-lg bg-zinc-900/60 text-sm text-zinc-400">{rfq.description}</div>
        )}

        {rfq.basePrice && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <IndianRupee size={14} className="text-zinc-500" />
            <span className="text-zinc-500">Base price:</span>
            <span className="font-mono text-zinc-200">₹{rfq.basePrice.toLocaleString('en-IN')}</span>
          </div>
        )}
      </div>

      {/* Quotes */}
      <div className="card">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="font-display font-semibold text-zinc-200">Quotes ({rfq.quotes?.length || 0})</h2>
        </div>
        {rfq.quotes?.length === 0 ? (
          <div className="py-10 text-center text-zinc-500 text-sm">No quotes submitted yet</div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {rfq.quotes?.map((q) => (
              <div key={q.id} className={`flex items-center gap-4 px-5 py-4 ${rfq.awardedQuoteId === q.id ? 'bg-amber-500/5' : ''}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p className="font-medium text-zinc-200">{q.transporter?.name}</p>
                    {rfq.awardedQuoteId === q.id && <span className="text-xs font-medium text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">Awarded</span>}
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">by {q.submittedBy?.name} · {new Date(q.createdAt).toLocaleDateString('en-IN')}</p>
                  {q.notes && <p className="text-xs text-zinc-400 mt-1">{q.notes}</p>}
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-zinc-100">₹{q.amount.toLocaleString('en-IN')}</p>
                  <StatusBadge status={q.status} />
                </div>
                {canManage() && rfq.status !== 'AWARDED' && rfq.status !== 'CANCELLED' && (
                  <Button size="sm" onClick={() => awardQuote(q.id)}>Award</Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quote Modal */}
      <Modal open={quoteModal} onClose={() => setQuoteModal(false)} title="Submit Your Quote">
        <form onSubmit={submitQuote} className="space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}
          <FormField label="Quote Amount (INR)" required>
            <input type="number" className="input-field" value={quoteForm.amount} onChange={e => setQuoteForm(f => ({ ...f, amount: e.target.value }))} placeholder="45000" required min="0" />
          </FormField>
          <FormField label="Valid Until">
            <input type="datetime-local" className="input-field" value={quoteForm.validUntil} onChange={e => setQuoteForm(f => ({ ...f, validUntil: e.target.value }))} />
          </FormField>
          <FormField label="Notes">
            <textarea className="input-field" rows={3} value={quoteForm.notes} onChange={e => setQuoteForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any conditions or comments..." />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setQuoteModal(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Quote'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function InfoBlock({ icon: Icon, label, value }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={12} className="text-zinc-500" />
        <span className="text-xs text-zinc-500">{label}</span>
      </div>
      <p className="text-sm font-medium text-zinc-200">{value}</p>
    </div>
  );
}
