import React, { useMemo, useState } from 'react';
import { FieldTask, Playbook, TeamMember, TaskStatus } from '../types';
import { AlertTriangle, CheckCircle, ClipboardList, Clock, MapPin, Users } from './Icons';
import { Badge, Button, Card, SectionHeader } from './ui';

interface OperationsProps {
  tasks: FieldTask[];
  playbooks: Playbook[];
  team: TeamMember[];
  onCreateTask: (draft: Omit<FieldTask, 'id' | 'status'>) => void;
  onUpdateTaskStatus: (id: string, status: TaskStatus) => void;
}

const Operations: React.FC<OperationsProps> = ({ tasks, playbooks, team, onCreateTask, onUpdateTaskStatus }) => {
  const [draft, setDraft] = useState({
    title: '',
    owner: '',
    priority: 'medium' as FieldTask['priority'],
    dueAt: '',
    location: '',
    notes: '',
  });

  const groupedTasks = useMemo(() => {
    return {
      backlog: tasks.filter((task) => task.status === 'backlog'),
      in_progress: tasks.filter((task) => task.status === 'in_progress'),
      done: tasks.filter((task) => task.status === 'done'),
    };
  }, [tasks]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.title.trim() || !draft.owner.trim()) return;

    const dueAt = draft.dueAt
      ? new Date(draft.dueAt).toISOString()
      : new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString();

    onCreateTask({
      title: draft.title,
      owner: draft.owner,
      priority: draft.priority,
      dueAt,
      location: draft.location || 'Setor principal',
      notes: draft.notes,
    });

    setDraft({
      title: '',
      owner: '',
      priority: 'medium',
      dueAt: '',
      location: '',
      notes: '',
    });
  };

  const statusTone = (status: TaskStatus) => {
    if (status === 'backlog') return 'warning';
    if (status === 'in_progress') return 'info';
    return 'success';
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr),minmax(0,0.8fr)]">
      <div className="space-y-6">
        <SectionHeader
          title="Sala de Operações"
          subtitle="Organize missões, acompanhe playbooks e mantenha a equipe sincronizada."
        />

        <Card>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-[color:var(--accent)]" />
            <h3 className="font-display text-lg text-white">Quadro de missões</h3>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {(
              [
                { id: 'backlog', label: 'Backlog', list: groupedTasks.backlog },
                { id: 'in_progress', label: 'Em execução', list: groupedTasks.in_progress },
                { id: 'done', label: 'Concluídas', list: groupedTasks.done },
              ] as const
            ).map((column) => (
              <div key={column.id} className="space-y-3">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]">{column.label}</p>
                {column.list.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 border-dashed bg-black/30 p-4 text-xs text-[color:var(--muted)]">
                    Sem missões nesta coluna
                  </div>
                ) : (
                  column.list.map((task) => (
                    <div key={task.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-white">{task.title}</p>
                        <Badge tone={statusTone(task.status)}>
                          {task.status === 'backlog' ? 'Backlog' : task.status === 'in_progress' ? 'Em execução' : 'Concluída'}
                        </Badge>
                      </div>
                      <div className="mt-2 space-y-1 text-xs text-[color:var(--muted)]">
                        <p>Responsável: {task.owner}</p>
                        <p className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(task.dueAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {task.location}
                        </p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {task.status === 'backlog' && (
                          <Button variant="ghost" onClick={() => onUpdateTaskStatus(task.id, 'in_progress')}>
                            Iniciar
                          </Button>
                        )}
                        {task.status === 'in_progress' && (
                          <Button variant="primary" onClick={() => onUpdateTaskStatus(task.id, 'done')}>
                            Concluir
                          </Button>
                        )}
                        {task.status === 'done' && (
                          <Button variant="secondary" onClick={() => onUpdateTaskStatus(task.id, 'backlog')}>
                            Reabrir
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-300" />
            <h3 className="font-display text-lg text-white">Playbooks inteligentes</h3>
          </div>
          <p className="mt-2 text-sm text-[color:var(--muted)]">Protocolos recomendados com SLA e responsáveis.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {playbooks.map((playbook) => (
              <div key={playbook.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{playbook.title}</p>
                  <Badge tone={playbook.severity === 'critical' ? 'danger' : playbook.severity === 'warning' ? 'warning' : 'info'}>
                    {playbook.severity === 'critical' ? 'Crítico' : playbook.severity === 'warning' ? 'Atenção' : 'Info'}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-[color:var(--muted)]">Trigger: {playbook.trigger}</p>
                <ul className="mt-3 space-y-2 text-xs text-white/80">
                  {playbook.steps.map((step, idx) => (
                    <li key={idx} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                      {step}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center justify-between text-xs text-[color:var(--muted)]">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> SLA {playbook.slaHours}h
                  </span>
                  <span>Owner: {playbook.ownerRole}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-300" />
            <h3 className="font-display text-lg text-white">Criar missão</h3>
          </div>
          <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-sm">
            <input
              value={draft.title}
              onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Título da missão"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-[color:var(--muted)]"
              required
            />
            <input
              value={draft.owner}
              onChange={(event) => setDraft((prev) => ({ ...prev, owner: event.target.value }))}
              placeholder="Responsável"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-[color:var(--muted)]"
              required
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={draft.priority}
                onChange={(event) => setDraft((prev) => ({ ...prev, priority: event.target.value as FieldTask['priority'] }))}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white"
              >
                <option value="high">Alta prioridade</option>
                <option value="medium">Média prioridade</option>
                <option value="low">Baixa prioridade</option>
              </select>
              <input
                type="datetime-local"
                value={draft.dueAt}
                onChange={(event) => setDraft((prev) => ({ ...prev, dueAt: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white"
              />
            </div>
            <input
              value={draft.location}
              onChange={(event) => setDraft((prev) => ({ ...prev, location: event.target.value }))}
              placeholder="Local"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-[color:var(--muted)]"
            />
            <textarea
              value={draft.notes}
              onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder="Observações"
              rows={3}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-[color:var(--muted)]"
            ></textarea>
            <Button type="submit" variant="primary" className="w-full">
              Criar missão
            </Button>
          </form>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-sky-300" />
            <h3 className="font-display text-lg text-white">Equipe de campo</h3>
          </div>
          <div className="mt-4 space-y-3">
            {team.map((member) => (
              <div key={member.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-white">{member.name}</p>
                    <p className="text-xs text-[color:var(--muted)]">{member.role}</p>
                  </div>
                  <Badge tone={member.status === 'available' ? 'success' : member.status === 'field' ? 'warning' : 'neutral'}>
                    {member.status === 'available' ? 'Disponível' : member.status === 'field' ? 'Em campo' : 'Offline'}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-[color:var(--muted)]">{member.shift}</p>
                {member.focus && <p className="mt-1 text-xs text-white/70">Foco: {member.focus}</p>}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Operations;
