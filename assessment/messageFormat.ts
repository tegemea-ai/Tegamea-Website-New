export interface TextRun {
  bold: boolean;
  text: string;
}

/** One bold question, with optional context before or after. The asterisks are a marker, not HTML. */
export function say(parts: { before?: string; question?: string; after?: string }): string {
  const blocks = [parts.before, parts.question ? `**${parts.question}**` : '', parts.after]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));
  return blocks.join('\n\n');
}

/**
 * Splits an assistant message into paragraphs and at most the marked question in bold.
 * A message that is entirely bold is left as plain text. HTML is not interpreted.
 */
export function assistantParagraphs(source: string): TextRun[][] {
  const text = source.replace(/\r\n/g, '\n').trim();
  if (!text) return [];
  return text
    .split(/\n\n+/)
    .map((paragraph) => runs(paragraph.trim()))
    .filter((paragraph) => paragraph.length > 0);
}

function runs(paragraph: string): TextRun[] {
  const matches = [...paragraph.matchAll(/\*\*([^*\n]+)\*\*/g)];
  if (!matches.length) return [{ bold: false, text: paragraph }];
  if (matches.length === 1 && matches[0].index === 0 && matches[0][0].length === paragraph.length) {
    const inner = matches[0][1];
    const questionOnly =
      inner.length < 280 &&
      (/\?\s*$/.test(inner) || /what you'd like help with\.\s*$/i.test(inner));
    if (!questionOnly) return [{ bold: false, text: inner }];
  }
  const result: TextRun[] = [];
  let cursor = 0;
  for (const match of matches) {
    const start = match.index ?? 0;
    if (start > cursor) result.push({ bold: false, text: paragraph.slice(cursor, start) });
    result.push({ bold: true, text: match[1] });
    cursor = start + match[0].length;
  }
  if (cursor < paragraph.length) result.push({ bold: false, text: paragraph.slice(cursor) });
  return result.filter((run) => run.text.length > 0);
}
