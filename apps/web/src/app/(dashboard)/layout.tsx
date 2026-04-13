import Link from 'next/link';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/approval', label: 'Approval Queue' },
  { href: '/ideas', label: 'Ideas' },
  { href: '/scripts', label: 'Scripts' },
  { href: '/videos', label: 'Videos' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/learning', label: 'Learning Loop' },
  { href: '/characters', label: 'Characters' },
  { href: '/settings', label: 'Instruções' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <div className="text-lg font-bold text-white tracking-tight">CG 160</div>
          <div className="text-xs text-gray-500 mt-0.5">Content Engine</div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-md text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-800">
          <div className="text-xs text-gray-600">v0.1.0</div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-gray-950">
        {children}
      </main>
    </div>
  );
}
