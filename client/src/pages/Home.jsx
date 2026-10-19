import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { roomsApi } from '../api/rooms.api.js';

// Static preview of two people editing the same line.
function LivePreview() {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-panel shadow-sm" aria-hidden="true">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2 text-xs text-ink-faint">
        <span className="h-2 w-2 rounded-full bg-moss" /> 2 people here
      </div>
      <pre className="px-5 py-4 font-mono text-[13px] leading-7 text-ink">
{`function findPair(nums, target) {
  const seen = new Map();
  for (const n of nums) {
    const need = target - n;
    if (seen.has(need)) return [need, n];`}
        <span className="relative">
          <span className="absolute -top-6 left-0 rounded bg-signal px-1.5 text-[11px] font-medium text-white font-sans">Asha</span>
          <span className="border-l-2 border-signal" />
        </span>
{`
    seen.set(n, true);
  }`}
        <span className="relative">
          <span className="absolute -top-6 left-0 rounded bg-cobalt px-1.5 text-[11px] font-medium text-white font-sans">Dev</span>
          <span className="border-l-2 border-cobalt" />
        </span>
{`
  return null;
}`}
      </pre>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');

  const start = async () => {
    setBusy(true);
    setError('');
    try {
      const { room } = await roomsApi.create();
      navigate(`/r/${room.roomId}`);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  const join = (e) => {
    e.preventDefault();
    const id = code.trim().split('/').pop(); // accepts a full link or just the code
    if (/^[a-zA-Z0-9_-]{4,40}$/.test(id)) navigate(`/r/${id}`);
    else setError('Enter a room link or a code with 4–40 letters or numbers.');
  };

  return (
    <div className="min-h-full">
      <Navbar />
      <main className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-10 lg:grid-cols-[1.05fr_1fr]">
        <section>
          <h1 className="text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">Write code together, in the same file.</h1>
          <p className="mt-5 max-w-md text-lg text-ink-soft">
            Open a session, send the link, and edit at the same time. No sign-up needed.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button className="btn btn-primary px-5 py-3 text-base" onClick={start} disabled={busy}>
              {busy ? 'Opening…' : 'Start a session'}
            </button>
            <form onSubmit={join} className="flex gap-2">
              <input className="input w-56" placeholder="Paste a room link or code" value={code} onChange={(e) => setCode(e.target.value)} aria-label="Room link or code" />
              <button className="btn btn-ghost" type="submit">Join</button>
            </form>
          </div>
          {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}

          <ul className="mt-12 grid max-w-xl gap-4 text-sm text-ink-soft sm:grid-cols-3">
            <li><strong className="block text-ink">Pair programming</strong>See each other’s cursors as you type.</li>
            <li><strong className="block text-ink">Interviews</strong>Watch a candidate solve a problem live.</li>
            <li><strong className="block text-ink">Teaching</strong>Share an example students can edit.</li>
          </ul>
        </section>
        <LivePreview />
      </main>
    </div>
  );
}
