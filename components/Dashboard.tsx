import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, AlertTriangle, CheckCircle } from './Icons';

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

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard Geral</h1>
          <p className="text-slate-400">Visão geral da saúde e produtividade do rebanho Smart Ranch.</p>
        </div>
        <div className="flex items-center gap-2 text-sm bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 text-slate-300">
           <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
           Sistema Operacional
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-green-500/20"></div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-sm font-medium">Média de Saúde (Hoje)</p>
              <h3 className="text-3xl font-bold text-white mt-1">94%</h3>
            </div>
            <div className="p-2 bg-slate-700/50 rounded-lg text-green-400">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-green-400 font-medium">
            <span>↑ 2.5%</span>
            <span className="text-slate-500">vs. semana passada</span>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm relative overflow-hidden group">
           <div className="absolute right-0 top-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-yellow-500/20"></div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-sm font-medium">Alertas Ativos</p>
              <h3 className="text-3xl font-bold text-white mt-1">3</h3>
            </div>
            <div className="p-2 bg-slate-700/50 rounded-lg text-yellow-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-yellow-400 font-medium">
            <span>2 requerem atenção imediata</span>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm relative overflow-hidden group">
           <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-blue-500/20"></div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Monitorado</p>
              <h3 className="text-3xl font-bold text-white mt-1">185</h3>
            </div>
            <div className="p-2 bg-slate-700/50 rounded-lg text-blue-400">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Distribuídos em 4 setores</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Health Trend */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-6">Tendência de Saúde (7 Dias)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={HEALTH_DATA}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="day" stroke="#94a3b8" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" tick={{fontSize: 12}} axisLine={false} tickLine={false} domain={[60, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                  itemStyle={{ color: '#4ade80' }}
                />
                <Area type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weight Distribution */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-6">Distribuição de Peso Estimado</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WEIGHT_DATA} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#94a3b8" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis dataKey="category" type="category" stroke="#94a3b8" tick={{fontSize: 12}} width={60} axisLine={false} tickLine={false} />
                <Tooltip 
                   cursor={{fill: '#334155', opacity: 0.4}}
                   contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Recent Activity List */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-lg font-bold text-white">Alertas Recentes do Sistema</h3>
        </div>
        <div className="divide-y divide-slate-700">
          {[
            { id: 1, msg: 'Padrão de manqueira detectado na Câmera 02', time: '10 min atrás', severity: 'high' },
            { id: 2, msg: 'Baixa movimentação detectada no Setor C', time: '1 hora atrás', severity: 'medium' },
            { id: 3, msg: 'Cocho de água abaixo do nível recomendado', time: '3 horas atrás', severity: 'low' },
          ].map((item) => (
            <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${item.severity === 'high' ? 'bg-red-500' : item.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                <p className="text-slate-300 text-sm">{item.msg}</p>
              </div>
              <span className="text-xs text-slate-500 font-mono">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;