import type { Metadata } from 'next';
import Link from 'next/link';
import { SmartImage as Image } from '../../../components/ui/SmartImage';
import { notFound } from 'next/navigation';
import { getContentIndex, getContentPage } from '@/lib/queries';
import { renderMarkdown } from '@/lib/markdown';
import { articleImage } from '@/lib/basImages';

interface Params {
  params: { slug: string };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const page = await getContentPage(params.slug);
  if (!page) return { title: 'Page not found' };
  return {
    title: page.meta_title ?? page.title,
    description: page.meta_description ?? page.excerpt ?? undefined,
    alternates: { canonical: `/content/${page.slug}` },
    openGraph: {
      title: page.title,
      description: page.meta_description ?? page.excerpt ?? undefined,
      type: page.kind === 'article' ? 'article' : 'website',
      url: `/content/${page.slug}`,
      images: page.card_image ? [{ url: page.card_image }] : undefined,
    },
  };
}

export default async function ContentPageRoute({ params }: Params) {
  const page = await getContentPage(params.slug);
  if (!page) notFound();

  const related =
    page.kind === 'article'
      ? (await getContentIndex()).filter((p) => p.kind === 'article' && p.slug !== page.slug).slice(0, 3)
      : [];

  return (
    <article className="page-wrapper py-8">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-grey-800">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/" className="hover:underline">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          {page.kind === 'article' && (
            <>
              <li>
                <Link href="/news" className="hover:underline">
                  News
                </Link>
              </li>
              <li aria-hidden="true">/</li>
            </>
          )}
          <li className="text-ink">{page.title}</li>
        </ol>
      </nav>

      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-semibold">{page.title}</h1>
        {page.excerpt && <p className="mt-2 text-lg text-grey-800">{page.excerpt}</p>}
        {page.kind === 'article' && (
          <p className="mt-2 text-xs text-grey-800">
            <time dateTime={page.published_at}>
              {new Date(page.published_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </time>
          </p>
        )}

        {/* Legal and utility pages carry no photograph; they simply omit it. */}
        {articleImage(page.slug, 1200) && (
          <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-minimal bg-grey-100">
            <Image
              src={articleImage(page.slug, 1200)!}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>
        )}

        {page.body && (
          <div
            className="prose-bw mt-6"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(page.body) }}
          />
        )}
      </div>

      {related.length > 0 && (
        <section className="mx-auto mt-12 max-w-3xl border-t border-grey-300 pt-8">
          <h2 className="mb-4 text-xl font-semibold">More articles</h2>
          <ul className="space-y-3">
            {related.map((item) => (
              <li key={item.slug}>
                <Link href={`/content/${item.slug}`} className="text-md font-semibold hover:underline">
                  {item.title}
                </Link>
                {item.excerpt && <p className="text-base text-grey-800">{item.excerpt}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
