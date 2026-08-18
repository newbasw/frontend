import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
  it('renders paragraphs', () => {
    expect(renderMarkdown('Hello world')).toContain('<p class="my-3 leading-6">Hello world</p>');
  });

  it('renders headings one level down', () => {
    expect(renderMarkdown('## Payload')).toContain('<h3');
    expect(renderMarkdown('### Tyres')).toContain('<h4');
  });

  it('renders bullet lists', () => {
    const html = renderMarkdown('* one\n* two');
    expect(html).toContain('<ul');
    expect(html).toContain('<li>one</li>');
    expect(html).toContain('<li>two</li>');
    expect(html).toContain('</ul>');
  });

  it('renders bold and italic', () => {
    expect(renderMarkdown('**bold**')).toContain('<strong>bold</strong>');
    expect(renderMarkdown('an *emphasis* here')).toContain('<em>emphasis</em>');
  });

  it('renders tables inside a horizontal scroll container', () => {
    const html = renderMarkdown('| Vehicle | Pallets |\n|---|---|\n| Trailer | 33 |');
    expect(html).toContain('overflow-x-auto');
    expect(html).toContain('<td class="border border-grey-300 px-3 py-2">Trailer</td>');
    expect(html).not.toContain('---');
  });

  // Security: CMS body copy must never be able to inject markup.
  it('escapes raw HTML', () => {
    const html = renderMarkdown('<script>alert(1)</script>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('escapes HTML inside list items and headings', () => {
    expect(renderMarkdown('* <img onerror=x>')).not.toContain('<img');
    expect(renderMarkdown('## <b>hi</b>')).toContain('&lt;b&gt;');
  });

  it('allows relative links only', () => {
    expect(renderMarkdown('[stock](/stock/all)')).toContain('href="/stock/all"');
    expect(renderMarkdown('[evil](javascript:alert(1))')).not.toContain('href="javascript');
    expect(renderMarkdown('[external](https://example.com)')).not.toContain('href="https://example.com"');
  });
});
