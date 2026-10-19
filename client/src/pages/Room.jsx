import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CodeEditor from '../components/CodeEditor.jsx';
import Toolbar from '../components/Toolbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCollabRoom } from '../hooks/useCollabRoom.js';
import { roomsApi } from '../api/rooms.api.js';
import { colorFor, getGuestIdentity } from '../lib/identity.js';

const VALID_ID = /^[a-zA-Z0-9_-]{4,40}$/;

function RoomView({ roomId }) {
  const { user } = useAuth();
  const identity = useMemo(
    () => (user ? { name: user.name, color: colorFor(user.name) } : getGuestIdentity()),
    [user]
  );
  const { collab, status, language, setLanguage, title, setTitle, presence, error } = useCollabRoom(roomId, identity);
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    if (status !== 'connected') return;
    roomsApi.get(roomId).then((d) => setMeta(d.room)).catch(() => {});
  }, [roomId, status, user]);

  const claim = async () => {
    try { await roomsApi.claim(roomId); setMeta((m) => ({ ...m, claimed: true, isOwner: true })); } catch { /* already owned */ }
  };
  const rename = async (t) => {
    try { await roomsApi.rename(roomId, t); setTitle(t); } catch { /* not owner */ }
  };

  if (error) {
    return (
      <div className="grid h-full place-items-center p-6 text-center">
        <div>
          <h1 className="text-2xl font-bold">This room couldn’t be opened</h1>
          <p className="mt-2 text-ink-soft">Check the link, or start a new session.</p>
          <Link to="/" className="btn btn-primary mt-5">Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <Toolbar
        roomId={roomId}
        status={status}
        presence={presence}
        language={language}
        onLanguage={setLanguage}
        title={title}
        user={user}
        canRename={Boolean(meta?.isOwner)}
        onRename={rename}
        canClaim={Boolean(user && meta && !meta.claimed)}
        onClaim={claim}
      />
      <div className="min-h-0 flex-1 bg-panel">
        {collab && <CodeEditor doc={collab.doc} awareness={collab.awareness} language={language} />}
      </div>
    </div>
  );
}

export default function Room() {
  const { roomId } = useParams();
  if (!VALID_ID.test(roomId)) {
    return (
      <div className="grid h-full place-items-center p-6 text-center">
        <div>
          <h1 className="text-2xl font-bold">That isn’t a valid room link</h1>
          <p className="mt-2 text-ink-soft">Room codes use 4–40 letters, numbers, dashes or underscores.</p>
          <Link to="/" className="btn btn-primary mt-5">Back to home</Link>
        </div>
      </div>
    );
  }
  return <RoomView key={roomId} roomId={roomId} />;
}
