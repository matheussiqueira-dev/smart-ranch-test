import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import LiveMonitor from './components/LiveMonitor';
import Analytics from './components/Analytics';
import Alerts from './components/Alerts';
import VoiceAgent from './components/VoiceAgent';

const HAS_VOICE_KEY = Boolean(import.meta.env.VITE_GEMINI_API_KEY);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'live':
        return <LiveMonitor />;
      case 'analytics':
        return <Analytics />;
      case 'alerts':
        return <Alerts />;
      case 'voice':
        return <VoiceAgent />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      
      <main className="flex-1 overflow-auto bg-slate-900/50">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto h-full">
          {renderContent()}
        </div>
      </main>

      {/* Warning if no API Key for voice */}
      {!HAS_VOICE_KEY && (
        <div className="fixed bottom-4 right-4 bg-red-500/90 text-white px-6 py-4 rounded-xl shadow-lg backdrop-blur max-w-sm z-50">
          <h4 className="font-bold mb-1">Configuração Necessária</h4>
          <p className="text-sm">A variável VITE_GEMINI_API_KEY não foi detectada. O assistente de voz ficará indisponível.</p>
        </div>
      )}
    </div>
  );
};

export default App;
