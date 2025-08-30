"use client";

import { useSession, signOut } from "next-auth/react";
import { SignUpForm } from "@/components/sign-up-form"


export default function Home() {
  const { data: session, status } = useSession();
  if (status === "loading") return <p>Loading…</p>;

  return (
    <main style={{ display: "grid", placeItems: "center", minHeight: "100dvh", gap: 16 }}>
      {!session ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <SignUpForm />
        </div>
      ) : (
        <>
          <p>Signed in as {session.user?.email}</p>
          <a href="/dashboard">Go to Dashboard</a>
          <button onClick={() => signOut()}>Sign out</button>
        </>
      )}
    </main>
  );
}
