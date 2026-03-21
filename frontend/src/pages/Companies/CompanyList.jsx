import { useState, useEffect } from 'react';
import { Building2, Plus } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, Button, SearchInput, EmptyState, Spinner, Modal, FormField } from '../../components/common';

const COMPANY_TYPES = ['SHIPPER', 'TRANSPORTER', 'BROKER', 'CONSIGNEE', 'BOTH'];

export default function CompanyList() {
  const [companies, setCompanies] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'SHIPPER', gstin: '', city: '', state: '', phone: '', email: '', contactPerson: '' });
  const { canManage } = useAuth();

  const load = () => {
    setLoading(true);
    api.get('/companies', { params: { limit: 50, ...(search && { search }), ...(type && { type }) } })
      .then(r => { setCompanies(r.data.data); setTotal(r.data.total); }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [type]);
  useEffect(() => { const t = setTimeout(load, 400); return () => clearTimeout(t); }, [search]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/companies', form);
      setShowModal(false);
      setForm({ name: '', type: 'SHIPPER', gstin: '', city: '', state: '', phone: '', email: '', contactPerson: '' });
      load();
    } finally { setSubmitting(false); }
  };

  const typeColor = { SHIPPER: 'badge-blue', TRANSPORTER: 'badge-amber', BROKER: 'badge-purple', CONSIGNEE: 'badge-green', BOTH: 'badge-zinc' };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Companies" subtitle={`${total} companies in directory`}
        action={canManage() && <Button onClick={() => setShowModal(true)}><Plus size={16} /> Add Company</Button>} />

      <div className="flex gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search companies..." />
        <select className="input-field w-40" value={type} onChange={e => setType(e.target.value)}>
          <option value="">All Types</option>
          {COMPANY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Company', 'Type', 'GSTIN', 'City', 'Contact Person', 'Phone', 'Email'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? <tr><td colSpan={7}><Spinner /></td></tr>
                : companies.length === 0 ? <tr><td colSpan={7}><EmptyState icon={Building2} title="No companies found" /></td></tr>
                : companies.map(c => (
                  <tr key={c.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-zinc-200">{c.name}</td>
                    <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${typeColor[c.type] || 'badge-zinc'}`}>{c.type}</span></td>
                    <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{c.gstin || '—'}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{c.city ? `${c.city}, ${c.state}` : '—'}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{c.contactPerson || '—'}</td>
                    <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{c.phone || '—'}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{c.email || '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Company">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><FormField label="Company Name" required><input className="input-field" value={form.name} onChange={set('name')} required /></FormField></div>
            <FormField label="Type" required><select className="input-field" value={form.type} onChange={set('type')}>{COMPANY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></FormField>
            <FormField label="GSTIN"><input className="input-field font-mono" value={form.gstin} onChange={set('gstin')} placeholder="29ABCDE1234F1Z5" /></FormField>
            <FormField label="City"><input className="input-field" value={form.city} onChange={set('city')} /></FormField>
            <FormField label="State"><input className="input-field" value={form.state} onChange={set('state')} /></FormField>
            <FormField label="Phone"><input className="input-field font-mono" value={form.phone} onChange={set('phone')} /></FormField>
            <FormField label="Email"><input type="email" className="input-field" value={form.email} onChange={set('email')} /></FormField>
            <div className="col-span-2"><FormField label="Contact Person"><input className="input-field" value={form.contactPerson} onChange={set('contactPerson')} /></FormField></div>
          </div>
          <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Add Company'}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
