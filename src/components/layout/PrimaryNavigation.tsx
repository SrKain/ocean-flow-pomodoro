import { BarChart3, Timer, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useBreakpoint } from '@/hooks/useBreakpoint';

const destinations = [
  { label: 'Foco', href: '/', icon: Timer },
  { label: 'Análises', href: '/dashboard', icon: BarChart3 },
  { label: 'Ajustes', href: '/settings', icon: Settings },
];

export function PrimaryNavigation() {
  const { pathname } = useLocation();
  const { isBottomNav } = useBreakpoint();

  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        'fixed z-40 border-white/10 bg-slate-950/90 shadow-2xl shadow-black/30 backdrop-blur-2xl',
        isBottomNav
          ? 'inset-x-0 bottom-0 flex items-center justify-around border-t px-3 pb-[env(safe-area-inset-bottom)] pt-2'
          : 'inset-y-0 left-0 flex w-[76px] flex-col items-center gap-3 border-r px-2 pt-8'
      )}
    >
      {destinations.map(({ label, href, icon: Icon }) => {
        const active = href === '/dashboard'
          ? pathname === '/dashboard' || pathname === '/summary'
          : pathname === href;

        return (
          <Link
            key={href}
            to={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-h-12 min-w-16 items-center justify-center gap-1 rounded-2xl px-3 text-[11px] font-medium transition-colors',
              isBottomNav ? 'flex-1 flex-col' : 'w-full flex-col py-3',
              active
                ? 'bg-sky-400/15 text-sky-200'
                : 'text-slate-300/75 hover:bg-white/10 hover:text-white'
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
