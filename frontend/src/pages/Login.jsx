import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Zap, ArrowRight, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Left panel */}
      <div className="flex-1 hidden lg:flex flex-col justify-between p-12 bg-zinc-900 border-r border-zinc-800 relative overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'linear-gradient(#F59E0B 1px, transparent 1px), linear-gradient(90deg, #F59E0B 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
              <Zap size={20} className="text-zinc-950 fill-zinc-950" />
            </div>
            <span className="font-display text-xl font-bold text-zinc-100">HaulSync</span>
          </div>
        </div>

        <div className="relative space-y-6">
          <div>
            <h2 className="font-display text-5xl font-bold text-zinc-100 leading-tight">
              Your freight.<br />
              <span className="text-amber-400">Fully synced.</span>
            </h2>
            <p className="text-zinc-400 text-lg mt-4 max-w-sm leading-relaxed">
              Open-source logistics operating system. Manage RFQs, track shipments, and reconcile invoices — all in one place.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-sm">
            {['RFQ Indenting', 'Live Tracking', 'Fleet Management', 'Invoice Reconciliation'].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-zinc-400">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                {f}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-zinc-600 text-sm">Open source · Self-hostable · MIT License</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-zinc-950 fill-zinc-950" />
            </div>
            <span className="font-display text-lg font-bold text-zinc-100">HaulSync</span>
          </div>

          <h1 className="font-display text-2xl font-bold text-zinc-100 mb-1">Sign in</h1>
          <p className="text-zinc-400 text-sm mb-8">Access your logistics dashboard</p>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-6">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@company.com"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-500 text-zinc-950 font-semibold rounded-lg hover:bg-amber-400 active:bg-amber-600 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
              ) : (
                <>Sign in <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-8 p-4 rounded-lg bg-zinc-900 border border-zinc-800">
            <p className="text-xs font-medium text-zinc-400 mb-2">Demo credentials</p>
            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between text-zinc-500">
                <span className="text-zinc-400">admin@haulsync.local</span>
                <span>Admin@1234</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span className="text-zinc-400">transporter@haulsync.local</span>
                <span>Trans@1234</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
