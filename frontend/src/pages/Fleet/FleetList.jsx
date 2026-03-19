import { useState, useEffect } from 'react';
import { Truck, Plus } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, Button, StatusBadge, SearchInput, EmptyState, Spinner, Modal, FormField } from '../../components/common';

const VEHICLE_TYPES = ['TRUCK', 'TRAILER', 'CONTAINER', 'TANKER', 'REFRIGERATED', 'FLATBED', 'MINI_TRUCK', 'TEMPO'];

export default function FleetList() {
  const [vehicles, setVehicles] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({ registrationNo: '', type: 'TRUCK', capacity: '', make: '', model: '', year: '', companyId: '' });
  const { canManage } = useAuth();

  const load = () => {
    setLoading(true);
    const params = { limit: 50, ...(search && { search }) };
    api.get('/fleet', { params }).then(r => { setVehicles(r.data.data); setTotal(r.data.total); }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { const t = setTimeout(load, 400); return () => clearTimeout(t); }, [search]);
  useEffect(() => { api.get('/companies', { params: { limit: 200 } }).then(r => setCompanies(r.data.data || [])); }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/fleet', { ...form, capacity: Number(form.capacity), year: form.year ? Number(form.year) : undefined });
      setShowModal(false);
      setForm({ registrationNo: '', type: 'TRUCK', capacity: '', make: '', model: '', year: '', companyId: '' });
      load();
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Fleet Management" subtitle={`${total} vehicles registered`}
        action={canManage() && <Button onClick={() => setShowModal(true)}><Plus size={16} /> Add Vehicle</Button>} />

      <SearchInput value={search} onChange={setSearch} placeholder="Search by registration..." />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Registration', 'Type', 'Capacity', 'Make/Model', 'Company', 'Insurance', 'Trips', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? <tr><td colSpan={8}><Spinner /></td></tr>
                : vehicles.length === 0 ? <tr><td colSpan={8}><EmptyState icon={Truck} title="No vehicles" description="Add your first vehicle to the fleet" /></td></tr>
                : vehicles.map(v => (
                  <tr key={v.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-amber-400 font-medium">{v.registrationNo}</td>
                    <td className="px-4 py-3 text-zinc-300 text-xs">{v.type}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{v.capacity ? `${v.capacity}T` : '—'}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{v.make} {v.model}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{v.company?.name || '—'}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">
                      {v.insuranceExpiry
                        ? <span className={new Date(v.insuranceExpiry) < new Date() ? 'text-red-400' : 'text-green-400'}>
                            {new Date(v.insuranceExpiry).toLocaleDateString('en-IN')}
                          </span>
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-zinc-300 font-mono text-xs">{v._count?.trips || 0}</td>
                    <td className="px-4 py-3 text-xs text-zinc-600">—</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Vehicle">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><FormField label="Registration No" required><input className="input-field font-mono" value={form.registrationNo} onChange={set('registrationNo')} placeholder="KA01AB1234" required /></FormField></div>
            <FormField label="Type" required><select className="input-field" value={form.type} onChange={set('type')}>{VEHICLE_TYPES.map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}</select></FormField>
            <FormField label="Capacity (tonnes)" required><input type="number" className="input-field" value={form.capacity} onChange={set('capacity')} placeholder="10" required /></FormField>
            <FormField label="Make"><input className="input-field" value={form.make} onChange={set('make')} placeholder="Tata" /></FormField>
            <FormField label="Model"><input className="input-field" value={form.model} onChange={set('model')} placeholder="LPT 1613" /></FormField>
            <FormField label="Year"><input type="number" className="input-field" value={form.year} onChange={set('year')} placeholder="2022" /></FormField>
            <FormField label="Company"><select className="input-field" value={form.companyId} onChange={set('companyId')}><option value="">Select...</option>{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></FormField>
          </div>
          <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Add Vehicle'}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
