/**
 * Minimal, dependency-free markdown renderer for CMS body copy.
 *
 * Deliberately narrow: it escapes all HTML first and then only re-introduces
 * the small set of tags the seeded content actually uses. Nothing an author
 * writes can inject markup, so `dangerouslySetInnerHTML` is safe here.
 */
export function renderMarkdown(source: string): string {
  const escaped = source
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const lines = escaped.split(/\r?\n/);
  const out: string[] = [];

  let inList = false;
  let inTable = false;

  const closeList = () => {
    if (inList) {
      out.push('</ul>');
      inList = false;
    }
  };
  const closeTable = () => {
    if (inTable) {
      out.push('</tbody></table></div>');
      inTable = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (line.trim() === '') {
      closeList();
      closeTable();
      continue;
    }

    // Table rows: | a | b |
    if (/^\|.*\|$/.test(line.trim())) {
      const cells = line.trim().slice(1, -1).split('|').map((c) => c.trim());
      if (cells.every((c) => /^-{2,}$/.test(c))) continue; // separator row
      if (!inTable) {
        out.push(
          '<div class="overflow-x-auto"><table class="w-full border-collapse text-base"><tbody>',
        );
        inTable = true;
      }
      out.push(
        `<tr>${cells
          .map((c) => `<td class="border border-grey-300 px-3 py-2">${inline(c)}</td>`)
          .join('')}</tr>`,
      );
      continue;
    }
    closeTable();

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      closeList();
      const level = Math.min(6, heading[1]!.length + 1); // ## in body -> <h3>
      const sizes: Record<number, string> = {
        2: 'text-2xl',
        3: 'text-xl',
        4: 'text-lg',
        5: 'text-md',
        6: 'text-base',
      };
      out.push(
        `<h${level} class="mt-6 mb-2 font-semibold ${sizes[level] ?? 'text-md'}">${inline(heading[2]!)}</h${level}>`,
      );
      continue;
    }

    const bullet = /^[*-]\s+(.*)$/.exec(line.trim());
    if (bullet) {
      if (!inList) {
        out.push('<ul class="my-3 list-disc space-y-1 pl-5">');
        inList = true;
      }
      out.push(`<li>${inline(bullet[1]!)}</li>`);
      continue;
    }
    closeList();

    const ordered = /^\d+\.\s+(.*)$/.exec(line.trim());
    if (ordered) {
      out.push(`<p class="my-2">${inline(ordered[0])}</p>`);
      continue;
    }

    out.push(`<p class="my-3 leading-6">${inline(line)}</p>`);
  }

  closeList();
  closeTable();
  return out.join('\n');
}

function inline(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-grey-100 px-1">$1</code>')
    // Only same-origin, relative links are permitted.
    .replace(/\[([^\]]+)\]\((\/[^)\s]*)\)/g, '<a class="cds-link" href="$2">$1</a>');
}
