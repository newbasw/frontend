import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

/**
 * The reference serves its FAQ under /service-desk/faq as well as /content/faq.
 * Keeping the URL alive here means inbound links and the reference's own
 * navigation both resolve, with one page behind them rather than two copies
 * that can drift apart.
 */
export const metadata: Metadata = {
  title: 'FAQ',
  alternates: { canonical: '/content/faq' },
};

export default function ServiceDeskFaqPage() {
  redirect('/content/faq');
}
