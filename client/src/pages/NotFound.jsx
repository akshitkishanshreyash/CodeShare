import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="grid h-full place-items-center p-6 text-center">
      <div>
        <h1 className="text-4xl font-bold">Page not found</h1>
        <p className="mt-2 text-ink-soft">The page you’re looking for doesn’t exist.</p>
        <Link to="/" className="btn btn-primary mt-6">Go home</Link>
      </div>
    </div>
  );
}
