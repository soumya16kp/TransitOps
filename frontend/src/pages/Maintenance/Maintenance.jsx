// src/pages/Maintenance/Maintenance.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import MaintenanceService from '../../services/MaintenanceService';
import registryService from '../../services/RegistryService';
import './Maintenance.css';

const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const Maintenance = () => {
    const [vehicles, setVehicles] = useState([]);
    const [records, setRecords]   = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [error, setError]       = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedRecords = useMemo(() => {
        let sortableItems = [...records];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aValue, bValue;
                if (sortConfig.key === 'vehicle') {
                    aValue = a.vehicle_name || '';
                    bValue = b.vehicle_name || '';
                } else if (sortConfig.key === 'cost') {
                    aValue = Number(a.cost) || 0;
                    bValue = Number(b.cost) || 0;
                } else {
                    aValue = a[sortConfig.key] || '';
                    bValue = b[sortConfig.key] || '';
                }
                
                if (typeof aValue === 'string') {
                    return sortConfig.direction === 'asc' 
                        ? aValue.localeCompare(bValue) 
                        : bValue.localeCompare(aValue);
                } else {
                    return sortConfig.direction === 'asc'
                        ? aValue - bValue
                        : bValue - aValue;
                }
            });
        }
        return sortableItems;
    }, [records, sortConfig]);

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) {
            return <i className="fas fa-sort sort-placeholder"></i>;
        }
        return sortConfig.direction === 'asc' 
            ? <i className="fas fa-sort-up sorted"></i> 
            : <i className="fas fa-sort-down sorted"></i>;
    };

    // Form State
    const [form, setForm] = useState({
        vehicle: '',
        service_type: '',
        cost: '',
        date: getTodayDateString(),
        status: 'Active',
    });
    const [saving, setSaving] = useState(false);

    // ── Fetch Vehicles & Records ───────────────────────────────────────────
    const fetchVehicles = async () => {
        try {
            const data = await registryService.getVehicles();
            setVehicles(data);
        } catch (err) {
            console.error('Failed to load vehicles for selection:', err);
        }
    };

    const fetchRecords = useCallback(async () => {
        setLoadingLogs(true);
        setError('');
        try {
            const data = await MaintenanceService.getServiceRecords();
            setRecords(data);
        } catch (err) {
            setError('Failed to fetch service records.');
        } finally {
            setLoadingLogs(false);
        }
    }, []);

    useEffect(() => {
        fetchVehicles();
        fetchRecords();
    }, [fetchRecords]);

    // ── Form Handlers ──────────────────────────────────────────────────────
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            await MaintenanceService.createServiceRecord({
                ...form,
                cost: Number(form.cost),
            });
            // Reset form but retain date & status defaults
            setForm({
                vehicle: '',
                service_type: '',
                cost: '',
                date: getTodayDateString(),
                status: 'Active',
            });
            fetchRecords();
            fetchVehicles(); // Refresh vehicle list to sync changed statuses
        } catch (err) {
            if (err && typeof err === 'object') {
                const msgs = Object.entries(err)
                    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
                    .join(' | ');
                setError(msgs);
            } else {
                setError(String(err));
            }
        } finally {
            setSaving(false);
        }
    };

    // ── Quick Actions ──────────────────────────────────────────────────────
    const handleMarkCompleted = async (record) => {
        try {
            await MaintenanceService.patchServiceRecord(record.id, { status: 'Completed' });
            fetchRecords();
            fetchVehicles(); // Sync vehicle statuses
        } catch (err) {
            alert('Failed to update record status: ' + JSON.stringify(err));
        }
    };

    const handleDeleteRecord = async (id) => {
        if (!window.confirm('Delete this service record? This does not auto-revert status transitions.')) return;
        try {
            await MaintenanceService.deleteServiceRecord(id);
            fetchRecords();
            fetchVehicles();
        } catch (err) {
            alert('Failed to delete record: ' + JSON.stringify(err));
        }
    };

    return (
        <div className="maintenance-container">
            {/* Left Column: Form Panel */}
            <div className="maintenance-form-panel">
                <h2 className="panel-title">Log Service Record</h2>
                {error && (
                    <div className="logs-error">
                        <i className="fas fa-exclamation-circle"></i>
                        {error}
                    </div>
                )}
                <form className="maintenance-form" onSubmit={handleSubmit}>
                    <div className="form-field">
                        <label htmlFor="vehicle">Vehicle *</label>
                        <select
                            id="vehicle"
                            name="vehicle"
                            value={form.vehicle}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Vehicle</option>
                            {vehicles.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.registration_no} ({v.name}) – {v.status}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-field">
                        <label htmlFor="service_type">Service Type *</label>
                        <input
                            id="service_type"
                            name="service_type"
                            type="text"
                            placeholder="e.g. Oil Change, Engine Repair"
                            value={form.service_type}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="cost">Cost (₹) *</label>
                        <input
                            id="cost"
                            name="cost"
                            type="number"
                            min="0"
                            placeholder="e.g. 2500"
                            value={form.cost}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="date">Date *</label>
                        <input
                            id="date"
                            name="date"
                            type="date"
                            value={form.date}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="status">Status *</label>
                        <select
                            id="status"
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                            required
                        >
                            <option value="Active">Active</option>
                            <option value="Completed">Completed</option>
                        </select>
                    </div>

                    <button type="submit" className="btn-save-record" disabled={saving}>
                        {saving ? (
                            <><i className="fas fa-spinner fa-spin"></i> Saving...</>
                        ) : (
                            <>Save</>
                        )}
                    </button>
                </form>

                {/* State Transition Guide */}
                <div className="business-rules">
                    <div className="rule-arrow shop-active">
                        <span>Available</span>
                        <i className="fas fa-long-arrow-alt-right"></i>
                        <span>In Shop</span>
                    </div>
                    <div className="rule-arrow shop-avail">
                        <span>In Shop</span>
                        <i className="fas fa-long-arrow-alt-right"></i>
                        <span>Available</span>
                    </div>
                    <p className="rules-note">
                        * Note: In Shop vehicles are automatically removed from the active trip dispatch pools.
                    </p>
                </div>
            </div>

            {/* Right Column: Logs Table */}
            <div className="maintenance-logs-panel">
                <h2 className="panel-title">Service Logs</h2>
                <div className="maintenance-table-wrapper">
                    {loadingLogs ? (
                        <div className="logs-loading">
                            <i className="fas fa-spinner fa-spin"></i>
                            Loading logs...
                        </div>
                    ) : records.length === 0 ? (
                        <div className="logs-empty">
                            <i className="fas fa-tools" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block' }}></i>
                            No maintenance logs found.
                        </div>
                    ) : (
                        <table className="maintenance-table">
                            <thead>
                                <tr>
                                    <th onClick={() => requestSort('vehicle')} className="sortable-header">
                                        Vehicle {getSortIcon('vehicle')}
                                    </th>
                                    <th onClick={() => requestSort('service_type')} className="sortable-header">
                                        Service {getSortIcon('service_type')}
                                    </th>
                                    <th onClick={() => requestSort('cost')} className="sortable-header">
                                        Cost {getSortIcon('cost')}
                                    </th>
                                    <th onClick={() => requestSort('status')} className="sortable-header">
                                        Status {getSortIcon('status')}
                                    </th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedRecords.map((r) => (
                                    <tr key={r.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{r.vehicle_name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#7b8299', fontFamily: 'monospace' }}>
                                                {r.vehicle_reg_no}
                                            </div>
                                        </td>
                                        <td>{r.service_type}</td>
                                        <td style={{ fontWeight: 500 }}>
                                            ₹{Number(r.cost).toLocaleString('en-IN')}
                                        </td>
                                        <td>
                                            {r.status === 'Active' ? (
                                                <span className="badge-inshop">In Shop</span>
                                            ) : (
                                                <span className="badge-completed">Completed</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="action-cell">
                                                {r.status === 'Active' && (
                                                    <button
                                                        className="btn-complete-task"
                                                        onClick={() => handleMarkCompleted(r)}
                                                        title="Mark Completed"
                                                    >
                                                        Complete
                                                    </button>
                                                )}
                                                <button
                                                    className="btn-delete-record"
                                                    onClick={() => handleDeleteRecord(r.id)}
                                                    title="Delete"
                                                >
                                                    <i className="fas fa-trash-alt"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Maintenance;
