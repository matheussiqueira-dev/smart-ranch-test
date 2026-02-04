export enum HealthStatus {
  HEALTHY = 'Saudável',
  WARNING = 'Atenção',
  CRITICAL = 'Crítico',
}

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertStatus = 'active' | 'resolved';

export type TaskStatus = 'backlog' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export type TeamStatus = 'available' | 'field' | 'offline';

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
  cameraId?: string;
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
  cameraId?: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  timestamp: string;
  location: string;
  status: AlertStatus;
}

export interface FieldTask {
  id: string;
  title: string;
  owner: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueAt: string;
  location?: string;
  notes?: string;
  sourceAlertId?: string;
}

export interface Playbook {
  id: string;
  title: string;
  trigger: string;
  steps: string[];
  severity: AlertSeverity;
  slaHours: number;
  ownerRole: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  shift: string;
  status: TeamStatus;
  focus?: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}
