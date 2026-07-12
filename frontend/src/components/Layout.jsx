import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/dashboard.css';

const Layout = () => {
    const { user, roleDisplay, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // Dynamically set titles based on path
    let title = "Dashboard";
    let subtitle = `Welcome back, ${user?.username || ''}!`;

    if (location.pathname === '/registry') {
        title = "Fleet Registry";
        subtitle = "Manage and track company fleet details";
    } else if (location.pathname === '/maintenance') {
        title = "Maintenance";
        subtitle = "Log, track, and resolve vehicle servicing records";
    } else if (location.pathname === '/fuel-expenses') {
        title = "Fuel & Expense Management";
        subtitle = "Track fleet fuel consumption and operational expenditures";
    } else if (location.pathname === '/documents') {
        title = "Roadside Documents";
        subtitle = "Manage critical legal vehicle documents for roadside checks";
    }

    return (
        <div className="dashboard-wrapper">
            <div className="dashboard-container">
                {/* Unified Sidebar */}
                <aside className="sidebar">
                    <div className="sidebar-brand">
                        <i className="fas fa-bus-alt" style={{ color: '#f5a623', fontSize: '24px' }}></i>
                        <span>TransitOps</span>
                    </div>
                    <nav className="sidebar-nav">
                        <NavLink to="/dashboard" className={({ isActive }) => isActive ? "active" : ""}>
                            <i className="fas fa-th-large"></i>
                            <span>Dashboard</span>
                        </NavLink>
                        <NavLink to="/registry" className={({ isActive }) => isActive ? "active" : ""}>
                            <i className="fas fa-truck"></i>
                            <span>Fleet</span>
                        </NavLink>
                        <a href="#drivers" onClick={(e) => e.preventDefault()}>
                            <i className="fas fa-id-card"></i>
                            <span>Drivers</span>
                        </a>
                        <a href="#trips" onClick={(e) => e.preventDefault()}>
                            <i className="fas fa-route"></i>
                            <span>Trips</span>
                        </a>
                        <NavLink to="/maintenance" className={({ isActive }) => isActive ? "active" : ""}>
                            <i className="fas fa-tools"></i>
                            <span>Maintenance</span>
                        </NavLink>
                        <NavLink to="/fuel-expenses" className={({ isActive }) => isActive ? "active" : ""}>
                            <i className="fas fa-gas-pump"></i>
                            <span>Fuel & Expenses</span>
                        </NavLink>
                        {user?.role === 'admin' && (
                            <NavLink to="/documents" className={({ isActive }) => isActive ? "active" : ""}>
                                <i className="fas fa-file-alt"></i>
                                <span>Documents</span>
                            </NavLink>
                        )}
                        <a href="#analytics" onClick={(e) => e.preventDefault()}>
                            <i className="fas fa-chart-line"></i>
                            <span>Analytics</span>
                        </a>
                        <a href="#settings" onClick={(e) => e.preventDefault()}>
                            <i className="fas fa-cog"></i>
                            <span>Settings</span>
                        </a>
                    </nav>
                    <div className="sidebar-footer">
                        <button onClick={handleLogout} className="logout-btn">
                            <i className="fas fa-sign-out-alt"></i>
                            <span>Logout</span>
                        </button>
                    </div>
                </aside>

                {/* Main Shared Content Area */}
                <main className="main-content">
                    {/* Unified Premium Header */}
                    <header className="main-header">
                        <div className="header-left">
                            <h1>{title}</h1>
                            <p>{subtitle}</p>
                        </div>
                        <div className="header-right">
                            <div className="notification-bell">
                                <i className="fas fa-bell"></i>
                                <span className="badge">3</span>
                            </div>
                            {roleDisplay && (
                                <span style={{
                                    background: '#f5a623',
                                    color: '#000',
                                    fontSize: '0.72rem',
                                    fontWeight: '700',
                                    padding: '0.25rem 0.7rem',
                                    borderRadius: '20px',
                                    textTransform: 'capitalize'
                                }}>
                                    {roleDisplay}
                                </span>
                            )}
                            <div className="user-avatar">
                                {user?.username?.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </header>

                    {/* Active Route Content */}
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
