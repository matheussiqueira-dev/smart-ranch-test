import React, { useCallback, useMemo, useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import LiveMonitor from './components/LiveMonitor';
import Analytics from './components/Analytics';
import Alerts from './components/Alerts';
import VoiceAgent from './components/VoiceAgent';
import Operations from './components/Operations';
import { Badge } from './components/ui';
import { CAMERAS, INITIAL_ALERTS, INITIAL_TASKS, PLAYBOOKS, TEAM_MEMBERS } from './data';
import { Alert, FieldTask, TaskPriority, TaskStatus } from './types';

const VIEW_CONFIG = {
  dashboard: {
    title: 'Panorama Operacional',
    subtitle: 'Visão integrada da saúde, segurança e produtividade do rebanho.',
  },
  live: {
    title: 'Monitoramento Vivo',
    subtitle: 'Acompanhe câmeras e gere diagnósticos em tempo real.',
  },
  analytics: {
    title: 'Inteligência de Rebanho',
    subtitle: 'Tendências, correlações e insights avançados por período.',
  },
  alerts: {
    title: 'Central de Alertas',
    subtitle: 'Incidentes priorizados e fluxo de resposta operacional.',
  },
  operations: {
    title: 'Sala de Operações',
    subtitle: 'Missões, playbooks e cobertura de equipe em campo.',
  },
  voice: {
    title: 'Assistente de Voz',
    subtitle: 'Suporte de áudio em tempo real com relay seguro.',
  },
} as const;

type ViewKey = keyof typeof VIEW_CONFIG;

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const priorityFromSeverity = (severity: Alert['severity']): TaskPriority => {
  if (severity === 'critical') return 'high';
  if (severity === 'warning') return 'medium';
  return 'low';
};

const dueFromSeverity = (severity: Alert['severity']) => {
  const base = Date.now();
  if (severity === 'critical') return new Date(base + 1000 * 60 * 60).toISOString();
  if (severity === 'warning') return new Date(base + 1000 * 60 * 60 * 4).toISOString();
  return new Date(base + 1000 * 60 * 60 * 24).toISOString();
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewKey>('dashboard');
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [tasks, setTasks] = useState<FieldTask[]>(INITIAL_TASKS);

  const activeAlerts = useMemo(() => alerts.filter((alert) => alert.status === 'active'), [alerts]);
  const criticalAlerts = useMemo(
    () => activeAlerts.filter((alert) => alert.severity === 'critical').length,
    [activeAlerts]
  );
  const openTasks = useMemo(() => tasks.filter((task) => task.status !== 'done').length, [tasks]);
  const camerasOnline = useMemo(() => CAMERAS.filter((cam) => cam.status === 'active').length, []);

  const handleResolveAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.map((alert) => (alert.id === id ? { ...alert, status: 'resolved' } : alert)));
  }, []);

  const handleCreateTaskFromAlert = useCallback(
    (alertId: string) => {
      const alert = alerts.find((item) => item.id === alertId);
      if (!alert) return;

      setTasks((prev) => {
        if (prev.some((task) => task.sourceAlertId === alert.id)) return prev;

        const newTask: FieldTask = {
          id: createId(),
          title: alert.title,
          owner: 'Equipe de Campo',
          priority: priorityFromSeverity(alert.severity),
          status: 'backlog',
          dueAt: dueFromSeverity(alert.severity),
          location: alert.location,
          notes: alert.description,
          sourceAlertId: alert.id,
        };

        return [newTask, ...prev];
      });
    },
    [alerts]
  );

  const handleUpdateTaskStatus = useCallback((id: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, status } : task)));
  }, []);

  const handleCreateTask = useCallback((draft: Omit<FieldTask, 'id' | 'status'>) => {
    setTasks((prev) => [{ ...draft, id: createId(), status: 'backlog' }, ...prev]);
  }, []);

  const viewContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            alerts={alerts}
            tasks={tasks}
            camerasOnline={camerasOnline}
            playbooksReady={PLAYBOOKS.length}
            team={TEAM_MEMBERS}
          />
        );
      case 'live':
        return <LiveMonitor />;
      case 'analytics':
        return <Analytics />;
      case 'alerts':
        return (
          <Alerts
            alerts={alerts}
            onResolve={handleResolveAlert}
            onCreateTask={handleCreateTaskFromAlert}
          />
        );
      case 'operations':
        return (
          <Operations
            tasks={tasks}
            playbooks={PLAYBOOKS}
            team={TEAM_MEMBERS}
            onCreateTask={handleCreateTask}
            onUpdateTaskStatus={handleUpdateTaskStatus}
          />
        );
      case 'voice':
        return <VoiceAgent />;
      default:
        return (
          <Dashboard
            alerts={alerts}
            tasks={tasks}
            camerasOnline={camerasOnline}
            playbooksReady={PLAYBOOKS.length}
            team={TEAM_MEMBERS}
          />
        );
    }
  };

  const header = VIEW_CONFIG[currentView];

  return (
    <div className="relative min-h-screen bg-[color:var(--bg)] text-[color:var(--ink)]">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-25"></div>

      <div className="relative flex min-h-screen">
        <Sidebar
          currentView={currentView}
          onChangeView={setCurrentView}
          alertCount={activeAlerts.length}
          taskCount={openTasks}
        />

        <main className="flex-1 overflow-y-auto">
          <header className="sticky top-0 z-20 border-b border-white/5 bg-black/40 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--muted)]">Smart Ranch</p>
                <h1 className="font-display text-3xl text-white">{header.title}</h1>
                <p className="mt-2 text-sm text-[color:var(--muted)]">{header.subtitle}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="danger">Alertas: {activeAlerts.length}</Badge>
                <Badge tone="warning">Críticos: {criticalAlerts}</Badge>
                <Badge tone="info">Missões: {openTasks}</Badge>
                <Badge tone="success">Câmeras: {camerasOnline}</Badge>
                <Badge>Playbooks: {PLAYBOOKS.length}</Badge>
              </div>
            </div>
          </header>

          <div className="mx-auto flex h-full max-w-7xl flex-col px-6 pb-10 pt-8">
            {viewContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
