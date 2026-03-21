import { Moon, Sun, Download, Focus, BookOpen } from 'lucide-react';
import { useAppStore } from '@/app/store';
import { parseFormattingRequest } from '@/lib/formattingParser';

export function TopToolbar(): JSX.Element {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const toggleFocusMode = useAppStore((s) => s.toggleFocusMode);
  const manuscriptMode = useAppStore((s) => s.manuscriptMode);
  const setManuscriptMode = useAppStore((s) => s.setManuscriptMode);
  const queueFormattingCommands = useAppStore((s) => s.queueFormattingCommands);
  const project = useAppStore((s) => s.project);

  async function exportMarkdown(): Promise<void> {
    const content = project.structure.map((n) => `## ${n.title}\n\n${JSON.stringify(n.content)}`).join('\n\n');
    await window.desktopAPI.exportManuscript(content);
  }

  return (
    <div className="h-14 px-4 border-b border-black/5 dark:border-white/10 bg-white/90 dark:bg-surface-950/90 backdrop-blur flex items-center gap-3">
      <div className="font-semibold tracking-tight">{project.title}</div>
      <button className="toolbar-btn" onClick={() => queueFormattingCommands(parseFormattingRequest('justify all body paragraphs'))}>AI Format</button>
      <button className="toolbar-btn" onClick={() => setManuscriptMode(manuscriptMode === 'draft' ? 'page' : 'draft')}><BookOpen size={15} /> {manuscriptMode === 'draft' ? 'Draft' : 'Page'}</button>
      <button className="toolbar-btn" onClick={toggleFocusMode}><Focus size={15} /> Focus</button>
      <button className="toolbar-btn" onClick={exportMarkdown}><Download size={15} /> Export</button>
      <div className="ml-auto" />
      <button className="toolbar-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />} {theme === 'dark' ? 'Light' : 'Dark'}
      </button>
    </div>
  );
}
