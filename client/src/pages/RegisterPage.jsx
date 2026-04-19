import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import HeroBackground from '../components/HeroBackground';
import PlexusBackground from '../components/PlexusBackground';
import { registerUser } from '../api/client';
import './auth.css';

export default function RegisterPage({ theme, onToggleTheme }) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const defaultRole = searchParams.get('role') || 'patient';

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState(defaultRole);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!name || !email || !password) {
            setError('Please fill in all fields.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);

        try {
            const userData = await registerUser({ name, email, password, role });
            localStorage.setItem('curalink_user', JSON.stringify(userData));
            navigate('/app');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-layout" data-theme={theme}>
            <PlexusBackground theme={theme} />

            {/* Nav */}
            <nav className="auth-nav">
                <Link to="/" className="auth-nav-brand">Home</Link>
                <div className="auth-nav-links">
                    <Link to="/login" className="auth-nav-btn ghost">Login</Link>
                    <Link to="/register" className="auth-nav-btn primary">Register</Link>
                    <button
                        className="theme-toggle-btn"
                        onClick={onToggleTheme}
                        title="Toggle theme"
                        id="theme-toggle-register"
                    >
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                </div>
            </nav>

            {/* Card */}
            <div className="auth-card-wrapper">
                <div className="auth-card">
                    <div className="auth-icons">
                        <span className="auth-icon">🩺</span>
                        <span className="auth-icon">🧬</span>
                        <span className="auth-icon">💓</span>
                    </div>

                    <h1 className="auth-title">Join CuraLink</h1>
                    <p className="auth-subtitle">Create your account to get started.</p>

                    {error && <div className="auth-error">{error}</div>}

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="auth-field">
                            <label className="auth-label" htmlFor="reg-name">Full Name</label>
                            <input
                                id="reg-name"
                                className="auth-input"
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                autoComplete="name"
                            />
                        </div>

                        <div className="auth-field">
                            <label className="auth-label" htmlFor="reg-email">Email</label>
                            <input
                                id="reg-email"
                                className="auth-input"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                autoComplete="email"
                            />
                        </div>

                        <div className="auth-field">
                            <label className="auth-label" htmlFor="reg-password">Password</label>
                            <input
                                id="reg-password"
                                className="auth-input"
                                type="password"
                                placeholder="Min. 6 characters"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="auth-field">
                            <label className="auth-label" htmlFor="reg-role">I am a…</label>
                            <select
                                id="reg-role"
                                className="auth-select"
                                value={role}
                                onChange={e => setRole(e.target.value)}
                            >
                                <option value="patient">Patient or Caregiver</option>
                                <option value="researcher">Researcher</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            className="auth-submit-btn"
                            id="register-submit-btn"
                            disabled={loading}
                        >
                            {loading ? '⏳ Creating account…' : 'Create Account'}
                        </button>
                    </form>

                    <p className="auth-footer">
                        Already have an account?{' '}
                        <Link to="/login" className="auth-footer-link">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
