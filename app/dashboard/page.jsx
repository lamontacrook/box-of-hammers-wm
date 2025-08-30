import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Link from "next/link";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <main style={{ display: "grid", placeItems: "center", minHeight: "100dvh" }}>
        <div>
          <p>Not signed in.</p>
        <Link href="/api/auth/signin">Sign in</Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Dashboard</h1>
      <p>Hello, {session.user?.name ?? session.user?.email}</p>
    </main>
  );
}
