import type { MemoryObject } from '@/types/models';

export function scoreMemoryForActiveSlate(memory: MemoryObject): number {
  const pinBoost = memory.userPinned ? 0.25 : 0;
  const freshness = Math.max(0, 1 - (Date.now() - Date.parse(memory.lastTouchedAt)) / (1000 * 60 * 60 * 24 * 30));
  return memory.importance * 0.35 + memory.durability * 0.2 + memory.retrievalPriority * 0.25 + freshness * 0.2 + pinBoost;
}

export function buildActiveMemorySlate(memories: MemoryObject[], limit = 6): MemoryObject[] {
  return [...memories]
    .filter((m) => m.state !== 'archived')
    .sort((a, b) => scoreMemoryForActiveSlate(b) - scoreMemoryForActiveSlate(a))
    .slice(0, limit);
}
