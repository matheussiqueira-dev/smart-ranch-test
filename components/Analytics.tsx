import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, LineChart, Line } from 'recharts';
import { Activity, TrendingUp, Thermometer } from './Icons';

const STRESS_DATA = [
  { time: '06:00', temp: 18, stress: 12 },
  { time: '09:00', temp: 22, stress: 15 },
  { time: '12:00', temp: 31, stress: 45 },
  { time: '15:00', temp: 33, stress: 58 },
  { time: '18:00', temp: 28, stress: 30 },
  { time: '21:00', temp: 24, stress: 18 },
];

const BCS_DATA = [
  { range: 'Magro (< 2.5)', count: 5 },
  { range: 'Ideal (2.5 - 3.5)', count: 142 },
  { range: 'Gordo (> 3.5)', count: 38 },
];

const MOVEMENT_DATA = [
  { day: 'Seg', steps: 4500 },
  { day: 'Ter', steps: 4800 },
  { day: 'Qua', steps: 4200 },
  { day: 'Qui', steps: 3900 },
  { day: 'Sex', steps: 5100 },
  { day: 'Sab', steps: 5400 },
  { day: 'Dom', steps: 4900 },
];

const Analytics: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-white">Análise Profunda do Rebanho</h2>
        <p className="text-slate-400">Correlação de dados ambientais, nutricionais e comportamentais gerados pela IA.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Ganho de Peso Médio (Diário)</p>
              <h3 className="text-2xl font-bold text-white">1.2 kg <span className="text-sm text-green-500 ml-1">↑ 5%</span></h3>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-lg text-red-400">
              <Thermometer className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Índice de Estresse Térmico</p>
              <h3 className="text-2xl font-bold text-white">Médio <span className="text-sm text-slate-500 ml-1">(31°C Max)</span></h3>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Atividade de Ruminação</p>
              <h3 className="text-2xl font-bold text-white">480 min/dia</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estresse Térmico Chart */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-6">Correlação: Temperatura vs. Estresse</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={STRESS_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis yAxisId="left" stroke="#ef4444" label={{ value: 'Estresse (%)', angle: -90, position: 'insideLeft', fill: '#ef4444' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#fbbf24" label={{ value: 'Temp (°C)', angle: 90, position: 'insideRight', fill: '#fbbf24' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="stress" name="Nível de Estresse" stroke="#ef4444" strokeWidth={3} />
                <Line yAxisId="right" type="monotone" dataKey="temp" name="Temperatura" stroke="#fbbf24" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BCS Distribution */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-6">Condição Corporal (Body Condition Score)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={BCS_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="range" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                <Bar dataKey="count" name="Qtd. Animais" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Movement Area Chart */}
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-6">Padrão de Movimentação do Rebanho (Últimos 7 dias)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOVEMENT_DATA}>
                <defs>
                  <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                <Area type="monotone" dataKey="steps" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorSteps)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
      </div>
    </div>
  );
};

export default Analytics;
