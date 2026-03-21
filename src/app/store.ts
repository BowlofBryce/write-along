import { create } from 'zustand';
import type { FormattingCommand, MemoryObject, StoryProject, StructureNode } from '@/types/models';
import { createSeedProject } from '@/lib/projectSeed';
import { buildActiveMemorySlate, consolidateMemories, extractCandidateMemories } from '@/lib/memoryEngine';

function contentToText(content: any): string {
  if (!content) return '';
  if (typeof content.text === 'string') return content.text;
  if (Array.isArray(content)) return content.map(contentToText).join(' ');
  if (Array.isArray(content.content)) return content.content.map(contentToText).join(' ');
  return '';
}

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
  setProject: (project: StoryProject) => void;
  selectNode: (id: string) => void;
  updateNodeContent: (id: string, content: unknown, wordCount: number) => void;
  addNode: (type: StructureNode['type'], parentId?: string | null) => void;
  deleteNode: (id: string) => void;
  queueFormattingCommands: (cmds: FormattingCommand[]) => void;
  clearFormattingQueue: () => void;
  addSuggestion: (title: string, detail: string) => void;
  removeSuggestion: (id: string) => void;
  extractMemoriesFromNode: (nodeId: string) => void;
  updateMemory: (memory: MemoryObject) => void;
  removeMemory: (id: string) => void;
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
  setProject: (project) => set({ project }),
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
  deleteNode: (id) =>
    set((state) => {
      const filtered = state.project.structure.filter((node) => node.id !== id && node.parentId !== id);
      return {
        project: {
          ...state.project,
          structure: filtered,
          selectedNodeId: filtered[0]?.id ?? state.project.selectedNodeId,
        },
      };
    }),
  queueFormattingCommands: (cmds) => set((state) => ({ formattingQueue: [...state.formattingQueue, ...cmds] })),
  clearFormattingQueue: () => set({ formattingQueue: [] }),
  addSuggestion: (title, detail) =>
    set((state) => ({
      project: {
        ...state.project,
        suggestions: [
          {
            id: crypto.randomUUID(),
            type: 'tone' as const,
            title,
            detail,
          },
          ...state.project.suggestions,
        ].slice(0, 12),
      },
    })),
  removeSuggestion: (id) =>
    set((state) => ({
      project: {
        ...state.project,
        suggestions: state.project.suggestions.filter((s) => s.id !== id),
      },
    })),
  extractMemoriesFromNode: (nodeId) =>
    set((state) => {
      const node = state.project.structure.find((n) => n.id === nodeId);
      if (!node) return state;
      const text = contentToText(node.content);
      const candidates = extractCandidateMemories(state.project.id, nodeId, text);
      const consolidated = consolidateMemories(state.project.id, state.project.memories, candidates);
      const slate = buildActiveMemorySlate(consolidated, text, 3);
      const liveSuggestions = slate.map((memory, index) => ({
        id: `live-${memory.id}-${index}`,
        type: memory.state === 'contradicted' ? 'continuity' as const : 'callback' as const,
        title: memory.state === 'contradicted' ? 'Potential contradiction detected' : 'Live continuity signal',
        detail: memory.content,
        sourceNodeId: nodeId,
      }));
      return {
        project: {
          ...state.project,
          memories: consolidated,
          suggestions: [...liveSuggestions, ...state.project.suggestions].slice(0, 20),
        },
      };
    }),
  updateMemory: (memory) =>
    set((state) => ({
      project: {
        ...state.project,
        memories: state.project.memories.map((m) => (m.id === memory.id ? memory : m)),
      },
    })),
  removeMemory: (id) =>
    set((state) => ({
      project: {
        ...state.project,
        memories: state.project.memories.filter((m) => m.id !== id),
      },
    })),
}));
