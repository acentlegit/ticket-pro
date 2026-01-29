import { Link } from 'react-router-dom';

export default function MobileNav() {
  return (
    <nav className="fixed bottom-0 w-full bg-white dark:bg-slate-900 border-t flex justify-around py-3 md:hidden">
      <Link to="/customer">Customer</Link>
      <Link to="/agent">Agent</Link>
      <Link to="/admin">Admin</Link>
    </nav>
  );
}
