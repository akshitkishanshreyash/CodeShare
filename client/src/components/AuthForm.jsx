import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from './Navbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthForm({ mode }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (isRegister) await register(form);
      else await login({ email: form.email, password: form.password });
      navigate(location.state?.from ?? '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-full place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <form onSubmit={submit} className="space-y-4 rounded-lg border border-line bg-panel p-6">
          <h1 className="text-2xl font-bold">{isRegister ? 'Create your account' : 'Sign in'}</h1>
          {isRegister && (
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium">Name</label>
              <input id="name" className="input" value={form.name} onChange={set('name')} required maxLength={60} autoComplete="name" />
            </div>
          )}
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">Email</label>
            <input id="email" type="email" className="input" value={form.email} onChange={set('email')} required autoComplete="email" />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium">Password</label>
            <input id="password" type="password" className="input" value={form.password} onChange={set('password')} required minLength={isRegister ? 8 : 1} autoComplete={isRegister ? 'new-password' : 'current-password'} />
            {isRegister && <p className="mt-1 text-xs text-ink-faint">At least 8 characters.</p>}
          </div>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button className="btn btn-primary w-full" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}</button>
        </form>
        <p className="mt-4 text-center text-sm text-ink-soft">
          {isRegister ? 'Already have an account? ' : 'New here? '}
          <Link className="font-medium text-cobalt" to={isRegister ? '/login' : '/register'} state={location.state}>
            {isRegister ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
      </div>
    </div>
  );
}
