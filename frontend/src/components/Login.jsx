// src/components/Login.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/login.css';

const Login = () => {
    const [credentials, setCredentials] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials({
            ...credentials,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(credentials);
            navigate('/dashboard');
        } catch (error) {
            setError(typeof error === 'string' ? error : 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-container">
                <div className="login-card">
                    {/* Animated background elements */}
                    <div className="bg-blob blob1"></div>
                    <div className="bg-blob blob2"></div>

                    <div className="login-header">
                        <div className="brand-icon">
                            <i className="fas fa-arrow-right-to-bracket"></i>
                        </div>
                        <h2>Welcome Back</h2>
                        <p>Sign in to access your account</p>
                    </div>

                    {error && (
                        <div className="alert alert-error">
                            <i className="fas fa-exclamation-circle"></i>
                            {error}
                        </div>
                    )}

                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>
                                <i className="fas fa-envelope"></i>
                                Email Address
                            </label>
                            <div className="input-wrapper">
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="you@example.com"
                                    value={credentials.email}
                                    onChange={handleChange}
                                    required
                                />
                                <i className="fas fa-envelope input-icon"></i>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>
                                <i className="fas fa-lock"></i>
                                Password
                            </label>
                            <div className="input-wrapper password-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Enter your password"
                                    value={credentials.password}
                                    onChange={handleChange}
                                    required
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                        </div>

                        <div className="form-options">
                            <label className="checkbox-label">
                                <input 
                                    type="checkbox" 
                                    checked={rememberMe}
                                    onChange={() => setRememberMe(!rememberMe)}
                                />
                                <span className="checkmark"></span>
                                Remember me
                            </label>
                            <Link to="/forgot-password" className="forgot-link">
                                Forgot password?
                            </Link>
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-sign-in-alt"></i>
                                    Sign In
                                </>
                            )}
                        </button>

                        <div className="divider">
                            <span>or continue with</span>
                        </div>

                        <div className="social-login">
                            <button type="button" className="btn btn-social google">
                                <i className="fab fa-google"></i>
                                Google
                            </button>
                            <button type="button" className="btn btn-social github">
                                <i className="fab fa-github"></i>
                                GitHub
                            </button>
                        </div>
                    </form>

                    <div className="login-footer">
                        <p>
                            Don't have an account? <Link to="/register">Create one</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;