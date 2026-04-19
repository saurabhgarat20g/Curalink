import { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { submitQuery, getStatus } from './api/client';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Dashboard components
import Sidebar from './components/Sidebar';
import QueryForm from './components/QueryForm';
import ResultsPanel from './components/ResultsPanel';
import Header from './components/Header';
import WelcomeScreen from './components/WelcomeScreen';

import './App.css';

// ─── Dashboard ───────────────────────────────────────────────────────────────
function Dashboard({ theme, onToggleTheme }) {
  const [sessionId] = useState(() => {
    const stored = localStorage.getItem('caura_session_id');
    if (stored) return stored;
    const id = uuidv4();
    localStorage.setItem('caura_session_id', id);
    return id;
  });

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState({ ollama: false, database: false });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deepResearch, setDeepResearch] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentQuery, setCurrentQuery] = useState(null);
  const [bookmarks, setBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('caura_bookmarks') || '[]'); }
    catch { return []; }
  });
  const [filterYear, setFilterYear] = useState(null);
  const [sortBy, setSortBy] = useState('relevance');
  const [activeTab, setActiveTab] = useState('analysis');
  const resultsRef = useRef(null);

  useEffect(() => {
    getStatus().then(setStatus).catch(() => { });
  }, []);

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    setCurrentQuery(formData);
    setActiveTab('analysis');

    const userMsg = {
      id: uuidv4(),
      role: 'user',
      content: `${formData.disease}${formData.query ? ' — ' + formData.query : ''}`,
      timestamp: new Date()
    };
    setChatHistory(prev => [...prev, userMsg]);

    try {
      const data = await submitQuery({ ...formData, sessionId, deepResearch });
      setResults(data);

      const assistantMsg = {
        id: uuidv4(),
        role: 'assistant',
        content: data.analysis,
        timestamp: new Date(),
        stats: data.stats
      };
      setChatHistory(prev => [...prev, assistantMsg]);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Research pipeline failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = (item) => {
    setBookmarks(prev => {
      const exists = prev.some(b => b.id === item.id);
      const updated = exists
        ? prev.filter(b => b.id !== item.id)
        : [...prev, { ...item, savedAt: new Date() }];
      localStorage.setItem('caura_bookmarks', JSON.stringify(updated));
      return updated;
    });
  };

  const isBookmarked = (id) => bookmarks.some(b => b.id === id);

  const resetSession = () => {
    setChatHistory([]);
    setResults(null);
    setCurrentQuery(null);
    setError(null);
  };

  return (
    <div className="app-shell" data-theme={theme}>
      <div className="bg-glow bg-glow-1" />
      <div className="bg-glow bg-glow-2" />

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        chatHistory={chatHistory}
        bookmarks={bookmarks}
        onNewSession={resetSession}
        sessionId={sessionId}
      />

      <div className="main-layout">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          status={status}
          deepResearch={deepResearch}
          onToggleDeepResearch={() => setDeepResearch(!deepResearch)}
          theme={theme}
          onToggleTheme={onToggleTheme}
        />

        <main className="content-area">
          <div className={`hero-container ${results || loading ? 'hero-minimized' : ''}`}>
            {!results && !loading && (
              <WelcomeScreen onExampleClick={handleSubmit} />
            )}
            <div className="query-section">
              <QueryForm
                onSubmit={handleSubmit}
                loading={loading}
                deepResearch={deepResearch}
                initialData={currentQuery}
              />
            </div>
          </div>

          {error && (
            <div className="error-banner animate-fade-in">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {(loading || results) && (
            <div ref={resultsRef} className="results-section animate-fade-in">
              <ResultsPanel
                results={results}
                loading={loading}
                query={currentQuery}
                onBookmark={handleBookmark}
                isBookmarked={isBookmarked}
                filterYear={filterYear}
                setFilterYear={setFilterYear}
                sortBy={sortBy}
                setSortBy={setSortBy}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                deepResearch={deepResearch}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── Root App with Theme + Routing ───────────────────────────────────────────
function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('curalink_theme') || 'dark';
  });

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('curalink_theme', next);
      return next;
    });
  };

  return (
    <Routes>
      <Route path="/" element={<LandingPage theme={theme} onToggleTheme={toggleTheme} />} />
      <Route path="/login" element={<LoginPage theme={theme} onToggleTheme={toggleTheme} />} />
      <Route path="/register" element={<RegisterPage theme={theme} onToggleTheme={toggleTheme} />} />
      <Route path="/app" element={<Dashboard theme={theme} onToggleTheme={toggleTheme} />} />
      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
