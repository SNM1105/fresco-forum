import Nav from "@/components/Nav";
import Sidebar from "@/components/Sidebar";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-plaster">
      <Nav />
      <main className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        <Sidebar />
        {children}
      </main>
      <footer className="max-w-7xl mx-auto px-4 py-6 text-xs text-ink-faint flex items-center justify-between">
        <span>Screw Your Slop — student-run, ad-free.</span>
        <a href="/about" className="hover:underline">About &amp; rules</a>
      </footer>
    </div>
  );
}
