export enum HealthStatus {
  HEALTHY = 'Saudável',
  WARNING = 'Atenção',
  CRITICAL = 'Crítico',
}

export interface IdentifiedIssue {
  issue: string;
  description: string;
  possibleCauses: string[];
}

export interface AnalysisResult {
  timestamp: string;
  cattleCount: number;
  identifiedIssues: IdentifiedIssue[];
  healthScore: number; // 0-100
  recommendations: string[];
  rawAnalysis: string;
  cameraId?: string; // Campo opcional para vincular análise a uma câmera
}

export interface CameraFeed {
  id: string;
  name: string;
  location: string;
  status: 'active' | 'offline';
  lastAnalysis?: AnalysisResult | null;
  thumbnailUrl: string;
}

export interface Alert {
  id: string;
  cameraId: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: Date;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}