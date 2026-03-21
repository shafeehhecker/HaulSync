import { useState, useEffect } from 'react';
import { Map, Plus } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, Button, SearchInput, EmptyState, Spinner, Modal, FormField } from '../../components/common';

export default function RouteManagement() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', originCity: '', originState: '', destCity: '', destState: '', distanceKm: '', estimatedDays: '' });
  const { canManage } = useAuth();

  const load = () => {
    setLoading(true);
    api.get('/routes').then(r => setRoutes(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/routes', { ...form, distanceKm: form.distanceKm ? Number(form.distanceKm) : undefined, estimatedDays: form.estimatedDays ? Number(form.estimatedDays) : undefined });
      setShowModal(false);
      setForm({ name: '', originCity: '', originState: '', destCity: '', destState: '', distanceKm: '', estimatedDays: '' });
      load();
    } finally { setSubmitting(false); }
  };

  const filtered = routes.filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.originCity.toLowerCase().includes(search.toLowerCase()) || r.destCity.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Route Management" subtitle={`${routes.length} routes defined`}
        action={canManage() && <Button onClick={() => setShowModal(true)}><Plus size={16} /> Add Route</Button>} />

      <SearchInput value={search} onChange={setSearch} placeholder="Search routes..." />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Route Name', 'Origin', 'Destination', 'Distance', 'Est. Days'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? <tr><td colSpan={5}><Spinner /></td></tr>
                : filtered.length === 0 ? <tr><td colSpan={5}><EmptyState icon={Map} title="No routes defined" description="Add common freight routes for quick selection" /></td></tr>
                : filtered.map(r => (
                  <tr key={r.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-zinc-200">{r.name}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{r.originCity}, {r.originState}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{r.destCity}, {r.destState}</td>
                    <td className="px-4 py-3 text-zinc-300 font-mono text-xs">{r.distanceKm ? `${r.distanceKm} km` : '—'}</td>
                    <td className="px-4 py-3 text-zinc-300 font-mono text-xs">{r.estimatedDays ? `${r.estimatedDays} day${r.estimatedDays > 1 ? 's' : ''}` : '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Route">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="col-span-2"><FormField label="Route Name" required><input className="input-field" value={form.name} onChange={set('name')} placeholder="Bangalore → Mumbai" required /></FormField></div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Origin City" required><input className="input-field" value={form.originCity} onChange={set('originCity')} placeholder="Bangalore" required /></FormField>
            <FormField label="Origin State" required><input className="input-field" value={form.originState} onChange={set('originState')} placeholder="Karnataka" required /></FormField>
            <FormField label="Dest City" required><input className="input-field" value={form.destCity} onChange={set('destCity')} placeholder="Mumbai" required /></FormField>
            <FormField label="Dest State" required><input className="input-field" value={form.destState} onChange={set('destState')} placeholder="Maharashtra" required /></FormField>
            <FormField label="Distance (km)"><input type="number" className="input-field" value={form.distanceKm} onChange={set('distanceKm')} placeholder="984" /></FormField>
            <FormField label="Est. Transit Days"><input type="number" className="input-field" value={form.estimatedDays} onChange={set('estimatedDays')} placeholder="2" /></FormField>
          </div>
          <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Add Route'}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
