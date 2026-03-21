import { useState, useEffect } from 'react';
import { Users, Plus } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, Button, SearchInput, EmptyState, Spinner, Modal, FormField, StatusBadge } from '../../components/common';

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER', 'TRANSPORTER'];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'OPERATOR', phone: '', companyId: '' });
  const { isAdmin } = useAuth();

  const load = () => {
    setLoading(true);
    api.get('/users', { params: { limit: 50, ...(search && { search }) } })
      .then(r => { setUsers(r.data.data); setTotal(r.data.total); }).finally(() => setLoading(false));
  };

  useEffect(() => { if (isAdmin()) load(); else setLoading(false); }, []);
  useEffect(() => { const t = setTimeout(load, 400); return () => clearTimeout(t); }, [search]);
  useEffect(() => { api.get('/companies', { params: { limit: 200 } }).then(r => setCompanies(r.data.data || [])); }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/users', form);
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'OPERATOR', phone: '', companyId: '' });
      load();
    } finally { setSubmitting(false); }
  };

  const toggleActive = async (u) => {
    await api.put(`/users/${u.id}`, { isActive: !u.isActive });
    load();
  };

  const roleColor = {
    SUPER_ADMIN: 'text-red-400', ADMIN: 'text-amber-400', MANAGER: 'text-blue-400',
    OPERATOR: 'text-green-400', VIEWER: 'text-zinc-400', TRANSPORTER: 'text-purple-400',
  };

  if (!isAdmin()) return <div className="text-zinc-400 p-6">Access restricted to administrators.</div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="User Management" subtitle={`${total} users · unlimited access at no extra cost`}
        action={<Button onClick={() => setShowModal(true)}><Plus size={16} /> Add User</Button>} />

      <SearchInput value={search} onChange={setSearch} placeholder="Search users..." />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Name', 'Email', 'Role', 'Company', 'Phone', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? <tr><td colSpan={7}><Spinner /></td></tr>
                : users.length === 0 ? <tr><td colSpan={7}><EmptyState icon={Users} title="No users" /></td></tr>
                : users.map(u => (
                  <tr key={u.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-zinc-200">{u.name}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs font-mono">{u.email}</td>
                    <td className="px-4 py-3 text-xs font-semibold font-mono"><span className={roleColor[u.role]}>{u.role}</span></td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{u.company?.name || '—'}</td>
                    <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{u.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${u.isActive ? 'text-green-400' : 'text-red-400'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActive(u)} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add User">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Full Name" required><input className="input-field" value={form.name} onChange={set('name')} required /></FormField>
            <FormField label="Email" required><input type="email" className="input-field" value={form.email} onChange={set('email')} required /></FormField>
            <FormField label="Password" required><input type="password" className="input-field" value={form.password} onChange={set('password')} placeholder="Min 8 chars" required /></FormField>
            <FormField label="Phone"><input className="input-field font-mono" value={form.phone} onChange={set('phone')} /></FormField>
            <FormField label="Role" required><select className="input-field" value={form.role} onChange={set('role')}>{ROLES.map(r => <option key={r} value={r}>{r}</option>)}</select></FormField>
            <FormField label="Company"><select className="input-field" value={form.companyId} onChange={set('companyId')}><option value="">Unassigned</option>{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></FormField>
          </div>
          <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create User'}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
