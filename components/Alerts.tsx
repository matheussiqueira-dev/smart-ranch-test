import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Video, Activity } from './Icons';

interface AlertItem {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
  location: string;
  status: 'active' | 'resolved';
}

const MOCK_ALERTS: AlertItem[] = [
  {
    id: '1',
    severity: 'critical',
    title: 'Animal Caído Detectado',
    description: 'Bovino ID #452 em decúbito lateral por mais de 3 horas sem movimentação de ruminação.',
    timestamp: '10 minutos atrás',
    location: 'Pasto Norte (Cocho)',
    status: 'active'
  },
  {
    id: '2',
    severity: 'warning',
    title: 'Comportamento Agitado',
    description: 'Grupo de 5 animais apresentando correria atípica, possível presença de predador ou estresse por insetos.',
    timestamp: '45 minutos atrás',
    location: 'Área de Descanso',
    status: 'active'
  },
  {
    id: '3',
    severity: 'warning',
    title: 'Nível de Água Baixo',
    description: 'O bebedouro principal está com nível abaixo de 20%.',
    timestamp: '2 horas atrás',
    location: 'Bebedouro Principal',
    status: 'active'
  },
  {
    id: '4',
    severity: 'info',
    title: 'Movimentação Noturna',
    description: 'Atividade normal registrada durante a madrugada.',
    timestamp: '6 horas atrás',
    location: 'Curral de Manejo',
    status: 'resolved'
  }
];

const Alerts: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'resolved'>('all');
  const [alerts, setAlerts] = useState(MOCK_ALERTS);

  const resolveAlert = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, status: 'resolved' } : alert
    ));
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return alert.status === 'active';
    if (filter === 'resolved') return alert.status === 'resolved';
    return alert.severity === filter && alert.status === 'active';
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Central de Alertas</h2>
          <p className="text-slate-400">Notificações em tempo real geradas pelo monitoramento contínuo.</p>
        </div>
        
        <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
          <button 
            onClick={() => setFilter('all')} 
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${filter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Ativos
          </button>
          <button 
            onClick={() => setFilter('critical')} 
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${filter === 'critical' ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:text-red-400'}`}
          >
            Críticos
          </button>
          <button 
            onClick={() => setFilter('warning')} 
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${filter === 'warning' ? 'bg-yellow-500/20 text-yellow-400' : 'text-slate-400 hover:text-yellow-400'}`}
          >
            Atenção
          </button>
          <button 
            onClick={() => setFilter('resolved')} 
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${filter === 'resolved' ? 'bg-green-500/20 text-green-400' : 'text-slate-400 hover:text-green-400'}`}
          >
            Resolvidos
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-slate-800 border-dashed">
            <CheckCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500">Nenhum alerta encontrado para este filtro.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`relative bg-slate-800 rounded-xl border p-6 transition-all hover:shadow-lg ${
                alert.status === 'resolved' ? 'border-slate-700 opacity-70' :
                alert.severity === 'critical' ? 'border-red-500/50 shadow-red-900/10' :
                alert.severity === 'warning' ? 'border-yellow-500/50 shadow-yellow-900/10' :
                'border-blue-500/50'
              }`}
            >
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                    alert.status === 'resolved' ? 'bg-green-500/10 text-green-500' :
                    alert.severity === 'critical' ? 'bg-red-500/10 text-red-500 animate-pulse' :
                    alert.severity === 'warning' ? 'bg-yellow-500/10 text-yellow-500' :
                    'bg-blue-500/10 text-blue-500'
                  }`}>
                    {alert.status === 'resolved' ? <CheckCircle /> : <AlertTriangle />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-white">{alert.title}</h3>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-600">
                        {alert.location}
                      </span>
                    </div>
                    <p className="text-slate-300 mb-2">{alert.description}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                       <span className="flex items-center gap-1"><Activity className="w-4 h-4" /> Detectado via IA</span>
                       <span>•</span>
                       <span>{alert.timestamp}</span>
                    </div>
                  </div>
                </div>

                {alert.status === 'active' && (
                  <div className="flex flex-row md:flex-col gap-2 justify-center">
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm border border-slate-600">
                      <Video className="w-4 h-4" /> Ver Câmera
                    </button>
                    <button 
                      onClick={() => resolveAlert(alert.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors text-sm shadow-lg"
                    >
                      <CheckCircle className="w-4 h-4" /> Resolver
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Alerts;
