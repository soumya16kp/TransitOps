import React, { useState, useEffect, useCallback } from 'react';
import { useRBAC } from '../../context/RBACContext';
import axios from 'axios';
import './Analytics.css';

const Analytics = () => {
    const { canAccess } = useRBAC();
    const [summary, setSummary]           = useState(null);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState(null);
    const [vehicles, setVehicles]         = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState('ALL');

    const fetchAnalytics = useCallback(async (vehicleFilter) => {
        if (!canAccess('analytics')) return;
        try {
            setLoading(true);
            const params = vehicleFilter && vehicleFilter !== 'ALL'
                ? `?vehicle=${encodeURIComponent(vehicleFilter)}`
                : '';
            const { data } = await axios.get(`http://localhost:8000/api/core/analytics/${params}`);
            setSummary(data);
            // Populate vehicle list from first response
            if (data.vehicles && data.vehicles.length > 0) {
                setVehicles(data.vehicles);
            }
            setError(null);
        } catch (err) {
            console.error('Error loading analytics summary:', err);
            setError('Failed to load reports and analytics metrics.');
        } finally {
            setLoading(false);
        }
    }, [canAccess]);

    useEffect(() => {
        fetchAnalytics(selectedVehicle);
    }, [fetchAnalytics, selectedVehicle]);

    // Access protection
    if (!canAccess('analytics')) {
        return (
            <div className="access-denied-container">
                <i className="fas fa-exclamation-triangle warning-icon"></i>
                <h2>Access Denied</h2>
                <p>This section is restricted. You do not have permissions to view reports or analytics dashboards.</p>
            </div>
        );
    }

    // Calculations for monthly revenue chart
    const monthlyData = summary?.monthly_revenue || [];
    const maxRevenue  = monthlyData.length > 0
        ? Math.max(...monthlyData.map(r => r.revenue), 1)
        : 1;

    // Calculations for top costliest vehicles progress bar
    const costliestVehicles = summary?.top_costliest || [];
    const maxCost = costliestVehicles.length > 0
        ? Math.max(...costliestVehicles.map(c => c.cost), 1)
        : 1;

    const hasRevenue = monthlyData.some(m => m.revenue > 0);

    return (
        <div className="analytics-page-container">

            {/* ── Vehicle Filter Bar ── */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                marginBottom: '24px',
                padding: '12px 16px',
                background: 'linear-gradient(135deg, #111827, #0f172a)',
                border: '1px solid #1f2937',
                borderRadius: '10px',
            }}>
                <i className="fas fa-filter" style={{ color: '#60a5fa', fontSize: '0.85rem' }}></i>
                <span style={{ color: '#9ca3af', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Filter by Vehicle
                </span>
                <select
                    value={selectedVehicle}
                    onChange={e => setSelectedVehicle(e.target.value)}
                    style={{
                        background: '#1f2937', border: '1px solid #374151', color: '#f9fafb',
                        padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem',
                        cursor: 'pointer', outline: 'none', minWidth: '220px',
                    }}
                >
                    <option value="ALL">All Vehicles</option>
                    {vehicles.map(v => (
                        <option key={v.registration_no} value={v.registration_no}>
                            {v.registration_no} — {v.name} ({v.vehicle_type})
                        </option>
                    ))}
                </select>
                {selectedVehicle !== 'ALL' && (
                    <button
                        onClick={() => setSelectedVehicle('ALL')}
                        style={{
                            background: '#374151', color: '#9ca3af', border: 'none',
                            borderRadius: '5px', padding: '5px 10px', cursor: 'pointer',
                            fontSize: '0.75rem',
                        }}
                    >
                        ✕ Clear
                    </button>
                )}
                {selectedVehicle !== 'ALL' && (
                    <span style={{
                        marginLeft: 'auto', color: '#60a5fa', fontSize: '0.75rem',
                        background: 'rgba(96,165,250,0.1)', padding: '3px 8px',
                        borderRadius: '4px', border: '1px solid rgba(96,165,250,0.2)',
                    }}>
                        Showing: {selectedVehicle}
                    </span>
                )}
            </div>

            {error && (
                <div className="error-state">
                    <i className="fas fa-exclamation-triangle"></i> {error}
                </div>
            )}

            {loading ? (
                <div className="loading-state">
                    <i className="fas fa-spinner fa-spin"></i> Loading Reports &amp; Analytics...
                </div>
            ) : (
                <>
                    {/* ── KPI Cards Grid ── */}
                    <div className="analytics-cards-grid">
                        <div className="analytics-card blue-card">
                            <div className="card-header-label">FUEL EFFICIENCY</div>
                            <div className="card-value">{summary?.fuel_efficiency}</div>
                            <div style={{ fontSize: '0.65rem', color: '#93c5fd', marginTop: '4px', opacity: 0.7 }}>
                                km per litre — all fuel logs
                            </div>
                        </div>

                        <div className="analytics-card green-card">
                            <div className="card-header-label">FLEET UTILIZATION</div>
                            <div className="card-value">{summary?.fleet_utilization}</div>
                            <div style={{ fontSize: '0.65rem', color: '#6ee7b7', marginTop: '4px', opacity: 0.7 }}>
                                {selectedVehicle === 'ALL' ? 'vehicles On Trip right now' : 'current status'}
                            </div>
                        </div>

                        <div className="analytics-card orange-card">
                            <div className="card-header-label">OPERATIONAL COST</div>
                            <div className="card-value">
                                ₹{parseFloat(summary?.operational_cost || 0).toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: '#fcd34d', marginTop: '4px', opacity: 0.7 }}>
                                fuel + maintenance + toll + misc
                            </div>
                        </div>

                        <div className="analytics-card yellow-card">
                            <div className="card-header-label">VEHICLE ROI</div>
                            <div className="card-value">{summary?.roi}</div>
                            <div style={{ fontSize: '0.65rem', color: '#fde68a', marginTop: '4px', opacity: 0.7 }}>
                                (Revenue − Costs) ÷ Acquisition
                            </div>
                        </div>
                    </div>

                    {/* Graphs row */}
                    <div className="analytics-graphs-row">
                        {/* Monthly Revenue — real historical data */}
                        <div className="graph-panel monthly-revenue-panel">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <h3 className="graph-panel-title">MONTHLY REVENUE</h3>
                                <span style={{ fontSize: '0.65rem', color: '#4b5563' }}>
                                    {hasRevenue ? 'live DB data — last 7 months' : 'no completed trips yet'}
                                </span>
                            </div>
                            <div className="bar-chart-container">
                                <div className="bars-flexbox">
                                    {monthlyData.map((item, idx) => {
                                        const heightPercent = maxRevenue > 0
                                            ? (item.revenue / maxRevenue) * 100
                                            : 0;
                                        return (
                                            <div key={idx} className="bar-col-wrapper">
                                                <div className="bar-tooltip">
                                                    {item.revenue > 0
                                                        ? `₹${item.revenue.toLocaleString('en-IN')}`
                                                        : 'No data'}
                                                </div>
                                                <div
                                                    className="bar-column-fill"
                                                    style={{
                                                        height: `${Math.max(heightPercent, item.revenue > 0 ? 2 : 0)}%`,
                                                        opacity: item.revenue > 0 ? 1 : 0.2,
                                                    }}
                                                    title={`₹${item.revenue.toLocaleString('en-IN')}`}
                                                ></div>
                                                <div className="bar-axis-label">{item.month}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Top Costliest Vehicles */}
                        <div className="graph-panel costliest-vehicles-panel">
                            <h3 className="graph-panel-title">TOP COSTLIEST VEHICLES (FUEL)</h3>
                            <div className="progress-bars-list">
                                {costliestVehicles.map((item, idx) => {
                                    const widthPercent = maxCost > 0 ? (item.cost / maxCost) * 100 : 0;
                                    const colorClass = idx === 0 ? 'red-bar' : idx === 1 ? 'orange-bar' : 'blue-bar';
                                    return (
                                        <div key={idx} className="vehicle-cost-row">
                                            <div className="costly-vehicle-name">{item.vehicle}</div>
                                            <div className="costly-progress-container">
                                                <div
                                                    className={`costly-progress-fill ${colorClass}`}
                                                    style={{ width: `${widthPercent}%` }}
                                                ></div>
                                            </div>
                                            <div className="costly-amount-label">
                                                ₹{parseFloat(item.cost).toLocaleString('en-IN')}
                                            </div>
                                        </div>
                                    );
                                })}
                                {costliestVehicles.length === 0 && (
                                    <div className="empty-panel-state">No fuel logs found.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Data source notice */}
                    <div style={{
                        marginTop: '16px', padding: '10px 16px',
                        background: 'rgba(96,165,250,0.05)',
                        border: '1px solid rgba(96,165,250,0.1)',
                        borderRadius: '8px', fontSize: '0.72rem', color: '#4b5563',
                        display: 'flex', alignItems: 'center', gap: '8px',
                    }}>
                        <i className="fas fa-database" style={{ color: '#374151' }}></i>
                        All metrics are calculated live from the database.
                        Monthly revenue = real completed trip revenue grouped by month.
                        {selectedVehicle !== 'ALL' && (
                            <span style={{ color: '#60a5fa', marginLeft: '8px' }}>
                                Filtered to vehicle: <strong>{selectedVehicle}</strong>
                            </span>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default Analytics;
