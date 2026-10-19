import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
      <span className="grid h-7 w-7 place-items-center rounded-md bg-cobalt text-white" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 9l-6 7 6 7M20 9l6 7-6 7" />
        </svg>
      </span>
      CodeShare
    </Link>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="flex items-center justify-between px-6 py-4">
      <Logo />
      <nav className="flex items-center gap-3 text-sm">
        {user ? (
          <>
            <Link to="/dashboard" className="btn btn-ghost">My snippets</Link>
            <button onClick={onLogout} className="btn btn-ghost">Sign out</button>
          </>
        ) : (
          <>
            <Link to="/login" className="px-3 py-2 font-medium text-ink-soft hover:text-ink">Sign in</Link>
            <Link to="/register" className="btn btn-ghost">Create account</Link>
          </>
        )}
      </nav>
    </header>
  );
}
