import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import LiveMonitor from './components/LiveMonitor';
import Analytics from './components/Analytics';
import Alerts from './components/Alerts';
import VoiceAgent from './components/VoiceAgent';

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

    </div>
  );
};

export default App;
