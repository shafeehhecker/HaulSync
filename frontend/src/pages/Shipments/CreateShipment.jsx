import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { PageHeader, Button, FormField } from '../../components/common';

const VEHICLE_TYPES = ['TRUCK', 'TRAILER', 'CONTAINER', 'TANKER', 'REFRIGERATED', 'FLATBED', 'MINI_TRUCK', 'TEMPO'];

export default function CreateShipment() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [companies, setCompanies] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [goodsTypes, setGoodsTypes] = useState([]);
  const [routes, setRoutes] = useState([]);

  const [form, setForm] = useState({
    shipperCompanyId: '', vehicleId: '', driverId: '', goodsTypeId: '', routeId: '',
    originCity: '', originState: '', destCity: '', destState: '',
    weight: '', quantity: 1, freightAmount: '', loadingDate: '', expectedDelivery: '',
    ewayBillNo: '', lrNumber: '', notes: '',
  });

  useEffect(() => {
    Promise.all([
      api.get('/companies', { params: { limit: 200 } }),
      api.get('/fleet', { params: { limit: 200 } }),
      api.get('/drivers', { params: { limit: 200 } }),
      api.get('/goods'),
      api.get('/routes'),
    ]).then(([c, v, d, g, r]) => {
      setCompanies(c.data.data || []);
      setVehicles(v.data.data || []);
      setDrivers(d.data.data || []);
      setGoodsTypes(g.data || []);
      setRoutes(r.data || []);
    });
  }, []);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleRouteSelect = (routeId) => {
    const route = routes.find(r => r.id === routeId);
    if (route) setForm(f => ({ ...f, routeId, originCity: route.originCity, originState: route.originState, destCity: route.destCity, destState: route.destState }));
    else setForm(f => ({ ...f, routeId }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/shipments', {
        ...form,
        quantity: Number(form.quantity),
        weight: form.weight ? Number(form.weight) : undefined,
        freightAmount: form.freightAmount ? Number(form.freightAmount) : undefined,
      });
      navigate(`/shipments/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create shipment');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl animate-fade-in">
      <PageHeader title="Create Shipment" subtitle="Schedule and dispatch a new freight trip" />
      {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Shipper Company" required>
            <select className="input-field" value={form.shipperCompanyId} onChange={set('shipperCompanyId')} required>
              <option value="">Select company...</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormField>

          <FormField label="Route">
            <select className="input-field" value={form.routeId} onChange={e => handleRouteSelect(e.target.value)}>
              <option value="">Custom route</option>
              {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </FormField>

          <FormField label="Origin City" required><input className="input-field" value={form.originCity} onChange={set('originCity')} placeholder="Mumbai" required /></FormField>
          <FormField label="Origin State" required><input className="input-field" value={form.originState} onChange={set('originState')} placeholder="Maharashtra" required /></FormField>
          <FormField label="Destination City" required><input className="input-field" value={form.destCity} onChange={set('destCity')} placeholder="Delhi" required /></FormField>
          <FormField label="Destination State" required><input className="input-field" value={form.destState} onChange={set('destState')} placeholder="Delhi" required /></FormField>

          <FormField label="Vehicle">
            <select className="input-field" value={form.vehicleId} onChange={set('vehicleId')}>
              <option value="">Assign vehicle...</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.registrationNo} ({v.type})</option>)}
            </select>
          </FormField>

          <FormField label="Driver">
            <select className="input-field" value={form.driverId} onChange={set('driverId')}>
              <option value="">Assign driver...</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.name} — {d.phone}</option>)}
            </select>
          </FormField>

          <FormField label="Goods Type">
            <select className="input-field" value={form.goodsTypeId} onChange={set('goodsTypeId')}>
              <option value="">Select goods...</option>
              {goodsTypes.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </FormField>

          <FormField label="Weight (tonnes)"><input type="number" className="input-field" value={form.weight} onChange={set('weight')} placeholder="10.5" step="0.1" /></FormField>
          <FormField label="Freight Amount (INR)"><input type="number" className="input-field" value={form.freightAmount} onChange={set('freightAmount')} placeholder="50000" /></FormField>
          <FormField label="Loading Date" required><input type="datetime-local" className="input-field" value={form.loadingDate} onChange={set('loadingDate')} required /></FormField>
          <FormField label="Expected Delivery"><input type="datetime-local" className="input-field" value={form.expectedDelivery} onChange={set('expectedDelivery')} /></FormField>
          <FormField label="E-Way Bill No"><input className="input-field font-mono" value={form.ewayBillNo} onChange={set('ewayBillNo')} placeholder="1234ABCDE5678" /></FormField>
          <FormField label="LR Number"><input className="input-field font-mono" value={form.lrNumber} onChange={set('lrNumber')} placeholder="LR/2024/001" /></FormField>

          <div className="col-span-2">
            <FormField label="Notes"><textarea className="input-field" rows={2} value={form.notes} onChange={set('notes')} placeholder="Additional instructions..." /></FormField>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-zinc-800">
          <Button type="button" variant="secondary" onClick={() => navigate('/shipments')}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Shipment'}</Button>
        </div>
      </form>
    </div>
  );
}
