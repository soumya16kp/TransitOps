import React, { useState, useEffect } from 'react';
import { useRBAC } from '../../context/RBACContext';
import analyticsService from '../../services/AnalyticsService';
import './Analytics.css';

const Analytics = () => {
    const { canAccess } = useRBAC();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!canAccess('analytics')) return;
            try {
                setLoading(true);
                const data = await analyticsService.getAnalyticsSummary();
                setSummary(data);
                setError(null);
            } catch (err) {
                console.error('Error loading analytics summary:', err);
                setError('Failed to load reports and analytics metrics.');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [canAccess]);

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

    if (loading) {
        return (
            <div className="loading-state">
                <i className="fas fa-spinner fa-spin"></i> Loading Reports & Analytics...
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-state">
                <i className="fas fa-exclamation-triangle"></i> {error}
            </div>
        );
    }

    // Calculations for monthly revenue chart height percentage
    const monthlyData = summary?.monthly_revenue || [];
    const maxRevenue = monthlyData.length > 0 ? Math.max(...monthlyData.map(r => r.revenue), 1000) : 1000;

    // Calculations for top costliest vehicles progress bar width
    const costliestVehicles = summary?.top_costliest || [];
    const maxCost = costliestVehicles.length > 0 ? Math.max(...costliestVehicles.map(c => c.cost), 1000) : 1000;

    return (
        <div className="analytics-page-container">
            {/* KPI Cards Grid */}
            <div className="analytics-cards-grid">
                {/* Fuel Efficiency */}
                <div className="analytics-card blue-card">
                    <div className="card-header-label">FUEL EFFICIENCY</div>
                    <div className="card-value">{summary?.fuel_efficiency}</div>
                </div>

                {/* Fleet Utilization */}
                <div className="analytics-card green-card">
                    <div className="card-header-label">FLEET UTILIZATION</div>
                    <div className="card-value">{summary?.fleet_utilization}</div>
                </div>

                {/* Operational Cost */}
                <div className="analytics-card orange-card">
                    <div className="card-header-label">OPERATIONAL COST</div>
                    <div className="card-value">₹{parseFloat(summary?.operational_cost).toLocaleString('en-IN')}</div>
                </div>

                {/* Vehicle ROI */}
                <div className="analytics-card yellow-card">
                    <div className="card-header-label">VEHICLE ROI</div>
                    <div className="card-value">{summary?.roi}</div>
                </div>
            </div>

            {/* Subtext description below ROI */}
            <div className="roi-formula-label">
                ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost
            </div>

            {/* Graphs row */}
            <div className="analytics-graphs-row">
                {/* Monthly Revenue Section */}
                <div className="graph-panel monthly-revenue-panel">
                    <h3 className="graph-panel-title">MONTHLY REVENUE</h3>
                    <div className="bar-chart-container">
                        <div className="bars-flexbox">
                            {monthlyData.map((item, idx) => {
                                const heightPercent = (item.revenue / maxRevenue) * 100;
                                return (
                                    <div key={idx} className="bar-col-wrapper">
                                        <div className="bar-tooltip">₹{item.revenue.toLocaleString('en-IN')}</div>
                                        <div 
                                            className="bar-column-fill" 
                                            style={{ height: `${heightPercent}%` }}
                                            title={`₹${item.revenue.toLocaleString('en-IN')}`}
                                        ></div>
                                        <div className="bar-axis-label">{item.month}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Top Costliest Vehicles Section */}
                <div className="graph-panel costliest-vehicles-panel">
                    <h3 className="graph-panel-title">TOP COSTLIEST VEHICLES</h3>
                    <div className="progress-bars-list">
                        {costliestVehicles.map((item, idx) => {
                            const widthPercent = (item.cost / maxCost) * 100;
                            // Progression color scheme matching screenshot (Red, Orange, Blue)
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
                                    <div className="costly-amount-label">₹{parseFloat(item.cost).toLocaleString('en-IN')}</div>
                                </div>
                            );
                        })}
                        {costliestVehicles.length === 0 && (
                            <div className="empty-panel-state">No vehicle expenditure logs found.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
