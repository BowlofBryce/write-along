import { TopToolbar } from './TopToolbar';
import { StructureSidebar } from '@/features/project/StructureSidebar';
import { EditorPane } from '@/features/editor/EditorPane';
import { AIPanel } from '@/features/ai/AIPanel';
import { StatusBar } from './StatusBar';
import { useAppStore } from '@/app/store';

export function MainWorkspace(): JSX.Element {
  const focusMode = useAppStore((s) => s.focusMode);

  return (
    <div className="h-screen w-screen bg-surface-50 dark:bg-surface-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <TopToolbar />
      <div className="flex-1 flex overflow-hidden">
        {!focusMode && <StructureSidebar />}
        <EditorPane />
        {!focusMode && <AIPanel />}
      </div>
      <StatusBar />
    </div>
  );
}
