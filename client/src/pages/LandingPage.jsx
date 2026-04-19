import { Link, useNavigate } from 'react-router-dom';
import PlexusBackground from '../components/PlexusBackground';
import './auth.css';

export default function LandingPage({ theme, onToggleTheme }) {
    const navigate = useNavigate();

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
                        id="theme-toggle-landing"
                    >
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                </div>
            </nav>

            {/* Card */}
            <div className="auth-card-wrapper">
                <div className="auth-card">
                    {/* Icons */}
                    <div className="auth-icons">
                        <span className="auth-icon">🩺</span>
                        <span className="auth-icon">🧬</span>
                        <span className="auth-icon">💓</span>
                    </div>

                    <h1 className="auth-title">Welcome to CuraLink.</h1>
                    <p className="auth-subtitle">
                        Connecting patients, caregivers, and researchers to the<br />
                        latest in medical science. Effortlessly.
                    </p>

                    <div className="role-buttons">
                        <button
                            className="role-btn filled"
                            id="patient-caregiver-btn"
                            onClick={() => navigate('/register?role=patient')}
                        >
                            👤 I am a Patient or Caregiver
                        </button>
                        <button
                            className="role-btn outlined"
                            id="researcher-btn"
                            onClick={() => navigate('/register?role=researcher')}
                        >
                            🔬 I am a Researcher
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
