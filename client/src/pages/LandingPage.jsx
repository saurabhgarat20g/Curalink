import { Link, useNavigate } from 'react-router-dom';
import HeroBackground from '../components/HeroBackground';
import './auth.css';
import './landing.css';

export default function LandingPage({ theme, onToggleTheme }) {
    const navigate = useNavigate();

    return (
        <div className="auth-layout landing-layout" data-theme={theme}>
            <HeroBackground theme={theme} />

            {/* Nav */}
            <nav className="auth-nav landing-nav">
                <Link to="/" className="auth-nav-brand landing-brand">Home</Link>
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

            {/* Hero Card */}
            <div className="auth-card-wrapper landing-card-wrapper">
                <div className="auth-card landing-card">

                    {/* Animated icons */}
                    <div className="landing-icons">
                        <span className="landing-icon licon-1">🩺</span>
                        <span className="landing-icon licon-2">🧬</span>
                        <span className="landing-icon licon-3">💓</span>
                    </div>

                    {/* Headline — gradient text on dark, dark text on light */}
                    <h1 className="landing-title">
                        Welcome to <span className="landing-title-accent">CuraLink.</span>
                    </h1>

                    <p className="landing-subtitle">
                        Connecting patients, caregivers, and researchers<br />
                        to the latest in medical science. Effortlessly.
                    </p>

                    {/* CTA buttons */}
                    <div className="landing-ctas">
                        <button
                            className="landing-btn landing-btn-filled"
                            id="patient-caregiver-btn"
                            onClick={() => navigate('/register?role=patient')}
                        >
                            <span className="lbtn-icon">👤</span>
                            I am a Patient or Caregiver
                            <span className="lbtn-arrow">→</span>
                        </button>
                        <button
                            className="landing-btn landing-btn-outlined"
                            id="researcher-btn"
                            onClick={() => navigate('/register?role=researcher')}
                        >
                            <span className="lbtn-icon">🔬</span>
                            I am a Researcher
                            <span className="lbtn-arrow">→</span>
                        </button>
                    </div>

                    {/* Subtle trust line */}
                    <p className="landing-trust">
                        🔒 Secure &nbsp;·&nbsp; 🌐 AI-Powered &nbsp;·&nbsp; ⚡ Real-time Research
                    </p>
                </div>
            </div>

            {/* Bottom floating badge */}
            <div className="landing-badge">
                <span className="badge-dot" />
                Powered by AI Medical Research Engine
            </div>
        </div>
    );
}
