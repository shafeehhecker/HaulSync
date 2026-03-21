import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import { StatusBadge, Button, Modal, FormField, Spinner } from '../../components/common';
import { MapPin, ChevronLeft, Navigation, Upload, Clock, Truck } from 'lucide-react';

const TRACKING_EVENTS = ['DEPARTED', 'REACHED_CHECKPOINT', 'HALTED', 'RESUMED', 'REACHED_DESTINATION', 'DELIVERED'];

export default function ShipmentDetail() {
  const { id } = useParams();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trackModal, setTrackModal] = useState(false);
  const [trackForm, setTrackForm] = useState({ eventType: 'REACHED_CHECKPOINT', location: '', city: '', state: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = () => api.get(`/shipments/${id}`).then(r => setShipment(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, [id]);

  const addTracking = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/shipments/${id}/tracking`, trackForm);
      setTrackModal(false);
      setTrackForm({ eventType: 'REACHED_CHECKPOINT', location: '', city: '', state: '', notes: '' });
      load();
    } finally { setSubmitting(false); }
  };

  if (loading) return <Spinner />;
  if (!shipment) return <div className="text-zinc-400">Shipment not found</div>;

  const s = shipment;

  return (
    <div className="max-w-4xl animate-fade-in space-y-5">
      <Link to="/shipments" className="text-zinc-500 hover:text-zinc-300 flex items-center gap-1 text-sm w-fit"><ChevronLeft size={16} />Back</Link>

      {/* Header */}
      <div className="card p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="font-mono text-xs text-amber-400 mb-1">{s.shipmentNumber}</p>
            <h1 className="font-display text-xl font-bold text-zinc-100">{s.originCity} → {s.destCity}</h1>
            <p className="text-zinc-500 text-sm mt-0.5">{s.shipper?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={s.status} />
            <Button size="sm" onClick={() => setTrackModal(true)} variant="secondary">
              <Navigation size={14} /> Update Tracking
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 pt-4 border-t border-zinc-800">
          <Detail label="Vehicle" value={s.vehicle?.registrationNo || '—'} mono />
          <Detail label="Driver" value={s.driver?.name || '—'} />
          <Detail label="Loading Date" value={new Date(s.loadingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />
          <Detail label="Freight Amount" value={s.freightAmount ? `₹${s.freightAmount.toLocaleString('en-IN')}` : '—'} mono />
          <Detail label="Goods Type" value={s.goodsType?.name || '—'} />
          <Detail label="Weight" value={s.weight ? `${s.weight} T` : '—'} />
          <Detail label="E-Way Bill" value={s.ewayBillNo || '—'} mono />
          <Detail label="LR Number" value={s.lrNumber || '—'} mono />
        </div>
      </div>

      {/* Tracking Timeline */}
      <div className="card p-5">
        <h2 className="font-display font-semibold text-zinc-200 mb-4 flex items-center gap-2">
          <Navigation size={16} className="text-amber-400" /> Tracking Timeline
        </h2>
        {s.trackingEvents?.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-sm">No tracking events yet</div>
        ) : (
          <div className="space-y-0">
            {s.trackingEvents?.map((ev, i) => (
              <div key={ev.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${i === 0 ? 'bg-amber-400 pulse-amber' : 'bg-zinc-600'}`} />
                  {i < s.trackingEvents.length - 1 && <div className="w-px flex-1 bg-zinc-800 my-1" />}
                </div>
                <div className="pb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-medium text-amber-400">{ev.eventType.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-zinc-500 flex items-center gap-1"><Clock size={10} /> {new Date(ev.recordedAt).toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-sm text-zinc-300 mt-0.5">{ev.location}</p>
                  {ev.city && <p className="text-xs text-zinc-500">{ev.city}, {ev.state}</p>}
                  {ev.notes && <p className="text-xs text-zinc-500 mt-1 italic">{ev.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PODs */}
      {s.pods?.length > 0 && (
        <div className="card p-5">
          <h2 className="font-display font-semibold text-zinc-200 mb-4">Proof of Delivery ({s.pods.length})</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {s.pods.map(pod => (
              <a key={pod.id} href={pod.imageUrl} target="_blank" rel="noopener noreferrer"
                className="block rounded-lg overflow-hidden border border-zinc-800 hover:border-amber-500/50 transition-colors">
                <img src={pod.imageUrl} alt="POD" className="w-full h-32 object-cover bg-zinc-800" />
                <div className="px-3 py-2">
                  <p className="text-xs text-zinc-400">Signed by: {pod.signedBy || '—'}</p>
                  {pod.receivedAt && <p className="text-xs text-zinc-600">{new Date(pod.receivedAt).toLocaleDateString('en-IN')}</p>}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Tracking Modal */}
      <Modal open={trackModal} onClose={() => setTrackModal(false)} title="Add Tracking Event">
        <form onSubmit={addTracking} className="space-y-4">
          <FormField label="Event Type" required>
            <select className="input-field" value={trackForm.eventType} onChange={e => setTrackForm(f => ({ ...f, eventType: e.target.value }))}>
              {TRACKING_EVENTS.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </FormField>
          <FormField label="Location / Description" required>
            <input className="input-field" value={trackForm.location} onChange={e => setTrackForm(f => ({ ...f, location: e.target.value }))} placeholder="Near Pune Toll Plaza" required />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="City">
              <input className="input-field" value={trackForm.city} onChange={e => setTrackForm(f => ({ ...f, city: e.target.value }))} placeholder="Pune" />
            </FormField>
            <FormField label="State">
              <input className="input-field" value={trackForm.state} onChange={e => setTrackForm(f => ({ ...f, state: e.target.value }))} placeholder="Maharashtra" />
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea className="input-field" rows={2} value={trackForm.notes} onChange={e => setTrackForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any additional info..." />
          </FormField>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setTrackModal(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Add Event'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Detail({ label, value, mono }) {
  return (
    <div>
      <p className="text-xs text-zinc-500 mb-0.5">{label}</p>
      <p className={`text-sm text-zinc-200 ${mono ? 'font-mono' : 'font-medium'}`}>{value}</p>
    </div>
  );
}
