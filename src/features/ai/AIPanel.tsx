import { useMemo, useState } from 'react';
import { useAppStore } from '@/app/store';
import { parseFormattingRequest } from '@/lib/formattingParser';
import { buildActiveMemorySlate } from '@/lib/memoryEngine';

const tabs = [
  { id: 'suggestions', label: 'Live Suggestions' },
  { id: 'ask', label: 'Ask the Story' },
  { id: 'memory', label: 'Memory Bank' },
  { id: 'actions', label: 'AI Actions' },
  { id: 'settings', label: 'Settings' },
] as const;

export function AIPanel(): JSX.Element {
  const selectedTab = useAppStore((s) => s.selectedTab);
  const setSelectedTab = useAppStore((s) => s.setSelectedTab);

  return (
    <aside className="w-[430px] border-l border-black/5 dark:border-white/10 bg-white/60 dark:bg-surface-900/30 p-3 overflow-y-auto">
      <div className="grid grid-cols-2 gap-2 mb-3">
        {tabs.map((tab) => (
          <button key={tab.id} className={`tab-btn ${selectedTab === tab.id ? 'tab-active' : ''}`} onClick={() => setSelectedTab(tab.id)}>{tab.label}</button>
        ))}
      </div>
      {selectedTab === 'suggestions' && <SuggestionsTab />}
      {selectedTab === 'ask' && <AskTab />}
      {selectedTab === 'memory' && <MemoryTab />}
      {selectedTab === 'actions' && <ActionsTab />}
      {selectedTab === 'settings' && <SettingsTab />}
    </aside>
  );
}

function SuggestionsTab(): JSX.Element {
  const suggestions = useAppStore((s) => s.project.suggestions);
  return (
    <div className="space-y-3">
      {suggestions.map((s) => (
        <article key={s.id} className="card">
          <div className="text-xs uppercase tracking-wider text-indigo-400 mb-1">{s.type}</div>
          <h3 className="font-medium">{s.title}</h3>
          <p className="text-sm text-slate-400 mt-1">{s.detail}</p>
          <div className="mt-3 flex gap-2 text-xs">
            <button className="chip">Dismiss</button><button className="chip">Ask why</button><button className="chip">Pin memory</button>
          </div>
        </article>
      ))}
    </div>
  );
}

function AskTab(): JSX.Element {
  const [query, setQuery] = useState('');
  const memories = useAppStore((s) => s.project.memories);
  const active = useMemo(() => buildActiveMemorySlate(memories), [memories]);
  const [answer, setAnswer] = useState('Ask about continuity, callbacks, contradictions, or unresolved threads.');

  function ask(): void {
    if (!query.trim()) return;
    const relevant = active.filter((m) => query.toLowerCase().split(' ').some((word) => m.text.toLowerCase().includes(word)));
    setAnswer(
      relevant.length
        ? `Explicit: ${relevant[0].text}\nInference: This thread likely remains open.\nConfidence: ${Math.round(relevant[0].confidence * 100)}%`
        : 'No direct memory match. Try extracting memory from the active scene first.',
    );
  }

  return (
    <div className="space-y-3">
      <textarea className="input min-h-20" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="What unresolved threads involve Mara?" />
      <button className="btn-primary w-full" onClick={ask}>Ask</button>
      <pre className="card whitespace-pre-wrap text-sm">{answer}</pre>
    </div>
  );
}

function MemoryTab(): JSX.Element {
  const memories = useAppStore((s) => s.project.memories);
  const updateMemory = useAppStore((s) => s.updateMemory);
  const [query, setQuery] = useState('');
  return (
    <div className="space-y-3">
      <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search memory" />
      {memories
        .filter((m) => m.text.toLowerCase().includes(query.toLowerCase()))
        .map((memory) => (
          <div key={memory.id} className="card">
            <textarea className="input min-h-16" value={memory.text} onChange={(e) => updateMemory({ ...memory, text: e.target.value, userEdited: true })} />
            <div className="mt-2 flex gap-2 text-xs">
              <button className="chip" onClick={() => updateMemory({ ...memory, userPinned: !memory.userPinned })}>{memory.userPinned ? 'Unpin' : 'Pin'}</button>
              <button className="chip" onClick={() => updateMemory({ ...memory, state: 'archived' })}>Archive</button>
              <button className="chip" onClick={() => updateMemory({ ...memory, contradiction: 'Marked by user' })}>Mark wrong</button>
            </div>
          </div>
        ))}
    </div>
  );
}

function ActionsTab(): JSX.Element {
  const queueFormattingCommands = useAppStore((s) => s.queueFormattingCommands);
  const [prompt, setPrompt] = useState('make all chapter titles centered and larger');
  return (
    <div className="space-y-3">
      <div className="card text-sm">
        <div className="font-medium mb-2">Formatting Actions</div>
        <textarea className="input min-h-20" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        <button className="btn-primary mt-2 w-full" onClick={() => queueFormattingCommands(parseFormattingRequest(prompt))}>Parse to structured command</button>
      </div>
      <div className="card text-sm">
        <div className="font-medium">Content Actions</div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs"><button className="chip">Rewrite</button><button className="chip">Shorten</button><button className="chip">Expand</button><button className="chip">Literary voice</button></div>
      </div>
      <div className="card text-sm">
        <div className="font-medium">Story Operations</div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs"><button className="chip">Summarize scene</button><button className="chip">Extract memory</button><button className="chip">Explain suggestion</button></div>
      </div>
    </div>
  );
}

function SettingsTab(): JSX.Element {
  const setOnboardingComplete = useAppStore((s) => s.setOnboardingComplete);
  return (
    <div className="space-y-3 card text-sm">
      <div className="font-medium">Diagnostics</div>
      <button className="btn-secondary" onClick={async () => {
        await window.desktopAPI.setOnboardingComplete(false);
        setOnboardingComplete(false);
      }}>Reset onboarding & re-check dependencies</button>
      <div className="text-slate-400">AI Provider: Local runtime (Ollama). Project autosave every 2.5s.</div>
    </div>
  );
}
