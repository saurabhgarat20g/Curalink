import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
    BookOpen, FlaskConical, BarChart3, Users, Filter,
    ChevronDown, Clock, ExternalLink, Bookmark, BookmarkCheck,
    Star, Award, Globe, Shield
} from 'lucide-react';
import './ResultsPanel.css';

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="skeleton-card shimmer-loading">
            <div className="skel-line skel-title" />
            <div className="skel-line skel-subtitle" />
            <div className="skel-line skel-body" />
            <div className="skel-line skel-body short" />
        </div>
    );
}

// ─── Publication Card ─────────────────────────────────────────────────────────
function PublicationCard({ pub, onBookmark, bookmarked, index }) {
    const [expanded, setExpanded] = useState(false);

    const scoreColor = pub.relevanceScore >= 70 ? 'score-high' :
        pub.relevanceScore >= 40 ? 'score-mid' : 'score-low';

    return (
        <div className="result-card pub-card animate-fade-in" style={{ animationDelay: `${index * 60}ms` }}>
            <div className="card-header">
                <div className="card-number">[{index + 1}]</div>
                <div className="card-meta-badges">
                    {pub.isOpenAccess && (
                        <span className="badge badge-oa"><Globe size={10} /> Open Access</span>
                    )}
                    <span className={`badge badge-source source-${pub.source.toLowerCase().replace('.', '')}`}>
                        {pub.source}
                    </span>
                    {pub.year && <span className="badge badge-year">{pub.year}</span>}
                </div>
                <div className="card-actions">
                    <div className={`relevance-score ${scoreColor}`}>
                        <BarChart3 size={11} />
                        {pub.relevanceScore}%
                    </div>
                    <button
                        className={`bookmark-btn ${bookmarked ? 'bookmarked' : ''}`}
                        onClick={() => onBookmark({ id: pub.id, type: 'publication', title: pub.title, url: pub.url })}
                        title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
                    >
                        {bookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                    </button>
                </div>
            </div>

            <h3 className="card-title">{pub.title}</h3>

            <div className="card-authors">
                <Users size={12} />
                {pub.authors?.slice(0, 4).join(', ')}
                {pub.authors?.length > 4 && <span className="et-al">, et al.</span>}
            </div>

            <div className="card-journal">
                <BookOpen size={11} />
                <em>{pub.journal}</em>
                {pub.citedBy > 0 && (
                    <span className="citation-count">
                        <Star size={10} /> {pub.citedBy.toLocaleString()} citations
                    </span>
                )}
            </div>

            {pub.abstract && (
                <div className="card-abstract">
                    <p className={expanded ? '' : 'truncated'}>
                        {pub.abstract}
                    </p>
                    {pub.abstract.length > 280 && (
                        <button className="expand-btn" onClick={() => setExpanded(!expanded)}>
                            {expanded ? '▲ Less' : '▼ Read more'}
                        </button>
                    )}
                </div>
            )}

            {pub.concepts?.length > 0 && (
                <div className="concept-tags">
                    {pub.concepts.slice(0, 4).map(c => (
                        <span key={c} className="concept-tag">{c}</span>
                    ))}
                </div>
            )}

            <a className="card-link" href={pub.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={13} />
                View Publication
            </a>
        </div>
    );
}

// ─── Trial Card ───────────────────────────────────────────────────────────────
function TrialCard({ trial, onBookmark, bookmarked, index }) {
    const [expanded, setExpanded] = useState(false);

    const statusConfig = {
        RECRUITING: { color: 'status-recruiting', label: 'Recruiting', icon: '🟢' },
        COMPLETED: { color: 'status-completed', label: 'Completed', icon: '✅' },
        ACTIVE_NOT_RECRUITING: { color: 'status-active', label: 'Active', icon: '🔵' },
        ENROLLING_BY_INVITATION: { color: 'status-inv', label: 'By Invitation', icon: '📩' }
    };

    const sc = statusConfig[trial.status] || { color: 'status-other', label: trial.status, icon: '⚪' };
    const scoreColor = trial.relevanceScore >= 60 ? 'score-high' :
        trial.relevanceScore >= 30 ? 'score-mid' : 'score-low';

    return (
        <div className="result-card trial-card animate-fade-in" style={{ animationDelay: `${index * 60}ms` }}>
            <div className="card-header">
                <div className="trial-number">[T{index + 1}]</div>
                <div className="card-meta-badges">
                    <span className={`badge trial-status ${sc.color}`}>{sc.icon} {sc.label}</span>
                    {trial.phase && trial.phase !== 'Not Specified' && (
                        <span className="badge badge-phase">Phase {trial.phase.replace('PHASE', '').replace('_', ' ').trim()}</span>
                    )}
                    <span className="badge badge-source source-clinicaltrials">ClinicalTrials</span>
                </div>
                <div className="card-actions">
                    <div className={`relevance-score ${scoreColor}`}>
                        <BarChart3 size={11} />
                        {trial.relevanceScore}%
                    </div>
                    <button
                        className={`bookmark-btn ${bookmarked ? 'bookmarked' : ''}`}
                        onClick={() => onBookmark({ id: trial.id, type: 'trial', title: trial.title, url: trial.url })}
                    >
                        {bookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                    </button>
                </div>
            </div>

            <h3 className="card-title">{trial.title}</h3>

            {trial.nctId && (
                <div className="nct-id">
                    <Shield size={11} />
                    {trial.nctId}
                </div>
            )}

            <div className="trial-meta-grid">
                {trial.enrollment > 0 && (
                    <div className="trial-meta-item">
                        <Users size={12} />
                        <span>{trial.enrollment.toLocaleString()} participants</span>
                    </div>
                )}
                {trial.sponsor && (
                    <div className="trial-meta-item">
                        <Award size={12} />
                        <span className="truncate-text">{trial.sponsor}</span>
                    </div>
                )}
                {trial.startDate && (
                    <div className="trial-meta-item">
                        <Clock size={12} />
                        <span>{trial.startDate} → {trial.completionDate || 'Ongoing'}</span>
                    </div>
                )}
            </div>

            {trial.interventions?.length > 0 && (
                <div className="trial-interventions">
                    <span className="section-mini-label">Interventions:</span>
                    {trial.interventions.slice(0, 3).map((iv, i) => (
                        <span key={i} className="intervention-tag">{iv}</span>
                    ))}
                </div>
            )}

            {trial.description && (
                <div className="card-abstract">
                    <p className={expanded ? '' : 'truncated'}>{trial.description}</p>
                    {trial.description.length > 200 && (
                        <button className="expand-btn" onClick={() => setExpanded(!expanded)}>
                            {expanded ? '▲ Less' : '▼ More details'}
                        </button>
                    )}
                </div>
            )}

            {trial.locations?.length > 0 && (
                <div className="trial-locations">
                    <Globe size={11} />
                    {trial.locations.slice(0, 3).join(' · ')}
                </div>
            )}

            <a className="card-link trial-link" href={trial.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={13} />
                View on ClinicalTrials.gov
            </a>
        </div>
    );
}

// ─── Authors Panel ────────────────────────────────────────────────────────────
function AuthorsPanel({ authors }) {
    if (!authors?.length) return null;
    return (
        <div className="authors-panel">
            <h3 className="section-subtitle"><Award size={14} /> Top Researchers</h3>
            <div className="authors-grid">
                {authors.map((a, i) => (
                    <div key={a.name} className="author-item animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                        <div className="author-rank">#{i + 1}</div>
                        <div className="author-info">
                            <span className="author-name">{a.name}</span>
                            <span className="author-pubs">{a.publications} publication{a.publications !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="author-bar">
                            <div className="author-bar-fill" style={{ width: `${Math.min(a.publications * 20, 100)}%` }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────
function StatsBar({ stats, query }) {
    if (!stats) return null;
    return (
        <div className="stats-bar animate-fade-in">
            <div className="stat-item">
                <span className="stat-value">{stats.totalRetrieved?.toLocaleString() || 0}</span>
                <span className="stat-label">Total Retrieved</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
                <span className="stat-value">{stats.publicationsShown || 0}</span>
                <span className="stat-label">Top Publications</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
                <span className="stat-value">{stats.trialsShown || 0}</span>
                <span className="stat-label">Clinical Trials</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
                <span className="stat-value">{((stats.processingTimeMs || 0) / 1000).toFixed(1)}s</span>
                <span className="stat-label">Query Time</span>
            </div>
        </div>
    );
}

// ─── Main Results Panel ───────────────────────────────────────────────────────
export default function ResultsPanel({
    results, loading, onBookmark, isBookmarked,
    filterYear, setFilterYear, sortBy, setSortBy,
    activeTab, setActiveTab
}) {
    const tabs = [
        { id: 'analysis', label: 'AI Analysis', icon: <BarChart3 size={14} /> },
        { id: 'publications', label: `Publications ${results ? `(${results.publications?.length || 0})` : ''}`, icon: <BookOpen size={14} /> },
        { id: 'trials', label: `Trials ${results ? `(${results.trials?.length || 0})` : ''}`, icon: <FlaskConical size={14} /> },
        { id: 'authors', label: 'Top Authors', icon: <Users size={14} /> }
    ];

    // Filter & sort publications
    const filteredPubs = (results?.publications || [])
        .filter(p => !filterYear || p.year >= filterYear)
        .sort((a, b) => {
            if (sortBy === 'relevance') return (b.relevanceScore || 0) - (a.relevanceScore || 0);
            if (sortBy === 'year') return (b.year || 0) - (a.year || 0);
            if (sortBy === 'citations') return (b.citedBy || 0) - (a.citedBy || 0);
            return 0;
        });

    const years = [...new Set((results?.publications || []).map(p => p.year).filter(Boolean))].sort((a, b) => b - a);

    return (
        <div className="results-panel">
            {/* Stats Bar */}
            {results && <StatsBar stats={results.stats} query={results.query} />}

            {/* Query display */}
            {results?.query && (
                <div className="query-display animate-fade-in">
                    <span className="query-label">Query:</span>
                    <span className="query-value">{results.query}</span>
                    {results.llmSource && (
                        <span className={`llm-badge ${results.llmSource === 'ollama' ? 'llm-ollama' : 'llm-template'}`}>
                            {results.llmSource === 'ollama' ? '🤖 Mistral AI' : '📝 Template Engine'}
                        </span>
                    )}
                </div>
            )}

            {/* Tabs */}
            <div className="results-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        id={`tab-${tab.id}`}
                        className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.icon}
                        {tab.label}
                        {activeTab === tab.id && <div className="tab-indicator" />}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="tab-content">

                {/* ── Analysis Tab ── */}
                {activeTab === 'analysis' && (
                    <div className="analysis-section">
                        {loading ? (
                            <div className="loading-analysis">
                                <div className="typing-indicator">
                                    <div className="typing-dot" style={{ animationDelay: '0ms' }} />
                                    <div className="typing-dot" style={{ animationDelay: '160ms' }} />
                                    <div className="typing-dot" style={{ animationDelay: '320ms' }} />
                                </div>
                                <span>AI is analyzing research data...</span>
                            </div>
                        ) : results?.analysis ? (
                            <div className="analysis-card animate-fade-scale glass">
                                <div className="markdown-body">
                                    <ReactMarkdown>{results.analysis}</ReactMarkdown>
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}

                {/* ── Publications Tab ── */}
                {activeTab === 'publications' && (
                    <div className="publications-section">
                        {/* Filters */}
                        <div className="filter-bar">
                            <div className="filter-group">
                                <Filter size={13} />
                                <select
                                    id="sort-select"
                                    className="filter-select"
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value)}
                                >
                                    <option value="relevance">Sort: Relevance</option>
                                    <option value="year">Sort: Year (Newest)</option>
                                    <option value="citations">Sort: Citations</option>
                                </select>
                            </div>
                            <div className="filter-group">
                                <Clock size={13} />
                                <select
                                    id="year-filter"
                                    className="filter-select"
                                    value={filterYear || ''}
                                    onChange={e => setFilterYear(e.target.value ? parseInt(e.target.value) : null)}
                                >
                                    <option value="">All Years</option>
                                    <option value={new Date().getFullYear() - 1}>Last 2 years</option>
                                    <option value={new Date().getFullYear() - 3}>Last 4 years</option>
                                    <option value={new Date().getFullYear() - 5}>Last 6 years</option>
                                    <option value={new Date().getFullYear() - 10}>Last 11 years</option>
                                </select>
                            </div>
                            <span className="filter-count">{filteredPubs.length} papers</span>
                        </div>

                        {loading ? (
                            <div className="skeleton-grid">
                                {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
                            </div>
                        ) : filteredPubs.length > 0 ? (
                            <div className="cards-grid">
                                {filteredPubs.map((pub, i) => (
                                    <PublicationCard
                                        key={pub.id}
                                        pub={pub}
                                        index={i}
                                        onBookmark={onBookmark}
                                        bookmarked={isBookmarked(pub.id)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">No publications match the current filters.</div>
                        )}
                    </div>
                )}

                {/* ── Trials Tab ── */}
                {activeTab === 'trials' && (
                    <div className="trials-section">
                        {loading ? (
                            <div className="skeleton-grid">
                                {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
                            </div>
                        ) : results?.trials?.length > 0 ? (
                            <div className="cards-grid">
                                {results.trials.map((trial, i) => (
                                    <TrialCard
                                        key={trial.id}
                                        trial={trial}
                                        index={i}
                                        onBookmark={onBookmark}
                                        bookmarked={isBookmarked(trial.id)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                No clinical trials found for this query.
                                <br />
                                <small>Try broadening the disease name or removing the location filter.</small>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Authors Tab ── */}
                {activeTab === 'authors' && (
                    <div className="authors-section">
                        {loading ? (
                            <div className="skeleton-grid">
                                {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                            </div>
                        ) : (
                            <AuthorsPanel authors={results?.topAuthors} />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
