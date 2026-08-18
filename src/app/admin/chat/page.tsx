import type { Metadata } from 'next';
import { AdminChat } from '@/components/admin/AdminChat';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin — chats',
  robots: { index: false, follow: false },
};

export default function AdminChatPage() {
  return (
    <div className="page-wrapper py-8">
      <h1 className="mb-1 text-3xl font-semibold">Chats</h1>
      <p className="mb-6 text-base text-grey-800">
        Buyer messages, oldest waiting first. Replies appear in the buyer&rsquo;s chat immediately.
      </p>
      <AdminChat />
    </div>
  );
}
