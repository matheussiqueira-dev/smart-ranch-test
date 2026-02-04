import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, LineChart, Line } from 'recharts';
import { Activity, TrendingUp, Thermometer } from './Icons';
import { Card, SectionHeader, StatCard } from './ui';

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
    <div className="space-y-6">
      <SectionHeader
        title="Inteligência de Rebanho"
        subtitle="Correlação de clima, nutrição e comportamento com recomendações táticas."
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard
          label="Ganho diário"
          value="1.2 kg"
          helper="↑ 5%"
          icon={<TrendingUp className="h-6 w-6" />}
          tone="success"
        />
        <StatCard
          label="Estresse térmico"
          value="Médio"
          helper="31°C máx."
          icon={<Thermometer className="h-6 w-6" />}
          tone="warning"
        />
        <StatCard
          label="Ruminação"
          value="480 min/dia"
          helper="Consistência alta"
          icon={<Activity className="h-6 w-6" />}
          tone="info"
        />
        <StatCard
          label="Conversão"
          value="6.8 : 1"
          helper="Eficiência ótima"
          icon={<Activity className="h-6 w-6" />}
          tone="success"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="font-display text-lg text-white">Temperatura x Estresse</h3>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={STRESS_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2a21" vertical={false} />
                <XAxis dataKey="time" stroke="#9fb0a1" />
                <YAxis yAxisId="left" stroke="#f87171" label={{ value: 'Estresse (%)', angle: -90, position: 'insideLeft', fill: '#f87171' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#fbbf24" label={{ value: 'Temp (°C)', angle: 90, position: 'insideRight', fill: '#fbbf24' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0b0f0a', borderColor: '#1f2a21', color: '#fff' }} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="stress" name="Nível de Estresse" stroke="#f87171" strokeWidth={3} />
                <Line yAxisId="right" type="monotone" dataKey="temp" name="Temperatura" stroke="#fbbf24" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="font-display text-lg text-white">Condição Corporal (BCS)</h3>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={BCS_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2a21" vertical={false} />
                <XAxis dataKey="range" stroke="#9fb0a1" />
                <YAxis stroke="#9fb0a1" />
                <Tooltip cursor={{ fill: '#1f2a21' }} contentStyle={{ backgroundColor: '#0b0f0a', borderColor: '#1f2a21', color: '#fff' }} />
                <Bar dataKey="count" name="Qtd. Animais" fill="#7ad3a6" radius={[6, 6, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="font-display text-lg text-white">Movimentação do Rebanho (7 dias)</h3>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MOVEMENT_DATA}>
              <defs>
                <linearGradient id="movementGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2a21" vertical={false} />
              <XAxis dataKey="day" stroke="#9fb0a1" />
              <YAxis stroke="#9fb0a1" />
              <Tooltip contentStyle={{ backgroundColor: '#0b0f0a', borderColor: '#1f2a21', color: '#fff' }} />
              <Area type="monotone" dataKey="steps" stroke="#60a5fa" strokeWidth={3} fillOpacity={1} fill="url(#movementGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

export default Analytics;
