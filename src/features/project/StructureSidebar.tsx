import { Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAppStore } from '@/app/store';

export function StructureSidebar(): JSX.Element {
  const project = useAppStore((s) => s.project);
  const selectNode = useAppStore((s) => s.selectNode);
  const addNode = useAppStore((s) => s.addNode);
  const deleteNode = useAppStore((s) => s.deleteNode);
  const [query, setQuery] = useState('');

  const nodes = useMemo(
    () => project.structure.filter((n) => n.title.toLowerCase().includes(query.toLowerCase())).sort((a, b) => a.order - b.order),
    [project.structure, query],
  );

  return (
    <aside className="w-80 border-r border-black/5 dark:border-white/10 p-3 bg-white/50 dark:bg-surface-900/40 overflow-y-auto">
      <div className="text-sm font-semibold mb-3">Structure</div>
      <div className="relative mb-3">
        <Search size={14} className="absolute left-2 top-2.5 text-slate-400" />
        <input className="input pl-7" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search scenes and chapters" />
      </div>
      <div className="flex gap-2 mb-3">
        <button className="btn-secondary flex-1" onClick={() => addNode('chapter')}><Plus size={14} /> Chapter</button>
        <button className="btn-secondary flex-1" onClick={() => addNode('scene', project.selectedNodeId)}><Plus size={14} /> Scene</button>
      </div>
      <div className="space-y-1">
        {nodes.map((node) => (
          <button
            key={node.id}
            className={`w-full rounded-xl p-3 text-left transition ${project.selectedNodeId === node.id ? 'bg-indigo-500/20 border border-indigo-400/30' : 'hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'}`}
            onClick={() => selectNode(node.id)}
          >
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium">{node.title}</div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{node.metadata.wordCount}</span>
                <button
                  className="chip"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNode(node.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{node.type} · {node.metadata.status ?? 'Draft'}</div>
          </button>
        ))}
      </div>
    </aside>
  );
}
