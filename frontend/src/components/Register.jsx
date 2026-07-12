// src/components/Register.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/register.css';

const ROLES = [
    { value: 'fleet_manager',     label: 'Fleet Manager' },
    { value: 'dispatcher',        label: 'Dispatcher' },
    { value: 'safety_officer',    label: 'Safety Officer' },
    { value: 'financial_analyst', label: 'Financial Analyst' },
];

const Register = () => {
    const [userData, setUserData] = useState({
        email:        '',
        username:     '',
        password:     '',
        password2:    '',
        phone_number: '',
        role:         'dispatcher',
    });
    const [error, setError]                       = useState('');
    const [loading, setLoading]                   = useState(false);
    const [showPassword, setShowPassword]         = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await register(userData);
            navigate('/dashboard');
        } catch (err) {
            // Flatten DRF validation errors nicely
            if (err && typeof err === 'object') {
                const msgs = Object.values(err).flat().join(' | ');
                setError(msgs || 'Registration failed. Please try again.');
            } else {
                setError(typeof err === 'string' ? err : 'Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Password strength indicator
    const getPasswordStrength = (password) => {
        if (!password) return { score: 0, label: 'None', color: '#e2e8f0' };
        let score = 0;
        if (password.length >= 8) score++;
        if (password.match(/[a-z]/) && password.match(/[A-Z]/)) score++;
        if (password.match(/\d/)) score++;
        if (password.match(/[^a-zA-Z\d]/)) score++;
        const strengths = [
            { label: 'Very Weak', color: '#fc8181' },
            { label: 'Weak',      color: '#f6ad55' },
            { label: 'Fair',      color: '#f6e05e' },
            { label: 'Good',      color: '#68d391' },
            { label: 'Strong',    color: '#4fd1c5' },
        ];
        return { score, ...strengths[score] };
    };

    const passwordStrength = getPasswordStrength(userData.password);

    return (
        <div className="register-wrapper">
            <div className="register-container">
                <div className="register-card">
                    {/* Animated background elements */}
                    <div className="bg-blob blob1"></div>
                    <div className="bg-blob blob2"></div>
                    <div className="bg-blob blob3"></div>

                    <div className="register-header">
                        <div className="brand-icon">
                            <i className="fas fa-bus-alt"></i>
                        </div>
                        <h2>Create Account</h2>
                        <p>Join TransitOps and choose your role</p>
                    </div>

                    {error && (
                        <div className="alert alert-error">
                            <i className="fas fa-exclamation-circle"></i>
                            {error}
                        </div>
                    )}

                    <form className="register-form" onSubmit={handleSubmit}>
                        {/* Email */}
                        <div className="form-group">
                            <label>
                                <i className="fas fa-envelope"></i>
                                Email Address <span className="required">*</span>
                            </label>
                            <div className="input-wrapper">
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="you@example.com"
                                    value={userData.email}
                                    onChange={handleChange}
                                    required
                                />
                                <i className="fas fa-check-circle input-icon success"></i>
                            </div>
                        </div>

                        {/* Username */}
                        <div className="form-group">
                            <label>
                                <i className="fas fa-user"></i>
                                Username <span className="required">*</span>
                            </label>
                            <div className="input-wrapper">
                                <input
                                    type="text"
                                    name="username"
                                    placeholder="Choose a username"
                                    value={userData.username}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {/* Role */}
                        <div className="form-group">
                            <label>
                                <i className="fas fa-user-shield"></i>
                                Role <span className="required">*</span>
                            </label>
                            <div className="input-wrapper">
                                <select
                                    name="role"
                                    value={userData.role}
                                    onChange={handleChange}
                                    required
                                    style={{
                                        width: '100%',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1.5px solid rgba(255,255,255,0.12)',
                                        borderRadius: '12px',
                                        padding: '0.85rem 1.1rem',
                                        color: '#fff',
                                        fontSize: '0.97rem',
                                        outline: 'none',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {ROLES.map((r) => (
                                        <option
                                            key={r.value}
                                            value={r.value}
                                            style={{ background: '#1a1a2e', color: '#fff' }}
                                        >
                                            {r.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Password */}
                        <div className="form-group">
                            <label>
                                <i className="fas fa-lock"></i>
                                Password <span className="required">*</span>
                            </label>
                            <div className="input-wrapper password-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    placeholder="Create a strong password"
                                    value={userData.password}
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
                            {userData.password && (
                                <div className="password-strength">
                                    <div className="strength-bar">
                                        <div
                                            className="strength-fill"
                                            style={{
                                                width: `${(passwordStrength.score / 4) * 100}%`,
                                                background: passwordStrength.color,
                                            }}
                                        ></div>
                                    </div>
                                    <span className="strength-label" style={{ color: passwordStrength.color }}>
                                        {passwordStrength.label}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="form-group">
                            <label>
                                <i className="fas fa-check-circle"></i>
                                Confirm Password <span className="required">*</span>
                            </label>
                            <div className="input-wrapper password-wrapper">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="password2"
                                    placeholder="Confirm your password"
                                    value={userData.password2}
                                    onChange={handleChange}
                                    required
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                            {userData.password2 && userData.password !== userData.password2 && (
                                <span className="field-error">
                                    <i className="fas fa-times-circle"></i>
                                    Passwords do not match
                                </span>
                            )}
                        </div>

                        {/* Phone */}
                        <div className="form-group">
                            <label>
                                <i className="fas fa-phone"></i>
                                Phone Number
                            </label>
                            <div className="input-wrapper">
                                <input
                                    type="tel"
                                    name="phone_number"
                                    placeholder="+91 98765 43210"
                                    value={userData.phone_number}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Terms */}
                        <div className="form-group terms">
                            <label className="checkbox-label">
                                <input type="checkbox" required />
                                <span className="checkmark"></span>
                                I agree to the{' '}
                                <Link to="/terms">Terms of Service</Link> and{' '}
                                <Link to="/privacy">Privacy Policy</Link>
                            </label>
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-user-plus"></i>
                                    Create Account
                                </>
                            )}
                        </button>
                    </form>

                    <div className="register-footer">
                        <p>
                            Already have an account? <Link to="/login">Sign in</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;