import React, { useEffect, useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, AlertTriangle, CheckCircle, Users } from './Icons';
import { Alert, FieldTask, TeamMember } from '../types';
import { fetchSummary, SummaryResponse } from '../services/ai';
import { Badge, Card, SectionHeader, StatCard } from './ui';

const HEALTH_DATA = [
  { day: 'Seg', score: 88 },
  { day: 'Ter', score: 85 },
  { day: 'Qua', score: 89 },
  { day: 'Qui', score: 82 },
  { day: 'Sex', score: 91 },
  { day: 'Sab', score: 88 },
  { day: 'Dom', score: 94 },
];

const WEIGHT_DATA = [
  { category: 'Abaixo', count: 12 },
  { category: 'Ideal', count: 145 },
  { category: 'Acima', count: 28 },
];

interface DashboardProps {
  alerts: Alert[];
  tasks: FieldTask[];
  camerasOnline: number;
  playbooksReady: number;
  team: TeamMember[];
}

const Dashboard: React.FC<DashboardProps> = ({ alerts, tasks, camerasOnline, playbooksReady, team }) => {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);

  const activeAlerts = useMemo(() => alerts.filter((alert) => alert.status === 'active'), [alerts]);
  const criticalAlerts = useMemo(() => activeAlerts.filter((alert) => alert.severity === 'critical'), [activeAlerts]);
  const openTasks = useMemo(() => tasks.filter((task) => task.status !== 'done'), [tasks]);
  const availableTeam = useMemo(() => team.filter((member) => member.status === 'available'), [team]);

  const priorityTasks = useMemo(() => {
    const weight = { high: 3, medium: 2, low: 1 } as const;
    return [...openTasks]
      .sort((a, b) => {
        const diff = weight[b.priority] - weight[a.priority];
        if (diff !== 0) return diff;
        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      })
      .slice(0, 3);
  }, [openTasks]);

  useEffect(() => {
    let isMounted = true;

    const loadSummary = async () => {
      try {
        const payload = await fetchSummary();
        if (isMounted) {
          setSummary(payload);
        }
      } catch {
        // Mantém fallback estático caso o backend não esteja disponível
      }
    };

    loadSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  const avgScore = summary?.avgScore ?? 94;
  const totalAnalyses = summary?.total ?? 0;

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Dashboard Geral"
        subtitle="Resumo executivo da operação e tendências críticas do dia."
        action={<Badge tone="success">Sistema Operacional</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard
          label="Saúde média"
          value={`${avgScore}%`}
          helper={totalAnalyses ? `Total de análises: ${totalAnalyses}` : '+2.5% vs semana passada'}
          icon={<Activity className="h-6 w-6" />}
          tone="success"
        />
        <StatCard
          label="Alertas ativos"
          value={`${activeAlerts.length}`}
          helper={`${criticalAlerts.length} críticos em andamento`}
          icon={<AlertTriangle className="h-6 w-6" />}
          tone="danger"
        />
        <StatCard
          label="Missões abertas"
          value={`${openTasks.length}`}
          helper="Equipes em deslocamento"
          icon={<CheckCircle className="h-6 w-6" />}
          tone="warning"
        />
        <StatCard
          label="Câmeras online"
          value={`${camerasOnline}`}
          helper={`Playbooks prontos: ${playbooksReady}`}
          icon={<Users className="h-6 w-6" />}
          tone="info"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr),minmax(0,0.9fr)]">
        <Card>
          <h3 className="font-display text-lg text-white">Tendência de saúde (7 dias)</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={HEALTH_DATA}>
                <defs>
                  <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7ad3a6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#7ad3a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2a21" vertical={false} />
                <XAxis dataKey="day" stroke="#9fb0a1" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#9fb0a1" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} domain={[60, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0b0f0a', borderColor: '#1f2a21', color: '#f8fafc' }} />
                <Area type="monotone" dataKey="score" stroke="#7ad3a6" strokeWidth={3} fillOpacity={1} fill="url(#healthGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="font-display text-lg text-white">Distribuição de peso estimado</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WEIGHT_DATA} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2a21" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#9fb0a1" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="category" type="category" stroke="#9fb0a1" tick={{ fontSize: 12 }} width={70} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#1f2a21', opacity: 0.4 }} contentStyle={{ backgroundColor: '#0b0f0a', borderColor: '#1f2a21', color: '#f8fafc' }} />
                <Bar dataKey="count" fill="#f1b357" radius={[0, 6, 6, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <h3 className="font-display text-lg text-white">Prioridades imediatas</h3>
          <p className="mt-2 text-sm text-[color:var(--muted)]">Missões com maior impacto nas próximas horas.</p>
          <div className="mt-4 space-y-3">
            {priorityTasks.length === 0 ? (
              <div className="rounded-2xl border border-white/10 border-dashed bg-black/30 p-5 text-sm text-[color:var(--muted)]">
                Nenhuma missão crítica no momento.
              </div>
            ) : (
              priorityTasks.map((task) => (
                <div key={task.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">{task.title}</p>
                      <p className="text-xs text-[color:var(--muted)]">Responsável: {task.owner}</p>
                    </div>
                    <Badge tone={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'success'}>
                      {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-[color:var(--muted)]">{task.location}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h3 className="font-display text-lg text-white">Alertas em andamento</h3>
          <p className="mt-2 text-sm text-[color:var(--muted)]">Foco nos incidentes com resposta aberta.</p>
          <div className="mt-4 space-y-3">
            {activeAlerts.length === 0 ? (
              <div className="rounded-2xl border border-white/10 border-dashed bg-black/30 p-5 text-sm text-[color:var(--muted)]">
                Nenhum alerta ativo.
              </div>
            ) : (
              activeAlerts.slice(0, 4).map((alert) => (
                <div key={alert.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm text-white">{alert.title}</p>
                      <p className="text-xs text-[color:var(--muted)]">{alert.location}</p>
                    </div>
                    <Badge tone={alert.severity === 'critical' ? 'danger' : alert.severity === 'warning' ? 'warning' : 'info'}>
                      {alert.severity === 'critical' ? 'Crítico' : alert.severity === 'warning' ? 'Atenção' : 'Info'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h3 className="font-display text-lg text-white">Equipe disponível</h3>
          <p className="mt-2 text-sm text-[color:var(--muted)]">Cobertura e foco por turno.</p>
          <div className="mt-4 space-y-3">
            {availableTeam.map((member) => (
              <div key={member.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{member.name}</p>
                    <p className="text-xs text-[color:var(--muted)]">{member.role}</p>
                  </div>
                  <Badge tone="success">Disponível</Badge>
                </div>
                <p className="mt-2 text-xs text-[color:var(--muted)]">{member.focus}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
