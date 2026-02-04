import React, { useState, useRef, useEffect } from 'react';
import { CameraFeed, AnalysisResult, IdentifiedIssue } from '../types';
import { analyzeFrame, fetchHistory } from '../services/gemini';
import { Camera, Video, Upload, Activity, AlertTriangle, CheckCircle, Download, ChevronDown, ChevronUp } from './Icons';

const MOCK_CAMERAS: CameraFeed[] = [
  { id: 'cam-01', name: 'Pasto Norte (Cocho)', location: 'Setor A', status: 'active', thumbnailUrl: 'https://picsum.photos/seed/cows1/800/600' },
  { id: 'cam-02', name: 'Bebedouro Principal', location: 'Setor B', status: 'active', thumbnailUrl: 'https://picsum.photos/seed/cows2/800/600' },
  { id: 'cam-03', name: 'Curral de Manejo', location: 'Sede', status: 'active', thumbnailUrl: 'https://picsum.photos/seed/cows3/800/600' },
  { id: 'cam-04', name: 'Área de Descanso', location: 'Setor C', status: 'active', thumbnailUrl: 'https://picsum.photos/seed/cows4/800/600' },
];

// Dados iniciais para popular o histórico
const MOCK_HISTORY: AnalysisResult[] = [
  {
    cameraId: 'cam-01',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 min atrás
    cattleCount: 15,
    healthScore: 94,
    identifiedIssues: [],
    recommendations: ['Manter rotina'],
    rawAnalysis: 'Rebanho em comportamento normal de pastejo. Sem sinais visuais de estresse.'
  },
  {
    cameraId: 'cam-01',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 horas atrás
    cattleCount: 14,
    healthScore: 88,
    identifiedIssues: [
        {
            issue: 'Leve agitação',
            description: 'Um animal apresenta movimentação de cabeça repetitiva e deslocamento frequente sem pastejo.',
            possibleCauses: ['Estresse térmico leve', 'Presença de insetos', 'Início de desconforto físico']
        }
    ],
    recommendations: ['Observar animal isolado'],
    rawAnalysis: 'A maioria do gado está calma, mas um animal apresenta movimentação excessiva.'
  },
  {
    cameraId: 'cam-01',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // 26 horas atrás (Ontem)
    cattleCount: 12,
    healthScore: 55,
    identifiedIssues: [
        {
            issue: 'Animal caído',
            description: 'Bovino detectado em decúbito lateral por período prolongado, sem movimentos de ruminação visíveis.',
            possibleCauses: ['Lesão locomotora', 'Doença metabólica', 'Exaustão severa']
        },
        {
            issue: 'Possível lesão',
            description: 'Posicionamento anormal do membro posterior direito enquanto deitado.',
            possibleCauses: ['Trauma', 'Fratura', 'Inflamação articular']
        }
    ],
    recommendations: ['Verificação veterinária imediata'],
    rawAnalysis: 'Alerta crítico: Animal detectado deitado por longo período sem movimento.'
  },
  {
    cameraId: 'cam-02',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    cattleCount: 8,
    healthScore: 91,
    identifiedIssues: [],
    recommendations: [],
    rawAnalysis: 'Animais bebendo água regularmente.'
  }
];

const LOCAL_STORAGE_KEY = 'smart_ranch_history';

