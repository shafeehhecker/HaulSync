import { useState } from 'react';
import { Settings, Lock, User, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { PageHeader, Button, FormField } from '../../components/common';

function Alert({ type, message }) {
  if (!message) return null;
  const isSuccess = type === 'success';
  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg text-sm border ${
      isSuccess ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
    }`}>
      {isSuccess ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
      {message}
    </div>
  );
}

function ProfileSection({ user }) {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
          <User size={16} className="text-amber-400" />
        </div>
        <div>
          <h2 className="font-display font-semibold text-zinc-100">Profile</h2>
          <p className="text-xs text-zinc-500">Your account information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-zinc-500 mb-1.5 uppercase tracking-wider">Name</label>
          <div className="input-field text-zinc-300 cursor-default bg-zinc-900/50">{user?.name}</div>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1.5 uppercase tracking-wider">Email</label>
          <div className="input-field text-zinc-300 cursor-default bg-zinc-900/50">{user?.email}</div>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1.5 uppercase tracking-wider">Role</label>
          <div className="input-field cursor-default bg-zinc-900/50">
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 text-xs font-mono font-medium">
              {user?.role?.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1.5 uppercase tracking-wider">User ID</label>
          <div className="input-field font-mono text-xs text-zinc-500 cursor-default bg-zinc-900/50">{user?.id}</div>
        </div>
      </div>
    </div>
  );
}

function PasswordSection() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const strength = (pw) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColor = ['', 'bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-green-500'];
  const s = strength(form.newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (s < 2) {
      setError('Password is too weak. Use uppercase letters, numbers, or symbols.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setSuccess('Password changed successfully.');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
          <Lock size={16} className="text-amber-400" />
        </div>
        <div>
          <h2 className="font-display font-semibold text-zinc-100">Change Password</h2>
          <p className="text-xs text-zinc-500">Use a strong password you don't use elsewhere</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <Alert type="success" message={success} />
        <Alert type="error" message={error} />

        <FormField label="Current Password" required>
          <input
            type="password"
            value={form.currentPassword}
            onChange={e => set('currentPassword', e.target.value)}
            className="input-field"
            placeholder="••••••••"
            required
          />
        </FormField>

        <FormField label="New Password" required>
          <input
            type="password"
            value={form.newPassword}
            onChange={e => set('newPassword', e.target.value)}
            className="input-field"
            placeholder="••••••••"
            required
            minLength={8}
          />
          {form.newPassword && (
            <div className="mt-2 space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= s ? strengthColor[s] : 'bg-zinc-700'}`} />
                ))}
              </div>
              <p className={`text-xs ${s <= 1 ? 'text-red-400' : s === 2 ? 'text-amber-400' : s === 3 ? 'text-blue-400' : 'text-green-400'}`}>
                {strengthLabel[s]}
              </p>
            </div>
          )}
        </FormField>

        <FormField label="Confirm New Password" required>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={e => set('confirmPassword', e.target.value)}
            className="input-field"
            placeholder="••••••••"
            required
          />
          {form.confirmPassword && form.newPassword !== form.confirmPassword && (
            <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
          )}
        </FormField>

        <Button type="submit" disabled={loading || !form.currentPassword || !form.newPassword || !form.confirmPassword}>
          {loading ? 'Updating...' : 'Update Password'}
        </Button>
      </form>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      <PageHeader title="Settings" subtitle="Manage your account preferences" />
      <ProfileSection user={user} />
      <PasswordSection />
    </div>
  );
}
