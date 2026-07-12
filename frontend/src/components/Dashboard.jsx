// src/components/Dashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../styles/dashboard.css';

const normalizeTripStatus = (status) => {
    switch ((status || '').toUpperCase()) {
        case 'DISPATCHED':
        case 'ON_TRIP':
        case 'ON TRIP':
            return 'On Trip';
        case 'COMPLETED':
            return 'Completed';
        case 'DRAFT':
            return 'Draft';
        case 'CANCELLED':
            return 'Cancelled';
        default:
            return status || 'Draft';
    }
};

const getTripEtaLabel = (trip) => {
    const status = (trip?.status || '').toUpperCase();
    if (status === 'COMPLETED') return 'Completed';
    if (status === 'DRAFT') return 'Awaiting dispatch';
    if (status === 'DISPATCHED') return `${trip?.planned_distance || 0} km planned`;
    if (status === 'CANCELLED') return 'Cancelled';
    return '—';
};

/* ── SVG Donut Gauge ─────────────────────────────────────*/
const DonutGauge = ({ pct }) => {
    const R = 60;
    const circ = 2 * Math.PI * R;
    const offset = circ - (pct / 100) * circ;
    return (
        <div className="gauge-wrapper">
            <svg width="160" height="160" className="gauge-svg" viewBox="0 0 160 160">
                {/* Track */}
                <circle cx="80" cy="80" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" />
                {/* Fill */}
                <circle
                    cx="80" cy="80" r={R} fill="none"
                    stroke="#f5a623"
                    strokeWidth="14"
                    strokeDasharray={`${circ}`}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 80 80)"
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
                {/* Center text */}
                <text x="80" y="76" textAnchor="middle" fill="#f5a623" fontSize="26" fontWeight="800">{pct}%</text>
                <text x="80" y="96" textAnchor="middle" fill="#7b8299" fontSize="11">Utilization</text>
            </svg>
        </div>
    );
};

/* ── Status badge renderer ───────────────────────────────*/
const TripBadge = ({ status }) => {
    const map = {
        'On Trip':    'badge badge-on-trip',
        'Completed':  'badge badge-completed',
        'Dispatched': 'badge badge-dispatched',
        'Draft':      'badge badge-draft',
        'Cancelled':  'badge badge-retired',
    };
    const dotMap = {
        'On Trip':    '●',
        'Completed':  '✓',
        'Dispatched': '▶',
        'Draft':      '○',
        'Cancelled':  '✕',
    };
    return <span className={map[status] || 'badge badge-draft'}>{dotMap[status] || '○'} {status}</span>;
};

