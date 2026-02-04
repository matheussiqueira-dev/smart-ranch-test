import React from 'react';
import { Activity, AlertTriangle, Camera, ClipboardList, LayoutDashboard, Mic } from './Icons';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
  alertCount: number;
  taskCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, alertCount, taskCount }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'live', label: 'Monitoramento', icon: Camera },
    { id: 'analytics', label: 'Insights', icon: Activity },
    { id: 'alerts', label: 'Alertas', icon: AlertTriangle, badge: alertCount },
    { id: 'operations', label: 'Operações', icon: ClipboardList, badge: taskCount },
    { id: 'voice', label: 'Voz', icon: Mic },
  ];

  return (
    <aside className="flex h-screen w-20 flex-col border-r border-white/5 bg-black/40 px-3 py-6 backdrop-blur-xl transition-all duration-300 lg:w-72">
      <div className="flex items-center justify-center gap-3 lg:justify-start">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white">
          SR
        </div>
        <div className="hidden lg:block">
          <p className="text-[10px] uppercase tracking-[0.4em] text-[color:var(--muted)]">Smart</p>
          <p className="font-display text-lg text-white">Ranch Ops</p>
        </div>
      </div>

      <nav className="mt-10 flex-1">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => onChangeView(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`group flex w-full items-center justify-between rounded-2xl px-3 py-3 transition ${
                    isActive
                      ? 'border border-white/20 bg-white/10 text-white shadow-[0_0_30px_rgba(122,211,166,0.2)]'
                      : 'text-[color:var(--muted)] hover:border hover:border-white/10 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    <span className="hidden text-sm lg:block">{item.label}</span>
                  </span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="hidden rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[10px] text-white lg:inline-flex">
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-6 space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]">Status</p>
          <p className="mt-2 text-sm text-white">Operação estável</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-[color:var(--muted)]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>
            IA + campo sincronizados
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
          <img
            src="https://picsum.photos/seed/ranch-admin/80/80"
            alt="Usuária administradora"
            className="h-10 w-10 rounded-full border border-white/10"
          />
          <div className="hidden lg:block">
            <p className="text-sm text-white">Admin Fazenda</p>
            <p className="text-xs text-[color:var(--muted)]">Operação ativa</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
