import React from 'react';
import { LayoutDashboard, Camera, Activity, AlertTriangle, Mic } from './Icons';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'live', label: 'Monitoramento Vivo', icon: Camera },
    { id: 'analytics', label: 'Análise de Saúde', icon: Activity },
    { id: 'alerts', label: 'Alertas', icon: AlertTriangle },
    { id: 'voice', label: 'Assistente AI', icon: Mic },
  ];

  return (
    <aside className="w-20 lg:w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full transition-all duration-300">
      <div className="p-6 flex items-center justify-center lg:justify-start gap-3">
        <div className="w-8 h-8 bg-green-500 rounded-lg flex-shrink-0"></div>
        <span className="text-xl font-bold text-white hidden lg:block tracking-tight">Smart<span className="text-green-400">Ranch</span></span>
      </div>
      
      <nav className="flex-1 mt-6 px-3">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onChangeView(item.id)}
                  className={`w-full flex items-center gap-4 p-3 rounded-xl transition-colors duration-200
                    ${isActive 
                      ? 'bg-green-600/10 text-green-400' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="font-medium hidden lg:block">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
           <img src="https://picsum.photos/40/40" alt="User" className="w-10 h-10 rounded-full border border-slate-700" />
           <div className="hidden lg:block">
             <p className="text-sm font-medium text-white">Admin Fazenda</p>
             <p className="text-xs text-slate-500">Online</p>
           </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;