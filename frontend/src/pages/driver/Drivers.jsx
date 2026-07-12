import React, { useState, useEffect, useCallback } from 'react';
import './driver.css';
import StatusBadge from '../../components/StatusBadge';
import driverService from '../../services/DriverService';
import DriverModal from './DriverModal';

const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editDriver, setEditDriver] = useState(null);

  // Fetch Drivers from Backend
  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await driverService.getDrivers({
        status: statusFilter,
        search: searchTerm,
      });
      setDrivers(data);
    } catch (err) {
      setError('Failed to load drivers. Make sure the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  // Handlers
  const handleOpenAdd = () => {
    setEditDriver(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (driver) => {
    setEditDriver(driver);
    setModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete driver profile for ${name}?`)) return;
    try {
      await driverService.deleteDriver(id);
      fetchDrivers();
    } catch (err) {
      alert('Delete failed: ' + JSON.stringify(err));
    }
  };

  const handleSave = async (formData, id) => {
    if (id) {
      await driverService.updateDriver(id, formData);
    } else {
      await driverService.createDriver(formData);
    }
    fetchDrivers();
  };

  // Toggle Status Filter Helper
  const handleStatusToggle = (status) => {
    if (statusFilter === status) {
      setStatusFilter('All'); // Toggle off
    } else {
      setStatusFilter(status);
    }
  };

  // Check if license is expired
  const isLicenseExpired = (expiryDate) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    return expiry < today;
  };

  return (
    <div className="drivers-container">
      <div className="drivers-header">
        <div>
          <h2 style={{ margin: 0 }}>Drivers & Safety Profiles</h2>
          <p style={{ color: '#9ca3af', margin: '4px 0 0 0', fontSize: '0.9rem' }}>Manage driver profiles and compliance</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search driver or license..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #1f2937',
              backgroundColor: '#111827',
              color: '#fff',
              fontSize: '0.9rem'
            }}
          />
          <button className="add-btn" onClick={handleOpenAdd}>+ Add Driver</button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px', backgroundColor: '#7f1d1d', color: '#fca5a5', borderRadius: '6px', marginBottom: '16px' }}>
          <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>
          {error}
        </div>
      )}

      <div className="table-wrapper">
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>
            <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> Loading drivers...
          </div>
        ) : drivers.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>
            No drivers found. Add one or clear your filters.
          </div>
        ) : (
          <table className="drivers-table">
            <thead>
              <tr>
                <th>Driver</th>
                <th>License No</th>
                <th>Category</th>
                <th>Expiry</th>
                <th>Contact</th>
                <th>Safety Score</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => {
                const expired = isLicenseExpired(driver.license_expiry_date);
                return (
                  <tr key={driver.id}>
                    <td>{driver.name}</td>
                    <td>
                      <div>{driver.license_number}</div>
                      {driver.license_file && (
                        <div style={{ fontSize: '0.72rem', marginTop: '4px' }}>
                          <a 
                            href={`http://localhost:8000${driver.license_file}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ color: '#f5a623', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <i className="fas fa-file-pdf"></i>
                            View License
                          </a>
                        </div>
                      )}
                    </td>
                    <td>{driver.license_category}</td>
                    <td style={{ color: expired ? '#f87171' : 'inherit', fontWeight: expired ? 'bold' : 'normal' }}>
                      {driver.license_expiry_date} {expired && '(EXPIRED)'}
                    </td>
                    <td>{driver.contact_number}</td>
                    <td>{driver.safety_score}%</td>
                    <td>
                      <StatusBadge status={driver.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleOpenEdit(driver)}
                        style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', marginRight: '12px' }}
                      >
                        <i className="fas fa-edit"></i> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(driver.id, driver.name)}
                        style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                      >
                        <i className="fas fa-trash-alt"></i> Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Toggle Status Bar from Mockup */}
        <div style={{ marginTop: '30px' }}>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>
            Filter by Status {statusFilter !== 'All' && `(Active: ${statusFilter})`}
          </div>
          <div className="toggle-status-bar">
            <button
              className="toggle-btn"
              onClick={() => handleStatusToggle('AVAILABLE')}
              style={{
                backgroundColor: '#4ade80',
                color: '#064e3b',
                opacity: statusFilter === 'All' || statusFilter === 'AVAILABLE' ? 1 : 0.4,
                border: statusFilter === 'AVAILABLE' ? '2px solid #fff' : 'none'
              }}
            >
              Available
            </button>
            <button
              className="toggle-btn"
              onClick={() => handleStatusToggle('ON_TRIP')}
              style={{
                backgroundColor: '#60a5fa',
                color: '#1e3a8a',
                opacity: statusFilter === 'All' || statusFilter === 'ON_TRIP' ? 1 : 0.4,
                border: statusFilter === 'ON_TRIP' ? '2px solid #fff' : 'none'
              }}
            >
              On Trip
            </button>
            <button
              className="toggle-btn"
              onClick={() => handleStatusToggle('OFF_DUTY')}
              style={{
                backgroundColor: '#9ca3af',
                color: '#111827',
                opacity: statusFilter === 'All' || statusFilter === 'OFF_DUTY' ? 1 : 0.4,
                border: statusFilter === 'OFF_DUTY' ? '2px solid #fff' : 'none'
              }}
            >
              Off Duty
            </button>
            <button
              className="toggle-btn"
              onClick={() => handleStatusToggle('SUSPENDED')}
              style={{
                backgroundColor: '#f97316',
                color: '#431407',
                opacity: statusFilter === 'All' || statusFilter === 'SUSPENDED' ? 1 : 0.4,
                border: statusFilter === 'SUSPENDED' ? '2px solid #fff' : 'none'
              }}
            >
              Suspended
            </button>
          </div>
        </div>

        <div className="rule-text">
          Rule: Expired license or Suspended status &rarr; blocked from trip assignment
        </div>
      </div>

      <DriverModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        driver={editDriver}
      />
    </div>
  );
};

export default Drivers;