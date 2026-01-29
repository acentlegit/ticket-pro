import MobileNav from './MobileNav';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="p-4 bg-blue-600 text-white font-semibold">Support Portal</header>
      <main className="p-4 max-w-7xl mx-auto">{children}</main>
      <MobileNav />
    </div>
  );
}
