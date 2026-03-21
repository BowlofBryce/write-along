import { useEffect, useMemo, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { useAppStore } from '@/app/store';

export function EditorPane(): JSX.Element {
  const project = useAppStore((s) => s.project);
  const activeNode = useMemo(() => project.structure.find((n) => n.id === project.selectedNodeId), [project]);
  const updateNodeContent = useAppStore((s) => s.updateNodeContent);
  const manuscriptMode = useAppStore((s) => s.manuscriptMode);
  const formattingQueue = useAppStore((s) => s.formattingQueue);
  const clearFormattingQueue = useAppStore((s) => s.clearFormattingQueue);
  const extractMemoriesFromNode = useAppStore((s) => s.extractMemoriesFromNode);
  const lastSuggestionUpdateRef = useRef<{ nodeId: string | null; text: string; wordCount: number; timestamp: number }>({
    nodeId: null,
    text: '',
    wordCount: 0,
    timestamp: 0,
  });

  function maybeRefreshLiveSuggestions(): void {
    if (!editor || !activeNode?.id) return;
    const text = editor.getText().trim();
    const now = Date.now();
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    const last = lastSuggestionUpdateRef.current;
    const nodeChanged = last.nodeId !== activeNode.id;
    const contentChanged = text !== last.text;
    const wordDeltaReached = Math.abs(words - last.wordCount) >= 50;
    const timeDeltaReached = now - last.timestamp >= 30_000;
    const shouldRefresh = nodeChanged || wordDeltaReached || (timeDeltaReached && contentChanged);
    if (!shouldRefresh) return;
    extractMemoriesFromNode(activeNode.id);
    lastSuggestionUpdateRef.current = {
      nodeId: activeNode.id,
      text,
      wordCount: words,
      timestamp: now,
    };
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: activeNode?.content ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    editorProps: {
      attributes: {
        class: 'editor-prose focus:outline-none min-h-[68vh] px-20 py-16',
      },
    },
    onUpdate: ({ editor: ed }) => {
      const words = ed.getText().trim().split(/\s+/).filter(Boolean).length;
      if (activeNode) updateNodeContent(activeNode.id, ed.getJSON(), words);
    },
  });

  useEffect(() => {
    if (editor && activeNode) editor.commands.setContent(activeNode.content as any, false);
  }, [activeNode?.id]);

  useEffect(() => {
    lastSuggestionUpdateRef.current = {
      nodeId: activeNode?.id ?? null,
      text: '',
      wordCount: 0,
      timestamp: 0,
    };
  }, [activeNode?.id]);

  useEffect(() => {
    if (!editor || formattingQueue.length === 0) return;
    for (const command of formattingQueue) {
      if (command.operation.type === 'setAlignment') {
        editor.chain().focus().setTextAlign(command.operation.value).run();
      }
    }
    clearFormattingQueue();
  }, [clearFormattingQueue, editor, formattingQueue]);

  useEffect(() => {
    const timer = setInterval(() => {
      void window.desktopAPI.saveProject({
        id: project.id,
        title: project.title,
        data: JSON.stringify(project),
      });
      maybeRefreshLiveSuggestions();
    }, 2500);
    return () => clearInterval(timer);
  }, [editor, project]);

  return (
    <main className="flex-1 overflow-y-auto bg-surface-100/70 dark:bg-surface-950">
      <div className={`mx-auto my-8 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-surface-900 shadow-soft ${manuscriptMode === 'page' ? 'max-w-[830px]' : 'max-w-5xl'}`}>
        <div className="px-6 py-3 border-b border-black/5 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">{activeNode?.title}</div>
        <EditorContent editor={editor} />
      </div>
    </main>
  );
}
