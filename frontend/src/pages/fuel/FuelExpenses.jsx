import React, { useState, useEffect } from 'react';
import fuelService from '../../services/FuelService';
import './FuelExpenses.css';

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

    // Modal states
    const [showFuelModal, setShowFuelModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);

    // Form states
    const [fuelForm, setFuelForm] = useState({
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

    const loadData = async () => {
        try {
            setLoading(true);
            const [logs, expenses, sum] = await Promise.all([
                fuelService.getFuelLogs(),
                fuelService.getOtherExpenses(),
                fuelService.getSummary()
            ]);
            setFuelLogs(logs);
            setOtherExpenses(expenses);
            setSummary(sum);
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
            await fuelService.createFuelLog({
                vehicle: fuelForm.vehicle,
                date: fuelForm.date,
                liters: parseFloat(fuelForm.liters),
                fuel_cost: parseFloat(fuelForm.fuel_cost)
            });
            setShowFuelModal(false);
            setFuelForm({
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
                                        <th>VEHICLE</th>
                                        <th>DATE</th>
                                        <th>LITERS</th>
                                        <th>FUEL COST</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fuelLogs.map((log) => (
                                        <tr key={log.id}>
                                            <td className="bold-text">{log.vehicle}</td>
                                            <td>{formatDate(log.date)}</td>
                                            <td>{parseFloat(log.liters).toFixed(0)} L</td>
                                            <td className="amber-text">₹{parseFloat(log.fuel_cost).toLocaleString('en-IN')}</td>
                                        </tr>
                                    ))}
                                    {fuelLogs.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="empty-row">No fuel logs recorded</td>
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
                                        <th>TRIP</th>
                                        <th>VEHICLE</th>
                                        <th>TOLL</th>
                                        <th>OTHER</th>
                                        <th>MAINT. (LINKED)</th>
                                        <th>TOTAL / STATUS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {otherExpenses.map((exp) => (
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
                                    {otherExpenses.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="empty-row">No other expenses recorded</td>
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
