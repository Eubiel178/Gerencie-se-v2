/**
 * Parser mínimo e determinístico pra um subconjunto pequeno de Markdown -
 * negrito, listas com marcador e numeradas, parágrafos separados por
 * linha em branco. NUNCA gera HTML (sem `dangerouslySetInnerHTML` em
 * lugar nenhum que use isto) - vira uma estrutura de dados que o
 * componente (`companion-markdown.tsx`) mapeia pra elementos React
 * fixos (`<p>`, `<ul>`, `<ol>`, `<strong>`). Extraído puro (sem JSX) pra
 * poder testar com `node:test`, mesmo raciocínio de
 * `split-conversation-beats.ts`.
 *
 * De propósito NÃO cobre links, títulos, código, tabelas ou itálico -
 * só o que o chat do Companion realmente usa (ver o pedido original:
 * negrito, quebra de linha, lista com marcador, lista numerada).
 */

export interface InlineSegment {
  bold: boolean;
  text: string;
}

export type CompanionMarkdownBlock =
  | { type: "paragraph"; lines: InlineSegment[][] }
  | { type: "bullet-list"; items: InlineSegment[][] }
  | { type: "numbered-list"; items: InlineSegment[][] };

const BULLET_LINE = /^[-*]\s+(.*)$/;
const NUMBERED_LINE = /^\d+[.)]\s+(.*)$/;
const BOLD_SPLIT = /(\*\*[^*\n]+\*\*)/g;

function parseInline(text: string): InlineSegment[] {
  if (!text) return [];

  return text
    .split(BOLD_SPLIT)
    .filter((part) => part !== "")
    .map((part) => {
      if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) {
        return { bold: true, text: part.slice(2, -2) };
      }
      return { bold: false, text: part };
    });
}

export function parseCompanionMarkdown(raw: string): CompanionMarkdownBlock[] {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const blocks: CompanionMarkdownBlock[] = [];
  let paragraphLines: InlineSegment[][] = [];

  function flushParagraph() {
    if (paragraphLines.length > 0) {
      blocks.push({ type: "paragraph", lines: paragraphLines });
      paragraphLines = [];
    }
  }

  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (trimmed === "") {
      flushParagraph();
      i++;
      continue;
    }

    const bullet = trimmed.match(BULLET_LINE);
    if (bullet) {
      flushParagraph();
      const items: InlineSegment[][] = [];
      while (i < lines.length) {
        const match = lines[i].trim().match(BULLET_LINE);
        if (!match) break;
        items.push(parseInline(match[1]));
        i++;
      }
      blocks.push({ type: "bullet-list", items });
      continue;
    }

    const numbered = trimmed.match(NUMBERED_LINE);
    if (numbered) {
      flushParagraph();
      const items: InlineSegment[][] = [];
      while (i < lines.length) {
        const match = lines[i].trim().match(NUMBERED_LINE);
        if (!match) break;
        items.push(parseInline(match[1]));
        i++;
      }
      blocks.push({ type: "numbered-list", items });
      continue;
    }

    paragraphLines.push(parseInline(lines[i]));
    i++;
  }

  flushParagraph();
  return blocks;
}
