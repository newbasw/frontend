'use client';

import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Spinner } from '../icons';

export function LogoutButton() {
  const { logout } = useAuth();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      data-testid="logout-button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await logout();
        // Full navigation, not router.push: Next's client Router Cache still
        // holds the rendered payloads of the pages this user just visited while
        // signed in. A soft navigation would leave them there, so a back-button
        // press could show authenticated content after logout. Reloading throws
        // that cache away.
        window.location.assign('/');
      }}
      className="bw-btn-outline"
    >
      {busy ? <Spinner size={16} /> : 'Logout'}
    </button>
  );
}
