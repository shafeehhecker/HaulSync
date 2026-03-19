import { useState, useEffect } from 'react';
import { UserCheck, Plus, Star } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, Button, SearchInput, EmptyState, Spinner, Modal, FormField } from '../../components/common';

export default function DriverList() {
  const [drivers, setDrivers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', licenseNo: '', address: '', city: '', state: '', companyId: '', emergencyContact: '' });
  const { canManage } = useAuth();

  const load = () => {
    setLoading(true);
    api.get('/drivers', { params: { limit: 50, ...(search && { search }) } })
      .then(r => { setDrivers(r.data.data); setTotal(r.data.total); }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { const t = setTimeout(load, 400); return () => clearTimeout(t); }, [search]);
  useEffect(() => { api.get('/companies', { params: { limit: 200 } }).then(r => setCompanies(r.data.data || [])); }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/drivers', form);
      setShowModal(false);
      setForm({ name: '', phone: '', licenseNo: '', address: '', city: '', state: '', companyId: '', emergencyContact: '' });
      load();
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Driver Management" subtitle={`${total} active drivers`}
        action={canManage() && <Button onClick={() => setShowModal(true)}><Plus size={16} /> Add Driver</Button>} />

      <SearchInput value={search} onChange={setSearch} placeholder="Search drivers..." />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Name', 'Phone', 'License No', 'Location', 'Company', 'Rating', 'Total Trips'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? <tr><td colSpan={7}><Spinner /></td></tr>
                : drivers.length === 0 ? <tr><td colSpan={7}><EmptyState icon={UserCheck} title="No drivers" /></td></tr>
                : drivers.map(d => (
                  <tr key={d.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="px-4 py-3 text-zinc-200 font-medium">{d.name}</td>
                    <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{d.phone}</td>
                    <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{d.licenseNo}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{d.city ? `${d.city}, ${d.state}` : '—'}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{d.company?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-amber-400 fill-amber-400" />
                        <span className="text-zinc-300 text-xs font-mono">{d.rating?.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-300 font-mono text-xs">{d.totalTrips}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Driver">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Full Name" required><input className="input-field" value={form.name} onChange={set('name')} placeholder="Ramesh Kumar" required /></FormField>
            <FormField label="Phone" required><input className="input-field font-mono" value={form.phone} onChange={set('phone')} placeholder="9876543210" required /></FormField>
            <FormField label="License No" required><input className="input-field font-mono" value={form.licenseNo} onChange={set('licenseNo')} placeholder="KA0120210001234" required /></FormField>
            <FormField label="Emergency Contact"><input className="input-field font-mono" value={form.emergencyContact} onChange={set('emergencyContact')} placeholder="9876543211" /></FormField>
            <FormField label="City"><input className="input-field" value={form.city} onChange={set('city')} placeholder="Bangalore" /></FormField>
            <FormField label="State"><input className="input-field" value={form.state} onChange={set('state')} placeholder="Karnataka" /></FormField>
            <div className="col-span-2"><FormField label="Company"><select className="input-field" value={form.companyId} onChange={set('companyId')}><option value="">Unassigned</option>{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></FormField></div>
          </div>
          <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Add Driver'}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
