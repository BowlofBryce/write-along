import type { FormattingCommand } from '@/types/models';

export function parseFormattingRequest(input: string): FormattingCommand[] {
  const text = input.toLowerCase();
  const commands: FormattingCommand[] = [];
  if (text.includes('justify')) {
    commands.push({
      id: crypto.randomUUID(),
      scope: text.includes('chapter') ? 'chapter' : 'manuscript',
      target: 'bodyParagraph',
      operation: { type: 'setAlignment', value: 'justify' },
    });
  }
  if (text.includes('double-space') || text.includes('double space')) {
    commands.push({
      id: crypto.randomUUID(),
      scope: 'manuscript',
      target: 'bodyParagraph',
      operation: { type: 'setLineSpacing', value: 2 },
    });
  }
  if (text.includes('garamond')) {
    commands.push({
      id: crypto.randomUUID(),
      scope: 'manuscript',
      target: 'all',
      operation: { type: 'setFont', family: 'Garamond', size: text.includes('12') ? 12 : 11 },
    });
  }
  return commands;
}
