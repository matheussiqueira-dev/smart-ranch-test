import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnalysisResult, CameraFeed, IdentifiedIssue } from '../types';
import { analyzeFrame, fetchHistory } from '../services/ai';
import { CAMERAS, INITIAL_HISTORY } from '../data';
import { Activity, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Download, MapPin, Upload, Video } from './Icons';
import { Badge, Button, Card, SectionHeader } from './ui';

const LOCAL_STORAGE_KEY = 'smart_ranch_history';

const IssueItem = ({ issue }: { issue: IdentifiedIssue }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm text-white"
      >
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-400"></span>
          {issue.issue}
        </span>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {isOpen && (
        <div className="space-y-3 border-t border-amber-500/20 px-4 py-3 text-sm text-amber-50/90">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-amber-200/70">Observação</p>
            <p className="mt-2">{issue.description}</p>
          </div>
          {issue.possibleCauses.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-amber-200/70">Possíveis causas</p>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                {issue.possibleCauses.map((cause, idx) => (
                  <li key={idx}>{cause}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const HistoryItem = ({ item }: { item: AnalysisResult }) => {
  const [expanded, setExpanded] = useState(false);

  const tone = item.healthScore > 80 ? 'success' : item.healthScore > 60 ? 'warning' : 'danger';

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30">
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-medium">
              {new Date(item.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </span>
            <Badge tone={tone}>{item.healthScore}</Badge>
          </div>
          <p className="line-clamp-2 text-sm text-white/80" title={item.rawAnalysis}>
            {item.rawAnalysis}
          </p>
        </div>

        <Button variant="ghost" onClick={() => setExpanded((prev) => !prev)}>
          {expanded ? 'Ocultar' : 'Detalhes'}
        </Button>
      </div>

      {expanded && (
        <div className="space-y-4 border-t border-white/10 px-4 py-4 text-sm text-white/80">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">Análise completa</p>
            <p className="mt-2 rounded-2xl border border-white/10 bg-black/20 p-3">{item.rawAnalysis}</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {item.identifiedIssues.length > 0 && (
              <div className="space-y-2">
                <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  <AlertTriangle className="h-3 w-3 text-amber-300" />
                  Problemas detectados
                </p>
                <div className="space-y-2">
                  {item.identifiedIssues.map((issue, idx) => (
                    <div key={idx} className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                      <p className="text-sm font-semibold text-amber-100">{issue.issue}</p>
                      <p className="mt-1 text-xs text-amber-50/80">{issue.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {item.recommendations.length > 0 && (
              <div className="space-y-2">
                <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  <CheckCircle className="h-3 w-3 text-emerald-300" />
                  Recomendações
                </p>
                <ul className="space-y-2">
                  {item.recommendations.map((rec, idx) => (
                    <li key={idx} className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2">
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
  const [selectedCamera, setSelectedCamera] = useState<CameraFeed>(CAMERAS[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'all' | '24h' | 'week'>('all');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [history, setHistory] = useState<AnalysisResult[]>(() => {
    try {
      const savedHistory = localStorage.getItem(LOCAL_STORAGE_KEY);
      return savedHistory ? JSON.parse(savedHistory) : INITIAL_HISTORY;
    } catch (error) {
      console.error('Erro ao carregar histórico do localStorage:', error);
      return INITIAL_HISTORY;
    }
  });

  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      try {
        const remoteHistory = await fetchHistory();
        if (isMounted && remoteHistory.length > 0) {
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

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Erro ao salvar histórico no localStorage:', error);
    }
  }, [history]);

  const cameraHistory = useMemo(() => {
    return history
      .filter((item) => item.cameraId === selectedCamera.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [history, selectedCamera.id]);

  const avgScore = useMemo(() => {
    return cameraHistory.length
      ? Math.round(cameraHistory.reduce((acc, curr) => acc + curr.healthScore, 0) / cameraHistory.length)
      : 0;
  }, [cameraHistory]);

  const criticalCount = useMemo(() => cameraHistory.filter((item) => item.healthScore <= 60).length, [cameraHistory]);
  const lastAnalysis = cameraHistory[0];

  const filteredHistory = useMemo(() => {
    return cameraHistory.filter((item) => {
      const date = new Date(item.timestamp);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());

      if (timeFilter === '24h' && diffTime > 1000 * 60 * 60 * 24) return false;
      if (timeFilter === 'week' && diffTime > 1000 * 60 * 60 * 24 * 7) return false;

      if (scoreFilter === 'high' && item.healthScore <= 80) return false;
      if (scoreFilter === 'medium' && (item.healthScore > 80 || item.healthScore <= 60)) return false;
      if (scoreFilter === 'low' && item.healthScore > 60) return false;

      return true;
    });
  }, [cameraHistory, scoreFilter, timeFilter]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setUploadedImage(base64String);
      setAnalysisResult(null);
    };
    reader.readAsDataURL(file);
  };

  const saveSnapshot = async () => {
    const imageSrc = uploadedImage || selectedCamera.thumbnailUrl;
    if (!imageSrc) return;

    setIsSavingSnapshot(true);

    try {
      const now = new Date();
      const timestampStr = now.toISOString().replace(/[:.]/g, '-');
      const filename = `snapshot-${selectedCamera.id}-${timestampStr}.jpg`;

      const response = await fetch(imageSrc);
      if (!response.ok) throw new Error('Falha ao buscar imagem');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao salvar snapshot:', error);
      alert('Não foi possível salvar a imagem.');
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
        alert('Para esta demonstração, faça upload de um frame para simular a captura da câmera.');
        setIsAnalyzing(false);
        return;
      }

      const base64Data = imageToAnalyze.split(',')[1];
      const result = await analyzeFrame(base64Data, selectedCamera.id);
      const resultWithCamera = { ...result, cameraId: selectedCamera.id };

      setAnalysisResult(resultWithCamera);
      setHistory((prev) => [resultWithCamera, ...prev]);
    } catch (error) {
      console.error(error);
      alert('Erro ao analisar imagem. Verifique se o backend está rodando e se a API Key está configurada.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exportHistory = () => {
    try {
      setExporting(true);
      const data = JSON.stringify(cameraHistory, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `historico-${selectedCamera.id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar histórico', error);
      alert('Não foi possível exportar o histórico.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Monitoramento Vivo"
        subtitle="Selecione uma câmera e gere diagnósticos visuais em tempo real."
        action={
          <>
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" />
              Carregar frame
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
            <Button variant="ghost" onClick={exportHistory} disabled={exporting}>
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">Saúde média</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-semibold ${avgScore >= 80 ? 'text-emerald-200' : avgScore >= 60 ? 'text-amber-200' : 'text-rose-200'}`}>
              {avgScore || '—'}
            </span>
            <span className="text-xs text-[color:var(--muted)]">/100</span>
          </div>
          <p className="mt-2 text-xs text-[color:var(--muted)]">Média dos últimos registros.</p>
        </Card>
        <Card>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">Alertas críticos</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-rose-200">{criticalCount}</span>
            <span className="text-xs text-[color:var(--muted)]">no histórico</span>
          </div>
          <p className="mt-2 text-xs text-[color:var(--muted)]">Priorize resposta imediata.</p>
        </Card>
        <Card>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">Última análise</p>
          <p className="mt-3 text-lg font-semibold text-white">
            {lastAnalysis ? new Date(lastAnalysis.timestamp).toLocaleString('pt-BR') : '—'}
          </p>
          <p className="mt-2 text-xs text-[color:var(--muted)]">Dados sincronizados com playbooks.</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
        <div className="space-y-6">
          <Card className="relative overflow-hidden p-0">
            <div className="relative aspect-video overflow-hidden">
              <img
                src={uploadedImage || selectedCamera.thumbnailUrl}
                alt={`Feed da câmera ${selectedCamera.name}`}
                className="h-full w-full object-cover"
              />
              <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white">
                <span className="mr-2 inline-flex h-2 w-2 animate-pulse rounded-full bg-rose-500"></span>
                Ao vivo
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-6 py-5">
                <h3 className="font-display text-xl text-white">{selectedCamera.name}</h3>
                <div className="mt-1 flex items-center gap-2 text-sm text-white/70">
                  <MapPin className="h-4 w-4" />
                  {selectedCamera.location}
                </div>
              </div>
              <div className="absolute right-4 top-4 flex items-center gap-2">
                <Button variant="secondary" onClick={saveSnapshot} disabled={isSavingSnapshot}>
                  <Download className="h-4 w-4" />
                  Snapshot
                </Button>
                <Button variant="primary" onClick={runAnalysis} disabled={isAnalyzing}>
                  {isAnalyzing ? 'Analisando...' : 'Analisar'}
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {CAMERAS.map((cam) => (
              <button
                key={cam.id}
                onClick={() => {
                  setSelectedCamera(cam);
                  setUploadedImage(null);
                  setAnalysisResult(null);
                }}
                className={`group relative overflow-hidden rounded-2xl border transition ${
                  selectedCamera.id === cam.id
                    ? 'border-[color:var(--accent-2)] shadow-[0_0_30px_rgba(122,211,166,0.2)]'
                    : 'border-white/10 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={cam.thumbnailUrl} alt={cam.name} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>
                <div className="absolute bottom-2 left-3 text-xs font-semibold text-white drop-shadow">{cam.name}</div>
              </button>
            ))}
          </div>

          <Card>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-display text-lg text-white">Histórico da câmera</h3>
                <p className="text-sm text-[color:var(--muted)]">{selectedCamera.name}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="flex rounded-full border border-white/10 bg-black/30 p-1 text-xs">
                  {['all', '24h', 'week'].map((value) => (
                    <Button
                      key={value}
                      variant={timeFilter === value ? 'primary' : 'ghost'}
                      onClick={() => setTimeFilter(value as 'all' | '24h' | 'week')}
                    >
                      {value === 'all' ? 'Tudo' : value === '24h' ? '24h' : '7d'}
                    </Button>
                  ))}
                </div>
                <div className="flex rounded-full border border-white/10 bg-black/30 p-1 text-xs">
                  {['all', 'high', 'medium', 'low'].map((value) => (
                    <Button
                      key={value}
                      variant={scoreFilter === value ? 'primary' : 'ghost'}
                      onClick={() => setScoreFilter(value as 'all' | 'high' | 'medium' | 'low')}
                    >
                      {value === 'all' ? 'Todos' : value === 'high' ? 'Bom' : value === 'medium' ? 'Médio' : 'Crítico'}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-white/10 border-dashed bg-black/30 p-8 text-center text-sm text-[color:var(--muted)]">
                Nenhuma análise encontrada com os filtros atuais.
              </div>
            ) : (
              <div className="mt-6 space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {filteredHistory.map((item, index) => (
                  <HistoryItem key={`${item.timestamp}-${index}`} item={item} />
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[color:var(--accent-2)]" />
            <h3 className="font-display text-lg text-white">Diagnóstico atual</h3>
          </div>

          {!analysisResult ? (
            <div className="mt-6 flex h-64 flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 border-dashed bg-black/30 text-center text-sm text-[color:var(--muted)]">
              <Video className="h-10 w-10 opacity-60" />
              Faça upload de um frame e selecione analisar para gerar o relatório.
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">Health score</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{analysisResult.healthScore}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">Animais</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{analysisResult.cattleCount}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">Resumo técnico</p>
                <p className="mt-2 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white/80">
                  {analysisResult.rawAnalysis}
                </p>
              </div>

              {analysisResult.identifiedIssues.length > 0 && (
                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                    <AlertTriangle className="h-3 w-3 text-amber-300" />
                    Pontos de atenção
                  </p>
                  <div className="space-y-2">
                    {analysisResult.identifiedIssues.map((issue, idx) => (
                      <IssueItem key={idx} issue={issue} />
                    ))}
                  </div>
                </div>
              )}

              {analysisResult.recommendations.length > 0 && (
                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                    <CheckCircle className="h-3 w-3 text-emerald-300" />
                    Recomendações
                  </p>
                  <ul className="space-y-2">
                    {analysisResult.recommendations.map((rec, idx) => (
                      <li key={idx} className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border-t border-white/10 pt-4 text-center text-xs text-[color:var(--muted)]">
                Análise gerada pelo motor de IA • {new Date(analysisResult.timestamp).toLocaleTimeString('pt-BR')}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default LiveMonitor;
