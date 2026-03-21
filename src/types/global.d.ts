import type { DependencyStatus, InstallerStep } from '../../electron/types';

declare global {
  interface Window {
    desktopAPI: {
      checkDependencies: () => Promise<DependencyStatus[]>;
      installDependency: (id: string) => Promise<InstallerStep>;
      setOnboardingComplete: (value: boolean) => Promise<void>;
      getOnboardingComplete: () => Promise<string>;
      listProjects: () => Promise<Array<{ id: string; title: string; data: string; updated_at: string }>>;
      saveProject: (payload: { id: string; title: string; data: string }) => Promise<void>;
      getSetting: (key: string) => Promise<string | null>;
      setSetting: (payload: { key: string; value: string }) => Promise<void>;
      exportManuscript: (content: string) => Promise<{ ok: boolean; filePath?: string }>;
    };
  }
}

export {};
