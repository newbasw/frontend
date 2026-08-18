import type { Metadata } from 'next';
import { SmartImage as Image } from '../../components/ui/SmartImage';
import Link from 'next/link';
import { getArticles } from '@/lib/queries';
import { articleImage } from '@/lib/basImages';

export const metadata: Metadata = {
  title: 'News & articles',
  description: 'Buying guides, market news and product deep-dives from the BAS World specialists.',
  alternates: { canonical: '/news' },
};

export default async function NewsPage() {
  const articles = await getArticles(100);

  return (
    <div className="page-wrapper py-8">
      <h1 className="text-2xl font-semibold">Latest news &amp; articles</h1>
      <p className="mt-1 text-base text-grey-800">
        Buying guides, comparisons and market news from our specialists.
      </p>

      {articles.length === 0 ? (
        <p className="mt-8 border border-dashed border-grey-400 p-8 text-center text-base text-grey-800">
          No articles published yet.
        </p>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <article key={article.slug}>
              <Link href={`/content/${article.slug}`} className="group block">
                <div className="relative aspect-[338/230] w-full overflow-hidden bg-grey-100">
                  {articleImage(article.slug) && (
                    <Image
                      src={articleImage(article.slug)!}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 338px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                </div>
                <h2 className="mt-3 text-md font-semibold group-hover:underline">{article.title}</h2>
                {article.excerpt && (
                  <p className="mt-1 line-clamp-2 text-base text-grey-800">{article.excerpt}</p>
                )}
                <span className="mt-2 inline-block text-base font-semibold text-link">Read more</span>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
