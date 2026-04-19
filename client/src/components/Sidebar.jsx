import { X, MessageSquare, Bookmark, Plus, Clock, Trash2 } from 'lucide-react';
import './Sidebar.css';

export default function Sidebar({ open, onClose, chatHistory, bookmarks, onNewSession, sessionId }) {
    if (!open) return null;

    return (
        <>
            <div className="sidebar-backdrop" onClick={onClose} />
            <aside className="sidebar glass animate-slide-left">
                <div className="sidebar-header">
                    <h2 className="sidebar-title">
                        <MessageSquare size={16} />
                        Session
                    </h2>
                    <button className="icon-btn" onClick={onClose} id="sidebar-close-btn">
                        <X size={18} />
                    </button>
                </div>

                <div className="sidebar-section-head">
                    <span>Session ID</span>
                </div>
                <div className="session-id-display">
                    {sessionId?.slice(0, 8).toUpperCase()}...
                </div>

                {/* New Session */}
                <button className="new-session-btn" onClick={onNewSession} id="new-session-btn">
                    <Plus size={15} />
                    New Research Session
                </button>

                {/* Chat History */}
                <div className="sidebar-section-head">
                    <Clock size={13} />
                    <span>Chat History ({chatHistory.length})</span>
                </div>

                <div className="sidebar-chat-history">
                    {chatHistory.length === 0 ? (
                        <p className="sidebar-empty">No messages yet.</p>
                    ) : (
                        chatHistory.slice().reverse().map(msg => (
                            <div key={msg.id} className={`history-item history-${msg.role}`}>
                                <div className="history-role">{msg.role === 'user' ? '👤 You' : '🤖 AI'}</div>
                                <div className="history-content">{msg.content.slice(0, 100)}...</div>
                                <div className="history-time">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Bookmarks */}
                <div className="sidebar-section-head">
                    <Bookmark size={13} />
                    <span>Bookmarks ({bookmarks.length})</span>
                </div>

                <div className="sidebar-bookmarks">
                    {bookmarks.length === 0 ? (
                        <p className="sidebar-empty">No bookmarks saved.</p>
                    ) : (
                        bookmarks.map(b => (
                            <a
                                key={b.id}
                                href={b.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bookmark-item"
                            >
                                <span className="bookmark-type">{b.type === 'trial' ? '🧪' : '📄'}</span>
                                <span className="bookmark-title">{b.title?.slice(0, 60)}...</span>
                            </a>
                        ))
                    )}
                </div>
            </aside>
        </>
    );
}
