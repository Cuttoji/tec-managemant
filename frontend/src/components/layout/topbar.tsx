'use client';

import { Menu } from 'lucide-react';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-[var(--topbar-h)] items-center gap-3 bg-[hsl(var(--sidebar-bg))] px-4 lg:hidden">
      <button
        onClick={onMenuClick}
        className="rounded-md p-1.5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
        aria-label="เปิดเมนู"
      >
        <Menu className="h-5 w-5" />
      </button>
      <span className="text-[15px] font-bold text-white">⚙️ TechManage</span>
    </header>
  );
}
