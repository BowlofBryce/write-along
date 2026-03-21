import { create } from 'zustand';
import type { FormattingCommand, MemoryObject, StoryProject, StructureNode } from '@/types/models';
import { createSeedProject } from '@/lib/projectSeed';

interface AppState {
  theme: 'light' | 'dark';
  focusMode: boolean;
  manuscriptMode: 'draft' | 'page';
  onboardingComplete: boolean;
  project: StoryProject;
  formattingQueue: FormattingCommand[];
  selectedTab: 'suggestions' | 'ask' | 'memory' | 'actions' | 'settings';
  setTheme: (theme: 'light' | 'dark') => void;
  setOnboardingComplete: (value: boolean) => void;
  toggleFocusMode: () => void;
  setManuscriptMode: (mode: 'draft' | 'page') => void;
  setSelectedTab: (tab: AppState['selectedTab']) => void;
  selectNode: (id: string) => void;
  updateNodeContent: (id: string, content: unknown, wordCount: number) => void;
  addNode: (type: StructureNode['type'], parentId?: string | null) => void;
  queueFormattingCommands: (cmds: FormattingCommand[]) => void;
  updateMemory: (memory: MemoryObject) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'dark',
  focusMode: false,
  manuscriptMode: 'draft',
  onboardingComplete: false,
  project: createSeedProject(),
  formattingQueue: [],
  selectedTab: 'suggestions',
  setTheme: (theme) => set({ theme }),
  setOnboardingComplete: (onboardingComplete) => set({ onboardingComplete }),
  toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode })),
  setManuscriptMode: (manuscriptMode) => set({ manuscriptMode }),
  setSelectedTab: (selectedTab) => set({ selectedTab }),
  selectNode: (id) => set((state) => ({ project: { ...state.project, selectedNodeId: id } })),
  updateNodeContent: (id, content, wordCount) =>
    set((state) => ({
      project: {
        ...state.project,
        structure: state.project.structure.map((node) =>
          node.id === id ? { ...node, content, metadata: { ...node.metadata, wordCount } } : node,
        ),
        updatedAt: new Date().toISOString(),
      },
    })),
  addNode: (type, parentId = null) =>
    set((state) => {
      const id = crypto.randomUUID();
      const order = state.project.structure.length + 1;
      return {
        project: {
          ...state.project,
          structure: [
            ...state.project.structure,
            {
              id,
              parentId,
              type,
              title: type === 'chapter' ? `Chapter ${order}` : `Scene ${order}`,
              order,
              expanded: true,
              metadata: { wordCount: 0, status: 'Draft', tags: [] },
              content: { type: 'doc', content: [{ type: 'paragraph' }] },
            },
          ],
          selectedNodeId: id,
        },
      };
    }),
  queueFormattingCommands: (cmds) => set((state) => ({ formattingQueue: [...state.formattingQueue, ...cmds] })),
  updateMemory: (memory) =>
    set((state) => ({
      project: {
        ...state.project,
        memories: state.project.memories.map((m) => (m.id === memory.id ? memory : m)),
      },
    })),
}));
