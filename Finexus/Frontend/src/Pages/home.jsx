import React, { useState, useRef, useEffect } from 'react';
import { sendMessage as sendChatMessage, createChatAbortController } from '../services/chatService';
import './home.css';

/* ── ICONS ── */
const FinexusLogo = () => (
  <svg width="26" height="26" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="28" height="28" rx="7" fill="#6366F1"/>
    <path d="M7 9h14M7 14h9M7 19h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="21" cy="14" r="3" fill="white" fillOpacity="0.3" stroke="white" strokeWidth="1.5"/>
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

/* ── SUGGESTION PILLS ── */
const SUGGESTIONS = [
  'Add expense ₹500 for food',
  'Show my weekly summary',
  'What\'s my biggest expense this month?',
  'Set budget ₹10,000 for groceries',
];

/* ── CHAT HISTORY PLACEHOLDERS ── */
const HISTORY = [
  { id: 1, label: 'Monthly budget review', active: true },
  { id: 2, label: 'Food expenses this week', active: false },
  { id: 3, label: 'Investment suggestions', active: false },
  { id: 4, label: 'Rent & utilities log', active: false },
];

/* ── INITIAL MESSAGES ── */
const INITIAL_MESSAGES = [
  {
    id: 1,
    role: 'ai',
    text: 'Hello! I\'m Finexus, your AI financial assistant. I can help you track expenses, analyze spending patterns, and give personalized financial insights. What would you like to do today?',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
];

/* ── MARKDOWN-LITE RENDERER ── */
const renderText = (text) => {
  // Convert standard markdown bullets to nice text
  // e.g. "* Item" or "- Item" 
  let formatted = text.replace(/^(\*|-)\s(.*)/gm, '• $2');
  
  const parts = formatted.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={`bold-${i}`}>{part}</strong> : part.split('\n').flatMap((line, li, arr) =>
      li < arr.length - 1 ? [line, <br key={`br-${i}-${li}`}/>] : [line]
    )
  );
};

/* ── Helper: build a timestamped message object ── */
const makeMsg = (role, text, id = Date.now()) => ({
  id,
  role,
  text,
  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
});

/* ============================================================
   HOME COMPONENT
   ============================================================ */
const Home = () => {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeHistory, setActiveHistory] = useState(1);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null); // tracks in‑flight request

  // Auto‑scroll on new messages / loading change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Abort any in‑flight request when the component unmounts
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  /* ── Send handler ─────────────────────────── */
  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    // Abort previous request if still in flight (prevents stale replies)
    abortRef.current?.abort();
    const controller = createChatAbortController();
    abortRef.current = controller;

    // 1. Immediately show the user message
    setMessages(prev => [...prev, makeMsg('user', trimmed)]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      // 2. Call the API via the service layer
      const result = await sendChatMessage(trimmed, controller.signal);

      // 3. Show the AI reply
      setMessages(prev => [...prev, makeMsg('ai', result.text, Date.now() + 1)]);
    } catch (err) {
      // Silent cancellation (component unmounted or superseded request)
      if (err.userMessage === null && !err.aiReply) return;

      // Backend returned a friendly AI reply inside an error response (e.g. 400)
      if (err.aiReply) {
        setMessages(prev => [...prev, makeMsg('ai', err.aiReply, Date.now() + 1)]);
      } else {
        // Genuine error → show error bar
        setError(err.userMessage || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
      if (abortRef.current === controller) abortRef.current = null;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-root">
      {/* ── SIDEBAR ── */}
      <aside className={`chat-sidebar ${sidebarOpen ? 'chat-sidebar--open' : 'chat-sidebar--collapsed'}`}>
        {/* Sidebar header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <FinexusLogo />
            {sidebarOpen && <span className="sidebar-wordmark">Finexus</span>}
          </div>
          <button
            id="sidebar-toggle-btn"
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(o => !o)}
            aria-label="Toggle sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* New Chat */}
        {sidebarOpen && (
          <button id="new-chat-btn" className="sidebar-new-chat">
            <PlusIcon /> New Chat
          </button>
        )}

        {/* History */}
        {sidebarOpen && (
          <div className="sidebar-section">
            <span className="sidebar-section__label">Recent</span>
            <ul className="sidebar-history">
              {HISTORY.map(h => (
                <li
                  key={h.id}
                  className={`sidebar-history__item ${activeHistory === h.id ? 'sidebar-history__item--active' : ''}`}
                  onClick={() => setActiveHistory(h.id)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
                  <span>{h.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* User area */}
        {sidebarOpen && (
          <div className="sidebar-user">
            <div className="sidebar-user__avatar">U</div>
            <div className="sidebar-user__info">
              <span className="sidebar-user__name">My Account</span>
              <span className="sidebar-user__role">Free Plan</span>
            </div>
          </div>
        )}
      </aside>

      {/* ── MAIN PANEL ── */}
      <main className="chat-main">
        {/* Top bar */}
        <header className="chat-topbar">
          <div className="chat-topbar__left">
            <h2 className="chat-topbar__title">Financial Assistant</h2>
            <div className="chat-topbar__status">
              <span className="status-dot" />
              Online
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="chat-messages" role="log" aria-live="polite">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`chat-msg-row ${msg.role === 'user' ? 'chat-msg-row--user' : 'chat-msg-row--ai'}`}
            >
              {msg.role === 'ai' && (
                <div className="chat-msg__avatar chat-msg__avatar--ai">F</div>
              )}
              <div className="chat-msg__content">
                <div className={`chat-msg__bubble ${msg.role === 'user' ? 'chat-msg__bubble--user' : 'chat-msg__bubble--ai'}`}>
                  {renderText(msg.text)}
                </div>
                <span className="chat-msg__time">{msg.time}</span>
              </div>
              {msg.role === 'user' && (
                <div className="chat-msg__avatar chat-msg__avatar--user">U</div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="chat-msg-row chat-msg-row--ai">
              <div className="chat-msg__avatar chat-msg__avatar--ai">F</div>
              <div className="chat-msg__content">
                <div className="chat-msg__bubble chat-msg__bubble--ai chat-msg__bubble--typing">
                  <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="chat-error" role="alert">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              {error}
              <button onClick={() => setError('')}>Dismiss</button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── INPUT AREA ── */}
        <div className="chat-input-area">
          {/* Suggestions */}
          <div className="chat-suggestions" role="list">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                id={`suggestion-${i}`}
                className="chat-suggestion-pill"
                role="listitem"
                onClick={() => sendMessage(s)}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input bar */}
          <div className="chat-input-bar">
            <input
              id="chat-input"
              ref={inputRef}
              className="chat-input"
              type="text"
              placeholder="Ask Finexus anything… e.g. Add expense ₹500 for food"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              autoComplete="off"
            />
            <button
              id="chat-send-btn"
              className="chat-send-btn"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          </div>
          <p className="chat-input-hint">Press Enter to send · Shift+Enter for new line</p>
        </div>
      </main>
    </div>
  );
};

export default Home;