import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { roomsApi } from '../api/rooms.api.js';
import { languageLabel } from '../lib/languages.js';

export default function Dashboard() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    roomsApi.mine().then((d) => setRooms(d.rooms)).catch((e) => setError(e.message));
  }, []);

  const create = async () => {
    try { navigate(`/r/${(await roomsApi.create()).room.roomId}`); } catch (e) { setError(e.message); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this snippet for everyone with the link?')) return;
    try {
      await roomsApi.remove(id);
      setRooms((r) => r.filter((x) => x.roomId !== id));
    } catch (e) { setError(e.message); }
  };

  return (
    <div className="min-h-full">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 pb-16 pt-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">My snippets</h1>
          <button className="btn btn-primary" onClick={create}>New session</button>
        </div>
        {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
        {rooms === null && !error && <p className="mt-8 text-ink-soft">Loading…</p>}
        {rooms?.length === 0 && (
          <p className="mt-8 rounded-lg border border-dashed border-line p-8 text-center text-ink-soft">
            Nothing saved yet. Start a session and select “Save to my snippets”.
          </p>
        )}
        <ul className="mt-6 divide-y divide-line rounded-lg border border-line bg-panel">
          {rooms?.map((r) => (
            <li key={r.roomId} className="flex items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <Link to={`/r/${r.roomId}`} className="font-medium hover:text-cobalt">{r.title}</Link>
                <p className="truncate font-mono text-xs text-ink-faint">{r.snippet || 'Empty'}</p>
              </div>
              <span className="text-xs text-ink-soft">{languageLabel(r.language)}</span>
              <span className="hidden text-xs text-ink-faint sm:inline">{new Date(r.updatedAt).toLocaleDateString()}</span>
              <button className="text-sm text-red-700 hover:underline" onClick={() => remove(r.roomId)}>Delete</button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
