import { useEffect, useMemo, useState } from 'react';
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
  const addSuggestion = useAppStore((s) => s.addSuggestion);
  const uniqueSuggestions = useMemo(
    () =>
      suggestions.filter(
        (suggestion, index, all) =>
          all.findIndex((candidate) => candidate.title === suggestion.title && candidate.detail === suggestion.detail) === index,
      ),
    [suggestions],
  );
  const latestSuggestion = uniqueSuggestions[0];
  const earlierSuggestions = uniqueSuggestions.slice(1, 5);

  return (
    <div className="space-y-3">
      <article className="card">
        <div className="text-xs uppercase tracking-wider text-indigo-400 mb-2">Live coach</div>
        {!latestSuggestion && (
          <p className="text-sm text-slate-400">Suggestions appear here while you write. We only refresh when your draft meaningfully changes.</p>
        )}
        {latestSuggestion && (
          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-wider text-slate-400">{latestSuggestion.type}</p>
              <h3 className="font-medium mt-1">{latestSuggestion.title}</h3>
              <p className="text-sm text-slate-300 mt-1">{latestSuggestion.detail}</p>
            </div>
            {earlierSuggestions.length > 0 && (
              <div className="space-y-2">
                {earlierSuggestions.map((suggestion) => (
                  <p key={suggestion.id} className="text-sm text-slate-400">• {suggestion.detail}</p>
                ))}
              </div>
            )}
            <div className="flex gap-2 text-xs">
              <button
                className="chip"
                onClick={async () => {
                  const response = await window.desktopAPI.generateAI(`Explain this writing suggestion briefly and concretely:\nTitle: ${latestSuggestion.title}\nDetail: ${latestSuggestion.detail}`);
                  addSuggestion(`Why: ${latestSuggestion.title}`, response);
                }}
              >
                Ask why
              </button>
            </div>
          </div>
        )}
      </article>
    </div>
  );
}

