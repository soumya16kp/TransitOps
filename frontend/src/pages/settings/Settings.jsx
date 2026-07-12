// src/pages/settings/Settings.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRBAC, DEFAULT_RBAC } from '../../context/RBACContext';
import './Settings.css';

const Settings = () => {
    const { role } = useAuth();
    const { rbacRules, saveRules, resetRules } = useRBAC();

    // Local copy for editing – sync from context on mount
    const [localRules, setLocalRules] = useState(rbacRules);
    const [savedMsg, setSavedMsg] = useState(false);

    // Sync if context changes externally
    useEffect(() => {
        setLocalRules(rbacRules);
    }, [rbacRules]);

    // Admin-only guard
    if (role !== 'admin') {
        return (
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', padding: '4rem', textAlign: 'center'
            }}>
                <i className="fas fa-lock" style={{ fontSize: '3rem', color: '#e74c3c', marginBottom: '1rem' }}></i>
                <h2 style={{ color: '#e8eaf0', marginBottom: '0.5rem' }}>Access Restricted</h2>
                <p style={{ color: '#7b8299' }}>Only administrators can manage RBAC settings.</p>
            </div>
        );
    }

    const handlePermissionChange = (roleIndex, moduleKey, newValue) => {
        const updated = [...localRules];
        updated[roleIndex] = { ...updated[roleIndex], [moduleKey]: newValue };
        setLocalRules(updated);
    };

    const handleSave = () => {
        saveRules(localRules);    // push to context → triggers Layout re-render live
        setSavedMsg(true);
        setTimeout(() => setSavedMsg(false), 3000);
    };

    const handleReset = () => {
        if (window.confirm('Reset all permissions to default configuration?')) {
            resetRules();
            setLocalRules(DEFAULT_RBAC);
        }
    };

    return (
        <div className="settings-container-full">
            <div className="rbac-panel-full">
                {/* Header row */}
                <div className="rbac-header-row">
                    <div>
                        <h2 className="panel-section-title">
                            Role-Based Access Control (RBAC)
                        </h2>
                        <p style={{ color: '#7b8299', fontSize: '0.82rem', marginTop: '0.25rem' }}>
                            Changes apply live — sidebar tabs update immediately for all active sessions.
                        </p>
                    </div>
                    <div className="rbac-actions">
                        <button type="button" className="btn-reset-settings" onClick={handleReset}>
                            <i className="fas fa-undo"></i> Reset Defaults
                        </button>
                        <button type="button" className="btn-save-settings" onClick={handleSave}>
                            <i className="fas fa-save"></i> Save Changes
                        </button>
                    </div>
                </div>

                {/* Success alert */}
                {savedMsg && (
                    <div className="settings-success-alert">
                        <i className="fas fa-check-circle"></i>
                        RBAC rules saved — sidebar navigation updated across all roles!
                    </div>
                )}

                {/* RBAC Matrix Table */}
                <div className="rbac-table-wrapper">
                    <table className="rbac-table">
                        <thead>
                            <tr>
                                <th>Role</th>
                                <th>Fleet &amp; Maintenance</th>
                                <th>Drivers</th>
                                <th>Trips</th>
                                <th>Fuel &amp; Expenses</th>
                                <th>Analytics</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Admin row — always full, non-editable */}
                            <tr className="rbac-admin-row">
                                <td style={{ fontWeight: 700, color: '#f5a623' }}>
                                    <i className="fas fa-shield-alt" style={{ marginRight: '0.4rem' }}></i>
                                    Admin (You)
                                </td>
                                {['fleet', 'driver', 'trips', 'fuel', 'analytics'].map(mod => (
                                    <td key={mod}>
                                        <span className="rbac-allow">✓ Full</span>
                                    </td>
                                ))}
                            </tr>

                            {/* Editable role rows */}
                            {localRules.map((row, roleIndex) => (
                                <tr key={row.roleKey}>
                                    <td style={{ fontWeight: 700, color: '#e8eaf0' }}>{row.role}</td>
                                    {['fleet', 'driver', 'trips', 'fuel', 'analytics'].map((moduleKey) => (
                                        <td key={moduleKey}>
                                            <select
                                                className={`rbac-select ${
                                                    row[moduleKey] === '✓'    ? 'val-allow' :
                                                    row[moduleKey] === 'view' ? 'val-view'  : 'val-deny'
                                                }`}
                                                value={row[moduleKey]}
                                                onChange={(e) => handlePermissionChange(roleIndex, moduleKey, e.target.value)}
                                            >
                                                <option value="✓">✓ Full Access</option>
                                                <option value="view">👁 View Only</option>
                                                <option value="—">✕ No Access</option>
                                            </select>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Legend */}
                <div className="rbac-legend">
                    <div className="legend-item">
                        <span className="rbac-allow">✓</span>
                        <span><strong>Full Access</strong> — Create, edit, delete, and view records</span>
                    </div>
                    <div className="legend-item">
                        <span className="rbac-view">👁 view</span>
                        <span><strong>View Only</strong> — Read-only access, no mutations</span>
                    </div>
                    <div className="legend-item">
                        <span className="rbac-deny">✕</span>
                        <span><strong>No Access</strong> — Tab hidden, API endpoints blocked (403)</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
