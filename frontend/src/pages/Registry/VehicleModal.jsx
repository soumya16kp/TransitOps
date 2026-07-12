// src/pages/Registry/VehicleModal.jsx
import React, { useState, useEffect } from 'react';
import './VehicleModal.css';

const EMPTY_FORM = {
    registration_no:  '',
    name:             '',
    vehicle_type:     'Van',
    capacity:         '',
    odometer:         '',
    acquisition_cost: '',
    status:           'Available',
    notes:            '',
};

const TYPES    = ['Van', 'Truck', 'Mini', 'Bus'];
const STATUSES = ['Available', 'On Trip', 'In Shop', 'Retired'];

const VehicleModal = ({ isOpen, onClose, onSave, vehicle }) => {
    const [form, setForm]   = useState(EMPTY_FORM);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const isEditing = !!vehicle;

    // Pre-fill form when editing
    useEffect(() => {
        if (vehicle) {
            setForm({
                registration_no:  vehicle.registration_no  || '',
                name:             vehicle.name             || '',
                vehicle_type:     vehicle.vehicle_type     || 'Van',
                capacity:         vehicle.capacity         || '',
                odometer:         vehicle.odometer         ?? '',
                acquisition_cost: vehicle.acquisition_cost ?? '',
                status:           vehicle.status           || 'Available',
                notes:            vehicle.notes            || '',
            });
        } else {
            setForm(EMPTY_FORM);
        }
        setError('');
    }, [vehicle, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            const payload = {
                ...form,
                odometer:         Number(form.odometer),
                acquisition_cost: Number(form.acquisition_cost),
            };
            await onSave(payload, isEditing ? vehicle.id : null);
            onClose();
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

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-card">
                <div className="modal-header">
                    <h3>
                        <i className={`fas ${isEditing ? 'fa-edit' : 'fa-plus-circle'}`}></i>
                        {isEditing ? 'Edit Vehicle' : 'Add New Vehicle'}
                    </h3>
                    <button className="modal-close" onClick={onClose} aria-label="Close">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="modal-body">
                    {error && (
                        <div className="modal-error">
                            <i className="fas fa-exclamation-circle"></i>
                            {error}
                        </div>
                    )}

                    <form id="vehicle-form" onSubmit={handleSubmit}>
                        <div className="modal-grid">
                            {/* Registration No */}
                            <div className="modal-field">
                                <label htmlFor="registration_no">
                                    Reg. No. (Unique) *
                                </label>
                                <input
                                    id="registration_no"
                                    name="registration_no"
                                    type="text"
                                    placeholder="GJ01AB452"
                                    value={form.registration_no}
                                    onChange={handleChange}
                                    required
                                    disabled={isEditing}
                                    style={isEditing ? { opacity: 0.5 } : {}}
                                />
                            </div>

                            {/* Name / Mode */}
                            <div className="modal-field">
                                <label htmlFor="name">Name / Mode *</label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    placeholder="VAN-05"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* Type */}
                            <div className="modal-field">
                                <label htmlFor="vehicle_type">Type *</label>
                                <select
                                    id="vehicle_type"
                                    name="vehicle_type"
                                    value={form.vehicle_type}
                                    onChange={handleChange}
                                    required
                                >
                                    {TYPES.map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Capacity */}
                            <div className="modal-field">
                                <label htmlFor="capacity">Capacity *</label>
                                <input
                                    id="capacity"
                                    name="capacity"
                                    type="text"
                                    placeholder="500 kg"
                                    value={form.capacity}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* Odometer */}
                            <div className="modal-field">
                                <label htmlFor="odometer">Odometer (km) *</label>
                                <input
                                    id="odometer"
                                    name="odometer"
                                    type="number"
                                    min="0"
                                    placeholder="74000"
                                    value={form.odometer}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* Acquisition Cost */}
                            <div className="modal-field">
                                <label htmlFor="acquisition_cost">Acq. Cost (₹) *</label>
                                <input
                                    id="acquisition_cost"
                                    name="acquisition_cost"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="620000"
                                    value={form.acquisition_cost}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* Status */}
                            <div className="modal-field">
                                <label htmlFor="status">Status *</label>
                                <select
                                    id="status"
                                    name="status"
                                    value={form.status}
                                    onChange={handleChange}
                                    required
                                >
                                    {STATUSES.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Notes */}
                            <div className="modal-field full-width">
                                <label htmlFor="notes">Notes</label>
                                <textarea
                                    id="notes"
                                    name="notes"
                                    placeholder="Optional remarks..."
                                    value={form.notes}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn-cancel" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" className="btn-save" disabled={saving}>
                                {saving ? (
                                    <><i className="fas fa-spinner fa-spin"></i> Saving...</>
                                ) : (
                                    <><i className="fas fa-check"></i> {isEditing ? 'Update' : 'Add Vehicle'}</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default VehicleModal;
