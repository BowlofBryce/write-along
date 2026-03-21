import type { MemoryObject } from '@/types/models';

type CandidateMemory = {
  content: string;
  explicitness: MemoryObject['explicitness'];
  source: { nodeId: string; quote: string; capturedAt: string };
};

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

function tokenize(value: string): string[] {
  return value.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter((t) => t.length > 2);
}

function overlapScore(a: string, b: string): number {
  const aTokens = new Set(tokenize(a));
  const bTokens = new Set(tokenize(b));
  if (!aTokens.size || !bTokens.size) return 0;
  let overlap = 0;
  for (const t of aTokens) if (bTokens.has(t)) overlap += 1;
  return overlap / Math.max(aTokens.size, bTokens.size);
}

export function scoreMemoryForActiveSlate(memory: MemoryObject): number {
  const pinBoost = memory.userPinned ? 0.3 : 0;
  const recencyBoost = memory.recencyScore * 0.2;
  const stateModifier =
    memory.state === 'active' ? 1 : memory.state === 'tentative' ? 0.65 : memory.state === 'contradicted' ? 0.3 : 0.05;
  return (
    memory.importance * 0.22 +
    memory.durability * 0.12 +
    memory.scope * 0.1 +
    memory.retrievalPriority * 0.2 +
    memory.confidence * 0.14 +
    recencyBoost +
    clamp(memory.activationCount / 25, 0, 0.12) +
    clamp(memory.dependencyCount / 20, 0, 0.08) +
    pinBoost
  ) * stateModifier;
}

export function extractCandidateMemories(
  projectId: string,
  nodeId: string,
  sceneText: string,
  now = new Date().toISOString(),
): CandidateMemory[] {
  const sentences = sceneText.split(/[.!?]\s+/).map((s) => s.trim()).filter((s) => s.length > 30);
  return sentences.slice(0, 8).map((sentence) => ({
    content: sentence,
    explicitness: sentence.includes('likely') || sentence.includes('seems') ? 'inferred' : 'explicit',
    source: { nodeId, quote: sentence.slice(0, 220), capturedAt: now },
  }));
}

export function consolidateMemories(projectId: string, existing: MemoryObject[], candidates: CandidateMemory[]): MemoryObject[] {
  let next = [...existing];
  for (const candidate of candidates) {
    const match = next.find((m) => overlapScore(m.content, candidate.content) > 0.45 && m.state !== 'archived');
    if (!match) {
      next.push({
        id: crypto.randomUUID(),
        projectId,
        content: candidate.content,
        explicitness: candidate.explicitness,
        sources: [candidate.source],
        userNotes: '',
        linkedEntityIds: tokenize(candidate.content).filter((t) => t[0] === t[0]?.toLowerCase()).slice(0, 3),
        linkedMemoryIds: [],
        contradictionIds: [],
        importance: 0.62,
        durability: 0.58,
        scope: 0.5,
        retrievalPriority: 0.6,
        confidence: 0.55,
        recencyScore: 1,
        activationCount: 0,
        dependencyCount: 0,
        state: 'tentative',
        userPinned: false,
        userEdited: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      continue;
    }

    const contradiction = candidate.content.toLowerCase().includes('not ') && overlapScore(match.content, candidate.content) > 0.55;
    const mergedSources = [candidate.source, ...match.sources].slice(0, 8);
    next = next.map((m) =>
      m.id !== match.id
        ? m
        : {
            ...m,
            content: m.userEdited ? m.content : (m.confidence > 0.8 ? m.content : candidate.content),
            sources: mergedSources,
            confidence: clamp(m.confidence + 0.06),
            importance: clamp(m.importance + 0.03),
            retrievalPriority: clamp(m.retrievalPriority + 0.04),
            recencyScore: 1,
            state: contradiction ? 'contradicted' : m.state === 'tentative' ? 'active' : m.state,
            contradictionIds: contradiction ? [...m.contradictionIds, crypto.randomUUID()] : m.contradictionIds,
            updatedAt: new Date().toISOString(),
          },
    );
  }
  return next.map((m) => ({ ...m, recencyScore: clamp(m.recencyScore * 0.985) }));
}

export function buildActiveMemorySlate(memories: MemoryObject[], query = '', limit = 6): MemoryObject[] {
  const q = query.trim().toLowerCase();
  return [...memories]
    .filter((m) => m.state !== 'archived' && m.state !== 'superseded')
    .map((memory) => {
      const textMatch = q ? overlapScore(memory.content, q) : 0;
      const entityMatch = q ? memory.linkedEntityIds.some((e) => q.includes(e.toLowerCase())) : false;
      const rerank = scoreMemoryForActiveSlate(memory) + textMatch * 0.45 + (entityMatch ? 0.2 : 0);
      return { memory, rerank };
    })
    .sort((a, b) => b.rerank - a.rerank)
    .slice(0, limit)
    .map((x) => x.memory);
}
