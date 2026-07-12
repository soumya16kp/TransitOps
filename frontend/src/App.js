import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RBACProvider } from './context/RBACContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import VehicleRegistry from './pages/Registry/VehicleRegistry';
import Drivers from './pages/driver/Drivers';
import Maintenance from './pages/Maintenance/Maintenance';
import FuelExpenses from './pages/fuel/FuelExpenses';
import TripDispatcher from './pages/trips/TripDispatcher';
import Settings from './pages/settings/Settings';
import Tasks from './pages/Tasks/Tasks';
import Documents from './pages/documents/Documents';
function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="App">
                    <Routes>
                        {/* Public routes */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/" element={<Navigate to="/dashboard" />} />

                        {/* Protected routes wrapped in Layout and RBACProvider */}
                        <Route element={<ProtectedRoute />}>
                            <Route element={<RBACProvider><Layout /></RBACProvider>}>
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/registry" element={<VehicleRegistry />} />
                                <Route path="/drivers" element={<Drivers />} />
                                <Route path="/maintenance" element={<Maintenance />} />
                                <Route path="/fuel-expenses" element={<FuelExpenses />} />
                                <Route path="/dispatcher" element={<TripDispatcher />} />
                                <Route path="/settings" element={<Settings />} />
                                <Route path="/tasks" element={<Tasks />} />
                                <Route path="/documents" element={<Documents />} />
                            </Route>
                        </Route>
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;