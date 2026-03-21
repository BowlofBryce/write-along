export type StructureType = 'frontMatter' | 'part' | 'chapter' | 'scene' | 'note';

export type StructureNode = {
  id: string;
  parentId: string | null;
  type: StructureType;
  title: string;
  order: number;
  expanded: boolean;
  metadata: {
    wordCount: number;
    status?: 'Draft' | 'Revised' | 'Final';
    pov?: string;
    tags: string[];
  };
  content: unknown;
};

export type MemoryObject = {
  id: string;
  text: string;
  sources: Array<{ nodeId: string; quote: string }>;
  importance: number;
  durability: number;
  retrievalPriority: number;
  confidence: number;
  state: 'active' | 'inactive' | 'archived';
  userPinned: boolean;
  userEdited: boolean;
  contradiction?: string;
  intentionalAmbiguity?: boolean;
  linkedMemoryIds: string[];
  lastTouchedAt: string;
};

export type Suggestion = {
  id: string;
  type: 'continuity' | 'callback' | 'tone' | 'pacing';
  title: string;
  detail: string;
  sourceNodeId?: string;
};

export type StoryProject = {
  id: string;
  title: string;
  structure: StructureNode[];
  selectedNodeId: string;
  memories: MemoryObject[];
  suggestions: Suggestion[];
  updatedAt: string;
};

export type FormattingCommand = {
  id: string;
  scope: 'selection' | 'scene' | 'chapter' | 'manuscript';
  target: 'bodyParagraph' | 'chapterTitle' | 'sceneBreak' | 'all';
  operation:
    | { type: 'setAlignment'; value: 'left' | 'center' | 'right' | 'justify' }
    | { type: 'setFont'; family: string; size: number }
    | { type: 'setLineSpacing'; value: number }
    | { type: 'setFirstLineIndent'; value: number }
    | { type: 'setSceneBreak'; value: 'asterisks' | 'rule' };
};
