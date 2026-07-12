// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../styles/dashboard.css';

const Dashboard = () => {
    const { user, roleDisplay } = useAuth();
    const [protectedData, setProtectedData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stats] = useState({
        projects: 12,
        tasks: 48,
        completed: 36
    });

    useEffect(() => {
        const fetchProtectedData = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/core/protected/');
                setProtectedData(response.data);
            } catch (error) {
                console.error('Error fetching protected data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProtectedData();
    }, []);

    return (
        <>
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon purple">
                        <i className="fas fa-folder-open"></i>
                    </div>
                    <div className="stat-info">
                        <h3>{stats.projects}</h3>
                        <p>Total Projects</p>
                    </div>
                    <div className="stat-change positive">
                        <i className="fas fa-arrow-up"></i>
                        12%
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue">
                        <i className="fas fa-list-check"></i>
                    </div>
                    <div className="stat-info">
                        <h3>{stats.tasks}</h3>
                        <p>Active Tasks</p>
                    </div>
                    <div className="stat-change positive">
                        <i className="fas fa-arrow-up"></i>
                        8%
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green">
                        <i className="fas fa-check-circle"></i>
                    </div>
                    <div className="stat-info">
                        <h3>{stats.completed}</h3>
                        <p>Completed</p>
                    </div>
                    <div className="stat-change positive">
                        <i className="fas fa-arrow-up"></i>
                        24%
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon orange">
                        <i className="fas fa-clock"></i>
                    </div>
                    <div className="stat-info">
                        <h3>{stats.tasks - stats.completed}</h3>
                        <p>Pending</p>
                    </div>
                    <div className="stat-change negative">
                        <i className="fas fa-arrow-down"></i>
                        3%
                    </div>
                </div>
            </div>

            <div className="content-grid">
                <div className="profile-card">
                    <h3>
                        <i className="fas fa-user-circle"></i>
                        Profile Information
                    </h3>
                    <div className="profile-details">
                        <div className="profile-item">
                            <span className="label">Username</span>
                            <span className="value">{user?.username || 'N/A'}</span>
                        </div>
                        <div className="profile-item">
                            <span className="label">Email</span>
                            <span className="value">{user?.email || 'N/A'}</span>
                        </div>
                        <div className="profile-item">
                            <span className="label">Phone</span>
                            <span className="value">{user?.phone_number || 'Not provided'}</span>
                        </div>
                        <div className="profile-item">
                            <span className="label">Role</span>
                            <span className="value" style={{ color: '#f5a623', fontWeight: '600' }}>
                                {roleDisplay || user?.role || 'N/A'}
                            </span>
                        </div>
                        <div className="profile-item">
                            <span className="label">Status</span>
                            <span className="value status-active">
                                <span className="dot"></span>
                                Active
                            </span>
                        </div>
                    </div>
                </div>

                <div className="api-data-card">
                    <h3>
                        <i className="fas fa-code"></i>
                        API Response
                    </h3>
                    {loading ? (
                        <div className="loading-state">
                            <i className="fas fa-spinner fa-spin"></i>
                            Loading data...
                        </div>
                    ) : protectedData ? (
                        <pre>{JSON.stringify(protectedData, null, 2)}</pre>
                    ) : (
                        <div className="error-state">
                            <i className="fas fa-exclamation-triangle"></i>
                            Failed to fetch data
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Dashboard;