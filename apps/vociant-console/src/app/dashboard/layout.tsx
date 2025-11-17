import Link from 'next/link';
import { Bot, Home, Mic, Settings, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Mic className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold">Vociant</span>
          </Link>
        </div>

        <nav className="px-4 space-y-1">
          <NavLink href="/dashboard" icon={Home}>
            Overview
          </NavLink>
          <NavLink href="/dashboard/agents" icon={Bot}>
            Agents
          </NavLink>
          <NavLink href="/dashboard/sessions" icon={BarChart3}>
            Sessions
          </NavLink>
          <NavLink href="/dashboard/playground" icon={Mic}>
            Playground
          </NavLink>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 w-64 p-4 border-t border-gray-200">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

function NavLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  // In production, use usePathname() from next/navigation
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
        'text-gray-700 hover:bg-gray-100'
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
}
