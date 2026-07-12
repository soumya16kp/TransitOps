import React, { useState, useEffect } from 'react';
import './TripDispatcher.css';
import StatusBadge from '../../components/StatusBadge';
import axios from 'axios';

const TripDispatcher = () => {
  const [formData, setFormData] = useState({
    source: '', destination: '', vehicle: '', driver: '', cargoWeight: '', plannedDistance: ''
  });
  const [error, setError] = useState(null);
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  
  useEffect(() => {
    fetchTrips();
    fetchAvailableResources();
  }, []);

  const fetchTrips = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/trips/');
      setTrips(response.data);
    } catch (err) {
      console.error("Failed to fetch trips", err);
    }
  };

  const fetchAvailableResources = async () => {
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
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null); // Clear errors when user types
  };

  const handleCreateAndDispatch = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // 1. Create Draft Trip
      const createRes = await axios.post('http://localhost:8000/api/trips/', {
        source: formData.source,
        destination: formData.destination,
        vehicle: formData.vehicle, // ID of vehicle
        driver: formData.driver,   // ID of driver
        cargo_weight: formData.cargoWeight,
        planned_distance: formData.plannedDistance
      });

      const createData = createRes.data;

      // 2. Immediately Dispatch It
      await axios.post(`http://localhost:8000/api/trips/${createData.id}/dispatch_trip/`);

      // Success
      setFormData({ source: '', destination: '', vehicle: '', driver: '', cargoWeight: '', plannedDistance: '' });
      fetchTrips(); // Refresh Live Board
      fetchAvailableResources(); // Refresh dropdowns

    } catch (err) {
      // Parse Django errors and show in the red box
      const errorMsg = err.response?.data?.error || err.message;
      setError(typeof errorMsg === 'object' ? JSON.stringify(errorMsg).replace(/["{}\[\]]/g, '') : errorMsg);
    }
  };

  return (
    <div className="dispatcher-container">
      {/* LEFT PANE: Form */}
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

          {error && (
            <div className="error-box">
              <strong>X Error:</strong> {error} - Dispatch blocked
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
            <button type="submit" className={`btn-dispatch ${formData.cargoWeight ? 'active' : ''}`}>
              Dispatch
            </button>
            <button type="button" className="btn-dispatch" style={{ backgroundColor: '#374151', color: '#fff', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* RIGHT PANE: Live Board */}
      <div className="live-board-section">
        <h3 style={{ color: '#9ca3af', textTransform: 'uppercase', fontSize: '0.85rem' }}>Live Board</h3>
        
        <div style={{ marginTop: '24px' }}>
          {trips.length === 0 ? <p style={{ color: '#6b7280' }}>No active trips.</p> : null}
          
          {trips.map(trip => (
            <div key={trip.id} className="live-board-card">
              <div>
                <div style={{ fontWeight: 'bold' }}>{trip.tracking_number}</div>
                <div style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: '4px' }}>
                  {trip.source} &rarr; {trip.destination}
                </div>
                <div style={{ marginTop: '12px' }}>
                  <StatusBadge status={trip.status} />
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#9ca3af' }}>
                <div style={{ fontWeight: 'bold', color: '#f3f4f6' }}>{trip.vehicle_name || 'Vehicle'}</div>
                <div style={{ fontSize: '0.75rem', marginBottom: '8px' }}>Capacity: {trip.vehicle_capacity || 'N/A'}</div>
                <div style={{ fontWeight: 'bold', color: '#f3f4f6' }}>{trip.driver_name || 'Driver'}</div>
                <div style={{ fontSize: '0.75rem' }}>Contact: {trip.driver_contact || 'N/A'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TripDispatcher;