// Componente para item de problema expansível (Diagnóstico Atual)
const IssueItem = ({ issue }: { issue: IdentifiedIssue }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-yellow-500/10 rounded-lg border border-yellow-500/20 overflow-hidden transition-all duration-200">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-yellow-500/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-yellow-500 flex-shrink-0"></span>
          <span className="text-sm font-medium text-slate-200">{issue.issue}</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      
      {isOpen && (
        <div className="px-4 pb-3 pt-0 animate-fadeIn">
          <div className="pl-3.5 border-l border-yellow-500/20 space-y-3">
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold mb-1">Observação</p>
              <p className="text-sm text-slate-300 leading-relaxed">{issue.description}</p>
            </div>
            {issue.possibleCauses && issue.possibleCauses.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Possíveis Causas</p>
                <ul className="list-disc list-inside text-sm text-slate-400">
                  {issue.possibleCauses.map((cause, idx) => (
                    <li key={idx}>{cause}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para o item do histórico (Lista de Histórico)
const HistoryItem = ({ item }: { item: AnalysisResult }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-slate-900/60 rounded-lg border border-slate-800 hover:border-slate-700 transition-all duration-200 overflow-hidden">
      {/* Cabeçalho do Item */}
      <div className="p-3 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-500 font-mono bg-slate-800 px-1.5 py-0.5 rounded">
              {new Date(item.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </span>
            {item.healthScore <= 60 && (
              <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 rounded uppercase tracking-wide">Alerta</span>
            )}
            {item.identifiedIssues.length > 0 && item.healthScore > 60 && (
               <span className="text-[10px] font-bold bg-yellow-500/80 text-white px-1.5 rounded uppercase tracking-wide">Atenção</span>
            )}
          </div>
          <p className="text-sm text-slate-300 line-clamp-1" title={item.rawAnalysis}>
            {item.rawAnalysis}
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          <div className="text-right hidden sm:block">
            <span className="text-xs text-slate-500 block uppercase">Animais</span>
            <span className="text-sm font-bold text-white">{item.cattleCount}</span>
          </div>
          
          <div className="flex items-center gap-3">
             <div className={`px-2 py-1 rounded border text-xs font-bold whitespace-nowrap min-w-[3rem] text-center ${
                item.healthScore > 80 ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                item.healthScore > 60 ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
                {item.healthScore}
              </div>
              
              <button 
                onClick={() => setExpanded(!expanded)}
                className="p-1 hover:bg-slate-700 rounded-md text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-xs font-medium"
              >
                {expanded ? 'Ocultar' : 'Detalhes'}
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
          </div>
        </div>
      </div>

      {/* Conteúdo Expandido */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-800/50 bg-slate-900/30 space-y-4 animate-fadeIn">
           {/* Análise Completa */}
           <div>
             <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-wider">Análise Completa</p>
             <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/30 p-2 rounded border border-slate-800/50">
               {item.rawAnalysis}
             </p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Lista de Problemas Detalhada */}
             {item.identifiedIssues.length > 0 && (
               <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-2 tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-yellow-500" />
                    Problemas Detectados
                  </p>
                  <div className="space-y-3">
                    {item.identifiedIssues.map((issue, idx) => (
                      <div key={idx} className="bg-yellow-500/5 border border-yellow-500/10 rounded p-2">
                         <div className="flex items-center gap-2 mb-1">
                           <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                           <span className="text-sm font-medium text-yellow-400">{issue.issue}</span>
                         </div>
                         <p className="text-xs text-slate-300 mb-1.5 pl-3.5">{issue.description}</p>
                         {issue.possibleCauses?.length > 0 && (
                           <div className="pl-3.5">
                              <span className="text-[10px] text-slate-500 uppercase font-bold">Causas: </span>
                              <span className="text-xs text-slate-400 italic">{issue.possibleCauses.join(', ')}</span>
                           </div>
                         )}
                      </div>
                    ))}
                  </div>
               </div>
             )}

             {/* Recomendações */}
             {item.recommendations.length > 0 && (
                <div>
                   <p className="text-[10px] text-slate-500 uppercase font-bold mb-2 tracking-wider flex items-center gap-1">
                     <CheckCircle className="w-3 h-3 text-blue-500" />
                     Recomendações
                   </p>
                   <ul className="space-y-2">
                     {item.recommendations.map((rec, idx) => (
                       <li key={idx} className="flex items-start gap-2 text-sm text-slate-300 bg-blue-500/5 border border-blue-500/10 rounded p-2">
                         <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-400 flex-shrink-0"></span>
                         {rec}
                       </li>
                     ))}
                   </ul>
                </div>
             )}
           </div>
        </div>
      )}
    </div>
  );
};

const LiveMonitor: React.FC = () => {
  const [selectedCamera, setSelectedCamera] = useState<CameraFeed>(MOCK_CAMERAS[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  // Inicialização Lazy do estado com localStorage
  const [history, setHistory] = useState<AnalysisResult[]>(() => {
    try {
      const savedHistory = localStorage.getItem(LOCAL_STORAGE_KEY);
      return savedHistory ? JSON.parse(savedHistory) : MOCK_HISTORY;
    } catch (error) {
      console.error("Erro ao carregar histórico do localStorage:", error);
      return MOCK_HISTORY;
    }
  });

  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      try {
        const remoteHistory = await fetchHistory();
        if (isMounted && Array.isArray(remoteHistory) && remoteHistory.length > 0) {
          setHistory(remoteHistory);
        }
      } catch (error) {
        console.warn('Backend indisponível. Usando histórico local.', error);
      }
    };

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);
  
  // Filtros
  const [timeFilter, setTimeFilter] = useState<'all' | '24h' | 'week'>('all');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Efeito para salvar o histórico no localStorage sempre que ele mudar
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error("Erro ao salvar histórico no localStorage:", error);
    }
  }, [history]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setUploadedImage(base64String);
        // Clear previous result when new image loaded
        setAnalysisResult(null); 
      };
      reader.readAsDataURL(file);
    }
  };

  const saveSnapshot = async () => {
    const imageSrc = uploadedImage || selectedCamera.thumbnailUrl;
    if (!imageSrc) return;

    setIsSavingSnapshot(true);

    try {
      // Gera o nome do arquivo com timestamp e ID da câmera
      const now = new Date();
      const timestampStr = now.toISOString().replace(/[:.]/g, '-');
      const filename = `snapshot-${selectedCamera.id}-${timestampStr}.jpg`;

      // Busca a imagem para criar um Blob (necessário para downloads cross-origin seguros em alguns casos)
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Cria um link temporário para forçar o download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Limpeza
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao salvar snapshot:', error);
      alert('Não foi possível salvar a imagem. Tente novamente.');
    } finally {
      setIsSavingSnapshot(false);
    }
  };

  const runAnalysis = async () => {
    if (!uploadedImage && !selectedCamera.thumbnailUrl) return;
    
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const imageToAnalyze = uploadedImage;

      if (!imageToAnalyze) {
        alert("Para esta demonstração, por favor faça upload de uma imagem ('frame') para simular a captura da câmera.");
        setIsAnalyzing(false);
        return;
      }

      const base64Data = imageToAnalyze.split(',')[1];
      const result = await analyzeFrame(base64Data, selectedCamera.id);
      
      // Adiciona o ID da câmera ao resultado
      const resultWithCamera = { ...result, cameraId: selectedCamera.id };
      
      setAnalysisResult(resultWithCamera);
      
      // Atualiza o histórico adicionando o novo item no topo
      // O useEffect cuidará de salvar no localStorage
      setHistory(prev => [resultWithCamera, ...prev]);

    } catch (error) {
      console.error(error);
      alert("Erro ao analisar imagem. Verifique se o backend está rodando e se a API Key está configurada.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Filtrar histórico
  const filteredHistory = history.filter(h => {
    // 1. Filtrar pela Câmera atual
    if (h.cameraId !== selectedCamera.id) return false;

    // 2. Filtrar por Tempo
    const date = new Date(h.timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    
    if (timeFilter === '24h' && diffTime > 1000 * 60 * 60 * 24) return false;
    if (timeFilter === 'week' && diffTime > 1000 * 60 * 60 * 24 * 7) return false;

    // 3. Filtrar por Score
    // High: > 80, Medium: 61-80, Low: <= 60
    if (scoreFilter === 'high' && h.healthScore <= 80) return false;
    if (scoreFilter === 'medium' && (h.healthScore > 80 || h.healthScore <= 60)) return false;
    if (scoreFilter === 'low' && h.healthScore > 60) return false;

    return true;
  });

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Monitoramento em Tempo Real</h2>
          <p className="text-slate-400">Selecione uma câmera para visualizar e analisar o rebanho.</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors border border-slate-700"
           >
             <Upload className="w-4 h-4" />
             Carregar Frame
           </button>
           <input 
             type="file" 
             ref={fileInputRef} 
             onChange={handleFileUpload} 
             className="hidden" 
             accept="image/*"
           />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0">
        
        {/* Main Feed View & History Section */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl aspect-video border border-slate-800 group">
              <img 
                src={uploadedImage || selectedCamera.thumbnailUrl} 
                alt="Live Feed" 
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
              />
              
              {/* Live Indicator */}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-white uppercase tracking-wider">AO VIVO</span>
              </div>

              {/* Camera Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
                <h3 className="text-xl font-bold text-white">{selectedCamera.name}</h3>
                <p className="text-slate-300 text-sm">{selectedCamera.location}</p>
              </div>

              {/* Actions Overlay (Analyze & Snapshot) */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                 {/* Save Snapshot Button */}
                 <button 
                   onClick={saveSnapshot}
                   disabled={isSavingSnapshot}
                   className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-3 py-2 rounded-lg border border-white/10 shadow-lg transition-all disabled:opacity-50"
                   title="Salvar Snapshot"
                 >
                   <Download className="w-4 h-4" />
                   <span className="hidden sm:inline">Snapshot</span>
                 </button>

                 {/* Analyze Button */}
                 <button 
                   onClick={runAnalysis}
                   disabled={isAnalyzing}
                   className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {isAnalyzing ? (
                     <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Analisando...
                     </>
                   ) : (
                     <>
                      <Activity className="w-4 h-4" />
                      Analisar
                     </>
                   )}
                 </button>
              </div>
            </div>

            {/* Camera Grid Selector */}
            <div className="grid grid-cols-4 gap-4">
              {MOCK_CAMERAS.map((cam) => (
                <button
                  key={cam.id}
                  onClick={() => { setSelectedCamera(cam); setUploadedImage(null); setAnalysisResult(null); }}
                  className={`relative rounded-xl overflow-hidden aspect-video border-2 transition-all ${selectedCamera.id === cam.id ? 'border-green-500 ring-2 ring-green-500/20' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={cam.thumbnailUrl} alt={cam.name} className="w-full h-full object-cover" />
                  <div className="absolute bottom-1 left-2 text-[10px] font-bold text-white drop-shadow-md">{cam.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Histórico de Análises da Câmera Selecionada */}
          <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2 h-6 bg-blue-500 rounded-sm"></span>
                Histórico: {selectedCamera.name}
              </h3>

              {/* Filtros */}
              <div className="flex flex-wrap gap-3">
                {/* Filtro de Tempo */}
                <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                  <button 
                    onClick={() => setTimeFilter('all')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${timeFilter === 'all' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Tudo
                  </button>
                  <button 
                    onClick={() => setTimeFilter('24h')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${timeFilter === '24h' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    24h
                  </button>
                  <button 
                    onClick={() => setTimeFilter('week')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${timeFilter === 'week' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    7d
                  </button>
                </div>

                {/* Filtro de Score */}
                <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                  <button 
                    onClick={() => setScoreFilter('all')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${scoreFilter === 'all' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Todos
                  </button>
                  <button 
                    onClick={() => setScoreFilter('high')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${scoreFilter === 'high' ? 'bg-green-900/40 text-green-400 shadow-sm border border-green-500/20' : 'text-slate-400 hover:text-green-400'}`}
                  >
                    Bom
                  </button>
                  <button 
                    onClick={() => setScoreFilter('medium')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${scoreFilter === 'medium' ? 'bg-yellow-900/40 text-yellow-400 shadow-sm border border-yellow-500/20' : 'text-slate-400 hover:text-yellow-400'}`}
                  >
                    Médio
                  </button>
                   <button 
                    onClick={() => setScoreFilter('low')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${scoreFilter === 'low' ? 'bg-red-900/40 text-red-400 shadow-sm border border-red-500/20' : 'text-slate-400 hover:text-red-400'}`}
                  >
                    Crítico
                  </button>
                </div>
              </div>
            </div>
            
            {filteredHistory.length === 0 ? (
               <div className="text-center py-8 text-slate-500 bg-slate-900/30 rounded-lg border border-slate-800 border-dashed">
                 <p className="text-sm italic">Nenhuma análise encontrada com os filtros atuais.</p>
               </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {filteredHistory.map((item, index) => (
                  <HistoryItem key={index} item={item} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Analysis Panel (Right Side) */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 overflow-y-auto">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-400" />
            Diagnóstico Atual
          </h3>

          {!analysisResult ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 border-2 border-dashed border-slate-700 rounded-xl">
              <Video className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm text-center px-4">Faça upload de um frame ou selecione "Analisar" para gerar um relatório de saúde do rebanho.</p>
            </div>
          ) : (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Score Card */}
              <div className="flex items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-700">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Health Score</p>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-3xl font-bold ${analysisResult.healthScore > 75 ? 'text-green-400' : analysisResult.healthScore > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {analysisResult.healthScore}
                    </span>
                    <span className="text-slate-500">/100</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Animais</p>
                  <span className="text-2xl font-bold text-white">{analysisResult.cattleCount}</span>
                </div>
              </div>

              {/* Summary */}
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-2">Resumo Técnico</h4>
                <p className="text-sm text-slate-400 leading-relaxed bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                  {analysisResult.rawAnalysis}
                </p>
              </div>

              {/* Issues List */}
              {analysisResult.identifiedIssues.length > 0 && (
                <div>
                   <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                     <AlertTriangle className="w-4 h-4 text-yellow-500" />
                     Pontos de Atenção
                   </h4>
                   <div className="space-y-2">
                     {analysisResult.identifiedIssues.map((issue, idx) => (
                       <IssueItem key={idx} issue={issue} />
                     ))}
                   </div>
                </div>
              )}

              {/* Recommendations */}
              <div>
                 <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                   <CheckCircle className="w-4 h-4 text-blue-500" />
                   Recomendações
                 </h4>
                 <ul className="space-y-2">
                   {analysisResult.recommendations.map((rec, idx) => (
                     <li key={idx} className="text-sm text-slate-400 pl-4 border-l-2 border-blue-500/50">
                       {rec}
                     </li>
                   ))}
                 </ul>
              </div>

              <div className="pt-4 border-t border-slate-700">
                <p className="text-xs text-slate-600 text-center">
                  Análise gerada pelo Gemini 2.5 Flash • {new Date(analysisResult.timestamp).toLocaleTimeString()}
                </p>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default LiveMonitor;
