import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { PageHeader, Button, FormField } from '../../components/common';

const VEHICLE_TYPES = ['TRUCK', 'TRAILER', 'CONTAINER', 'TANKER', 'REFRIGERATED', 'FLATBED', 'MINI_TRUCK', 'TEMPO'];

export default function CreateRFQ() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [companies, setCompanies] = useState([]);
  const [goodsTypes, setGoodsTypes] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [form, setForm] = useState({
    title: '', shipperCompanyId: '', originCity: '', originState: '', destCity: '', destState: '',
    vehicleType: 'TRUCK', goodsTypeId: '', routeId: '', weight: '', quantity: 1,
    loadingDate: '', deliveryDate: '', description: '', basePrice: '', expiresAt: '',
  });

  useEffect(() => {
    Promise.all([
      api.get('/companies', { params: { type: 'SHIPPER', limit: 100 } }),
      api.get('/goods'),
      api.get('/routes'),
    ]).then(([c, g, r]) => {
      setCompanies(c.data.data || []);
      setGoodsTypes(g.data || []);
      setRoutes(r.data || []);
    });
  }, []);

  const handleRouteSelect = (routeId) => {
    const route = routes.find(r => r.id === routeId);
    if (route) {
      setForm(f => ({ ...f, routeId, originCity: route.originCity, originState: route.originState, destCity: route.destCity, destState: route.destState }));
    } else {
      setForm(f => ({ ...f, routeId }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = { ...form, quantity: Number(form.quantity), weight: form.weight ? Number(form.weight) : undefined, basePrice: form.basePrice ? Number(form.basePrice) : undefined };
      const { data } = await api.post('/rfq', payload);
      navigate(`/rfq/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create RFQ');
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <div className="max-w-3xl animate-fade-in">
      <PageHeader title="Create RFQ" subtitle="Post a truck requirement for transporters to quote on" />

      {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <FormField label="RFQ Title" required>
              <input className="input-field" value={form.title} onChange={set('title')} placeholder="e.g. Mumbai to Delhi — FMCG Load" required />
            </FormField>
          </div>

          <FormField label="Shipper Company" required>
            <select className="input-field" value={form.shipperCompanyId} onChange={set('shipperCompanyId')} required>
              <option value="">Select company...</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormField>

          <FormField label="Predefined Route">
            <select className="input-field" value={form.routeId} onChange={e => handleRouteSelect(e.target.value)}>
              <option value="">Custom route (fill below)</option>
              {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </FormField>

          <FormField label="Origin City" required>
            <input className="input-field" value={form.originCity} onChange={set('originCity')} placeholder="Mumbai" required />
          </FormField>
          <FormField label="Origin State" required>
            <input className="input-field" value={form.originState} onChange={set('originState')} placeholder="Maharashtra" required />
          </FormField>
          <FormField label="Destination City" required>
            <input className="input-field" value={form.destCity} onChange={set('destCity')} placeholder="Delhi" required />
          </FormField>
          <FormField label="Destination State" required>
            <input className="input-field" value={form.destState} onChange={set('destState')} placeholder="Delhi" required />
          </FormField>

          <FormField label="Vehicle Type" required>
            <select className="input-field" value={form.vehicleType} onChange={set('vehicleType')} required>
              {VEHICLE_TYPES.map(v => <option key={v} value={v}>{v.replace('_', ' ')}</option>)}
            </select>
          </FormField>

          <FormField label="Goods Type">
            <select className="input-field" value={form.goodsTypeId} onChange={set('goodsTypeId')}>
              <option value="">Select goods type...</option>
              {goodsTypes.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </FormField>

          <FormField label="Weight (tonnes)">
            <input type="number" className="input-field" value={form.weight} onChange={set('weight')} placeholder="10.5" step="0.1" min="0" />
          </FormField>
          <FormField label="Quantity (vehicles)">
            <input type="number" className="input-field" value={form.quantity} onChange={set('quantity')} min="1" required />
          </FormField>

          <FormField label="Loading Date" required>
            <input type="datetime-local" className="input-field" value={form.loadingDate} onChange={set('loadingDate')} required />
          </FormField>
          <FormField label="Expected Delivery">
            <input type="datetime-local" className="input-field" value={form.deliveryDate} onChange={set('deliveryDate')} />
          </FormField>

          <FormField label="Base Price (INR)">
            <input type="number" className="input-field" value={form.basePrice} onChange={set('basePrice')} placeholder="50000" min="0" />
          </FormField>
          <FormField label="RFQ Expires At">
            <input type="datetime-local" className="input-field" value={form.expiresAt} onChange={set('expiresAt')} />
          </FormField>

          <div className="col-span-2">
            <FormField label="Additional Notes">
              <textarea className="input-field" rows={3} value={form.description} onChange={set('description')} placeholder="Special instructions, load details, route constraints..." />
            </FormField>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
          <Button type="button" variant="secondary" onClick={() => navigate('/rfq')}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create RFQ'}
          </Button>
        </div>
      </form>
    </div>
  );
}
