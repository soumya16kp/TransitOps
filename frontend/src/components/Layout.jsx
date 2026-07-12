import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRBAC } from '../context/RBACContext';
import '../styles/dashboard.css';

const Layout = () => {
    const { user, role, roleDisplay, logout } = useAuth();
    const { canAccess } = useRBAC();
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
    } else if (location.pathname === '/dispatcher') {
        title = "Trip Dispatcher";
        subtitle = "Create, dispatch, and track live trips";
    } else if (location.pathname === '/settings') {
        title = "Settings & RBAC";
        subtitle = "Configure depot details and view role mappings";
    } else if (location.pathname === '/tasks') {
        title = "Execution Board";
        subtitle = "Real-time Kanban view of all trip lifecycle phases";
    } else if (location.pathname === '/documents') {
        title = "Roadside Documents";
        subtitle = "Manage critical legal vehicle documents for roadside checks";
    }

    // Guard: redirect to /dashboard if user tries to access a restricted page directly
    const routeModuleMap = {
        '/registry': 'fleet',
        '/maintenance': 'fleet',
        '/drivers': 'driver',
        '/dispatcher': 'trips',
        '/fuel-expenses': 'fuel',
    };
    const currentModule = routeModuleMap[location.pathname];
    if (currentModule && !canAccess(currentModule)) {
        return <Navigate to="/dashboard" replace />;
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
    {/* Fleet – canAccess('fleet') */ }
    {
        canAccess('fleet') && (
            <NavLink to="/registry" className={({ isActive }) => isActive ? "active" : ""}>
                <i className="fas fa-truck"></i>
                <span>Fleet</span>
            </NavLink>
        )
    }

    {/* Drivers – canAccess('driver') */ }
    {
        canAccess('driver') && (
            <NavLink to="/drivers" className={({ isActive }) => isActive ? "active" : ""}>
                <i className="fas fa-id-card"></i>
                <span>Drivers</span>
            </NavLink>
        )
    }

    {/* Tasks – canAccess('trips') */ }
    {
        canAccess('trips') && (
            <NavLink to="/tasks" className={({ isActive }) => isActive ? "active" : ""}>
                <i className="fas fa-tasks"></i>
                <span>Tasks</span>
            </NavLink>
        )
    }

    {/* Trips – canAccess('trips') */ }
    {
        canAccess('trips') && (
            <NavLink to="/dispatcher" className={({ isActive }) => isActive ? "active" : ""}>
                <i className="fas fa-route"></i>
                <span>Trips</span>
            </NavLink>
        )
    }

    {/* Maintenance – canAccess('fleet') (maintenance is fleet-adjacent) */ }
    {
        canAccess('fleet') && (
            <NavLink to="/maintenance" className={({ isActive }) => isActive ? "active" : ""}>
                <i className="fas fa-tools"></i>
                <span>Maintenance</span>
            </NavLink>
        )
    }

    {/* Fuel & Expenses – canAccess('fuel') */ }
    {
        canAccess('fuel') && (
            <NavLink to="/fuel-expenses" className={({ isActive }) => isActive ? "active" : ""}>
                <i className="fas fa-gas-pump"></i>
                <span>Fuel &amp; Expenses</span>
            </NavLink>
        )
    }

    {/* Analytics – canAccess('analytics') */ }
    {
        canAccess('analytics') && (
            <a href="#analytics" onClick={(e) => e.preventDefault()}>
                <i className="fas fa-chart-line"></i>
                <span>Analytics</span>
            </a>
        )
    }

    {/* Settings – admin only */ }
    {
        role === 'admin' && (
            <NavLink to="/settings" className={({ isActive }) => isActive ? "active" : ""}>
                <i className="fas fa-cog"></i>
                <span>Settings</span>
            </NavLink>
        )
    }

    {/* Documents – admin only */ }
    {
        role === 'admin' && (
            <NavLink to="/documents" className={({ isActive }) => isActive ? "active" : ""}>
                <i className="fas fa-file-alt"></i>
                <span>Documents</span>
            </NavLink>
        )
    }
                    </nav >
    <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
        </button>
    </div>
                </aside >

    {/* Main Shared Content Area */ }
    < main className = "main-content" >
        {/* Unified Premium Header */ }
        < header className = "main-header" >
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
                    </header >

    {/* Active Route Content */ }
    < Outlet />
                </main >
            </div >
        </div >
    );
};

export default Layout;
