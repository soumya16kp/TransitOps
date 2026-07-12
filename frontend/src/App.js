import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import VehicleRegistry from './pages/Registry/VehicleRegistry';
import Maintenance from './pages/Maintenance/Maintenance';
import FuelExpenses from './pages/fuel/FuelExpenses';

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="App">
                    <Routes>
                        {/* Public routes */}
                        <Route path="/login"    element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/"         element={<Navigate to="/dashboard" />} />

                        {/* Protected routes wrapped in Layout */}
                        <Route element={<ProtectedRoute />}>
                            <Route element={<Layout />}>
                                <Route path="/dashboard"   element={<Dashboard />} />
                                <Route path="/registry"    element={<VehicleRegistry />} />
                                <Route path="/maintenance" element={<Maintenance />} />
                                <Route path="/fuel-expenses" element={<FuelExpenses />} />
                            </Route>
                        </Route>
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;