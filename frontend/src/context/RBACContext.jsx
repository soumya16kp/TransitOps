// src/context/RBACContext.jsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

export const DEFAULT_RBAC = [
    { roleKey: 'fleet_manager',     role: 'Fleet Manager',     fleet: '✓',    driver: '✓',    trips: '—',    fuel: '—',    analytics: '✓' },
    { roleKey: 'dispatcher',        role: 'Dispatcher',        fleet: 'view', driver: '—',    trips: '✓',    fuel: '—',    analytics: '—' },
    { roleKey: 'safety_officer',    role: 'Safety Officer',    fleet: '—',    driver: '✓',    trips: 'view', fuel: '—',    analytics: '—' },
    { roleKey: 'financial_analyst', role: 'Financial Analyst', fleet: 'view', driver: '—',    trips: '—',    fuel: '✓',    analytics: '✓' },
];

export const MODULE_KEYS = ['fleet', 'driver', 'trips', 'fuel', 'analytics'];

const RBACContext = createContext();

export const RBACProvider = ({ children }) => {
    const { role, isAuthenticated } = useAuth();
    const [rbacRules, setRbacRules] = useState(DEFAULT_RBAC);
    const [loading, setLoading] = useState(false);

    /** Fetch rules from Django backend */
    const fetchRules = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:8000/api/core/permissions/');
            // Map keys from backend schema (e.g. role_key -> roleKey)
            const mapped = response.data.map(item => ({
                roleKey: item.role_key,
                role: item.role_name,
                fleet: item.fleet,
                driver: item.driver,
                trips: item.trips,
                fuel: item.fuel,
                analytics: item.analytics
            }));
            setRbacRules(mapped);
        } catch (err) {
            console.error('Failed to load DB permission matrix, using defaults', err);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    // Load permissions on auth state changes
    useEffect(() => {
        fetchRules();
    }, [fetchRules]);

    /** Save updated rules to backend */
    const saveRules = useCallback(async (newRules) => {
        try {
            // Map back to backend schema
            const backendData = newRules.map(item => ({
                role_key: item.roleKey,
                role_name: item.role,
                fleet: item.fleet,
                driver: item.driver,
                trips: item.trips,
                fuel: item.fuel,
                analytics: item.analytics
            }));
            const response = await axios.post('http://localhost:8000/api/core/permissions/', backendData);
            
            // Map back to frontend
            const mapped = response.data.map(item => ({
                roleKey: item.role_key,
                role: item.role_name,
                fleet: item.fleet,
                driver: item.driver,
                trips: item.trips,
                fuel: item.fuel,
                analytics: item.analytics
            }));
            setRbacRules(mapped);
        } catch (err) {
            console.error('Failed to update DB permission matrix', err);
            throw err;
        }
    }, []);

    /** Reset to defaults on backend */
    const resetRules = useCallback(async () => {
        try {
            const backendData = DEFAULT_RBAC.map(item => ({
                role_key: item.roleKey,
                role_name: item.role,
                fleet: item.fleet,
                driver: item.driver,
                trips: item.trips,
                fuel: item.fuel,
                analytics: item.analytics
            }));
            const response = await axios.post('http://localhost:8000/api/core/permissions/', backendData);
            
            const mapped = response.data.map(item => ({
                roleKey: item.role_key,
                role: item.role_name,
                fleet: item.fleet,
                driver: item.driver,
                trips: item.trips,
                fuel: item.fuel,
                analytics: item.analytics
            }));
            setRbacRules(mapped);
        } catch (err) {
            console.error('Failed to reset DB permission matrix', err);
        }
    }, []);

    const canAccess = useCallback((moduleKey) => {
        if (!role) return false;
        if (role === 'admin') return true;            // Admin always has all permissions

        const row = rbacRules.find(r => r.roleKey === role);
        if (!row) return false;
        return row[moduleKey] !== '—';
    }, [role, rbacRules]);

    const getPermission = useCallback((moduleKey) => {
        if (!role) return '—';
        if (role === 'admin') return '✓';
        const row = rbacRules.find(r => r.roleKey === role);
        return row ? row[moduleKey] : '—';
    }, [role, rbacRules]);

    return (
        <RBACContext.Provider value={{ rbacRules, saveRules, resetRules, canAccess, getPermission, loading }}>
            {children}
        </RBACContext.Provider>
    );
};

export const useRBAC = () => {
    const ctx = useContext(RBACContext);
    if (!ctx) throw new Error('useRBAC must be used within RBACProvider');
    return ctx;
};

export default RBACContext;
