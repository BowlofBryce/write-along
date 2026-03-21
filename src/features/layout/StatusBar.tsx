import { useMemo } from 'react';
import { useAppStore } from '@/app/store';
import { buildActiveMemorySlate } from '@/lib/memoryEngine';

export function StatusBar(): JSX.Element {
  const project = useAppStore((s) => s.project);
  const totalWords = useMemo(() => project.structure.reduce((sum, n) => sum + n.metadata.wordCount, 0), [project.structure]);
  const activeNode = project.structure.find((n) => n.id === project.selectedNodeId);
  const activeSlate = buildActiveMemorySlate(project.memories);

  return (
    <div className="h-8 px-4 text-xs border-t border-black/5 dark:border-white/10 bg-white/70 dark:bg-surface-950/70 flex items-center gap-4 text-slate-500 dark:text-slate-400">
      <span>Total words: {totalWords}</span>
      <span>Selection: {activeNode?.metadata.wordCount ?? 0}</span>
      <span>Autosave: Ready</span>
      <span>AI memory slate: {activeSlate.length} active</span>
    </div>
  );
}
