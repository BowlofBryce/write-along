import { useEffect, useState } from 'react';
import { OnboardingFlow } from '@/features/onboarding/OnboardingFlow';
import { MainWorkspace } from '@/features/layout/MainWorkspace';
import { useAppStore } from './store';
import type { MemoryObject, StoryProject } from '@/types/models';

function normalizeMemory(projectId: string, memory: any): MemoryObject {
  const now = new Date().toISOString();
  return {
    id: memory.id ?? crypto.randomUUID(),
    projectId,
    content: memory.content ?? memory.text ?? '',
    explicitness: memory.explicitness ?? 'explicit',
    sources: (memory.sources ?? []).map((s: any) => ({ nodeId: s.nodeId, quote: s.quote, capturedAt: s.capturedAt ?? now })),
    userNotes: memory.userNotes ?? '',
    linkedEntityIds: memory.linkedEntityIds ?? [],
    linkedMemoryIds: memory.linkedMemoryIds ?? [],
    contradictionIds: memory.contradictionIds ?? [],
    importance: memory.importance ?? 0.5,
    durability: memory.durability ?? 0.5,
    scope: memory.scope ?? 0.5,
    retrievalPriority: memory.retrievalPriority ?? 0.5,
    confidence: memory.confidence ?? 0.5,
    recencyScore: memory.recencyScore ?? 1,
    activationCount: memory.activationCount ?? 0,
    dependencyCount: memory.dependencyCount ?? 0,
    state: memory.state ?? 'active',
    userPinned: Boolean(memory.userPinned),
    userEdited: Boolean(memory.userEdited),
    intentionalAmbiguity: Boolean(memory.intentionalAmbiguity),
    createdAt: memory.createdAt ?? now,
    updatedAt: memory.updatedAt ?? now,
    lastRetrievedAt: memory.lastRetrievedAt,
  };
}

function normalizeProject(data: any): StoryProject {
  const projectId = data.id ?? crypto.randomUUID();
  return {
    ...data,
    id: projectId,
    memories: (data.memories ?? []).map((memory: any) => normalizeMemory(projectId, memory)),
  };
}

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
          const parsed = JSON.parse(projects[0].data);
          setProject(normalizeProject(parsed));
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
