import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HeroBackground from '../components/HeroBackground';
import PlexusBackground from '../components/PlexusBackground';
import { loginUser } from '../api/client';
import './auth.css';

export default function LoginPage({ theme, onToggleTheme }) {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please fill in all fields.');
            return;
        }

        setLoading(true);

        try {
            const userData = await loginUser({ email, password });
            localStorage.setItem('curalink_user', JSON.stringify(userData));
            navigate('/app');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Invalid credentials.');
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
                        id="theme-toggle-login"
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
                        <span className="auth-icon">🔒</span>
                        <span className="auth-icon">💓</span>
                    </div>

                    <h1 className="auth-title">Login to CuraLink</h1>
                    <p className="auth-subtitle">Welcome back. Sign in to continue.</p>

                    {error && <div className="auth-error">{error}</div>}

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="auth-field">
                            <label className="auth-label" htmlFor="login-email">Email</label>
                            <input
                                id="login-email"
                                className="auth-input"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                autoComplete="email"
                            />
                        </div>

                        <div className="auth-field">
                            <label className="auth-label" htmlFor="login-password">Password</label>
                            <input
                                id="login-password"
                                className="auth-input"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                autoComplete="current-password"
                            />
                        </div>

                        <button
                            type="submit"
                            className="auth-submit-btn"
                            id="login-submit-btn"
                            disabled={loading}
                        >
                            {loading ? '⏳ Signing in…' : 'Login'}
                        </button>
                    </form>

                    <p className="auth-footer">
                        Don't have an account?{' '}
                        <Link to="/register" className="auth-footer-link">Sign Up</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
