import type { StoryProject } from '@/types/models';

export function createSeedProject(): StoryProject {
  return {
    id: crypto.randomUUID(),
    title: 'Untitled Novel',
    structure: [
      {
        id: 'chapter-1',
        parentId: null,
        type: 'chapter',
        title: 'Chapter One: The Observatory',
        order: 0,
        expanded: true,
        metadata: { wordCount: 812, status: 'Draft', tags: ['opening'], pov: 'Mara' },
        content: {
          type: 'doc',
          content: [
            { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Chapter One: The Observatory' }] },
            { type: 'paragraph', content: [{ type: 'text', text: 'The silver key was colder than stone when Mara closed her hand around it.' }] },
            { type: 'paragraph', content: [{ type: 'text', text: 'Below the observatory, the harbor lamps swayed in the rain like uncertain stars.' }] }
          ]
        }
      },
      {
        id: 'scene-1',
        parentId: 'chapter-1',
        type: 'scene',
        title: 'Scene 1: Lantern Steps',
        order: 1,
        expanded: true,
        metadata: { wordCount: 568, status: 'Draft', tags: ['mystery'], pov: 'Mara' },
        content: {
          type: 'doc',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'Elias pretended not to notice when she tucked the key inside her sleeve.' }] },
            { type: 'paragraph', content: [{ type: 'text', text: 'He only said, “If we are seen tonight, you were never with me.”' }] }
          ]
        }
      }
    ],
    selectedNodeId: 'scene-1',
    memories: [
      {
        id: 'memory-key',
        text: 'The silver key appears repeatedly and likely signals unresolved significance.',
        sources: [{ nodeId: 'chapter-1', quote: 'The silver key was colder than stone...' }],
        importance: 0.91,
        durability: 0.8,
        retrievalPriority: 0.95,
        confidence: 0.84,
        state: 'active',
        userPinned: true,
        userEdited: false,
        linkedMemoryIds: [],
        lastTouchedAt: new Date().toISOString(),
      }
    ],
    suggestions: [
      {
        id: 'sug-1',
        type: 'callback',
        title: 'Callback opportunity',
        detail: 'The key has surfaced three times; this scene could deepen its history before the midpoint.',
        sourceNodeId: 'chapter-1',
      }
    ],
    updatedAt: new Date().toISOString(),
  };
}
