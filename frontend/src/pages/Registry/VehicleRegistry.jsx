// src/pages/Registry/VehicleRegistry.jsx
import React, { useState, useEffect, useCallback } from 'react';
import registryService from '../../services/RegistryService';
import VehicleModal from './VehicleModal';
import './VehicleRegistry.css';

// ── Helpers ────────────────────────────────────────────────────────────────
const STATUS_CLASS = {
    'Available': 'status-available',
    'On Trip':   'status-on-trip',
    'In Shop':   'status-in-shop',
    'Retired':   'status-retired',
};

const formatCost = (val) =>
    Number(val).toLocaleString('en-IN');

// ── Component ──────────────────────────────────────────────────────────────
const VehicleRegistry = () => {
    const [vehicles, setVehicles]     = useState([]);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState('');

    // Filters
    const [typeFilter, setTypeFilter]     = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchReg, setSearchReg]       = useState('');
    const [globalSearch, setGlobalSearch] = useState('');

    // Modal
    const [modalOpen, setModalOpen]       = useState(false);
    const [editVehicle, setEditVehicle]   = useState(null);

    // ── Fetch ──────────────────────────────────────────────────────────────
    const fetchVehicles = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await registryService.getVehicles({
                type:   typeFilter,
                status: statusFilter,
                search: searchReg || globalSearch,
            });
            setVehicles(data);
        } catch (err) {
            setError('Failed to load vehicles. Make sure the backend is running.');
        } finally {
            setLoading(false);
        }
    }, [typeFilter, statusFilter, searchReg, globalSearch]);

    useEffect(() => {
        fetchVehicles();
    }, [fetchVehicles]);

    // ── Handlers ───────────────────────────────────────────────────────────
    const handleOpenAdd = () => {
        setEditVehicle(null);
        setModalOpen(true);
    };

    const handleOpenEdit = (vehicle) => {
        setEditVehicle(vehicle);
        setModalOpen(true);
    };

    const handleDelete = async (id, regNo) => {
        if (!window.confirm(`Delete vehicle ${regNo}? This cannot be undone.`)) return;
        try {
            await registryService.deleteVehicle(id);
            fetchVehicles();
        } catch (err) {
            alert('Delete failed: ' + JSON.stringify(err));
        }
    };

    const handleSave = async (formData, id) => {
        if (id) {
            await registryService.updateVehicle(id, formData);
        } else {
            await registryService.createVehicle(formData);
        }
        fetchVehicles();
    };

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="registry-page-inner">
            {/* Filter Bar */}
            <div className="filter-bar">
                <select
                    className="filter-select"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                >
                    <option value="All">Type: All</option>
                    <option value="Van">Van</option>
                    <option value="Truck">Truck</option>
                    <option value="Mini">Mini</option>
                    <option value="Bus">Bus</option>
                </select>

                <select
                    className="filter-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="All">Status: All</option>
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="In Shop">In Shop</option>
                    <option value="Retired">Retired</option>
                </select>

                <input
                    className="filter-reg-search"
                    type="text"
                    placeholder="Search reg. no..."
                    value={searchReg}
                    onChange={(e) => setSearchReg(e.target.value)}
                />

                {/* Sub-search integrated inside the layout filters */}
                <input
                    className="filter-reg-search"
                    type="text"
                    placeholder="Global search..."
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    style={{ width: '200px' }}
                />

                <button className="btn-add-vehicle" onClick={handleOpenAdd}>
                    <i className="fas fa-plus"></i>
                    Add Vehicle
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="registry-error">
                    <i className="fas fa-exclamation-triangle"></i>
                    {error}
                </div>
            )}

            {/* Table */}
            <div className="vehicle-table-wrapper">
                {loading ? (
                    <div className="registry-loading">
                        <i className="fas fa-spinner fa-spin"></i>
                        Loading vehicles...
                    </div>
                ) : vehicles.length === 0 ? (
                    <div className="empty-state">
                        <i className="fas fa-truck"></i>
                        <h3>No vehicles found</h3>
                        <p>Add your first vehicle or clear the filters.</p>
                    </div>
                ) : (
                    <table className="vehicle-table">
                        <thead>
                            <tr>
                                <th>REG. NO. (UNIQUE)</th>
                                <th>NAME/MODE</th>
                                <th>TYPE</th>
                                <th>CAPACITY</th>
                                <th>ODOMETER</th>
                                <th>ACQ. COST</th>
                                <th>STATUS</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vehicles.map((v) => (
                                <tr key={v.id}>
                                    <td className="reg-no">{v.registration_no}</td>
                                    <td>{v.name}</td>
                                    <td>{v.vehicle_type}</td>
                                    <td>{v.capacity}</td>
                                    <td>{v.odometer?.toLocaleString('en-IN')}</td>
                                    <td>₹{formatCost(v.acquisition_cost)}</td>
                                    <td>
                                        <span className={`status-badge ${STATUS_CLASS[v.status] || ''}`}>
                                            {v.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-btns">
                                            <button
                                                className="btn-icon edit"
                                                title="Edit"
                                                onClick={() => handleOpenEdit(v)}
                                            >
                                                <i className="fas fa-pen"></i>
                                            </button>
                                            <button
                                                className="btn-icon delete"
                                                title="Delete"
                                                onClick={() => handleDelete(v.id, v.registration_no)}
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

            {/* Footer note */}
            <p className="registry-note">
                Rule: Registration No. must be unique &nbsp;·&nbsp;
                Retired/In Shop vehicles are hidden from Trip Dispatcher
            </p>

            {/* Modal */}
            <VehicleModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleSave}
                vehicle={editVehicle}
            />
        </div>
    );
};

export default VehicleRegistry;
