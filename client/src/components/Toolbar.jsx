import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from './Navbar.jsx';

const STATUS = {
  connected: { label: 'Live', dot: 'bg-moss' },
  connecting: { label: 'Connecting…', dot: 'bg-signal' },
  disconnected: { label: 'Offline — changes will sync when you reconnect', dot: 'bg-signal' },
  error: { label: 'Could not join this room', dot: 'bg-red-600' },
};

export default function Toolbar({ roomId, status, presence, title, canRename, onRename, canClaim, onClaim, user }) {
  const [copied, setCopied] = useState(false);
  const [draft, setDraft] = useState(null);
  const s = STATUS[status] ?? STATUS.connecting;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked */ }
  };

  const commitTitle = () => {
    if (draft !== null && draft.trim() && draft.trim() !== title) onRename(draft.trim());
    setDraft(null);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-line bg-panel px-4 py-2">
      <Logo />
      <div className="mx-2 h-5 w-px bg-line" />

      {canRename ? (
        <input
          aria-label="Snippet title"
          className="w-44 rounded border border-transparent px-2 py-1 text-sm font-medium hover:border-line"
          value={draft ?? title}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          maxLength={80}
        />
      ) : (
        <span className="px-2 text-sm font-medium text-ink-soft">{title}</span>
      )}

      <div className="flex items-center gap-2 text-sm text-ink-soft" role="status">
        <span className={`h-2 w-2 rounded-full ${s.dot}`} aria-hidden="true" />
        <span>{s.label}</span>
        {status === 'connected' && <span>· {presence} {presence === 1 ? 'person' : 'people'} here</span>}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {canClaim && <button className="btn btn-ghost" onClick={onClaim}>Save to my snippets</button>}
        {!user && <Link to="/login" state={{ from: `/r/${roomId}` }} className="text-sm text-ink-soft hover:text-ink">Sign in to save</Link>}
        <button className="btn btn-primary" onClick={copy}>{copied ? 'Link copied' : 'Copy invite link'}</button>
      </div>
    </div>
  );
}
