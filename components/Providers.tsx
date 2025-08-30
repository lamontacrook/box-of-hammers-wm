'use client';

import { SessionProvider } from 'next-auth/react';

export default function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: any; // if you hydrate from server (optional)
}) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
