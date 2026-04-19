import { Activity, Menu, Zap, Cpu } from 'lucide-react';
import './Header.css';

export default function Header({ onToggleSidebar, status, deepResearch, onToggleDeepResearch }) {
    return (
        <header className="app-header">
            <div className="header-left">
                <button className="icon-btn" onClick={onToggleSidebar} title="Toggle sidebar" id="sidebar-toggle-btn">
                    <Menu size={20} />
                </button>
                <div className="brand">
                    <div className="brand-icon">
                        <Activity size={18} />
                    </div>
                    <div className="brand-text">
                        <span className="brand-name">Curalink</span>
                        <span className="brand-tagline">Medical Research AI</span>
                    </div>
                </div>
            </div>

            <div className="header-center">
                <div className="status-indicators">
                    <StatusDot
                        active={status.ollama}
                        label={status.ollama ? `LLM: ${status.ollamaModel || 'Mistral'}` : 'LLM: Template Mode'}
                        color={status.ollama ? 'green' : 'amber'}
                        icon={<Cpu size={11} />}
                    />
                    <StatusDot
                        active={status.database}
                        label={status.database ? 'DB: Connected' : 'DB: Offline'}
                        color={status.database ? 'green' : 'red'}
                    />
                </div>
            </div>

            <div className="header-right">
                <button
                    id="deep-research-toggle"
                    className={`deep-research-btn ${deepResearch ? 'active' : ''}`}
                    onClick={onToggleDeepResearch}
                    title="Toggle deep research mode for more comprehensive results"
                >
                    <Zap size={14} className={deepResearch ? 'zap-active' : ''} />
                    <span>Deep Research</span>
                    <div className={`toggle-pill ${deepResearch ? 'on' : ''}`}>
                        <div className="toggle-thumb" />
                    </div>
                </button>
            </div>
        </header>
    );
}

function StatusDot({ active, label, color, icon }) {
    return (
        <div className={`status-dot-item status-${color}`}>
            {icon}
            <div className={`dot ${active ? 'dot-active' : 'dot-inactive'}`} />
            <span>{label}</span>
        </div>
    );
}
