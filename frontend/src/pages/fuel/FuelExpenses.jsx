import React, { useState, useEffect, useMemo } from 'react';
import fuelService from '../../services/FuelService';
import './FuelExpenses.css';
import axios from 'axios';

const FuelExpenses = () => {
    const [fuelLogs, setFuelLogs] = useState([]);
    const [otherExpenses, setOtherExpenses] = useState([]);
    const [summary, setSummary] = useState({
        total_fuel: 0,
        total_maint: 0,
        total_toll: 0,
        total_other: 0,
        total_operational_cost: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter search state
    const [searchQuery, setSearchQuery] = useState('');

    // Modal states
    const [showFuelModal, setShowFuelModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);

    // Form states
    const [trips, setTrips] = useState([]);
    const [fuelForm, setFuelForm] = useState({
        trip: '',
        vehicle: '',
        date: new Date().toISOString().split('T')[0],
        liters: '',
        fuel_cost: ''
    });

    const [expenseForm, setExpenseForm] = useState({
        trip: '',
        vehicle: '',
        toll: '0',
        other: '0',
        maint_linked: '0',
        status: 'Available'
    });

    // Sorting states
    const [fuelSortConfig, setFuelSortConfig] = useState({ key: null, direction: 'asc' });
    const [expenseSortConfig, setExpenseSortConfig] = useState({ key: null, direction: 'asc' });

    const requestFuelSort = (key) => {
        let direction = 'asc';
        if (fuelSortConfig.key === key && fuelSortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setFuelSortConfig({ key, direction });
    };

    const requestExpenseSort = (key) => {
        let direction = 'asc';
        if (expenseSortConfig.key === key && expenseSortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setExpenseSortConfig({ key, direction });
    };

    const sortedFuelLogs = useMemo(() => {
        // Filter first
        const filtered = fuelLogs.filter(log =>
            (log.vehicle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (log.trip_tracking_number || '').toLowerCase().includes(searchQuery.toLowerCase())
        );

        let sortableItems = [...filtered];
        if (fuelSortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aValue, bValue;
                if (fuelSortConfig.key === 'liters') {
                    aValue = Number(a.liters) || 0;
                    bValue = Number(b.liters) || 0;
                } else if (fuelSortConfig.key === 'fuel_cost') {
                    aValue = Number(a.fuel_cost) || 0;
                    bValue = Number(b.fuel_cost) || 0;
                } else {
                    aValue = a[fuelSortConfig.key] || '';
                    bValue = b[fuelSortConfig.key] || '';
                }

                if (typeof aValue === 'string') {
                    return fuelSortConfig.direction === 'asc'
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);
                } else {
                    return fuelSortConfig.direction === 'asc'
                        ? aValue - bValue
                        : bValue - aValue;
                }
            });
        }
        return sortableItems;
    }, [fuelLogs, fuelSortConfig, searchQuery]);

    const sortedOtherExpenses = useMemo(() => {
        // Filter first
        const filtered = otherExpenses.filter(exp =>
            (exp.vehicle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (exp.trip || '').toLowerCase().includes(searchQuery.toLowerCase())
        );

        let sortableItems = [...filtered];
        if (expenseSortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aValue, bValue;
                if (expenseSortConfig.key === 'toll') {
                    aValue = Number(a.toll) || 0;
                    bValue = Number(b.toll) || 0;
                } else if (expenseSortConfig.key === 'other') {
                    aValue = Number(a.other) || 0;
                    bValue = Number(b.other) || 0;
                } else if (expenseSortConfig.key === 'maint_linked') {
                    aValue = Number(a.maint_linked) || 0;
                    bValue = Number(b.maint_linked) || 0;
                } else if (expenseSortConfig.key === 'total') {
                    aValue = (Number(a.toll) || 0) + (Number(a.other) || 0) + (Number(a.maint_linked) || 0);
                    bValue = (Number(b.toll) || 0) + (Number(b.other) || 0) + (Number(b.maint_linked) || 0);
                } else {
                    aValue = a[expenseSortConfig.key] || '';
                    bValue = b[expenseSortConfig.key] || '';
                }

                if (typeof aValue === 'string') {
                    return expenseSortConfig.direction === 'asc'
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);
                } else {
                    return expenseSortConfig.direction === 'asc'
                        ? aValue - bValue
                        : bValue - aValue;
                }
            });
        }
        return sortableItems;
    }, [otherExpenses, expenseSortConfig, searchQuery]);

    const getFuelSortIcon = (key) => {
        if (fuelSortConfig.key !== key) {
            return <i className="fas fa-sort sort-placeholder"></i>;
        }
        return fuelSortConfig.direction === 'asc'
            ? <i className="fas fa-sort-up sorted"></i>
            : <i className="fas fa-sort-down sorted"></i>;
    };

    const getExpenseSortIcon = (key) => {
        if (expenseSortConfig.key !== key) {
            return <i className="fas fa-sort sort-placeholder"></i>;
        }
        return expenseSortConfig.direction === 'asc'
            ? <i className="fas fa-sort-up sorted"></i>
            : <i className="fas fa-sort-down sorted"></i>;
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const [logs, expenses, sum, tripsRes] = await Promise.all([
                fuelService.getFuelLogs(),
                fuelService.getOtherExpenses(),
                fuelService.getSummary(),
                axios.get('http://localhost:8000/api/trips/').then(r => r.data).catch(() => [])
            ]);
            setFuelLogs(logs);
            setOtherExpenses(expenses);
            setSummary(sum);
            setTrips(Array.isArray(tripsRes) ? tripsRes : []);
            setError(null);
        } catch (err) {
            console.error('Error loading expenses data:', err);
            setError('Failed to fetch fuel and expense logs.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleFuelSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                vehicle: fuelForm.vehicle,
                date: fuelForm.date,
                liters: parseFloat(fuelForm.liters),
                fuel_cost: parseFloat(fuelForm.fuel_cost)
            };
            if (fuelForm.trip) {
                payload.trip = parseInt(fuelForm.trip);
            }
            await fuelService.createFuelLog(payload);
            setShowFuelModal(false);
            setFuelForm({
                trip: '',
                vehicle: '',
                date: new Date().toISOString().split('T')[0],
                liters: '',
                fuel_cost: ''
            });
            loadData();
        } catch (err) {
            alert(err.detail || 'Failed to log fuel entry.');
        }
    };

    const handleExpenseSubmit = async (e) => {
        e.preventDefault();
        try {
            await fuelService.createOtherExpense({
                trip: expenseForm.trip,
                vehicle: expenseForm.vehicle,
                toll: parseFloat(expenseForm.toll || 0),
                other: parseFloat(expenseForm.other || 0),
                maint_linked: parseFloat(expenseForm.maint_linked || 0),
                status: expenseForm.status
            });
            setShowExpenseModal(false);
            setExpenseForm({
                trip: '',
                vehicle: '',
                toll: '0',
                other: '0',
                maint_linked: '0',
                status: 'Available'
            });
            loadData();
        } catch (err) {
            alert(err.detail || 'Failed to add expense.');
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <>
            <div className="expenses-action-bar">
                <div className="expenses-search-container" style={{ flex: 1, maxWidth: '360px' }}>
                    <input 
                        type="text" 
                        placeholder="Search by vehicle or trip..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="expenses-search-input"
                    />
                </div>
                <div className="expense-button-group">
                    <button onClick={() => setShowFuelModal(true)} className="expense-btn log-fuel">
                        <i className="fas fa-plus"></i> Log Fuel
                    </button>
                    <button onClick={() => setShowExpenseModal(true)} className="expense-btn add-expense">
                        <i className="fas fa-plus"></i> Add Expense
                    </button>
                </div>
            </div>

            {error && <div className="error-state"><i className="fas fa-exclamation-triangle"></i> {error}</div>}

            {loading ? (
                <div className="loading-state">
                    <i className="fas fa-spinner fa-spin"></i> Loading fuel and expense logs...
                </div>
            ) : (
                <div className="expenses-tables-wrapper">
                    {/* Fuel Logs Section */}
                    <div className="expense-section-card">
                        <h3 className="section-title-label">FUEL LOGS</h3>
                        <div className="expenses-table-container">
                            <table className="expenses-table">
                                <thead>
                                    <tr>
                                        <th onClick={() => requestFuelSort('trip_tracking_number')} className="sortable-header">
                                            TRIP ID {getFuelSortIcon('trip_tracking_number')}
                                        </th>
                                        <th onClick={() => requestFuelSort('vehicle')} className="sortable-header">
                                            VEHICLE {getFuelSortIcon('vehicle')}
                                        </th>
                                        <th onClick={() => requestFuelSort('date')} className="sortable-header">
                                            DATE {getFuelSortIcon('date')}
                                        </th>
                                        <th onClick={() => requestFuelSort('liters')} className="sortable-header">
                                            LITERS {getFuelSortIcon('liters')}
                                        </th>
                                        <th onClick={() => requestFuelSort('fuel_cost')} className="sortable-header">
                                            FUEL COST {getFuelSortIcon('fuel_cost')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedFuelLogs.map((log) => (
                                        <tr key={log.id}>
                                            <td className="bold-text" style={{ color: '#60a5fa' }}>{log.trip_tracking_number || '—'}</td>
                                            <td className="bold-text">{log.vehicle}</td>
                                            <td>{formatDate(log.date)}</td>
                                            <td>{parseFloat(log.liters).toFixed(0)} L</td>
                                            <td className="amber-text">₹{parseFloat(log.fuel_cost).toLocaleString('en-IN')}</td>
                                        </tr>
                                    ))}
                                    {sortedFuelLogs.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="empty-row">No matching fuel logs found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Other Expenses Section */}
                    <div className="expense-section-card">
                        <h3 className="section-title-label">OTHER EXPENSES (TOLL / MISC)</h3>
                        <div className="expenses-table-container">
                            <table className="expenses-table">
                                <thead>
                                    <tr>
                                        <th onClick={() => requestExpenseSort('trip')} className="sortable-header">
                                            TRIP {getExpenseSortIcon('trip')}
                                        </th>
                                        <th onClick={() => requestExpenseSort('vehicle')} className="sortable-header">
                                            VEHICLE {getExpenseSortIcon('vehicle')}
                                        </th>
                                        <th onClick={() => requestExpenseSort('toll')} className="sortable-header">
                                            TOLL {getExpenseSortIcon('toll')}
                                        </th>
                                        <th onClick={() => requestExpenseSort('other')} className="sortable-header">
                                            OTHER {getExpenseSortIcon('other')}
                                        </th>
                                        <th onClick={() => requestExpenseSort('maint_linked')} className="sortable-header">
                                            MAINT. (LINKED) {getExpenseSortIcon('maint_linked')}
                                        </th>
                                        <th onClick={() => requestExpenseSort('status')} className="sortable-header">
                                            STATUS {getExpenseSortIcon('status')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedOtherExpenses.map((exp) => (
                                        <tr key={exp.id}>
                                            <td className="bold-text">{exp.trip}</td>
                                            <td>{exp.vehicle}</td>
                                            <td>₹{parseFloat(exp.toll).toLocaleString('en-IN')}</td>
                                            <td>₹{parseFloat(exp.other).toLocaleString('en-IN')}</td>
                                            <td>₹{parseFloat(exp.maint_linked).toLocaleString('en-IN')}</td>
                                            <td>
                                                <span className={`status-pill ${exp.status.toLowerCase()}`}>
                                                    {exp.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {sortedOtherExpenses.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="empty-row">No matching expenses found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Operational Summary Banner */}
                    <div className="expense-summary-footer">
                        <div className="summary-formula">
                            TOTAL OPERATIONAL COST (AUTO) = FUEL + MAINT + TOLL + OTHER
                        </div>
                        <div className="summary-total-cost">
                            ₹{summary.total_operational_cost.toLocaleString('en-IN')}
                        </div>
                    </div>
                </div>
            )}

            {/* Log Fuel Modal */}
            {showFuelModal && (
                <div className="expense-modal-overlay">
                    <div className="expense-modal">
                        <div className="modal-header">
                            <h3>Log Fuel Entry</h3>
                            <button className="close-btn" onClick={() => setShowFuelModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleFuelSubmit}>
                            <div className="expense-form-group">
                                <label>Associate with Trip (Optional)</label>
                                <select 
                                    value={fuelForm.trip}
                                    onChange={(e) => {
                                        const selectedTripId = e.target.value;
                                        const selectedTrip = trips.find(t => String(t.id) === String(selectedTripId));
                                        setFuelForm({
                                            ...fuelForm,
                                            trip: selectedTripId,
                                            // Auto-populate vehicle registration number from selected trip if available
                                            vehicle: selectedTrip ? selectedTrip.vehicle_registration : fuelForm.vehicle
                                        });
                                    }}
                                >
                                    <option value="">-- Select Trip (Optional) --</option>
                                    {Array.isArray(trips) && trips.map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.tracking_number} ({t.source} &rarr; {t.destination}) [{t.status}]
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="expense-form-group">
                                <label>Vehicle</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. VAN-05" 
                                    required
                                    value={fuelForm.vehicle}
                                    onChange={(e) => setFuelForm({ ...fuelForm, vehicle: e.target.value })}
                                />
                            </div>
                            <div className="expense-form-group">
                                <label>Date</label>
                                <input 
                                    type="date" 
                                    required
                                    value={fuelForm.date}
                                    onChange={(e) => setFuelForm({ ...fuelForm, date: e.target.value })}
                                />
                            </div>
                            <div className="expense-form-group">
                                <label>Liters</label>
                                <input 
                                    type="number" 
                                    placeholder="e.g. 42" 
                                    min="0.1" 
                                    step="any"
                                    required
                                    value={fuelForm.liters}
                                    onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })}
                                />
                            </div>
                            <div className="expense-form-group">
                                <label>Fuel Cost (₹)</label>
                                <input 
                                    type="number" 
                                    placeholder="e.g. 3150" 
                                    min="0" 
                                    step="any"
                                    required
                                    value={fuelForm.fuel_cost}
                                    onChange={(e) => setFuelForm({ ...fuelForm, fuel_cost: e.target.value })}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowFuelModal(false)} className="cancel-btn">Cancel</button>
                                <button type="submit" className="submit-btn orange-btn">Log Fuel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Expense Modal */}
            {showExpenseModal && (
                <div className="expense-modal-overlay">
                    <div className="expense-modal">
                        <div className="modal-header">
                            <h3>Add Other Expense</h3>
                            <button className="close-btn" onClick={() => setShowExpenseModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleExpenseSubmit}>
                            <div className="expense-form-group">
                                <label>Trip ID</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. TR001" 
                                    required
                                    value={expenseForm.trip}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, trip: e.target.value })}
                                />
                            </div>
                            <div className="expense-form-group">
                                <label>Vehicle</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. VAN-05" 
                                    required
                                    value={expenseForm.vehicle}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, vehicle: e.target.value })}
                                />
                            </div>
                            <div className="expense-form-group">
                                <label>Toll Cost (₹)</label>
                                <input 
                                    type="number" 
                                    placeholder="e.g. 120" 
                                    min="0" 
                                    step="any"
                                    value={expenseForm.toll}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, toll: e.target.value })}
                                />
                            </div>
                            <div className="expense-form-group">
                                <label>Other Cost (₹)</label>
                                <input 
                                    type="number" 
                                    placeholder="e.g. 150" 
                                    min="0" 
                                    step="any"
                                    value={expenseForm.other}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, other: e.target.value })}
                                />
                            </div>
                            <div className="expense-form-group">
                                <label>Maintenance Linked Cost (₹)</label>
                                <input 
                                    type="number" 
                                    placeholder="e.g. 18000" 
                                    min="0" 
                                    step="any"
                                    value={expenseForm.maint_linked}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, maint_linked: e.target.value })}
                                />
                            </div>
                            <div className="expense-form-group">
                                <label>Status</label>
                                <select 
                                    value={expenseForm.status}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, status: e.target.value })}
                                >
                                    <option value="Available">Available</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowExpenseModal(false)} className="cancel-btn">Cancel</button>
                                <button type="submit" className="submit-btn orange-btn">Add Expense</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default FuelExpenses;
