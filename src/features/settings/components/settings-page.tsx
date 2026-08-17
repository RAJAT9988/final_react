import { useState, type ReactNode } from 'react';

import { cn } from '@/utils/cn';

export type SettingsSection = {
  id: string;
  label: string;
  content: ReactNode;
};

type SettingsPageProps = {
  sections: SettingsSection[];
};

export const SettingsPage = ({ sections }: SettingsPageProps) => {
  const [tab, setTab] = useState(sections[0]?.id ?? '');
  const active = sections.find((section) => section.id === tab) ?? sections[0];

  return (
    <div className="p-6 sm:px-8">
      <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
      <nav className="mt-4 flex gap-1 border-b border-slate-200">
        {sections.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              'px-3 py-2 text-sm font-medium',
              item.id === active?.id
                ? 'border-b-2 border-slate-900 text-slate-900'
                : 'text-slate-500 hover:text-slate-800',
            )}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="mt-6 max-w-3xl">{active?.content}</div>
    </div>
  );
};
