export type DependencyStatus = {
  id: string;
  name: string;
  purpose: string;
  installed: boolean;
  installHint: string;
  details?: string;
};

export type InstallerStep = {
  id: string;
  label: string;
  status: 'idle' | 'running' | 'success' | 'failed';
  logs: string[];
};
