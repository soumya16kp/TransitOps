import React, { createContext, useContext, useReducer, useEffect } from 'react';
import authService from '../services/AuthService';

// Initial state
const initialState = {
    user: null,
    role: null,
    roleDisplay: null,
    isAuthenticated: false,
    loading: true,
    error: null
};

// Action types
const ACTION_TYPES = {
    LOGIN_SUCCESS:    'LOGIN_SUCCESS',
    LOGIN_FAILURE:    'LOGIN_FAILURE',
    LOGOUT:           'LOGOUT',
    REGISTER_SUCCESS: 'REGISTER_SUCCESS',
    REGISTER_FAILURE: 'REGISTER_FAILURE',
    UPDATE_USER:      'UPDATE_USER',
    SET_LOADING:      'SET_LOADING'
};

// Reducer
const authReducer = (state, action) => {
    switch (action.type) {
        case ACTION_TYPES.LOGIN_SUCCESS:
        case ACTION_TYPES.REGISTER_SUCCESS:
            return {
                ...state,
                user:            action.payload.user,
                role:            action.payload.user?.role         || null,
                roleDisplay:     action.payload.user?.role_display  || null,
                isAuthenticated: true,
                loading:         false,
                error:           null
            };
        case ACTION_TYPES.LOGIN_FAILURE:
        case ACTION_TYPES.REGISTER_FAILURE:
            return {
                ...state,
                user:            null,
                role:            null,
                roleDisplay:     null,
                isAuthenticated: false,
                loading:         false,
                error:           action.payload
            };
        case ACTION_TYPES.LOGOUT:
            return {
                ...state,
                user:            null,
                role:            null,
                roleDisplay:     null,
                isAuthenticated: false,
                loading:         false,
                error:           null
            };
        case ACTION_TYPES.UPDATE_USER:
            return {
                ...state,
                user:        action.payload,
                role:        action.payload?.role         || state.role,
                roleDisplay: action.payload?.role_display  || state.roleDisplay,
            };
        case ACTION_TYPES.SET_LOADING:
            return { ...state, loading: action.payload };
        default:
            return state;
    }
};

// Create context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    useEffect(() => {
        const handleAuthLogout = () => dispatch({ type: ACTION_TYPES.LOGOUT });
        window.addEventListener('auth:logout', handleAuthLogout);
        return () => window.removeEventListener('auth:logout', handleAuthLogout);
    }, []);

    // Check authentication status on mount
    useEffect(() => {
        const checkAuth = async () => {
            if (authService.isAuthenticated()) {
                try {
                    const userData = await authService.getProfile();
                    localStorage.setItem('user_data', JSON.stringify(userData));
                    dispatch({
                        type:    ACTION_TYPES.LOGIN_SUCCESS,
                        payload: { user: userData }
                    });
                } catch (error) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('user_data');
                    dispatch({ type: ACTION_TYPES.LOGOUT });
                }
            } else {
                localStorage.removeItem('user_data');
                dispatch({ type: ACTION_TYPES.LOGOUT });
            }
        };
        checkAuth();
    }, []);

    // ── Auth actions ──────────────────────────────────────────────────────────

    const login = async (credentials) => {
        try {
            dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });
            const data = await authService.login(credentials);
            localStorage.setItem('user_data', JSON.stringify(data.user));
            dispatch({
                type:    ACTION_TYPES.LOGIN_SUCCESS,
                payload: { user: data.user }
            });
            return data;
        } catch (error) {
            dispatch({ type: ACTION_TYPES.LOGIN_FAILURE, payload: error });
            throw error;
        }
    };

    const register = async (userData) => {
        try {
            dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });
            const data = await authService.register(userData);
            localStorage.setItem('user_data', JSON.stringify(data.user));
            dispatch({
                type:    ACTION_TYPES.REGISTER_SUCCESS,
                payload: { user: data.user }
            });
            return data;
        } catch (error) {
            dispatch({ type: ACTION_TYPES.REGISTER_FAILURE, payload: error });
            throw error;
        }
    };

    const logout = async () => {
        try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) await authService.logout(refreshToken);
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('user_data');
            dispatch({ type: ACTION_TYPES.LOGOUT });
        }
    };

    const updateUser = (userData) => {
        dispatch({ type: ACTION_TYPES.UPDATE_USER, payload: userData });
        localStorage.setItem('user_data', JSON.stringify(userData));
    };

    /**
     * hasRole(['fleet_manager', 'admin']) → true if user has any listed role.
     */
    const hasRole = (roles = []) => {
        if (!state.role) return false;
        return roles.includes(state.role);
    };

    const value = {
        ...state,
        login,
        register,
        logout,
        updateUser,
        hasRole,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;