import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './TripDispatcher.css';
import StatusBadge from '../../components/StatusBadge';
import axios from 'axios';

// ─── Pipeline progress bar component ─────────────────────────────────────────
const PHASES = [
  { key: 'DRAFT',      label: 'Draft' },
  { key: 'DISPATCHED', label: 'Dispatched' },
  { key: 'COMPLETED',  label: 'Completed' },
];

const TripPipeline = ({ status }) => {
  const isCancelled = status === 'CANCELLED';

  const getPhaseState = (phaseKey) => {
    if (isCancelled) {
      if (phaseKey === 'DRAFT') return 'done';
      return 'idle';
    }
    const order = ['DRAFT', 'DISPATCHED', 'COMPLETED'];
    const currentIdx = order.indexOf(status);
    const phaseIdx   = order.indexOf(phaseKey);
    if (phaseIdx < currentIdx)  return 'done';
    if (phaseIdx === currentIdx) return 'active';
    return 'idle';
  };

  return (
    <div className="pipeline">
      {PHASES.map((phase, i) => {
        const state      = getPhaseState(phase.key);
        const isLast     = i === PHASES.length - 1;
        const connDone   = getPhaseState(PHASES[Math.min(i + 1, PHASES.length - 1)].key) !== 'idle' && !isLast;

        let nodeClass  = 'pipeline-node';
        let labelClass = 'pipeline-label';
        if (state === 'done')   { nodeClass += ' done';   labelClass += ' done-label'; }
        if (state === 'active') { nodeClass += ' active'; labelClass += ' active-label'; }

        return (
          <React.Fragment key={phase.key}>
            <div className="pipeline-step">
              <div className={nodeClass} />
              <span className={labelClass}>{phase.label}</span>
            </div>
            {!isLast && (
              <div className={`pipeline-connector${connDone ? ' done' : ''}`} />
            )}
          </React.Fragment>
        );
      })}

      {/* Cancelled node appended at the end */}
      <>
        <div className={`pipeline-connector${isCancelled ? ' done' : ''}`} style={{ background: isCancelled ? '#f87171' : undefined }} />
        <div className="pipeline-step">
          <div className={`pipeline-node${isCancelled ? ' cancelled' : ''}`} />
          <span className={`pipeline-label${isCancelled ? ' cancelled-label' : ''}`}>Cancelled</span>
        </div>
      </>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const TripDispatcher = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    source: '', destination: '', vehicle: '', driver: '',
    cargoWeight: '', plannedDistance: '', revenue: ''
  });
  const [error,    setError]    = useState(null);
  const [trips,    setTrips]    = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers,  setDrivers]  = useState([]);
  const [loading,  setLoading]  = useState({});

  const fetchTrips = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/trips/');
      setTrips(response.data);
    } catch (err) {
      console.error('Failed to fetch trips', err);
    }
  }, []);

  const fetchAvailableResources = useCallback(async () => {
    try {
      const [vehiclesRes, driversRes] = await Promise.all([
        axios.get('http://localhost:8000/api/vehicles/'),
        axios.get('http://localhost:8000/api/drivers/')
      ]);
      setVehicles(vehiclesRes.data);
      setDrivers(driversRes.data);
    } catch (err) {
      console.error("Failed to fetch vehicles or drivers", err);
    }
  }, []);

  // Initial load + auto-poll every 10 seconds for live tracking
  useEffect(() => {
    fetchTrips();
    fetchAvailableResources();
    const pollInterval = setInterval(fetchTrips, 10000);
    return () => clearInterval(pollInterval);
  }, [fetchTrips, fetchAvailableResources]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleCreateAndDispatch = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const createRes = await axios.post('http://localhost:8000/api/trips/', {
        source:           formData.source,
        destination:      formData.destination,
        vehicle:          formData.vehicle,
        driver:           formData.driver,
        cargo_weight:     formData.cargoWeight,
        planned_distance: formData.plannedDistance,
        revenue:          formData.revenue || 0.00,
      });

      await axios.post(`http://localhost:8000/api/trips/${createRes.data.id}/dispatch_trip/`);

      setFormData({ source: '', destination: '', vehicle: '', driver: '', cargoWeight: '', plannedDistance: '', revenue: '' });
      fetchTrips();
      fetchAvailableResources();
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      setError(typeof errorMsg === 'object' ? JSON.stringify(errorMsg).replace(/["{}\[\]]/g, '') : errorMsg);
    }
  };

  // ─── Action handler for Live Board buttons ──────────────────────────────
  const handleAction = async (tripId, actionType) => {
    setLoading(prev => ({ ...prev, [`${tripId}_${actionType}`]: true }));
    try {
      const res = await axios.post(`http://localhost:8000/api/trips/${tripId}/${actionType}/`);
      if (res.status >= 200 && res.status < 300) {
        fetchTrips();
        fetchAvailableResources();
      }
    } catch (err) {
      const msg = err.response?.data?.error;
      alert('Action failed: ' + (Array.isArray(msg) ? msg.join(', ') : msg || err.message));
    } finally {
      setLoading(prev => ({ ...prev, [`${tripId}_${actionType}`]: false }));
    }
  };

  const isActionLoading = (tripId, actionType) => !!loading[`${tripId}_${actionType}`];

  const formIsValid = formData.source && formData.destination && formData.vehicle
    && formData.driver && formData.cargoWeight && formData.plannedDistance;

  return (
    <div className="dispatcher-container">
      {/* ── LEFT: Dispatch Form ── */}
      <div className="form-section">
        <h2>Trip Dispatcher</h2>

        <form onSubmit={handleCreateAndDispatch} style={{ marginTop: '24px' }}>
          <div className="form-group">
            <label>Source</label>
            <input type="text" name="source" value={formData.source} onChange={handleChange} className="form-control" required />
          </div>
          <div className="form-group">
            <label>Destination</label>
            <input type="text" name="destination" value={formData.destination} onChange={handleChange} className="form-control" required />
          </div>

          <div className="form-group">
            <label>Vehicle</label>
            <select name="vehicle" value={formData.vehicle} onChange={handleChange} className="form-control" required>
              <option value="">Select Vehicle...</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id} disabled={v.status !== 'Available'}>
                  {v.registration_no} - {v.name} ({v.capacity}) [{v.status}]
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Driver</label>
            <select name="driver" value={formData.driver} onChange={handleChange} className="form-control" required>
              <option value="">Select Driver...</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id} disabled={d.status !== 'AVAILABLE'}>
                  {d.name} ({d.license_category}) [{d.status}]
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Cargo Weight (KG)</label>
            <input type="number" name="cargoWeight" value={formData.cargoWeight} onChange={handleChange} className="form-control" required />
          </div>

          <div className="form-group">
            <label>Planned Distance (KM)</label>
            <input type="number" name="plannedDistance" value={formData.plannedDistance} onChange={handleChange} className="form-control" required />
          </div>

          <div className="form-group">
            <label>Expected Revenue (₹)</label>
            <input
              type="number" step="0.01" name="revenue"
              value={formData.revenue} onChange={handleChange}
              className="form-control" placeholder="e.g. 5000.00" required
            />
          </div>

          {error && (
            <div className="error-box">
              <strong>✕ Error:</strong> {error} — Dispatch blocked
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', gap: '12px' }}>
            <button type="submit" className={`btn-dispatch ${formIsValid ? 'active' : ''}`} disabled={!formIsValid}>
              🚀 Create &amp; Dispatch
            </button>
            <button
              type="button"
              className="btn-dispatch"
              style={{ backgroundColor: '#374151', color: '#9ca3af', cursor: 'pointer' }}
              onClick={() => setFormData({ source: '', destination: '', vehicle: '', driver: '', cargoWeight: '', plannedDistance: '', revenue: '' })}
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* ── RIGHT: Live Board ── */}
      <div className="live-board-section">
        <h3 style={{ color: '#9ca3af', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>
          ● Live Board
          <span style={{ fontSize: '0.7rem', color: '#4b5563', marginLeft: '8px', fontWeight: 'normal' }}>
            auto-refreshes every 10s
          </span>
        </h3>

        <div style={{ marginTop: '20px' }}>
          {trips.length === 0 && (
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>No trips yet. Create one using the form.</p>
          )}

          {trips.map(trip => (
            <div key={trip.id} className="live-board-card">
              {/* Top row: tracking + status + right-side vehicle/driver */}
              <div className="live-board-card-top">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '800', fontSize: '1rem', color: '#f9fafb', letterSpacing: '0.5px' }}>
                    {trip.tracking_number}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '4px' }}>
                    {trip.source} &rarr; {trip.destination}
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <StatusBadge status={trip.status} />
                  </div>
                </div>

                {/* Right side: vehicle + driver (vehicle name is click-through) */}
                <div style={{ textAlign: 'right', fontSize: '0.82rem', color: '#9ca3af', minWidth: '120px' }}>
                  <span
                    className="vehicle-link"
                    title="View in Execution Board"
                    onClick={() => navigate(`/tasks?highlight=${trip.id}`)}
                  >
                    {trip.vehicle_registration || 'Vehicle'}
                  </span>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{trip.vehicle_name}</div>
                  <div style={{ marginTop: '6px', fontWeight: '600', color: '#d1d5db' }}>{trip.driver_name || 'Driver'}</div>
                  {trip.revenue && (
                    <div style={{ color: '#4ade80', fontWeight: '700', marginTop: '4px' }}>₹{trip.revenue}</div>
                  )}
                </div>
              </div>

              {/* Pipeline progress bar */}
              <TripPipeline status={trip.status} />

              {/* Action buttons */}
              <div className="card-actions">
                {trip.status === 'DRAFT' && (
                  <button
                    className="btn-action dispatch"
                    disabled={isActionLoading(trip.id, 'dispatch_trip')}
                    onClick={() => handleAction(trip.id, 'dispatch_trip')}
                  >
                    {isActionLoading(trip.id, 'dispatch_trip') ? '...' : '▶ Dispatch'}
                  </button>
                )}
                {trip.status === 'DISPATCHED' && (
                  <button
                    className="btn-action complete"
                    disabled={isActionLoading(trip.id, 'complete_trip')}
                    onClick={() => handleAction(trip.id, 'complete_trip')}
                  >
                    {isActionLoading(trip.id, 'complete_trip') ? '...' : '✓ Complete'}
                  </button>
                )}
                {['DRAFT', 'DISPATCHED'].includes(trip.status) && (
                  <button
                    className="btn-action cancel"
                    disabled={isActionLoading(trip.id, 'cancel_trip')}
                    onClick={() => handleAction(trip.id, 'cancel_trip')}
                  >
                    {isActionLoading(trip.id, 'cancel_trip') ? '...' : '✕ Cancel'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TripDispatcher;