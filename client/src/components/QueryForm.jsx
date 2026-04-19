import { useState, useEffect } from 'react';
import { Search, ChevronDown, SlidersHorizontal, ArrowRight } from 'lucide-react';
import './QueryForm.css';

export default function QueryForm({ onSubmit, loading, initialData }) {
    const [formData, setFormData] = useState({
        disease: '',
        query: '',
        patientName: '',
        location: '',
        freeText: ''
    });
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));
        }
    }, [initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.disease && !formData.freeText) return;
        onSubmit(formData);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className={`search-container ${isFocused ? 'is-focused' : ''}`}>
            <form onSubmit={handleSubmit} className="minimal-search-form">
                <div className="search-bar-wrapper">
                    <div className="search-icon-wrapper">
                        <Search size={20} className={isFocused ? 'icon-active' : ''} />
                    </div>

                    <input
                        type="text"
                        name="disease"
                        className="main-search-input"
                        placeholder="Search medical research (e.g., lung cancer treatment, diabetes trials...)"
                        value={formData.disease}
                        onChange={handleChange}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        autoComplete="off"
                    />

                    <div className="search-actions">
                        <button
                            type="button"
                            className={`advanced-btn ${showAdvanced ? 'active' : ''}`}
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            title="Advanced filters"
                        >
                            <SlidersHorizontal size={18} />
                        </button>
                        <button
                            type="submit"
                            className="search-submit-btn"
                            disabled={loading || (!formData.disease && !formData.freeText)}
                        >
                            {loading ? <div className="spinner-sml" /> : <ArrowRight size={20} />}
                        </button>
                    </div>
                </div>

                {showAdvanced && (
                    <div className="advanced-options-panel animate-fade-scale">
                        <div className="advanced-grid">
                            <div className="adv-field">
                                <label>Research focus</label>
                                <input
                                    type="text"
                                    name="query"
                                    placeholder="e.g. CRISPR, immunotherapy"
                                    value={formData.query}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="adv-field">
                                <label>Location (trials)</label>
                                <input
                                    type="text"
                                    name="location"
                                    placeholder="e.g. Boston, India"
                                    value={formData.location}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="adv-field">
                                <label>Patient ID (optional)</label>
                                <input
                                    type="text"
                                    name="patientName"
                                    placeholder="e.g. J. Doe"
                                    value={formData.patientName}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}
