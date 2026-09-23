import { Fragment } from "react";

import { InlineSegment, parseCompanionMarkdown } from "./parse-companion-markdown";

function renderInline(segments: InlineSegment[], keyPrefix: string) {
  return segments.map((segment, index) =>
    segment.bold ? (
      <strong key={`${keyPrefix}-${index}`}>{segment.text}</strong>
    ) : (
      <Fragment key={`${keyPrefix}-${index}`}>{segment.text}</Fragment>
    ),
  );
}

/**
 * Renderiza o texto do Companion com um subconjunto pequeno e seguro de
 * Markdown (negrito, listas, quebra de linha) - ver `parseCompanionMarkdown`.
 * NUNCA usa `dangerouslySetInnerHTML`; tudo vira elementos React fixos, então
 * não existe superfície de HTML arbitrário nem injeção de markup pelo texto
 * gerado pela IA.
 */
export function CompanionMarkdown({ text }: { text: string }) {
  const blocks = parseCompanionMarkdown(text);

  return (
    <>
      {blocks.map((block, blockIndex) => {
        const key = `block-${blockIndex}`;

        if (block.type === "bullet-list") {
          return (
            <ul key={key}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderInline(item, `${key}-${itemIndex}`)}</li>
              ))}
            </ul>
          );
        }

        if (block.type === "numbered-list") {
          return (
            <ol key={key}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderInline(item, `${key}-${itemIndex}`)}</li>
              ))}
            </ol>
          );
        }

        return (
          <p key={key}>
            {block.lines.map((line, lineIndex) => (
              <Fragment key={lineIndex}>
                {lineIndex > 0 && <br />}
                {renderInline(line, `${key}-${lineIndex}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}
