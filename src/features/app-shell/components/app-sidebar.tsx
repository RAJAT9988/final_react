import { Camera, Cpu, Home, Settings } from 'lucide-react';
import { NavLink } from 'react-router';

import { paths } from '@/config/paths';
import { AtomoLogo } from '@/features/app-shell/components/atomo-logo';
import { cn } from '@/utils/cn';

const navItems = [
  {
    label: 'Home',
    to: paths.app.home.getHref(),
    icon: Home,
  },
  {
    label: 'Cameras',
    to: paths.app.cameras.getHref(),
    icon: Camera,
  },
  {
    label: 'Devices',
    to: paths.app.devices.getHref(),
    icon: Cpu,
  },
  {
    label: 'Settings',
    to: paths.app.settings.getHref(),
    icon: Settings,
  },
] as const;

export const AppSidebar = () => {
  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white">
      <div className="flex h-16 shrink-0 items-center border-b border-slate-200 px-5">
        <AtomoLogo className="text-slate-900" />
      </div>

      <nav aria-label="App" className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === paths.app.home.getHref()}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )
              }
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};