function AskTab(): JSX.Element {
  const [query, setQuery] = useState('');
  const memories = useAppStore((s) => s.project.memories);
  const active = useMemo(() => buildActiveMemorySlate(memories), [memories]);
  const [answer, setAnswer] = useState('Ask about continuity, callbacks, contradictions, or unresolved threads.');

  async function ask(): Promise<void> {
    if (!query.trim()) return;
    const relevant = active.filter((m) => query.toLowerCase().split(' ').some((word) => m.content.toLowerCase().includes(word)));
    const memoryContext = relevant.length
      ? relevant.map((m) => `- ${m.content} (confidence ${Math.round(m.confidence * 100)}%)`).join('\n')
      : '- No direct memory matches.';
    const aiAnswer = await window.desktopAPI.generateAI(
      `You are assisting a novelist. Answer this query in <= 120 words.\nQuery: ${query}\nMemory context:\n${memoryContext}`,
    );
    setAnswer(aiAnswer);
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
  const removeMemory = useAppStore((s) => s.removeMemory);
  const activeNodeId = useAppStore((s) => s.project.selectedNodeId);
  const extractMemoriesFromNode = useAppStore((s) => s.extractMemoriesFromNode);
  const [query, setQuery] = useState('');
  return (
    <div className="space-y-3">
      <button className="btn-secondary w-full" onClick={() => extractMemoriesFromNode(activeNodeId)}>Refresh memory from current scene</button>
      <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search memory" />
      {memories
        .filter((m) => m.content.toLowerCase().includes(query.toLowerCase()))
        .map((memory) => (
          <div key={memory.id} className="card">
            <textarea className="input min-h-16" value={memory.content} onChange={(e) => updateMemory({ ...memory, content: e.target.value, userEdited: true, updatedAt: new Date().toISOString() })} />
            <div className="mt-2 text-xs text-slate-400">State: {memory.state} · Confidence: {Math.round(memory.confidence * 100)}% · Activations: {memory.activationCount}</div>
            {memory.sources[0] && <div className="mt-1 text-xs text-slate-500">Source: {memory.sources[0].nodeId} — “{memory.sources[0].quote}”</div>}
            <div className="mt-2 flex gap-2 text-xs">
              <button className="chip" onClick={() => updateMemory({ ...memory, userPinned: !memory.userPinned })}>{memory.userPinned ? 'Unpin' : 'Pin'}</button>
              <button className="chip" onClick={() => updateMemory({ ...memory, retrievalPriority: Math.max(0, memory.retrievalPriority - 0.15) })}>Demote</button>
              <button className="chip" onClick={() => updateMemory({ ...memory, state: 'archived' })}>Archive</button>
              <button className="chip" onClick={() => updateMemory({ ...memory, state: 'contradicted' })}>Mark wrong</button>
              <button className="chip" onClick={() => updateMemory({ ...memory, intentionalAmbiguity: !memory.intentionalAmbiguity })}>Ambiguous</button>
              <button className="chip" onClick={() => removeMemory(memory.id)}>Delete</button>
            </div>
          </div>
        ))}
    </div>
  );
}

function ActionsTab(): JSX.Element {
  const queueFormattingCommands = useAppStore((s) => s.queueFormattingCommands);
  const addSuggestion = useAppStore((s) => s.addSuggestion);
  const project = useAppStore((s) => s.project);
  const activeNode = project.structure.find((n) => n.id === project.selectedNodeId);
  const [prompt, setPrompt] = useState('make all chapter titles centered and larger');
  const [result, setResult] = useState('Run a content or story action to see AI output.');
  return (
    <div className="space-y-3">
      <div className="card text-sm">
        <div className="font-medium mb-2">Formatting Actions</div>
        <textarea className="input min-h-20" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        <button className="btn-primary mt-2 w-full" onClick={() => queueFormattingCommands(parseFormattingRequest(prompt))}>Parse to structured command</button>
      </div>
      <div className="card text-sm">
        <div className="font-medium">Content Actions</div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <button className="chip" onClick={async () => setResult(await window.desktopAPI.generateAI(`Rewrite this passage with clearer flow:\n${JSON.stringify(activeNode?.content ?? '')}`))}>Rewrite</button>
          <button className="chip" onClick={async () => setResult(await window.desktopAPI.generateAI(`Shorten this passage by about 30% while preserving voice:\n${JSON.stringify(activeNode?.content ?? '')}`))}>Shorten</button>
          <button className="chip" onClick={async () => setResult(await window.desktopAPI.generateAI(`Expand this passage with sensory detail:\n${JSON.stringify(activeNode?.content ?? '')}`))}>Expand</button>
          <button className="chip" onClick={async () => setResult(await window.desktopAPI.generateAI(`Rewrite this in a literary voice, preserving meaning:\n${JSON.stringify(activeNode?.content ?? '')}`))}>Literary voice</button>
        </div>
      </div>
      <div className="card text-sm">
        <div className="font-medium">Story Operations</div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <button className="chip" onClick={async () => setResult(await window.desktopAPI.generateAI(`Summarize this story scene in 4 bullets:\n${JSON.stringify(activeNode?.content ?? '')}`))}>Summarize scene</button>
          <button
            className="chip"
            onClick={async () => {
              const response = await window.desktopAPI.generateAI(`Extract one durable memory fact from this scene in one sentence:\n${JSON.stringify(activeNode?.content ?? '')}`);
              addSuggestion('Extracted memory candidate', response);
              setResult(response);
            }}
          >
            Extract memory
          </button>
          <button className="chip" onClick={async () => setResult(await window.desktopAPI.generateAI('Explain the value of continuity suggestions in one short paragraph.'))}>Explain suggestion</button>
        </div>
      </div>
      <pre className="card whitespace-pre-wrap text-xs">{result}</pre>
    </div>
  );
}

function SettingsTab(): JSX.Element {
  const setOnboardingComplete = useAppStore((s) => s.setOnboardingComplete);
  const [model, setModel] = useState('llama3.2');
  const [baseUrl, setBaseUrl] = useState('http://127.0.0.1:11434');
  const [models, setModels] = useState<string[]>([]);
  const [status, setStatus] = useState('Load available models, then save your preferred defaults.');

  useEffect(() => {
    (async () => {
      const savedModel = await window.desktopAPI.getSetting('ai.model');
      const savedBaseUrl = await window.desktopAPI.getSetting('ai.baseUrl');
      if (savedModel) setModel(savedModel);
      if (savedBaseUrl) setBaseUrl(savedBaseUrl);
    })();
  }, []);

  async function refreshModels(): Promise<void> {
    await window.desktopAPI.setSetting({ key: 'ai.baseUrl', value: baseUrl.trim() });
    const available = await window.desktopAPI.listAIModels();
    setModels(available);
    setStatus(available.length ? `Found ${available.length} model(s).` : 'No models returned. Check runtime URL and pull a model.');
  }

  async function saveAISettings(): Promise<void> {
    await window.desktopAPI.setSetting({ key: 'ai.model', value: model.trim() });
    await window.desktopAPI.setSetting({ key: 'ai.baseUrl', value: baseUrl.trim() });
    setStatus(`Saved AI settings. Active model: ${model.trim()}`);
  }

  return (
    <div className="space-y-3 card text-sm">
      <div className="font-medium">Diagnostics</div>
      <div className="space-y-2">
        <label className="block text-xs text-slate-400">Local runtime URL</label>
        <input className="input" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="http://127.0.0.1:11434" />
      </div>
      <div className="space-y-2">
        <label className="block text-xs text-slate-400">Default model</label>
        <input className="input" value={model} onChange={(e) => setModel(e.target.value)} placeholder="llama3.2" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button className="btn-secondary" onClick={refreshModels}>Refresh models</button>
        <button className="btn-primary" onClick={saveAISettings}>Save AI settings</button>
      </div>
      {models.length > 0 && (
        <div className="rounded-xl border border-white/10 p-3 bg-white/5">
          <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">Available models</div>
          <div className="flex flex-wrap gap-2">
            {models.map((m) => (
              <button key={m} className="chip" onClick={() => setModel(m)}>{m}</button>
            ))}
          </div>
        </div>
      )}
      <button className="btn-secondary" onClick={async () => {
        await window.desktopAPI.setOnboardingComplete(false);
        setOnboardingComplete(false);
      }}>Reset onboarding & re-check dependencies</button>
      <div className="text-slate-400">{status}</div>
      <div className="text-slate-400">AI Provider: Local runtime (Ollama). Project autosave every 2.5s.</div>
    </div>
  );
}
