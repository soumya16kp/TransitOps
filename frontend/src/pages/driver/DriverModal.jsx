import React, { useState, useEffect } from 'react';

const EMPTY_FORM = {
    name: '',
    license_number: '',
    license_category: 'LMV',
    license_expiry_date: '',
    contact_number: '',
    safety_score: '100',
    status: 'AVAILABLE',
};

const CATEGORIES = [
    { value: 'LMV', label: 'Light Motor Vehicle' },
    { value: 'HMV', label: 'Heavy Motor Vehicle' },
];

const STATUSES = [
    { value: 'AVAILABLE', label: 'Available' },
    { value: 'ON_TRIP', label: 'On Trip' },
    { value: 'OFF_DUTY', label: 'Off Duty' },
    { value: 'SUSPENDED', label: 'Suspended' },
];

const DriverModal = ({ isOpen, onClose, onSave, driver }) => {
    const [form, setForm] = useState(EMPTY_FORM);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const isEditing = !!driver;

    useEffect(() => {
        if (driver) {
            setForm({
                name: driver.name || '',
                license_number: driver.license_number || '',
                license_category: driver.license_category || 'LMV',
                license_expiry_date: driver.license_expiry_date || '',
                contact_number: driver.contact_number || '',
                safety_score: driver.safety_score ?? '100',
                status: driver.status || 'AVAILABLE',
            });
        } else {
            setForm(EMPTY_FORM);
        }
        setError('');
    }, [driver, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(false);
        try {
            const payload = {
                ...form,
                safety_score: Number(form.safety_score),
            };
            await onSave(payload, isEditing ? driver.id : null);
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
                        {isEditing ? 'Edit Driver' : 'Add New Driver'}
                    </h3>
                    <button className="modal-close" onClick={onClose} aria-label="Close">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="modal-body">
                    {error && (
                        <div className="modal-error" style={{ color: '#f87171', marginBottom: '16px' }}>
                            <i className="fas fa-exclamation-circle"></i> {error}
                        </div>
                    )}

                    <form id="driver-form" onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {/* Name */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={form.name}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #374151', backgroundColor: '#1f2937', color: '#e5e7eb' }}
                                />
                            </div>

                            {/* License Number */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>License Number</label>
                                <input
                                    type="text"
                                    name="license_number"
                                    required
                                    value={form.license_number}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #374151', backgroundColor: '#1f2937', color: '#e5e7eb' }}
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>License Category</label>
                                <select
                                    name="license_category"
                                    value={form.license_category}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #374151', backgroundColor: '#1f2937', color: '#e5e7eb' }}
                                >
                                    {CATEGORIES.map((cat) => (
                                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Expiry Date */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>License Expiry Date</label>
                                <input
                                    type="date"
                                    name="license_expiry_date"
                                    required
                                    value={form.license_expiry_date}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #374151', backgroundColor: '#1f2937', color: '#e5e7eb' }}
                                />
                            </div>

                            {/* Contact Number */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>Contact Number</label>
                                <input
                                    type="text"
                                    name="contact_number"
                                    required
                                    value={form.contact_number}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #374151', backgroundColor: '#1f2937', color: '#e5e7eb' }}
                                />
                            </div>

                            {/* Safety Score */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>Safety Score (0-100)</label>
                                <input
                                    type="number"
                                    name="safety_score"
                                    min="0"
                                    max="100"
                                    required
                                    value={form.safety_score}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #374151', backgroundColor: '#1f2937', color: '#e5e7eb' }}
                                />
                            </div>

                            {/* Status */}
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>Status</label>
                                <select
                                    name="status"
                                    value={form.status}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #374151', backgroundColor: '#1f2937', color: '#e5e7eb' }}
                                >
                                    {STATUSES.map((st) => (
                                        <option key={st.value} value={st.value}>{st.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
                    <button className="btn-secondary" onClick={onClose} style={{ padding: '8px 16px', border: '1px solid #374151', borderRadius: '4px', backgroundColor: '#374151', color: '#fff', cursor: 'pointer' }}>Cancel</button>
                    <button
                        type="submit"
                        form="driver-form"
                        disabled={saving}
                        style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', backgroundColor: '#f59e0b', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DriverModal;
