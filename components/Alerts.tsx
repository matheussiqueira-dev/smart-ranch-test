import React, { useMemo, useState } from 'react';
import { Alert } from '../types';
import { AlertTriangle, CheckCircle, ClipboardList, MapPin } from './Icons';
import { Badge, Button, Card, SectionHeader } from './ui';

interface AlertsProps {
  alerts: Alert[];
  onResolve: (id: string) => void;
  onCreateTask: (alertId: string) => void;
}

const Alerts: React.FC<AlertsProps> = ({ alerts, onResolve, onCreateTask }) => {
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info' | 'resolved'>('all');
  const [query, setQuery] = useState('');

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (filter === 'all' && alert.status !== 'active') return false;
      if (filter === 'resolved' && alert.status !== 'resolved') return false;
      if (['critical', 'warning', 'info'].includes(filter) && alert.severity !== filter) return false;

      if (!query.trim()) return true;
      const haystack = `${alert.title} ${alert.description} ${alert.location}`.toLowerCase();
      return haystack.includes(query.toLowerCase());
    });
  }, [alerts, filter, query]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Central de Alertas"
        subtitle="Incidentes priorizados com busca inteligente e criação de missões operacionais."
        action={
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'Ativos' },
              { id: 'critical', label: 'Críticos' },
              { id: 'warning', label: 'Atenção' },
              { id: 'info', label: 'Info' },
              { id: 'resolved', label: 'Resolvidos' },
            ].map((item) => (
              <Button
                key={item.id}
                variant={filter === item.id ? 'primary' : 'ghost'}
                onClick={() => setFilter(item.id as typeof filter)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        }
      />

      <Card variant="soft">
        <label className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]" htmlFor="alert-search">
          Buscar alertas
        </label>
        <input
          id="alert-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por título, descrição ou local"
          className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
        />
      </Card>

      {filteredAlerts.length === 0 ? (
        <Card variant="ghost" className="text-center">
          <CheckCircle className="mx-auto h-10 w-10 text-emerald-300" />
          <p className="mt-3 text-sm text-[color:var(--muted)]">Nenhum alerta encontrado para este filtro.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <Card key={alert.id} className="p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                    alert.status === 'resolved'
                      ? 'bg-emerald-500/10 text-emerald-300'
                      : alert.severity === 'critical'
                      ? 'bg-rose-500/10 text-rose-300'
                      : alert.severity === 'warning'
                      ? 'bg-amber-500/10 text-amber-300'
                      : 'bg-sky-500/10 text-sky-300'
                  }`}>
                    {alert.status === 'resolved' ? <CheckCircle /> : <AlertTriangle />}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">{alert.title}</h3>
                      <Badge tone={alert.severity === 'critical' ? 'danger' : alert.severity === 'warning' ? 'warning' : 'info'}>
                        {alert.severity === 'critical' ? 'Crítico' : alert.severity === 'warning' ? 'Atenção' : 'Info'}
                      </Badge>
                      <Badge tone={alert.status === 'resolved' ? 'success' : 'neutral'}>
                        {alert.status === 'resolved' ? 'Resolvido' : 'Ativo'}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-white/80">{alert.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[color:var(--muted)]">
                      <span className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> {alert.location}
                      </span>
                      <span>{alert.timestamp}</span>
                    </div>
                  </div>
                </div>

                {alert.status === 'active' && (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => onCreateTask(alert.id)}>
                      <ClipboardList className="h-4 w-4" />
                      Criar missão
                    </Button>
                    <Button variant="primary" onClick={() => onResolve(alert.id)}>
                      <CheckCircle className="h-4 w-4" />
                      Resolver
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;
