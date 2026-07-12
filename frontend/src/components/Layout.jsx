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
        title = "Vehicle Registry";
        subtitle = "Manage and track company fleet details";
    }

    return (
        <div className="dashboard-wrapper">
            <div className="dashboard-container">
                {/* Unified Sidebar */}
                <aside className="sidebar">
                    <div className="sidebar-brand">
                        <i className="fas fa-cube"></i>
                        <span>TransitOps</span>
                    </div>
                    <nav className="sidebar-nav">
                        <NavLink to="/dashboard" className={({ isActive }) => isActive ? "active" : ""}>
                            <i className="fas fa-th-large"></i>
                            <span>Dashboard</span>
                        </NavLink>
                        <NavLink to="/registry" className={({ isActive }) => isActive ? "active" : ""}>
                            <i className="fas fa-bus-alt"></i>
                            <span>Vehicle Registry</span>
                        </NavLink>
                        <a href="#tasks">
                            <i className="fas fa-tasks"></i>
                            <span>Tasks</span>
                        </a>
                        <a href="#team">
                            <i className="fas fa-users"></i>
                            <span>Team</span>
                        </a>
                        <a href="#settings">
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