/* ── VehicleStatusBar component ─────────────────────────*/
const StatusBar = ({ label, count, total, color }) => {
    const pct = total ? Math.round((count / total) * 100) : 0;
    return (
        <div className="vs-row">
            <div className="vs-meta">
                <span className="vs-name">{label}</span>
                <span className="vs-count">{count}</span>
            </div>
            <div className="vs-bar-bg">
                <div className="vs-bar-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════ */
const Dashboard = () => {
    const [vehicles,     setVehicles]     = useState([]);
    const [maintenance,  setMaintenance]  = useState([]);
    const [drivers,      setDrivers]      = useState([]);
    const [trips,        setTrips]        = useState([]);
    const [loading,      setLoading]      = useState(true);

    /* Filter state */
    const [filterType,   setFilterType]   = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');

    /* ── Fetch all data ────────────────────────────────── */
    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [tRes, vRes, mRes, dRes] = await Promise.all([
                axios.get('http://localhost:8000/api/trips/').catch(() => ({ data: [] })),
                axios.get('http://localhost:8000/api/vehicles/').catch(() => ({ data: [] })),
                axios.get('http://localhost:8000/api/maintenance/').catch(() => ({ data: [] })),
                axios.get('http://localhost:8000/api/drivers/').catch(() => ({ data: [] })),
            ]);
            setTrips(Array.isArray(tRes.data) ? tRes.data : []);
            setVehicles(Array.isArray(vRes.data) ? vRes.data : []);
            setMaintenance(Array.isArray(mRes.data) ? mRes.data : []);
            setDrivers(Array.isArray(dRes.data) ? dRes.data : []);
        } catch (err) {
            console.error('Dashboard fetch error', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    /* ── Derived KPIs ──────────────────────────────────── */
    const totalVehicles     = vehicles.length;
    const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
    const onTripVehicles    = vehicles.filter(v => v.status === 'On Trip').length;
    const inShopVehicles    = vehicles.filter(v => v.status === 'In Shop').length;
    const retiredVehicles   = vehicles.filter(v => v.status === 'Retired').length;
    const normalizedTripStatuses = trips.map(t => normalizeTripStatus(t.status));
    const activeTrips       = normalizedTripStatuses.filter(status => status === 'On Trip').length;
    const pendingTrips      = normalizedTripStatuses.filter(status => status === 'Draft' || status === 'Dispatched').length;
    const driversOnDuty     = drivers.filter(d => d.status === 'AVAILABLE' || d.status === 'ON_DUTY').length;
    const activeMaintenance = maintenance.filter(m => m.status === 'Active').length;

    /* Fleet utilization = (available + on_trip) / total */
    const utilizationPct = totalVehicles
        ? Math.round(((availableVehicles + onTripVehicles) / totalVehicles) * 100)
        : 0;

    /* ── Filter vehicles for display ─────────────────────*/
    const filteredVehicles = vehicles.filter(v => {
        const typeOk   = filterType   === 'All' || v.vehicle_type === filterType;
        const statusOk = filterStatus === 'All' || v.status === filterStatus;
        return typeOk && statusOk;
    });

    /* ── Total maintenance cost ────────────────────────── */
    const totalMaintCost = maintenance.reduce((sum, m) => sum + parseFloat(m.cost || 0), 0);

    /* ── Recent maintenance records (top 4) ──────────────*/
    const recentMaint = [...maintenance]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 4);

    return (
        <>
            {/* ── Filter Bar ─────────────────────────────── */}
            <div className="dashboard-filter-bar">
                <span className="filter-label">Filters:</span>
                <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                    <option>All</option>
                    <option>Van</option>
                    <option>Truck</option>
                    <option>Mini</option>
                    <option>Bus</option>
                </select>
                <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option>All</option>
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="In Shop">In Shop</option>
                    <option value="Retired">Retired</option>
                </select>
                {loading && <span style={{ color: '#7b8299', fontSize: '0.8rem' }}>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.4rem' }} />Refreshing…
                </span>}
                <button
                    onClick={fetchAll}
                    style={{
                        marginLeft: 'auto',
                        background: 'rgba(245,166,35,0.1)',
                        border: '1px solid rgba(245,166,35,0.3)',
                        color: '#f5a623',
                        borderRadius: '8px',
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontWeight: 600,
                    }}
                >
                    <i className="fas fa-sync-alt" /> Refresh
                </button>
            </div>

            {/* ── KPI Cards ──────────────────────────────── */}
            <div className="kpi-grid">
                <div className="kpi-card blue">
                    <span className="kpi-label">Total Fleet</span>
                    <span className="kpi-value">{totalVehicles.toString().padStart(2, '0')}</span>
                    <span className="kpi-sub">Registered vehicles</span>
                    <i className="fas fa-bus kpi-icon"></i>
                </div>
                <div className="kpi-card green">
                    <span className="kpi-label">Available</span>
                    <span className="kpi-value">{availableVehicles.toString().padStart(2, '0')}</span>
                    <span className="kpi-sub">Ready to dispatch</span>
                    <i className="fas fa-check-circle kpi-icon"></i>
                </div>
                <div className="kpi-card orange">
                    <span className="kpi-label">In Maintenance</span>
                    <span className="kpi-value">{inShopVehicles.toString().padStart(2, '0')}</span>
                    <span className="kpi-sub">Currently in shop</span>
                    <i className="fas fa-tools kpi-icon"></i>
                </div>
                <div className="kpi-card cyan">
                    <span className="kpi-label">Active Trips</span>
                    <span className="kpi-value">{activeTrips.toString().padStart(2, '0')}</span>
                    <span className="kpi-sub">Currently on route</span>
                    <i className="fas fa-route kpi-icon"></i>
                </div>
                <div className="kpi-card red">
                    <span className="kpi-label">Pending Trips</span>
                    <span className="kpi-value">{pendingTrips.toString().padStart(2, '0')}</span>
                    <span className="kpi-sub">Dispatched / Draft</span>
                    <i className="fas fa-clock kpi-icon"></i>
                </div>
                <div className="kpi-card purple">
                    <span className="kpi-label">Drivers on Duty</span>
                    <span className="kpi-value">{driversOnDuty.toString().padStart(2, '0')}</span>
                    <span className="kpi-sub">Active drivers</span>
                    <i className="fas fa-id-card kpi-icon"></i>
                </div>
                <div className="kpi-card teal">
                    <span className="kpi-label">Fleet Utilization</span>
                    <span className="kpi-value large-pct">{utilizationPct}%</span>
                    <span className="kpi-sub">Active / total ratio</span>
                    <i className="fas fa-chart-pie kpi-icon"></i>
                </div>
            </div>

            {/* ── Main Two-Column Grid ────────────────────── */}
            <div className="dashboard-main-grid">
                {/* Left: Recent Trips */}
                <div className="dash-panel">
                    <div className="dash-panel-title">
                        <i className="fas fa-route"></i> Recent Trips
                    </div>
                    <table className="trips-table">
                        <thead>
                            <tr>
                                <th>Trip</th>
                                <th>Vehicle</th>
                                <th>Driver</th>
                                <th>Status</th>
                                <th>ETA</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trips.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="dash-empty">No trips available yet.</td>
                                </tr>
                            ) : trips.slice(0, 6).map(t => {
                                const status = normalizeTripStatus(t.status);
                                return (
                                    <tr key={t.id}>
                                        <td className="trip-id">{t.tracking_number || t.id}</td>
                                        <td style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.82rem' }}>
                                            {t.vehicle_registration || t.vehicle_name || '—'}
                                        </td>
                                        <td>{t.driver_name || '—'}</td>
                                        <td><TripBadge status={status} /></td>
                                        <td style={{ color: '#7b8299', fontSize: '0.8rem' }}>{getTripEtaLabel(t)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Right: Vehicle Status Panel */}
                <div className="dash-panel">
                    <div className="dash-panel-title">
                        <i className="fas fa-chart-bar"></i> Vehicle Status
                    </div>
                    <div className="vehicle-status-list">
                        <StatusBar label="Available"  count={availableVehicles} total={totalVehicles} color="#2ecc71" />
                        <StatusBar label="On Trip"    count={onTripVehicles}    total={totalVehicles} color="#3b82f6" />
                        <StatusBar label="In Shop"    count={inShopVehicles}    total={totalVehicles} color="#f5a623" />
                        <StatusBar label="Retired"    count={retiredVehicles}   total={totalVehicles} color="#e74c3c" />
                    </div>

                    <div style={{ margin: '1.25rem 0 0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.1rem' }}>
                        <DonutGauge pct={utilizationPct} />
                    </div>
                </div>
            </div>

            {/* ── Bottom Three-Column Grid ─────────────────── */}
            <div className="dashboard-bottom-grid">
                {/* Fleet Live Status by Type */}
                <div className="dash-panel">
                    <div className="dash-panel-title">
                        <i className="fas fa-filter"></i> Fleet (Filtered View)
                    </div>
                    {loading ? (
                        <div className="dash-loading"><i className="fas fa-spinner fa-spin" /> Loading…</div>
                    ) : filteredVehicles.length === 0 ? (
                        <div className="dash-empty">No vehicles match the filter.</div>
                    ) : (
                        <table className="trips-table">
                            <thead>
                                <tr>
                                    <th>Reg No</th>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredVehicles.slice(0, 6).map(v => (
                                    <tr key={v.id}>
                                        <td className="trip-id">{v.registration_no}</td>
                                        <td style={{ fontSize: '0.82rem' }}>{v.name}</td>
                                        <td style={{ fontSize: '0.78rem', color: '#7b8299' }}>{v.vehicle_type}</td>
                                        <td>
                                            {v.status === 'Available' && <span className="badge badge-available">Available</span>}
                                            {v.status === 'On Trip'   && <span className="badge badge-on-trip-v">On Trip</span>}
                                            {v.status === 'In Shop'   && <span className="badge badge-in-shop">In Shop</span>}
                                            {v.status === 'Retired'   && <span className="badge badge-retired">Retired</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Recent Maintenance */}
                <div className="dash-panel">
                    <div className="dash-panel-title">
                        <i className="fas fa-tools"></i> Recent Maintenance
                    </div>
                    {loading ? (
                        <div className="dash-loading"><i className="fas fa-spinner fa-spin" /> Loading…</div>
                    ) : recentMaint.length === 0 ? (
                        <div className="dash-empty">No maintenance records yet.</div>
                    ) : (
                        <div className="maintenance-list">
                            {recentMaint.map(m => (
                                <div className="maint-item" key={m.id}>
                                    <div className="maint-icon">
                                        <i className="fas fa-wrench"></i>
                                    </div>
                                    <div className="maint-info">
                                        <div className="veh">{m.vehicle_reg_no || 'N/A'} – {m.vehicle_name || ''}</div>
                                        <div className="svc">{m.service_type} · {m.date}</div>
                                    </div>
                                    <div className="maint-cost">₹{Number(m.cost).toLocaleString('en-IN')}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Fleet Quick Stats */}
                <div className="dash-panel">
                    <div className="dash-panel-title">
                        <i className="fas fa-tachometer-alt"></i> Quick Stats
                    </div>
                    <div className="quick-stats">
                        <div className="qs-row">
                            <span className="qs-label">Total Vehicles</span>
                            <span className="qs-value">{totalVehicles}</span>
                        </div>
                        <div className="qs-row">
                            <span className="qs-label">Available</span>
                            <span className="qs-value up">{availableVehicles}</span>
                        </div>
                        <div className="qs-row">
                            <span className="qs-label">In Shop</span>
                            <span className="qs-value warn">{inShopVehicles}</span>
                        </div>
                        <div className="qs-row">
                            <span className="qs-label">Retired</span>
                            <span className="qs-value down">{retiredVehicles}</span>
                        </div>
                        <div className="qs-row">
                            <span className="qs-label">Active Maintenance</span>
                            <span className="qs-value warn">{activeMaintenance}</span>
                        </div>
                        <div className="qs-row">
                            <span className="qs-label">Total Maint. Cost</span>
                            <span className="qs-value">₹{totalMaintCost.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="qs-row">
                            <span className="qs-label">Drivers Registered</span>
                            <span className="qs-value">{drivers.length}</span>
                        </div>
                        <div className="qs-row">
                            <span className="qs-label">Fleet Utilization</span>
                            <span className="qs-value up">{utilizationPct}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Dashboard;