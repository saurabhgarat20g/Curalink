import { Brain, Dna, FlaskConical } from 'lucide-react';
import './WelcomeScreen.css';

const EXAMPLES = [
    {
        icon: <Brain size={18} />,
        text: "Deep Brain Stimulation in Parkinson's",
        disease: "Parkinson's disease",
        query: "Deep Brain Stimulation"
    },
    {
        icon: <Dna size={18} />,
        text: "Immunotherapy for Breast Cancer",
        disease: "Breast Cancer",
        query: "immunotherapy"
    },
    {
        icon: <FlaskConical size={18} />,
        text: "Clinical trials for Type 2 Diabetes",
        disease: "Type 2 Diabetes",
        query: "clinical trials"
    }
];

export default function WelcomeScreen({ onExampleClick }) {
    return (
        <div className="welcome-screen">
            <div className="welcome-hero">
                <h1 className="hero-title animate-fade-in">
                    <span className="hero-title-blue">Curalink</span> AI Research Assistant
                </h1>
                <p className="hero-subtitle">
                    Search and analyze medical research with AI
                </p>
            </div>

            <div className="welcome-examples">
                <p className="examples-label">Try searching for:</p>
                <div className="examples-grid">
                    {EXAMPLES.map((ex, i) => (
                        <button
                            key={i}
                            className="example-pill"
                            onClick={() => onExampleClick({ disease: ex.disease, query: ex.query })}
                        >
                            <div className="example-pill-icon">{ex.icon}</div>
                            <span>{ex.text}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
