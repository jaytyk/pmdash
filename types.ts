
export interface Project {
  id: string;
  name: string;
  manager: string;
  description: string;
  status1: string; // Dynamic 1st depth status
  status2: string; // Dynamic 2nd depth status
  startDate: string;
  endDate: string;
  milestones: Milestone[];
  tasks: WbsTask[]; // WBS Task Level (3rd depth)
  charter?: string;
  requirements?: string;
  weeklyReports: WeeklyReport[];
  retrospective?: string;
}

export interface WbsTask {
  id: string;
  parentStatus2: string; // Linking to the 2nd level status
  title: string;
  isCompleted: boolean;
  startDate?: string;
  dueDate?: string;
}

export interface Milestone {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: 'UPCOMING' | 'COMPLETED' | 'OVERDUE';
}

export interface WeeklyReport {
  id: string;
  date: string;
  content: string;
}

export type ViewType = 'LIST' | 'CALENDAR' | 'GANTT';
export type ScaleType = 'DAY' | 'MONTH' | 'QUARTER' | 'YEAR';

export interface AppState {
  projects: Project[];
  customStatus1: string[]; // Added customization for 1st depth
  customStatus2: string[];
  selectedProjectId: string | null;
  activeView: 'DASHBOARD' | 'PROJECT_DETAIL' | 'SETTINGS';
}
