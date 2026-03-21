import { useEffect, useState } from 'react';
import { OnboardingFlow } from '@/features/onboarding/OnboardingFlow';
import { MainWorkspace } from '@/features/layout/MainWorkspace';
import { useAppStore } from './store';

export function App(): JSX.Element {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const onboardingComplete = useAppStore((s) => s.onboardingComplete);
  const setOnboardingComplete = useAppStore((s) => s.setOnboardingComplete);
  const setProject = useAppStore((s) => s.setProject);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    (async () => {
      const done = await window.desktopAPI.getOnboardingComplete();
      setOnboardingComplete(done === 'true');
      const persistedTheme = await window.desktopAPI.getSetting('theme');
      if (persistedTheme === 'light' || persistedTheme === 'dark') setTheme(persistedTheme);
      const projects = await window.desktopAPI.listProjects();
      if (projects.length > 0) {
        try {
          setProject(JSON.parse(projects[0].data));
        } catch {
          // ignore corrupt payloads and continue with seed project
        }
      }
      setBooting(false);
    })();
  }, [setOnboardingComplete, setProject, setTheme]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    void window.desktopAPI.setSetting({ key: 'theme', value: theme });
  }, [theme]);

  if (booting) {
    return <div className="h-screen w-screen bg-surface-950 text-white grid place-items-center">Loading Write Along…</div>;
  }

  if (!onboardingComplete) {
    return <OnboardingFlow onReady={() => setOnboardingComplete(true)} />;
  }

  return <MainWorkspace />;
}
