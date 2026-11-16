import { describe, expect, it } from 'vitest';
import { assistantParagraphs, say } from './messageFormat';
import { WELCOME } from './conversation';

describe('assistant formatting', () => {
  it('bolds only the marked question and leaves context in ordinary text', () => {
    const message = say({
      before: 'You mentioned diary management.',
      question: 'Roughly how many meetings are in a typical week?',
      after: 'A rough sense is enough.',
    });
    const paragraphs = assistantParagraphs(message);
    expect(paragraphs).toHaveLength(3);
    expect(paragraphs[0]).toEqual([{ bold: false, text: 'You mentioned diary management.' }]);
    expect(paragraphs[1]).toEqual([{ bold: true, text: 'Roughly how many meetings are in a typical week?' }]);
    expect(paragraphs[2][0].bold).toBe(false);
  });

  it('leaves a fully wrapped statement as plain text and does not interpret HTML', () => {
    const paragraphs = assistantParagraphs('**<script>alert(1)</script> The whole reply should not be bold.**');
    expect(paragraphs[0][0].bold).toBe(false);
    expect(paragraphs[0][0].text).toContain('<script>alert(1)</script>');
  });

  it('bolds the opening question even though it ends with a full stop, and leaves the example plain', () => {
    const paragraphs = assistantParagraphs(WELCOME);
    const bold = paragraphs.flat().filter((run) => run.bold).map((run) => run.text);
    const plain = paragraphs.flat().filter((run) => !run.bold).map((run) => run.text).join(' ');
    expect(bold).toEqual(["Tell me a little about your business and what you'd like help with."]);
    expect(plain).toMatch(/for example/i);
  });
});
